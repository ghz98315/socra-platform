import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  ROOT_CAUSE_CATEGORY_LABELS,
  getRootCauseSubtypeOption,
  type RootCauseCategory,
  type RootCauseSubtype,
} from '@/lib/error-loop/taxonomy';
import {
  buildReviewInterventionTaskDraft,
  parseReviewInterventionTaskMarkers,
  type MasteryJudgement,
} from '@/lib/error-loop/review';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
const VALID_ATTEMPT_MODES = new Set(['original', 'variant', 'mixed']);

type RootCauseSnapshot = {
  category: RootCauseCategory | null;
  subtype: RootCauseSubtype | null;
  statement: string | null;
};

type ParentTaskRow = {
  id: string;
  description: string | null;
  status: string | null;
};

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

function getRootCauseContext(snapshot: RootCauseSnapshot) {
  const categoryLabel = snapshot.category ? ROOT_CAUSE_CATEGORY_LABELS[snapshot.category] : null;
  const subtypeLabel = snapshot.subtype ? getRootCauseSubtypeOption(snapshot.subtype)?.label ?? snapshot.subtype : null;

  return {
    categoryLabel,
    subtypeLabel,
    displayLabel: subtypeLabel || categoryLabel,
  };
}

function buildJudgementGuidance({
  judgement,
  rootCause,
}: {
  judgement: MasteryJudgement;
  rootCause: RootCauseSnapshot;
}) {
  const context = getRootCauseContext(rootCause);
  const causeLabel = context.displayLabel || '当前根因';
  const statementSuffix = rootCause.statement ? `当前暴露的稳定模式是：${rootCause.statement}` : '';

  switch (judgement) {
    case 'not_mastered':
      return {
        summary: `这次还没能独立做对，说明「${causeLabel}」没有被真正处理掉。${statementSuffix}`,
        next_actions: ['回到错题详情，重新完成根因反思', `先把「${causeLabel}」对应的防错动作写出来再做题`, '下一轮先独立尝试，再决定是否求助'],
      };
    case 'assisted_correct':
      return {
        summary: `这次结果做对了，但仍依赖提示，说明「${causeLabel}」一离开扶手就容易复发。${statementSuffix}`,
        next_actions: ['先做 2 分钟独立尝试，避免一上来就求助', `复习前先口头复述「${causeLabel}」的检查动作`, '做完后补一句“如果没提示，我刚才卡在哪里”'],
      };
    case 'explanation_gap':
      return {
        summary: `这次能得到答案，但还讲不清依据，说明「${causeLabel}」停留在结果层，没有真正内化。${statementSuffix}`,
        next_actions: ['做完后必须用自己的话复述为什么这么做', '把关键依据写成 2 到 3 句短句', '下一轮优先验证“会不会讲清”，不是只看答案对不对'],
      };
    case 'pseudo_mastery':
      return {
        summary: `这次原题表现正常，但变式没过，说明你记住了表面路径，还没有把「${causeLabel}」处理到可迁移层。${statementSuffix}`,
        next_actions: ['回到原题后立刻追加一题变式，不要只重复原题', `专门盯住「${causeLabel}」在变式里会怎么复发`, '下一轮先讲通用方法，再做题'],
      };
    case 'provisional_mastered':
      return {
        summary: `这次已经能独立做对并讲清，但系统还要跨间隔继续验证「${causeLabel}」是不是真的稳定。${statementSuffix}`,
        next_actions: ['保留这次有效的防错动作，不要因为做对就撤掉', '下次复习继续先独立完成，再讲清思路', '优先验证变式题，而不是只回看原题'],
      };
    case 'mastered':
      return {
        summary: `这道题已经通过独立完成和间隔复习验证，「${causeLabel}」当前可以视为稳定关闭。${statementSuffix}`,
        next_actions: ['保留这类题的通用解法，避免只记这一题', '遇到同结构题先独立迁移，不急着求助', '后续只做抽查，不再重复高频回炉'],
      };
    default:
      return {
        summary: statementSuffix || '这次复习结果已生成。',
        next_actions: [],
      };
  }
}

async function ensureReviewInterventionTask({
  studentId,
  sessionId,
  subject,
  judgement,
  rootCause,
  judgementSummary,
  nextActions,
}: {
  studentId: string;
  sessionId: string;
  subject: string | null | undefined;
  judgement: MasteryJudgement;
  rootCause: RootCauseSnapshot;
  judgementSummary: string;
  nextActions: string[];
}) {
  if (!['not_mastered', 'assisted_correct', 'explanation_gap', 'pseudo_mastery'].includes(judgement)) {
    return null;
  }

  const { data: student, error: studentError } = await supabase
    .from('profiles')
    .select('id, parent_id')
    .eq('id', studentId)
    .maybeSingle();

  if (studentError || !student?.parent_id) {
    return null;
  }

  const { data: existingTasks, error: existingTasksError } = await supabase
    .from('parent_tasks')
    .select('id, description, status')
    .eq('parent_id', student.parent_id)
    .eq('child_id', studentId)
    .eq('task_type', 'review_intervention')
    .order('created_at', { ascending: false })
    .limit(20);

  if (existingTasksError) {
    console.error('[review/attempt] Failed to query review intervention tasks:', existingTasksError);
    return null;
  }

  const duplicateTask = ((existingTasks || []) as ParentTaskRow[]).find((task) => {
    if (task.status === 'completed' || task.status === 'cancelled') {
      return false;
    }

    const markers = parseReviewInterventionTaskMarkers(task.description);
    return markers?.session_id === sessionId && markers?.judgement === judgement;
  });

  if (duplicateTask) {
    return duplicateTask.id;
  }

  const rootCauseContext = getRootCauseContext(rootCause);
  const taskDraft = buildReviewInterventionTaskDraft({
    sessionId,
    judgement,
    subject,
    rootCauseDisplayLabel: rootCauseContext.displayLabel,
    rootCauseStatement: rootCause.statement,
    judgementSummary,
    nextActions,
  });

  const { data: createdTask, error: createTaskError } = await supabase
    .from('parent_tasks')
    .insert({
      parent_id: student.parent_id,
      child_id: studentId,
      title: taskDraft.title,
      description: taskDraft.description,
      task_type: taskDraft.taskType,
      subject: taskDraft.subject,
      target_count: taskDraft.targetCount,
      target_duration: taskDraft.targetDuration,
      priority: taskDraft.priority,
      status: 'pending',
      reward_points: taskDraft.rewardPoints,
    })
    .select('id')
    .single();

  if (createTaskError) {
    console.error('[review/attempt] Failed to create review intervention task:', createTaskError);
    return null;
  }

  return createdTask?.id ?? null;
}

async function sendParentRiskNotification({
  studentId,
  sessionId,
  reviewId,
  judgement,
  rootCause,
  interventionTaskId,
}: {
  studentId: string;
  sessionId: string;
  reviewId: string;
  judgement: MasteryJudgement;
  rootCause: RootCauseSnapshot;
  interventionTaskId: string | null;
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

    const rootCauseContext = getRootCauseContext(rootCause);
    const causeLabel = rootCauseContext.displayLabel;
    const causePrefix = causeLabel ? `当前反复暴露的是「${causeLabel}」。` : '';
    const statementSuffix = rootCause.statement ? `稳定模式：${rootCause.statement}` : '';
    const judgementMessageMap: Record<Exclude<MasteryJudgement, 'provisional_mastered' | 'mastered'>, string> = {
      not_mastered: `本轮复习仍未独立做对。${causePrefix}${statementSuffix}`,
      assisted_correct: `本轮复习虽然做对了，但仍依赖提示。${causePrefix}${statementSuffix}`,
      explanation_gap: `本轮复习虽然有答案，但还讲不清依据。${causePrefix}${statementSuffix}`,
      pseudo_mastery: `本轮复习出现典型“假会”信号，原题正常但变式没过。${causePrefix}${statementSuffix}`,
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
        root_cause_category: rootCause.category,
        root_cause_subtype: rootCause.subtype,
        root_cause_statement: rootCause.statement,
        intervention_task_id: interventionTaskId,
      },
      action_url: interventionTaskId ? `/tasks` : `/controls?student_id=${studentId}`,
      action_text: interventionTaskId ? '查看家长任务' : '查看家长洞察',
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

    const metadataRootCause = metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : null;
    const fallbackRootCause: RootCauseSnapshot = {
      category:
        typeof metadataRootCause?.current_root_cause_category === 'string'
          ? (metadataRootCause.current_root_cause_category as RootCauseCategory)
          : null,
      subtype:
        typeof metadataRootCause?.current_root_cause_subtype === 'string'
          ? (metadataRootCause.current_root_cause_subtype as RootCauseSubtype)
          : null,
      statement:
        typeof metadataRootCause?.current_root_cause_statement === 'string'
          ? metadataRootCause.current_root_cause_statement
          : null,
    };

    const { data: sessionRootCause } = await supabase
      .from('error_sessions')
      .select('subject, primary_root_cause_category, primary_root_cause_subtype, primary_root_cause_statement')
      .eq('id', review.session_id)
      .eq('student_id', student_id)
      .maybeSingle();

    const rootCauseSnapshot: RootCauseSnapshot = {
      category: sessionRootCause?.primary_root_cause_category ?? fallbackRootCause.category,
      subtype: sessionRootCause?.primary_root_cause_subtype ?? fallbackRootCause.subtype,
      statement: sessionRootCause?.primary_root_cause_statement ?? fallbackRootCause.statement,
    };
    const sessionSubject = typeof sessionRootCause?.subject === 'string' ? sessionRootCause.subject : null;

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

    const judgementGuidance = buildJudgementGuidance({
      judgement,
      rootCause: rootCauseSnapshot,
    });
    const rootCauseContext = getRootCauseContext(rootCauseSnapshot);
    const interventionTaskId = await ensureReviewInterventionTask({
      studentId: student_id,
      sessionId: review.session_id,
      subject: sessionSubject,
      judgement,
      rootCause: rootCauseSnapshot,
      judgementSummary: judgementGuidance.summary,
      nextActions: judgementGuidance.next_actions,
    });

    await sendParentRiskNotification({
      studentId: student_id,
      sessionId: review.session_id,
      reviewId: review_id,
      judgement,
      rootCause: rootCauseSnapshot,
      interventionTaskId,
    });

    return NextResponse.json({
      success: true,
      data: {
        attempt: insertedAttempt,
        review: updatedReview,
        mastery_judgement: judgement,
        closed: judgement === 'mastered',
        next_review_at: updatedReview?.next_review_at ?? null,
        root_cause_label: rootCauseContext.categoryLabel,
        root_cause_subtype_label: rootCauseContext.subtypeLabel,
        root_cause_display_label: rootCauseContext.displayLabel,
        root_cause_statement: rootCauseSnapshot.statement,
        judgement_summary: judgementGuidance.summary,
        next_actions: judgementGuidance.next_actions,
        intervention_task_id: interventionTaskId,
      },
    });
  } catch (error: any) {
    console.error('[review/attempt] API error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
