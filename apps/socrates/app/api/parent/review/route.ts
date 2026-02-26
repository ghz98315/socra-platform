// =====================================================
// Project Socrates - Parent Review API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// 创建 Supabase Admin 客户端
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - 获取待复核的错题列表
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get('student_id');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!student_id) {
      return NextResponse.json({ error: 'Missing student_id parameter' }, { status: 400 });
    }

    // 验证家长权限
    const parentUser = await getParentUser();
    if (!parentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 验证该学生是否属于当前家长
    const { data: student, error: studentError } = await supabaseAdmin
      .from('profiles')
      .select('id, parent_id, display_name')
      .eq('id', student_id)
      .single();

    if (studentError || !student || student.parent_id !== parentUser.id) {
      return NextResponse.json({ error: 'Not authorized to review this student' }, { status: 403 });
    }

    // 获取待复核的错题（最近完成的）
    const { data: sessions, error } = await supabaseAdmin
      .from('error_sessions')
      .select(`
        id,
        subject,
        extracted_text,
        difficulty_rating,
        concept_tags,
        status,
        created_at,
        chat_messages (
          role,
          content,
          created_at
        )
      `)
      .eq('student_id', student_id)
      .in('status', ['guided_learning', 'mastered'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    return NextResponse.json({
      data: sessions || [],
      student: {
        id: student.id,
        display_name: student.display_name,
      },
    });
  } catch (error: any) {
    console.error('Parent review API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - 提交家长复核
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, action, notes } = body; // action: 'confirmed' | 'overridden'

    if (!session_id || !action) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 验证家长权限
    const parentUser = await getParentUser();
    if (!parentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取错题会话信息
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('error_sessions')
      .select('student_id, parent_id')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 验证该学生是否属于当前家长
    if (session.parent_id !== parentUser.id) {
      return NextResponse.json({ error: 'Not authorized to review this session' }, { status: 403 });
    }

    // 记录家长复核
    const { data: review, error: insertError } = await supabaseAdmin
      .from('parent_reviews')
      .insert({
        session_id,
        parent_id: parentUser.id,
        action,
        notes: notes || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating review:', insertError);
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }

    // 如果家长选择"修改判定"，更新错题状态
    if (action === 'overridden') {
      await supabaseAdmin
        .from('error_sessions')
        .update({ status: 'analyzing' })  // 重置为待分析状态
        .eq('id', session_id);
    }

    return NextResponse.json({
      success: true,
      data: review,
      message: action === 'confirmed' ? '已确认学生的掌握情况' : '已标记为需要重新学习',
    });
  } catch (error: any) {
    console.error('Parent review submit API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 获取当前家长用户
async function getParentUser() {
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

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }

  // 获取家长 profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'parent') {
    return null;
  }

  return profile;
}
