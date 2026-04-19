import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseAdminInstance = createClient(url, key);
  }

  return supabaseAdminInstance;
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '');
}

function resolveThemeByGrade(gradeLevel: number | null | undefined) {
  if (!gradeLevel) {
    return null;
  }

  return gradeLevel <= 6 ? 'junior' : 'senior';
}

type AccountProfile = {
  id: string;
  role: 'student' | 'parent' | 'admin';
  display_name: string | null;
  phone: string | null;
  grade_level: number | null;
  theme_preference: 'junior' | 'senior' | null;
  avatar_url: string | null;
  student_avatar_url: string | null;
  parent_avatar_url: string | null;
  parent_id: string | null;
  created_at: string;
};

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

async function getAccountProfile(admin: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await admin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as AccountProfile | null) || null;
}

async function getAvailableProfiles(
  admin: ReturnType<typeof createClient>,
  accountProfile: AccountProfile,
) {
  if (accountProfile.role !== 'parent') {
    return [accountProfile];
  }

  const { data: children, error } = await admin
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .eq('parent_id', accountProfile.id)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return [accountProfile, ...((children as AccountProfile[] | null) || [])];
}

async function resolveTargetProfile(
  admin: ReturnType<typeof createClient>,
  accountProfile: AccountProfile,
  targetProfileId: string | null | undefined,
) {
  const normalizedTargetId = targetProfileId?.trim();
  if (!normalizedTargetId || normalizedTargetId === accountProfile.id) {
    return accountProfile;
  }

  if (accountProfile.role !== 'parent') {
    return null;
  }

  const { data, error } = await admin
    .from('profiles')
    .select('*')
    .eq('id', normalizedTargetId)
    .eq('role', 'student')
    .eq('parent_id', accountProfile.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as AccountProfile | null) || null;
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const accountProfile = await getAccountProfile(admin, user.id);

    if (!accountProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const availableProfiles = await getAvailableProfiles(admin, accountProfile);

    return NextResponse.json({
      data: {
        account_profile: accountProfile,
        available_profiles: availableProfiles,
      },
    });
  } catch (error) {
    console.error('[API account/profile] GET unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const admin = getSupabaseAdmin();
    const accountProfile = await getAccountProfile(admin, user.id);

    if (!accountProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const targetProfile = await resolveTargetProfile(admin, accountProfile, body.profile_id);
    if (!targetProfile) {
      return NextResponse.json({ error: 'Target profile not found' }, { status: 404 });
    }

    const nextDisplayName =
      typeof body.display_name === 'string' && body.display_name.trim().length > 0
        ? body.display_name.trim()
        : targetProfile.display_name;

    const nextStudentAvatar =
      typeof body.student_avatar_url === 'string' && body.student_avatar_url.trim().length > 0
        ? body.student_avatar_url.trim()
        : targetProfile.student_avatar_url || targetProfile.avatar_url;

    const nextParentAvatar =
      typeof body.parent_avatar_url === 'string' && body.parent_avatar_url.trim().length > 0
        ? body.parent_avatar_url.trim()
        : targetProfile.parent_avatar_url || targetProfile.avatar_url;

    const nextGradeLevel =
      body.grade_level === null || body.grade_level === undefined || body.grade_level === ''
        ? targetProfile.grade_level
        : Number(body.grade_level);

    if (
      nextGradeLevel !== null &&
      nextGradeLevel !== undefined &&
      (!Number.isInteger(nextGradeLevel) || nextGradeLevel < 1 || nextGradeLevel > 12)
    ) {
      return NextResponse.json({ error: 'Grade level must be between 1 and 12' }, { status: 400 });
    }

    const nextTheme =
      typeof body.theme_preference === 'string'
        ? body.theme_preference
        : resolveThemeByGrade(nextGradeLevel) || targetProfile.theme_preference;

    let nextPhone = targetProfile.phone;
    if (typeof body.phone === 'string') {
      const trimmedPhone = body.phone.trim();
      if (trimmedPhone.length === 0) {
        nextPhone = null;
      } else {
        const normalizedPhone = normalizePhone(trimmedPhone);
        if (!/^1[3-9]\d{9}$/.test(normalizedPhone)) {
          return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
        }
        nextPhone = normalizedPhone;
      }
    }

    if (targetProfile.id === user.id && nextPhone && nextPhone !== targetProfile.phone) {
      const { data: existingUsers } = await admin.auth.admin.listUsers();
      const duplicate = existingUsers.users.find(
        (candidate) => candidate.id !== user.id && candidate.email === `${nextPhone}@student.local`,
      );

      if (duplicate) {
        return NextResponse.json({ error: 'This phone number is already in use' }, { status: 409 });
      }
    }

    const nextAvatarUrl =
      targetProfile.role === 'parent'
        ? nextParentAvatar || targetProfile.avatar_url
        : nextStudentAvatar || targetProfile.avatar_url;

    if (targetProfile.id === user.id) {
      const currentMetadata =
        user.user_metadata && typeof user.user_metadata === 'object'
          ? { ...user.user_metadata }
          : {};

      const { error: authUpdateError } = await admin.auth.admin.updateUserById(user.id, {
        email: nextPhone ? `${nextPhone}@student.local` : user.email || undefined,
        email_confirm: true,
        user_metadata: {
          ...currentMetadata,
          display_name: nextDisplayName,
          phone: nextPhone,
          avatar_url: nextAvatarUrl,
          student_avatar_url: nextStudentAvatar,
          parent_avatar_url: nextParentAvatar,
        },
      });

      if (authUpdateError) {
        console.error('[API account/profile] Failed to update auth user:', authUpdateError);
        return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
      }
    }

    const { data: updatedProfile, error: updateError } = await (admin as any)
      .from('profiles')
      .update({
        display_name: nextDisplayName,
        phone: nextPhone,
        grade_level: nextGradeLevel,
        theme_preference: nextTheme,
        avatar_url: nextAvatarUrl,
        student_avatar_url: nextStudentAvatar,
        parent_avatar_url: nextParentAvatar,
      })
      .eq('id', targetProfile.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('[API account/profile] Failed to update profile:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      data: updatedProfile,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('[API account/profile] PATCH unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
