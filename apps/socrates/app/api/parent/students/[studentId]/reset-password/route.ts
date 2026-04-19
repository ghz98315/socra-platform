import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const body = await req.json();
    const password =
      typeof body.password === 'string' ? body.password.trim() : '';

    if (password.length < 6) {
      return NextResponse.json(
        { error: '新密码至少需要 6 位字符' },
        { status: 400 }
      );
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
      }
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
      console.error('[parent/reset-password] parent lookup failed:', parentError);
      return NextResponse.json({ error: 'Failed to verify parent account' }, { status: 500 });
    }

    if (!parentProfile || parentProfile.role !== 'parent') {
      return NextResponse.json(
        { error: 'Only parent accounts can manage student passwords' },
        { status: 403 }
      );
    }

    const { data: studentProfile, error: studentError } = await supabase
      .from('profiles')
      .select('id, display_name, role, parent_id')
      .eq('id', studentId)
      .maybeSingle();

    if (studentError) {
      console.error('[parent/reset-password] student lookup failed:', studentError);
      return NextResponse.json({ error: 'Failed to verify student account' }, { status: 500 });
    }

    if (!studentProfile || studentProfile.role !== 'student') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (studentProfile.parent_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only reset passwords for your own students' },
        { status: 403 }
      );
    }

    const { data: authUserResult, error: authLookupError } = await supabaseAdmin.auth.admin.getUserById(studentId);
    if (authLookupError || !authUserResult?.user) {
      return NextResponse.json(
        { error: 'This student profile does not have an independent login password' },
        { status: 400 }
      );
    }

    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(studentId, {
      password,
    });

    if (resetError) {
      console.error('[parent/reset-password] auth update failed:', resetError);
      return NextResponse.json({ error: 'Failed to reset student password' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: studentId,
        display_name: studentProfile.display_name,
      },
      message: 'Student password reset successfully',
    });
  } catch (error) {
    console.error('[parent/reset-password] unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
