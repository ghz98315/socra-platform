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

    console.log('[API /students] Auth result:', { hasUser: !!user, userError: userError?.message });

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 只返回 parent_id 指向当前用户的学生
    const { data: students, error } = await supabase
      .from('profiles')
      .select('id, display_name, grade_level, avatar_url')
      .eq('role', 'student')
      .eq('parent_id', user.id)  // 只返回这个家长的学生
      .order('display_name', { ascending: true });

    if (error) {
      console.error('Error fetching students:', error);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    return NextResponse.json({
      data: students || [],
    });
  } catch (error) {
    console.error('Students API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
