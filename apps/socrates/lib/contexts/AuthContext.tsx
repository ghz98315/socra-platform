'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import type { PhoneCodePurpose } from '@/lib/auth/phone-auth';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

const ACTIVE_PROFILE_COOKIE = 'socrates-active-profile';
const ACTIVE_PROFILE_STORAGE_PREFIX = 'socrates-active-profile:';

export interface UserProfile {
  id: string;
  email?: string | null;
  phone?: string | null;
  role: 'admin' | 'student' | 'parent';
  theme_preference?: 'junior' | 'senior' | null;
  grade_level?: number | null;
  display_name?: string | null;
  avatar_url?: string | null;
  student_avatar_url?: string | null;
  parent_avatar_url?: string | null;
  xp_points?: number | null;
  parent_id?: string | null;
  created_at: string;
}

interface AccountProfilesResponse {
  data?: {
    account_profile?: ProfileRow | null;
    available_profiles?: ProfileRow[];
  };
  error?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  accountProfile: UserProfile | null;
  availableProfiles: UserProfile[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile | null>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  requestPhoneCode: (params: {
    phone: string;
    purpose: PhoneCodePurpose;
    displayName?: string;
    avatarUrl?: string | null;
    studentAvatarUrl?: string | null;
    parentAvatarUrl?: string | null;
  }) => Promise<{ debugCode?: string }>;
  verifyPhoneCode: (params: {
    phone: string;
    code: string;
    purpose: PhoneCodePurpose;
  }) => Promise<UserProfile | null>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  selectProfile: (profileId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStorageKey(userId: string) {
  return `${ACTIVE_PROFILE_STORAGE_PREFIX}${userId}`;
}

function readCookieValue(name: string) {
  if (typeof document === 'undefined') {
    return null;
  }

  const prefix = `${name}=`;
  const item = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix));

  if (!item) {
    return null;
  }

  return decodeURIComponent(item.slice(prefix.length));
}

function writeActiveProfileCookie(profileId: string | null) {
  if (typeof document === 'undefined') {
    return;
  }

  if (!profileId) {
    document.cookie = `${ACTIVE_PROFILE_COOKIE}=; path=/; max-age=0; samesite=lax`;
    return;
  }

  document.cookie = `${ACTIVE_PROFILE_COOKIE}=${encodeURIComponent(profileId)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

function writeStoredActiveProfile(userId: string, profileId: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  const storageKey = getStorageKey(userId);
  if (!profileId) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(storageKey, profileId);
}

function readStoredActiveProfile(userId: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(getStorageKey(userId));
}

function clearStoredActiveProfile(userId?: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (userId) {
    window.localStorage.removeItem(getStorageKey(userId));
    return;
  }

  const keysToRemove: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(ACTIVE_PROFILE_STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
}

function toUserProfile(profile: ProfileRow | null | undefined): UserProfile | null {
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    email: profile.email,
    phone: profile.phone,
    role: profile.role,
    theme_preference: profile.theme_preference,
    grade_level: profile.grade_level,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    student_avatar_url: profile.student_avatar_url,
    parent_avatar_url: profile.parent_avatar_url,
    xp_points: profile.xp_points,
    parent_id: profile.parent_id,
    created_at: profile.created_at,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accountProfile, setAccountProfile] = useState<UserProfile | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const activeProfileRef = useRef<UserProfile | null>(null);
  const profileLoadRef = useRef<Promise<UserProfile | null> | null>(null);
  const profileLoadUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeProfileRef.current = profile;
  }, [profile]);

  const persistActiveProfile = (userId: string, profileId: string | null) => {
    writeStoredActiveProfile(userId, profileId);
    writeActiveProfileCookie(profileId);
  };

  const chooseActiveProfileId = (
    userId: string,
    nextAccountProfile: UserProfile,
    nextAvailableProfiles: UserProfile[],
    preferredProfileId?: string | null,
  ) => {
    const validIds = new Set(nextAvailableProfiles.map((item) => item.id));
    const candidates = [
      preferredProfileId || null,
      activeProfileRef.current?.id || null,
      readStoredActiveProfile(userId),
      readCookieValue(ACTIVE_PROFILE_COOKIE),
      nextAccountProfile.id,
    ];

    const match = candidates.find(
      (candidate): candidate is string => typeof candidate === 'string' && validIds.has(candidate),
    );
    return match || nextAccountProfile.id;
  };

  const fetchProfilesBundle = async (userId: string) => {
    const response = await fetch('/api/account/profile', {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    let payload: AccountProfilesResponse | null = null;
    try {
      payload = (await response.json()) as AccountProfilesResponse;
    } catch (error) {
      console.error('[AuthContext] Failed to parse account profile payload:', error);
    }

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(payload?.error || 'Failed to fetch account profiles');
    }

    const nextAccountProfile = toUserProfile(payload?.data?.account_profile || null);
    const nextAvailableProfiles = (payload?.data?.available_profiles || [])
      .map((item) => toUserProfile(item))
      .filter((item): item is UserProfile => Boolean(item));

    if (!nextAccountProfile) {
      return null;
    }

    if (nextAvailableProfiles.length === 0) {
      return {
        accountProfile: nextAccountProfile,
        availableProfiles: [nextAccountProfile],
      };
    }

    return {
      accountProfile: nextAccountProfile,
      availableProfiles: nextAvailableProfiles,
    };
  };

  const ensureOwnProfile = async (params: {
    role?: 'student' | 'parent';
    displayName?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
  }) => {
    const response = await fetch('/api/profile/ensure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: params.role || 'student',
        display_name: params.displayName || undefined,
        phone: params.phone || undefined,
        avatar_url: params.avatarUrl || undefined,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error || 'Failed to ensure profile');
    }
  };

  const loadProfilesForUser = async (
    authUser: User,
    preferredProfileId?: string | null,
  ): Promise<UserProfile | null> => {
    if (profileLoadRef.current && profileLoadUserIdRef.current === authUser.id) {
      return profileLoadRef.current;
    }

    const loadPromise = (async () => {
      let bundle = await fetchProfilesBundle(authUser.id);

      if (!bundle) {
        await ensureOwnProfile({
          role: 'student',
          displayName:
            typeof authUser.user_metadata?.display_name === 'string'
              ? authUser.user_metadata.display_name
              : authUser.email?.split('@')[0] || null,
          phone:
            typeof authUser.user_metadata?.phone === 'string'
              ? authUser.user_metadata.phone
              : null,
          avatarUrl:
            typeof authUser.user_metadata?.avatar_url === 'string'
              ? authUser.user_metadata.avatar_url
              : null,
        });
        bundle = await fetchProfilesBundle(authUser.id);
      }

      if (!bundle) {
        setAccountProfile(null);
        setAvailableProfiles([]);
        setProfile(null);
        persistActiveProfile(authUser.id, null);
        return null;
      }

      setAccountProfile(bundle.accountProfile);
      setAvailableProfiles(bundle.availableProfiles);

      const nextActiveProfileId = chooseActiveProfileId(
        authUser.id,
        bundle.accountProfile,
        bundle.availableProfiles,
        preferredProfileId,
      );
      const nextActiveProfile =
        bundle.availableProfiles.find((item) => item.id === nextActiveProfileId) || bundle.accountProfile;

      setProfile(nextActiveProfile);
      persistActiveProfile(authUser.id, nextActiveProfile.id);
      return nextActiveProfile;
    })();

    profileLoadRef.current = loadPromise;
    profileLoadUserIdRef.current = authUser.id;

    try {
      return await loadPromise;
    } finally {
      if (profileLoadRef.current === loadPromise) {
        profileLoadRef.current = null;
        profileLoadUserIdRef.current = null;
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setLoading(false);
          return;
        }

        setUser(session.user);
        await loadProfilesForUser(session.user);
      } catch (error) {
        console.error('[AuthContext] Failed to initialize session:', error);
      } finally {
        setLoading(false);
      }
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        return;
      }

      if (!session?.user) {
        if (user?.id) {
          clearStoredActiveProfile(user.id);
        }
        writeActiveProfileCookie(null);
        setUser(null);
        setProfile(null);
        setAccountProfile(null);
        setAvailableProfiles([]);
        setLoading(false);
        return;
      }

      setUser(session.user);
      await loadProfilesForUser(session.user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (emailOrPhone: string, password: string) => {
    setLoading(true);

    const phoneRegex = /^1[3-9]\d{9}$/;
    const email = phoneRegex.test(emailOrPhone) ? `${emailOrPhone}@student.local` : emailOrPhone;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        return null;
      }

      setUser(data.user);
      return await loadProfilesForUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (emailOrPhone: string, password: string, name?: string) => {
    setLoading(true);

    const phoneRegex = /^1[3-9]\d{9}$/;
    const isPhone = phoneRegex.test(emailOrPhone);
    const email = isPhone ? `${emailOrPhone}@student.local` : emailOrPhone;
    const phone = isPhone ? emailOrPhone : null;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            display_name: name,
            phone,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user || !data.session) {
        throw new Error('Sign up succeeded but session was not created');
      }

      setUser(data.user);
      await ensureOwnProfile({
        role: 'student',
        displayName: name || phone || email.split('@')[0],
        phone,
      });
      await loadProfilesForUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const requestPhoneCode = async ({
    phone,
    purpose,
    displayName,
    avatarUrl,
    studentAvatarUrl,
    parentAvatarUrl,
  }: {
    phone: string;
    purpose: PhoneCodePurpose;
    displayName?: string;
    avatarUrl?: string | null;
    studentAvatarUrl?: string | null;
    parentAvatarUrl?: string | null;
  }) => {
    const response = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        purpose,
        display_name: displayName,
        avatar_url: avatarUrl,
        student_avatar_url: studentAvatarUrl,
        parent_avatar_url: parentAvatarUrl,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send verification code');
    }

    return {
      debugCode: typeof data.debugCode === 'string' ? data.debugCode : undefined,
    };
  };

  const verifyPhoneCode = async ({
    phone,
    code,
    purpose,
  }: {
    phone: string;
    code: string;
    purpose: PhoneCodePurpose;
  }) => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          code,
          purpose,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify code');
      }

      const accessToken = data?.session?.access_token;
      const refreshToken = data?.session?.refresh_token;
      if (!accessToken || !refreshToken) {
        throw new Error('Verification succeeded but no session was returned');
      }

      const { data: sessionData, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error || !sessionData.user) {
        throw error || new Error('Failed to establish session');
      }

      setUser(sessionData.user);
      return await loadProfilesForUser(sessionData.user);
    } finally {
      setLoading(false);
    }
  };

  const selectProfile = async (profileId: string) => {
    if (!user) {
      throw new Error('Not authenticated');
    }

    const nextProfile = availableProfiles.find((item) => item.id === profileId);
    if (!nextProfile) {
      throw new Error('Profile not found');
    }

    setProfile(nextProfile);
    persistActiveProfile(user.id, nextProfile.id);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile_id: profile.id,
        ...updates,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update profile');
    }

    await loadProfilesForUser(user, profile.id);
  };

  const refreshProfile = async () => {
    if (!user) {
      return;
    }

    await loadProfilesForUser(user);
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[AuthContext] signOut failed:', error);
    }

    clearStoredActiveProfile(user?.id);
    writeActiveProfileCookie(null);
    setUser(null);
    setProfile(null);
    setAccountProfile(null);
    setAvailableProfiles([]);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        accountProfile,
        availableProfiles,
        loading,
        signIn,
        signUp,
        requestPhoneCode,
        verifyPhoneCode,
        signOut,
        updateProfile,
        refreshProfile,
        selectProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
