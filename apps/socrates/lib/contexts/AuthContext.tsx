// =====================================================
// Project Socrates - Authentication Context
// =====================================================

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface UserProfile {
  id: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'student' | 'parent';
  theme_preference?: 'junior' | 'senior';
  grade_level?: number;
  display_name?: string;
  avatar_url?: string;
  student_avatar_url?: string;
  parent_avatar_url?: string;
  xp_points?: number;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // Track last fetched user ID to prevent duplicate fetches
  const lastFetchedUserId = React.useRef<string | null>(null);
  const profileFetchInFlight = React.useRef<Promise<UserProfile | null> | null>(null);
  const profileFetchUserId = React.useRef<string | null>(null);

  const fetchProfileInternal = async (userId: string, retries = 2): Promise<UserProfile | null> => {
    try {
      console.log('[AuthContext] Fetching profile for user:', userId);

      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout after 10s')), 10000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        console.error('[AuthContext] Error fetching profile:', JSON.stringify(error, null, 2));
        if (retries > 0) {
          console.log(`[AuthContext] Retrying profile fetch (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchProfileInternal(userId, retries - 1);
        }
        return null;
      }

      console.log('[AuthContext] Profile fetched:', data);
      lastFetchedUserId.current = userId;
      return (data as UserProfile | null);
    } catch (error: any) {
      if (error?.message?.includes('timeout')) {
        console.error('[AuthContext] Profile fetch timeout');
        if (retries > 0) {
          console.log(`[AuthContext] Retrying profile fetch after timeout (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchProfileInternal(userId, retries - 1);
        }
        return null;
      }
      console.error('[AuthContext] Exception fetching profile:', error?.message || error);
      return null;
    }
  };

  // Fetch user profile from database with retry logic
  const fetchProfile = async (userId: string, retries = 2): Promise<UserProfile | null> => {
    if (profileFetchInFlight.current && profileFetchUserId.current === userId) {
      console.log('[AuthContext] Reusing in-flight profile fetch for user:', userId);
      return profileFetchInFlight.current;
    }

    const fetchPromise = fetchProfileInternal(userId, retries);
    profileFetchInFlight.current = fetchPromise;
    profileFetchUserId.current = userId;

    try {
      return await fetchPromise;
    } finally {
      if (profileFetchInFlight.current === fetchPromise) {
        profileFetchInFlight.current = null;
        profileFetchUserId.current = null;
      }
    }
  };

  useEffect(() => {
    // Check active session and set up auth listener
    const getSession = async () => {
      console.log('[AuthContext] Getting initial session');
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[AuthContext] Error getting session:', error);
        setLoading(false);
        return;
      }

      console.log('[AuthContext] Initial session:', !!session?.user);
      if (session?.user) {
        setUser(session.user);
        const userProfile = await fetchProfile(session.user.id);
        setProfile(userProfile);
      }

      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] onAuthStateChange:', event, !!session?.user);

        // 跳过 TOKEN_REFRESHED 事件，避免不必要的 profile 刷新
        if (event === 'TOKEN_REFRESHED') {
          console.log('[AuthContext] Token refreshed, keeping existing profile');
          return;
        }

        if (session?.user) {
          setUser(session.user);
          // 只有当用户ID变化时才重新获取profile
          if (lastFetchedUserId.current !== session.user.id) {
            const userProfile = await fetchProfile(session.user.id);
            setProfile(userProfile);
          }
        } else {
          setUser(null);
          setProfile(null);
          lastFetchedUserId.current = null;
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (emailOrPhone: string, password: string) => {
    setLoading(true);

    // 判断是手机号还是邮箱
    const phoneRegex = /^1[3-9]\d{9}$/;
    const email = phoneRegex.test(emailOrPhone)
      ? `${emailOrPhone}@student.local`  // 手机号转换为 email
      : emailOrPhone;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      throw error;
    }

    if (data.user) {
      setUser(data.user);
      const userProfile = await fetchProfile(data.user.id);
      setProfile(userProfile);
    }
    setLoading(false);
  };

  const signUp = async (emailOrPhone: string, password: string, name?: string) => {
    console.log('[AuthContext] signUp started');
    setLoading(true);

    // 判断是手机号还是邮箱
    const phoneRegex = /^1[3-9]\d{9}$/;
    const isPhone = phoneRegex.test(emailOrPhone);
    const email = isPhone
      ? `${emailOrPhone}@student.local`  // 手机号转换为 email
      : emailOrPhone;

    // 记录原始手机号（如果是手机号注册）
    const phone = isPhone ? emailOrPhone : null;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // 不需要邮件验证
        data: {
          display_name: name,
          phone: phone,  // 存储手机号到 metadata
        },
      },
    });

    console.log('[AuthContext] signUp response:', { hasUser: !!data.user, hasSession: !!data.session, error });

    if (error) {
      console.error('[AuthContext] signUp error:', error);
      setLoading(false);
      throw error;
    }

    // 检查是否有 session（如果没有 session，说明需要邮箱确认）
    if (!data.session) {
      console.error('[AuthContext] No session after signUp');
      setLoading(false);
      throw new Error('注册成功，但需要邮箱确认。请检查您的邮箱。');
    }

    if (data.user) {
      console.log('[AuthContext] Setting user:', data.user.id);
      setUser(data.user);

      // 等待触发器创建 profile，然后获取
      // 使用重试逻辑，因为触发器是异步的
      let userProfile = null;
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`[AuthContext] Fetching profile attempt ${i + 1}/5`);
        userProfile = await fetchProfile(data.user.id);
        if (userProfile) {
          console.log('[AuthContext] Profile fetched successfully');
          break;
        }
      }

      // 如果找到 profile，确保 phone 字段已设置
      if (userProfile) {
        // 如果 phone 字段为空，更新它
        if (!userProfile.phone && phone) {
          console.log('[AuthContext] Updating profile with phone:', phone);
          const { error: updateError } = await (supabase as any)
            .from('profiles')
            .update({ phone, display_name: name || userProfile.display_name })
            .eq('id', data.user.id);

          if (updateError) {
            console.error('[AuthContext] Error updating profile phone:', updateError);
          } else {
            // 重新获取更新后的 profile
            userProfile = await fetchProfile(data.user.id);
          }
        }
      } else {
        // 如果触发器未创建 profile，通过 API 创建（绕过 RLS）
        console.log('[AuthContext] Profile not found after retries, creating via API');
        try {
          const response = await fetch('/api/profile/ensure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone,
              display_name: name || phone || email.split('@')[0],
              avatar_url: data.user.user_metadata?.avatar_url || null,
              role: 'student',
            }),
          });

          if (response.ok) {
            console.log('[AuthContext] Profile created via API, fetching again');
            userProfile = await fetchProfile(data.user.id);
          } else {
            const error = await response.json();
            console.error('[AuthContext] API error creating profile:', error);
          }
        } catch (apiError) {
          console.error('[AuthContext] Failed to call profile ensure API:', apiError);
        }
      }

      console.log('[AuthContext] Setting profile:', userProfile);
      setProfile(userProfile);
    }

    console.log('[AuthContext] signUp completed, setting loading to false');
    setLoading(false);
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AuthContext] signOut error:', error);
      }
    } catch (err) {
      console.error('[AuthContext] signOut exception:', err);
    }
    // 清除本地状态
    setUser(null);
    setProfile(null);
    lastFetchedUserId.current = null;
    // 使用 window.location.href 进行硬重定向，确保一定跳转
    window.location.href = '/login';
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('Not authenticated');
    }

    console.log('updateProfile called with:', updates);

    try {
      // 先检查 profile 是否存在
      const existingProfile = await fetchProfile(user.id);

      // 如果 profile 不存在，使用 API 创建（绕过 RLS）
      if (!existingProfile) {
        console.log('Profile not found, creating via API');
        const response = await fetch('/api/profile/ensure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: user.user_metadata?.phone || null,
              display_name: updates.display_name || user.user_metadata?.display_name || user.email?.split('@')[0],
              avatar_url: updates.avatar_url || user.user_metadata?.avatar_url || null,
              student_avatar_url: updates.student_avatar_url || user.user_metadata?.student_avatar_url || null,
              parent_avatar_url: updates.parent_avatar_url || user.user_metadata?.parent_avatar_url || null,
              role: updates.role || 'student',
            }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Profile created via API:', result);
          setProfile(result.data as UserProfile);
          return;
        } else {
          const error = await response.json();
          console.error('API error creating profile:', error);
          throw new Error('Failed to create profile');
        }
      }

      // Profile 存在，使用 upsert 更新
      const profileData = {
        id: user.id,
        ...updates,
        // 确保 phone 从 user_metadata 同步
        phone: updates.phone || existingProfile.phone || user.user_metadata?.phone || null,
        display_name: updates.display_name || existingProfile.display_name || user.user_metadata?.display_name || user.email?.split('@')[0],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('Profile updated successfully:', data);

      // 更新后立即刷新本地 profile 状态
      setProfile(data as UserProfile);
    } catch (err: any) {
      console.error('Exception in updateProfile:', err);
      throw err;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await fetchProfile(user.id);
      setProfile(userProfile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshProfile,
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
