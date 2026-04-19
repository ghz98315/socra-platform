import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> },
) {
  try {
    const { studentId } = await params;
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
      console.error('[students/delete] parent lookup failed:', parentError);
      return NextResponse.json({ error: 'Failed to verify account' }, { status: 500 });
    }

    if (!parentProfile || parentProfile.role !== 'parent') {
      return NextResponse.json({ error: 'Only parents can delete student profiles' }, { status: 403 });
    }

    const { data: studentProfile, error: studentError } = await supabase
      .from('profiles')
      .select('id, parent_id, display_name')
      .eq('id', studentId)
      .eq('role', 'student')
      .maybeSingle();

    if (studentError) {
      console.error('[students/delete] student lookup failed:', studentError);
      return NextResponse.json({ error: 'Failed to verify student profile' }, { status: 500 });
    }

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (studentProfile.parent_id !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own students' }, { status: 403 });
    }

    const { error: deleteProfileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', studentId);

    if (deleteProfileError) {
      console.error('[students/delete] profile delete failed:', deleteProfileError);
      return NextResponse.json({ error: 'Failed to delete student profile' }, { status: 500 });
    }

    await supabaseAdmin.auth.admin.deleteUser(studentId).catch((error) => {
      console.warn('[students/delete] auth user delete skipped:', error);
    });

    return NextResponse.json({
      message: 'Student deleted successfully',
      data: {
        id: studentId,
        display_name: studentProfile.display_name,
      },
    });
  } catch (error) {
    console.error('[students/delete] unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
