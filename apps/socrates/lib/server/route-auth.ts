import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const ACTIVE_PROFILE_COOKIE = 'socrates-active-profile';

export type AuthenticatedProfile = {
  id: string;
  role: 'parent' | 'student' | 'admin';
};

export type AuthorizedStudentProfile = {
  id: string;
  role: 'student';
  parent_id: string | null;
  display_name?: string | null;
  grade_level?: number | null;
};

export type AuthorizedStudentError =
  | 'not_authenticated'
  | 'unsupported_role'
  | 'student_id_required'
  | 'forbidden'
  | 'student_not_found';

export async function getAuthenticatedProfile() {
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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  return profile as AuthenticatedProfile;
}

export async function getAuthenticatedParentProfile() {
  const profile = await getAuthenticatedProfile();
  if (!profile || profile.role !== 'parent') {
    return null;
  }
  return profile;
}

export async function getAuthenticatedStudentProfile() {
  const profile = await getAuthenticatedProfile();
  if (!profile) {
    return null;
  }

  if (profile.role === 'student') {
    return profile;
  }

  if (profile.role !== 'parent') {
    return null;
  }

  const cookieStore = await cookies();
  const activeProfileId = cookieStore.get(ACTIVE_PROFILE_COOKIE)?.value?.trim() || '';
  if (!activeProfileId) {
    return null;
  }

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

  const { data: student, error } = await supabase
    .from('profiles')
    .select('id, role, parent_id, display_name, grade_level')
    .eq('id', activeProfileId)
    .eq('role', 'student')
    .eq('parent_id', profile.id)
    .maybeSingle();

  if (error || !student) {
    return null;
  }

  return student as AuthorizedStudentProfile;
}

export async function getAuthorizedStudentProfile(requestedStudentId?: string | null) {
  const profile = await getAuthenticatedProfile();
  if (!profile) {
    return { error: 'not_authenticated' as AuthorizedStudentError };
  }

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

  if (profile.role === 'student') {
    if (requestedStudentId && requestedStudentId !== profile.id) {
      return { error: 'forbidden' as AuthorizedStudentError };
    }

    const { data: student, error } = await supabase
      .from('profiles')
      .select('id, role, parent_id, display_name, grade_level')
      .eq('id', profile.id)
      .eq('role', 'student')
      .maybeSingle();

    if (error || !student) {
      return { error: 'student_not_found' as AuthorizedStudentError };
    }

    return { profile: student as AuthorizedStudentProfile };
  }

  if (profile.role === 'parent') {
    const activeProfileId = cookieStore.get(ACTIVE_PROFILE_COOKIE)?.value?.trim() || '';
    const normalizedStudentId = requestedStudentId?.trim() || activeProfileId;
    if (!normalizedStudentId) {
      return { error: 'student_id_required' as AuthorizedStudentError };
    }

    const { data: student, error } = await supabase
      .from('profiles')
      .select('id, role, parent_id, display_name, grade_level')
      .eq('id', normalizedStudentId)
      .eq('role', 'student')
      .eq('parent_id', profile.id)
      .maybeSingle();

    if (error || !student) {
      return { error: 'student_not_found' as AuthorizedStudentError };
    }

    return { profile: student as AuthorizedStudentProfile };
  }

  return { error: 'unsupported_role' as AuthorizedStudentError };
}

export function createAuthorizedStudentErrorResponse(error?: AuthorizedStudentError) {
  switch (error) {
    case 'not_authenticated':
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    case 'student_id_required':
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    case 'forbidden':
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    case 'student_not_found':
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    default:
      return NextResponse.json({ error: 'Unsupported role' }, { status: 403 });
  }
}
