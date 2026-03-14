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
    const scope = searchParams.get('scope') || 'due';
    const includeCounts = searchParams.get('include_counts') === '1';

    if (!student_id) {
      return NextResponse.json({ error: 'Missing student_id parameter' }, { status: 400 });
    }

    const reviewSelect = `
        id,
        session_id,
        student_id,
        review_stage,
        next_review_at,
        is_completed,
        created_at,
        error_sessions (
          id,
          subject,
          extracted_text,
          difficulty_rating,
          student_difficulty_rating,
          final_difficulty_rating,
          concept_tags,
          created_at,
          status
        )
      `;

    let pendingQuery = supabase
      .from('review_schedule')
      .select(reviewSelect)
      .eq('student_id', student_id)
      .eq('is_completed', false)
      .order('next_review_at', { ascending: true });

    if (scope !== 'all') {
      pendingQuery = pendingQuery.lte('next_review_at', new Date().toISOString());
    }

    const pendingPromise = pendingQuery;
    const completedPromise = includeCounts
      ? supabase
          .from('review_schedule')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', student_id)
          .eq('is_completed', true)
      : Promise.resolve({ count: 0, error: null } as { count: number | null; error: null });

    const completedListPromise = includeCounts
      ? supabase
          .from('review_schedule')
          .select(reviewSelect)
          .eq('student_id', student_id)
          .eq('is_completed', true)
          .order('next_review_at', { ascending: false })
          .limit(6)
      : Promise.resolve({ data: [], error: null } as { data: any[]; error: null });

    const [pendingResult, completedResult, completedListResult] = await Promise.all([
      pendingPromise,
      completedPromise,
      completedListPromise,
    ]);
    const { data: reviews, error } = pendingResult;
    const { data: completedReviews, error: completedListError } = completedListResult;

    if (error) {
      console.error('Error fetching review schedule:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    if (completedListError) {
      console.error('Error fetching completed review schedule:', completedListError);
    }

    const now = Date.now();
    const mapReview = (review: any) => {
      const session = Array.isArray(review.error_sessions) ? review.error_sessions[0] : review.error_sessions;
      const nextReviewAt = new Date(review.next_review_at);
      const daysUntilDue = Math.ceil((nextReviewAt.getTime() - now) / (1000 * 60 * 60 * 24));

      return {
        id: review.id,
        session_id: review.session_id,
        student_id: review.student_id,
        review_stage: review.review_stage,
        next_review_at: review.next_review_at,
        is_completed: review.is_completed,
        days_until_due: daysUntilDue,
        is_overdue: daysUntilDue <= 0,
        error_session: session
          ? {
            id: session.id,
            subject: session.subject,
            extracted_text: session.extracted_text,
            difficulty_rating: session.difficulty_rating,
            student_difficulty_rating: session.student_difficulty_rating,
            final_difficulty_rating: session.final_difficulty_rating,
            concept_tags: session.concept_tags,
            created_at: session.created_at,
            status: session.status,
          }
          : null,
      };
    };

    const mappedReviews = (reviews || []).map(mapReview);
    const mappedCompletedReviews = (completedReviews || []).map(mapReview);
    const overdueCount = mappedReviews.filter((review) => review.is_overdue).length;
    const dueTodayCount = mappedReviews.filter((review) => review.days_until_due <= 1).length;
    const upcomingCount = mappedReviews.filter((review) => review.days_until_due > 1).length;
    const completedCount = includeCounts ? completedResult.count || 0 : 0;

    return NextResponse.json({
      data: mappedReviews,
      completed_data: mappedCompletedReviews,
      count: mappedReviews.length,
      completed_count: includeCounts ? completedCount : undefined,
      summary: {
        total_count: mappedReviews.length + completedCount,
        pending_count: mappedReviews.length,
        due_today_count: dueTodayCount,
        overdue_count: overdueCount,
        upcoming_count: upcomingCount,
        completed_count: completedCount,
      },
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
