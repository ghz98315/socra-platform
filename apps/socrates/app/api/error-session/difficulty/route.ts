// =====================================================
// Project Socrates - Difficulty Rating API
// 学生难度自评 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 计算最终难度
 * AI 评估 (60%) + 学生自评 (40%)
 */
function calculateFinalDifficulty(aiRating: number | null, studentRating: number): number {
  const ai = aiRating || 3; // 如果没有 AI 评估，默认为 3
  const final = ai * 0.6 + studentRating * 0.4;
  // 四舍五入到 0.5
  return Math.round(final * 2) / 2;
}

// POST - 提交学生难度评价
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, student_id, difficulty_rating } = body;

    // 参数验证
    if (!session_id || !student_id || !difficulty_rating) {
      return NextResponse.json(
        { error: '缺少必填参数: session_id, student_id, difficulty_rating' },
        { status: 400 }
      );
    }

    if (difficulty_rating < 1 || difficulty_rating > 5) {
      return NextResponse.json(
        { error: '难度评分必须在 1-5 之间' },
        { status: 400 }
      );
    }

    // 获取当前错题会话信息
    const { data: session, error: fetchError } = await supabase
      .from('error_sessions')
      .select('difficulty_rating, student_difficulty_rating')
      .eq('id', session_id)
      .eq('student_id', student_id)
      .single();

    if (fetchError || !session) {
      console.error('[Difficulty API] Session not found:', fetchError);
      return NextResponse.json(
        { error: '错题会话不存在' },
        { status: 404 }
      );
    }

    // 计算最终难度
    const finalDifficulty = calculateFinalDifficulty(session.difficulty_rating, difficulty_rating);

    console.log('[Difficulty API] Calculating final difficulty:', {
      aiRating: session.difficulty_rating,
      studentRating: difficulty_rating,
      finalDifficulty
    });

    // 更新数据库
    const { error: updateError } = await supabase
      .from('error_sessions')
      .update({
        student_difficulty_rating: difficulty_rating,
        final_difficulty_rating: finalDifficulty,
        student_rated_at: new Date().toISOString(),
      })
      .eq('id', session_id);

    if (updateError) {
      console.error('[Difficulty API] Update error:', updateError);
      return NextResponse.json(
        { error: '更新失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        student_difficulty_rating: difficulty_rating,
        final_difficulty_rating: finalDifficulty,
      },
    });
  } catch (error: any) {
    console.error('[Difficulty API] Error:', error);
    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}

// GET - 获取难度评价信息
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      return NextResponse.json(
        { error: '缺少 session_id 参数' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('error_sessions')
      .select('difficulty_rating, student_difficulty_rating, final_difficulty_rating')
      .eq('id', session_id)
      .single();

    if (error) {
      console.error('[Difficulty API] Fetch error:', error);
      return NextResponse.json(
        { error: '获取失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('[Difficulty API] Error:', error);
    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
