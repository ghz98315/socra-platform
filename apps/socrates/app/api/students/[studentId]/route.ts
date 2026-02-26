// =====================================================
// Project Socrates - Delete Student API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// 创建 Supabase Admin 客户端（用于删除用户）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// DELETE endpoint - 删除学生账号
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    // 创建服务端客户端，用于认证当前用户
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

    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 验证当前用户是家长
    const { data: parentProfile, error: parentError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (parentError || !parentProfile || parentProfile.role !== 'parent') {
      return NextResponse.json({ error: 'Only parents can delete students' }, { status: 403 });
    }

    // studentId already destructured above

    // 验证学生确实属于当前家长
    const { data: studentProfile, error: studentError } = await supabase
      .from('profiles')
      .select('parent_id, display_name')
      .eq('id', studentId)
      .single();

    if (studentError || !studentProfile) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (studentProfile.parent_id !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own students' }, { status: 403 });
    }

    // 1. 删除 auth.users 记录（会级联删除 profiles 和其他相关记录）
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(studentId);

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      return NextResponse.json({ error: 'Failed to delete student account' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Student deleted successfully',
      data: {
        id: studentId,
        display_name: studentProfile.display_name,
      },
    });
  } catch (error: any) {
    console.error('Delete student API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
