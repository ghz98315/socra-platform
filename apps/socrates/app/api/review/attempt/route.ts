import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
const VALID_ATTEMPT_MODES = new Set(['original', 'variant', 'mixed']);

type MasteryJudgement =
  | 'not_mastered'
  | 'assisted_correct'
  | 'explanation_gap'
  | 'pseudo_mastery'
  | 'provisional_mastered'
  | 'mastered';

function nextDateByDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function determineJudgement({
  independentFirst,
  askedAi,
  aiHintCount,
  solvedCorrectly,
  explainedCorrectly,
  variantPassed,
  reviewStage,
}: {
  independentFirst: boolean;
  askedAi: boolean;
  aiHintCount: number;
  solvedCorrectly: boolean;
  explainedCorrectly: boolean;
  variantPassed: boolean | null;
  reviewStage: number;
}): MasteryJudgement {
  if (!solvedCorrectly) {
    return 'not_mastered';
  }

  if (!independentFirst || askedAi || aiHintCount > 0) {
    return 'assisted_correct';
  }

  if (!explainedCorrectly) {
    return 'explanation_gap';
  }

  if (variantPassed === false) {
    return 'pseudo_mastery';
  }

  if (reviewStage >= 2) {
    return 'mastered';
  }

  return 'provisional_mastered';
}

function deriveScheduleUpdate({
  currentReviewStage,
  currentReopenedCount,
  judgement,
}: {
  currentReviewStage: number;
  currentReopenedCount: number;
  judgement: MasteryJudgement;
}) {
  switch (judgement) {
    case 'mastered':
      return {
        review_stage: currentReviewStage,
        next_review_at: null,
        is_completed: true,
        mastery_state: 'mastered_closed',
        last_judgement: judgement,
        close_reason: 'stable_independent_recall',
        reopened_count: currentReopenedCount,
        next_interval_days: null,
        closure_state: 'mastered_closed',
        error_status: 'mastered',
      };
    case 'provisional_mastered': {
      const nextStage = Math.min(currentReviewStage + 1, REVIEW_INTERVALS.length);
      const nextIntervalDays = REVIEW_INTERVALS[Math.max(nextStage - 1, 0)];
      return {
        review_stage: nextStage,
        next_review_at: nextDateByDays(nextIntervalDays),
        is_completed: false,
        mastery_state: 'provisional_mastered',
        last_judgement: judgement,
        close_reason: null,
        reopened_count: currentReopenedCount,
        next_interval_days: nextIntervalDays,
        closure_state: 'provisional_mastered',
        error_status: 'guided_learning',
      };
    }
    case 'assisted_correct':
    case 'explanation_gap':
    case 'pseudo_mastery':
    case 'not_mastered':
    default: {
      const nextIntervalDays = REVIEW_INTERVALS[0];
      return {
        review_stage: 1,
        next_review_at: nextDateByDays(nextIntervalDays),
        is_completed: false,
        mastery_state: 'reopened',
        last_judgement: judgement,
        close_reason: null,
        reopened_count: currentReopenedCount + 1,
        next_interval_days: nextIntervalDays,
        closure_state: 'reopened',
        error_status: 'guided_learning',
      };
    }
  }
}

async function sendParentRiskNotification({
  studentId,
  sessionId,
  reviewId,
  judgement,
}: {
  studentId: string;
  sessionId: string;
  reviewId: string;
  judgement: MasteryJudgement;
}) {
  if (!['not_mastered', 'assisted_correct', 'explanation_gap', 'pseudo_mastery'].includes(judgement)) {
    return;
  }

  try {
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('id, display_name, parent_id')
      .eq('id', studentId)
      .maybeSingle();

    if (studentError || !student?.parent_id) {
      return;
    }

    const judgementMessageMap: Record<Exclude<MasteryJudgement, 'provisional_mastered' | 'mastered'>, string> = {
      not_mastered: '本轮复习仍未做对，需要重新进入巩固流程。',
      assisted_correct: '本轮复习做对了，但依赖了 AI 提示，暂不能判定为真正掌握。',
      explanation_gap: '本轮复习做对了，但学生还无法清楚解释思路，仍需继续巩固。',
      pseudo_mastery: '本轮复习原题表现正常，但变式未通过，属于典型“假会”信号。',
    };

    await supabase.from('notifications').insert({
      user_id: student.parent_id,
      type: 'mastery_update',
      title: `${student.display_name || '孩子'}出现掌握风险提醒`,
      content: judgementMessageMap[judgement as Exclude<MasteryJudgement, 'provisional_mastered' | 'mastered'>],
      data: {
        student_id: studentId,
        session_id: sessionId,
        review_id: reviewId,
        mastery_judgement: judgement,
        risk_type: 'mastery_risk',
      },
      action_url: `/review/session/${reviewId}`,
      action_text: '查看复习详情',
      is_read: false,
      priority: 2,
    });
  } catch (error) {
    console.error('[review/attempt] Failed to create parent notification:', error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const reviewId = req.nextUrl.searchParams.get('review_id');
    const studentId = req.nextUrl.searchParams.get('student_id');

    if (!reviewId || !studentId) {
      return NextResponse.json({ error: 'Missing required query params: review_id, student_id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('review_attempts')
      .select('*')
      .eq('review_id', reviewId)
      .eq('student_id', studentId)
      .order('attempt_no', { ascending: true });

    if (error) {
      console.error('[review/attempt] Failed to fetch review attempts:', error);
      return NextResponse.json({ error: 'Failed to fetch review attempts' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
      count: data?.length ?? 0,
    });
  } catch (error: any) {
    console.error('[review/attempt] GET API error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      review_id,
      student_id,
      attempt_mode,
      independent_first,
      asked_ai,
      ai_hint_count,
      solved_correctly,
      explained_correctly,
      confidence_score,
      duration_seconds,
      variant_passed,
      notes,
      metadata,
    } = body ?? {};

    if (!review_id || !student_id) {
      return NextResponse.json({ error: 'Missing required fields: review_id, student_id' }, { status: 400 });
    }

    const { data: review, error: reviewError } = await supabase
      .from('review_schedule')
      .select('id, session_id, student_id, review_stage, reopened_count, is_completed')
      .eq('id', review_id)
      .eq('student_id', student_id)
      .maybeSingle();

    if (reviewError) {
      console.error('[review/attempt] Failed to load review schedule:', reviewError);
      return NextResponse.json({ error: 'Failed to load review schedule' }, { status: 500 });
    }

    if (!review?.id) {
      return NextResponse.json({ error: 'Review schedule not found for this student' }, { status: 404 });
    }

    const { count: attemptCount, error: attemptCountError } = await supabase
      .from('review_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('review_id', review_id);

    if (attemptCountError) {
      console.error('[review/attempt] Failed to count review attempts:', attemptCountError);
      return NextResponse.json({ error: 'Failed to count existing review attempts' }, { status: 500 });
    }

    const normalizedIndependentFirst = independent_first !== false;
    const normalizedAskedAi = asked_ai === true;
    const normalizedAiHintCount = Number.isFinite(ai_hint_count) ? Math.max(0, Number(ai_hint_count)) : 0;
    const normalizedSolvedCorrectly = solved_correctly === true;
    const normalizedExplainedCorrectly = explained_correctly === true;
    const normalizedVariantPassed =
      variant_passed === true ? true : variant_passed === false ? false : null;
    const normalizedConfidenceScore =
      Number.isFinite(confidence_score) && Number(confidence_score) >= 1 && Number(confidence_score) <= 5
        ? Number(confidence_score)
        : null;
    const normalizedDurationSeconds =
      Number.isFinite(duration_seconds) && Number(duration_seconds) >= 0 ? Number(duration_seconds) : null;
    const normalizedAttemptMode =
      typeof attempt_mode === 'string' && VALID_ATTEMPT_MODES.has(attempt_mode) ? attempt_mode : 'original';

    const judgement = determineJudgement({
      independentFirst: normalizedIndependentFirst,
      askedAi: normalizedAskedAi,
      aiHintCount: normalizedAiHintCount,
      solvedCorrectly: normalizedSolvedCorrectly,
      explainedCorrectly: normalizedExplainedCorrectly,
      variantPassed: normalizedVariantPassed,
      reviewStage: review.review_stage ?? 1,
    });

    const { data: insertedAttempt, error: insertAttemptError } = await supabase
      .from('review_attempts')
      .insert({
        review_id,
        session_id: review.session_id,
        student_id,
        attempt_no: (attemptCount || 0) + 1,
        attempt_mode: normalizedAttemptMode,
        independent_first: normalizedIndependentFirst,
        asked_ai: normalizedAskedAi,
        ai_hint_count: normalizedAiHintCount,
        solved_correctly: normalizedSolvedCorrectly,
        explained_correctly: normalizedExplainedCorrectly,
        confidence_score: normalizedConfidenceScore,
        duration_seconds: normalizedDurationSeconds,
        variant_passed: normalizedVariantPassed,
        mastery_judgement: judgement,
        notes: typeof notes === 'string' ? notes : null,
        metadata: metadata && typeof metadata === 'object' ? metadata : {},
      })
      .select('*')
      .single();

    if (insertAttemptError) {
      console.error('[review/attempt] Failed to insert review attempt:', insertAttemptError);
      return NextResponse.json({ error: 'Failed to save review attempt' }, { status: 500 });
    }

    const scheduleUpdate = deriveScheduleUpdate({
      currentReviewStage: review.review_stage ?? 1,
      currentReopenedCount: review.reopened_count ?? 0,
      judgement,
    });

    const { data: updatedReview, error: updateReviewError } = await supabase
      .from('review_schedule')
      .update({
        review_stage: scheduleUpdate.review_stage,
        next_review_at: scheduleUpdate.next_review_at,
        is_completed: scheduleUpdate.is_completed,
        mastery_state: scheduleUpdate.mastery_state,
        last_attempt_id: insertedAttempt.id,
        last_judgement: scheduleUpdate.last_judgement,
        close_reason: scheduleUpdate.close_reason,
        reopened_count: scheduleUpdate.reopened_count,
        next_interval_days: scheduleUpdate.next_interval_days,
      })
      .eq('id', review_id)
      .eq('student_id', student_id)
      .select('*')
      .single();

    if (updateReviewError) {
      console.error('[review/attempt] Failed to update review schedule:', updateReviewError);
      return NextResponse.json({ error: 'Review attempt saved, but schedule update failed' }, { status: 500 });
    }

    const { error: updateSessionError } = await supabase
      .from('error_sessions')
      .update({
        status: scheduleUpdate.error_status,
        closure_state: scheduleUpdate.closure_state,
      })
      .eq('id', review.session_id)
      .eq('student_id', student_id);

    if (updateSessionError) {
      console.error('[review/attempt] Failed to update error session closure state:', updateSessionError);
      return NextResponse.json({ error: 'Review attempt saved, but error session update failed' }, { status: 500 });
    }

    await sendParentRiskNotification({
      studentId: student_id,
      sessionId: review.session_id,
      reviewId: review_id,
      judgement,
    });

    return NextResponse.json({
      success: true,
      data: {
        attempt: insertedAttempt,
        review: updatedReview,
        mastery_judgement: judgement,
        closed: judgement === 'mastered',
        next_review_at: updatedReview?.next_review_at ?? null,
      },
    });
  } catch (error: any) {
    console.error('[review/attempt] API error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
