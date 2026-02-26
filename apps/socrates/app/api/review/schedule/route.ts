// =====================================================
// Project Socrates - Review Schedule API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 创建 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - 获取待复习列表
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get('student_id');

    if (!student_id) {
      return NextResponse.json({ error: 'Missing student_id parameter' }, { status: 400 });
    }

    // 获取待复习的错题
    const { data: reviews, error } = await supabase
      .from('review_schedule')
      .select(`
        id,
        session_id,
        student_id,
        review_stage,
        next_review_at,
        is_completed,
        error_sessions (
          id,
          subject,
          extracted_text,
          difficulty_rating,
          concept_tags,
          created_at
        )
      `)
      .eq('student_id', student_id)
      .eq('is_completed', false)
      .lte('next_review_at', new Date().toISOString())
      .order('next_review_at', { ascending: true });

    if (error) {
      console.error('Error fetching review schedule:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    return NextResponse.json({
      data: reviews || [],
      count: reviews?.length || 0,
    });
  } catch (error: any) {
    console.error('Review schedule API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - 完成复习并进入下一阶段
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { review_id, student_id, result } = body; // result: 'correct' | 'incorrect' | 'skipped'

    if (!review_id || !student_id) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 调用数据库函数推进复习阶段
    const { data, error } = await supabase.rpc('advance_review_stage', {
      p_review_id: review_id
    });

    if (error) {
      console.error('Error advancing review stage:', error);
      return NextResponse.json({ error: 'Failed to complete review' }, { status: 500 });
    }

    // 记录复习结果到聊天历史（可选）
    if (result && result !== 'skipped') {
      // 可以在这里添加记录复习结果的逻辑
    }

    return NextResponse.json({
      success: true,
      completed: data === true, // true = 已完成所有阶段
      message: data === true ? '恭喜！这道错题已完全掌握' : '复习完成，进入下一阶段',
    });
  } catch (error: any) {
    console.error('Review complete API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
