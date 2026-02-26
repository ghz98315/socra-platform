// =====================================================
// Project Socrates - Complete Error Session API
// 标记错题为已掌握，并自动创建复习计划
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 创建 Supabase 服务端客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 艾宾浩斯复习间隔（天）
const REVIEW_INTERVALS = [1, 3, 7, 30];

// POST - 标记错题为已掌握，并创建复习计划
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, student_id } = body;

    if (!session_id || !student_id) {
      return NextResponse.json({ error: '缺少必填字段: session_id, student_id' }, { status: 400 });
    }

    // 1. 更新错题状态为已掌握
    const { error: updateError } = await supabase
      .from('error_sessions')
      .update({
        status: 'mastered',
      })
      .eq('id', session_id)
      .eq('student_id', student_id);

    if (updateError) {
      console.error('Error updating session status:', updateError);
      return NextResponse.json({ error: '更新状态失败' }, { status: 500 });
    }

    // 2. 检查是否已有复习计划
    const { data: existingReview } = await supabase
      .from('review_schedule')
      .select('id')
      .eq('session_id', session_id)
      .eq('student_id', student_id)
      .single();

    if (existingReview) {
      return NextResponse.json({
        success: true,
        message: '错题已标记为已掌握',
        review_exists: true,
      });
    }

    // 3. 创建复习计划（第一次复习：1天后）
    const firstReviewDate = new Date();
    firstReviewDate.setDate(firstReviewDate.getDate() + REVIEW_INTERVALS[0]);

    const { data: reviewData, error: reviewError } = await supabase
      .from('review_schedule')
      .insert({
        session_id,
        student_id,
        review_stage: 1,
        next_review_at: firstReviewDate.toISOString(),
        is_completed: false,
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error creating review schedule:', reviewError);
      // 不返回错误，因为状态已更新成功
      return NextResponse.json({
        success: true,
        message: '错题已标记为已掌握，但复习计划创建失败',
        review_created: false,
      });
    }

    // 4. 更新成就（可选：记录掌握成就）
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/achievements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: student_id,
          action: 'error_mastered',
          data: { count: 1 },
        }),
      });
    } catch (e) {
      console.error('Failed to update achievements:', e);
    }

    return NextResponse.json({
      success: true,
      message: '恭喜！错题已掌握，复习计划已创建',
      review_created: true,
      review_id: reviewData?.id,
      next_review_at: firstReviewDate.toISOString(),
    });
  } catch (error: any) {
    console.error('Complete error session API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
