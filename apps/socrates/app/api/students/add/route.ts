import { randomUUID } from 'crypto';

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

function buildStudentAuthEmail(studentId: string, phone: string | null) {
  if (phone) {
    return `${phone}@student.local`;
  }

  return `student-profile+${studentId}@socra.local`;
}

export async function POST(req: NextRequest) {
  try {
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
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: parentProfile, error: parentError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (parentError) {
      console.error('[students/add] parent lookup failed:', parentError);
      return NextResponse.json({ error: 'Failed to verify account' }, { status: 500 });
    }

    if (!parentProfile || parentProfile.role !== 'parent') {
      return NextResponse.json({ error: 'Only parents can add student profiles' }, { status: 403 });
    }

    const body = await req.json();
    const displayName =
      typeof body.display_name === 'string' ? body.display_name.trim() : '';
    const phone =
      typeof body.phone === 'string' && body.phone.trim().length > 0 ? body.phone.trim() : null;
    const parsedGradeLevel =
      body.grade_level === null || body.grade_level === undefined || body.grade_level === ''
        ? null
        : Number(body.grade_level);

    if (!displayName) {
      return NextResponse.json({ error: 'display_name is required' }, { status: 400 });
    }

    if (
      parsedGradeLevel !== null &&
      (!Number.isInteger(parsedGradeLevel) || parsedGradeLevel < 1 || parsedGradeLevel > 12)
    ) {
      return NextResponse.json({ error: 'Grade level must be between 1 and 12' }, { status: 400 });
    }

    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    const studentId = randomUUID();
    const themePreference = parsedGradeLevel && parsedGradeLevel <= 6 ? 'junior' : 'senior';
    const studentEmail = buildStudentAuthEmail(studentId, phone);
    const bootstrapPassword = `Tmp!${randomUUID()}Aa`;

    const { data: createdAuthUser, error: createAuthUserError } = await supabaseAdmin.auth.admin.createUser({
      email: studentEmail,
      password: bootstrapPassword,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        phone,
        linked_parent_id: user.id,
        profile_mode: 'child_profile_backing_user',
      },
    });

    if (createAuthUserError || !createdAuthUser?.user?.id) {
      console.error('[students/add] auth user create failed:', createAuthUserError);
      return NextResponse.json({ error: 'Failed to create student profile' }, { status: 500 });
    }

    const { error: insertError } = await supabaseAdmin.from('profiles').insert({
      id: createdAuthUser.user.id,
      role: 'student',
      parent_id: user.id,
      display_name: displayName,
      phone,
      grade_level: parsedGradeLevel,
      theme_preference: parsedGradeLevel ? themePreference : null,
    });

    if (insertError) {
      console.error('[students/add] profile insert failed:', insertError);
      await supabaseAdmin.auth.admin.deleteUser(createdAuthUser.user.id).catch((error) => {
        console.warn('[students/add] auth user cleanup skipped:', error);
      });
      return NextResponse.json({ error: 'Failed to create student profile' }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        id: createdAuthUser.user.id,
        display_name: displayName,
        phone,
        grade_level: parsedGradeLevel,
        role: 'student',
      },
      message: 'Student profile created successfully',
    });
  } catch (error) {
    console.error('[students/add] unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
