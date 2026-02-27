// =====================================================
// Project Socrates - Students List API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// GET endpoint - 获取当前家长的学生列表
export async function GET(req: NextRequest) {
  try {
    // 创建服务端客户端，自动处理 cookies
    const cookieStore = await cookies();

    // 调试：打印所有 cookies
    console.log('[API /students] Cookies:', Array.from(cookieStore.getAll()).map(c => c.name));

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

    console.log('[API /students] Auth result:', { hasUser: !!user, userId: user?.id, userError: userError?.message });

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 获取当前用户的角色
    const { data: parentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('[API /students] Parent profile:', parentProfile);

    // 只返回 parent_id 指向当前用户的学生
    const { data: students, error } = await supabase
      .from('profiles')
      .select('id, display_name, grade_level, avatar_url, phone, parent_id')
      .eq('role', 'student')
      .eq('parent_id', user.id)  // 只返回这个家长的学生
      .order('display_name', { ascending: true });

    console.log('[API /students] Query result:', { studentsCount: students?.length, error: error?.message });

    if (error) {
      console.error('Error fetching students:', error);
      return NextResponse.json({ error: 'Failed to fetch students', details: error.message }, { status: 500 });
    }

    // 调试：如果没有学生，检查是否有学生记录
    if (!students || students.length === 0) {
      const { data: allStudents } = await supabase
        .from('profiles')
        .select('id, display_name, parent_id')
        .eq('role', 'student')
        .limit(10);

      console.log('[API /students] All students for debugging:', allStudents);
    }

    return NextResponse.json({
      data: students || [],
      debug: {
        parentId: user.id,
        parentRole: parentProfile?.role,
      },
    });
  } catch (error) {
    console.error('Students API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
