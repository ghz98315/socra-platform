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
  deriveReviewScheduleUpdate,
  evaluateClosureGates,
  getMasteryJudgementMeta,
  parseReviewInterventionTaskMarkers,
  type AttemptMode,
  type ClosureGateAttemptEvidence,
  type ClosureGateKey,
  type MasteryJudgement,
  type ReviewInterventionReason,
} from '@/lib/error-loop/review';
import {
  summarizeVariantEvidence,
  type VariantEvidenceSummary,
  type VariantPracticeLogEvidenceRow,
  type VariantQuestionEvidenceRow,
} from '@/lib/error-loop/variant-evidence';
import { buildMasteryRiskNotificationCopy } from '@/lib/notifications/intervention-status';
import {
  buildMissingMathErrorLoopMigrationResponse,
  isMissingMathErrorLoopMigrationError,
} from '@/lib/error-loop/migration-guard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

type ReviewAttemptEvidenceRow = {
  attempt_mode: AttemptMode;
  independent_first: boolean | null;
  asked_ai: boolean | null;
  ai_hint_count: number | null;
  solved_correctly: boolean | null;
  explained_correctly: boolean | null;
  variant_passed: boolean | null;
};

type VariantQuestionRow = VariantQuestionEvidenceRow;

type VariantPracticeLogRow = VariantPracticeLogEvidenceRow;

function toAttemptEvidence(input: {
  attemptMode: AttemptMode;
  independentFirst: boolean;
  askedAi: boolean;
  aiHintCount: number;
  solvedCorrectly: boolean;
  explainedCorrectly: boolean;
  variantPassed: boolean | null;
}): ClosureGateAttemptEvidence {
  return {
    attemptMode: input.attemptMode,
    independentFirst: input.independentFirst,
    askedAi: input.askedAi,
    aiHintCount: input.aiHintCount,
    solvedCorrectly: input.solvedCorrectly,
    explainedCorrectly: input.explainedCorrectly,
    variantPassed: input.variantPassed,
  };
}

function mapAttemptRowToEvidence(row: ReviewAttemptEvidenceRow): ClosureGateAttemptEvidence {
  return toAttemptEvidence({
    attemptMode: row.attempt_mode,
    independentFirst: row.independent_first !== false,
    askedAi: row.asked_ai === true,
    aiHintCount: Number.isFinite(row.ai_hint_count) ? Number(row.ai_hint_count) : 0,
    solvedCorrectly: row.solved_correctly === true,
    explainedCorrectly: row.explained_correctly === true,
    variantPassed: row.variant_passed === true ? true : row.variant_passed === false ? false : null,
  });
}

async function loadVariantEvidenceForSession({
  sessionId,
  studentId,
}: {
  sessionId: string;
  studentId: string;
}): Promise<VariantEvidenceSummary> {
  const { data: variantQuestions, error: variantQuestionsError } = await supabase
    .from('variant_questions')
    .select('id, status, attempts, correct_attempts, last_practiced_at, completed_at, created_at')
    .eq('original_session_id', sessionId)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (variantQuestionsError) {
    console.error('[review/attempt] Failed to load variant questions:', variantQuestionsError);
    return summarizeVariantEvidence({ questions: [], logs: [] });
  }

  const questions = (variantQuestions || []) as VariantQuestionRow[];
  if (questions.length === 0) {
    return summarizeVariantEvidence({ questions: [], logs: [] });
  }

  const variantIds = questions.map((question) => question.id);
  const { data: practiceLogs, error: practiceLogsError } = await supabase
    .from('variant_practice_logs')
    .select('variant_id, is_correct, hints_used, created_at')
    .in('variant_id', variantIds)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (practiceLogsError) {
    console.error('[review/attempt] Failed to load variant practice logs:', practiceLogsError);
    return summarizeVariantEvidence({ questions, logs: [] });
  }

  return summarizeVariantEvidence({
    questions,
    logs: (practiceLogs || []) as VariantPracticeLogRow[],
  });
}

function determineJudgement({
  currentAttempt,
  previousAttempts,
  externalVariantEvidencePassed,
  reviewStage,
}: {
  currentAttempt: ClosureGateAttemptEvidence;
  previousAttempts: ClosureGateAttemptEvidence[];
  externalVariantEvidencePassed: boolean;
  reviewStage: number;
}): {
  judgement: MasteryJudgement;
  closureGate: ReturnType<typeof evaluateClosureGates>;
} {
  const buildClosureGate = () =>
    evaluateClosureGates({
      reviewStage,
      currentAttempt,
      previousAttempts,
      externalVariantEvidencePassed,
    });

  if (!currentAttempt.solvedCorrectly) {
    return {
      judgement: 'not_mastered',
      closureGate: buildClosureGate(),
    };
  }

  if (!currentAttempt.independentFirst || currentAttempt.askedAi || currentAttempt.aiHintCount > 0) {
    return {
      judgement: 'assisted_correct',
      closureGate: buildClosureGate(),
    };
  }

  if (!currentAttempt.explainedCorrectly) {
    return {
      judgement: 'explanation_gap',
      closureGate: buildClosureGate(),
    };
  }

  if (currentAttempt.variantPassed === false) {
    return {
      judgement: 'pseudo_mastery',
      closureGate: buildClosureGate(),
    };
  }

  const closureGate = buildClosureGate();

  return {
    judgement: closureGate.eligibleForClosure ? 'mastered' : 'provisional_mastered',
    closureGate,
  };
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
  const judgementMeta = getMasteryJudgementMeta(judgement);

  switch (judgement) {
    case 'not_mastered':
      return {
        summary: `这次${judgementMeta?.messaging.studentSummaryObserved || '还没能独立做对'}，说明「${causeLabel}」${judgementMeta?.messaging.studentSummaryImplication || '没有被真正处理掉'}。${statementSuffix}`,
        next_actions: ['回到错题详情，重新完成根因反思', `先把「${causeLabel}」对应的防错动作写出来再做题`, '下一轮先独立尝试，再决定是否求助'],
      };
    case 'assisted_correct':
      return {
        summary: `这次${judgementMeta?.messaging.studentSummaryObserved || '结果做对了，但仍依赖提示'}，说明「${causeLabel}」${judgementMeta?.messaging.studentSummaryImplication || '一离开扶手就容易复发'}。${statementSuffix}`,
        next_actions: ['先做 2 分钟独立尝试，避免一上来就求助', `复习前先口头复述「${causeLabel}」的检查动作`, '做完后补一句“如果没提示，我刚才卡在哪里”'],
      };
    case 'explanation_gap':
      return {
        summary: `这次${judgementMeta?.messaging.studentSummaryObserved || '能得到答案，但还讲不清依据'}，说明「${causeLabel}」${judgementMeta?.messaging.studentSummaryImplication || '停留在结果层，没有真正内化'}。${statementSuffix}`,
        next_actions: ['做完后必须用自己的话复述为什么这么做', '把关键依据写成 2 到 3 句短句', '下一轮优先验证“会不会讲清”，不是只看答案对不对'],
      };
    case 'pseudo_mastery':
      return {
        summary: `这次${judgementMeta?.messaging.studentSummaryObserved || '原题表现正常，但变式没过'}，说明你记住了表面路径，还没有把「${causeLabel}」${judgementMeta?.messaging.studentSummaryImplication || '处理到可迁移层'}。${statementSuffix}`,
        next_actions: ['回到原题后立刻追加一题变式，不要只重复原题', `专门盯住「${causeLabel}」在变式里会怎么复发`, '下一轮先讲通用方法，再做题'],
      };
    case 'provisional_mastered':
      return {
        summary: `这次${judgementMeta?.messaging.studentSummaryObserved || '已经能独立做对并讲清'}，系统还要继续验证「${causeLabel}」${judgementMeta?.messaging.studentSummaryImplication || '是不是真的稳定'}。${statementSuffix}`,
        next_actions: ['保留这次有效的防错动作，不要因为做对就撤掉', '下次复习继续先独立完成，再讲清思路', '优先验证变式题，而不是只回看原题'],
      };
    case 'mastered':
      return {
        summary: `这道题${judgementMeta?.messaging.studentSummaryObserved || '已经通过独立完成和间隔复习验证'}，「${causeLabel}」${judgementMeta?.messaging.studentSummaryImplication || '当前可以视为稳定关闭'}。${statementSuffix}`,
        next_actions: ['保留这类题的通用解法，避免只记这一题', '遇到同结构题先独立迁移，不急着求助', '后续只做抽查，不再重复高频回炉'],
      };
    default:
      return {
        summary: statementSuffix || '这次复习结果已生成。',
        next_actions: [],
      };
  }
}

function hasPendingClosureGate(pendingGateKeys: string[] | undefined, key: ClosureGateKey) {
  return Array.isArray(pendingGateKeys) && pendingGateKeys.includes(key);
}

async function ensureReviewInterventionTask({
  studentId,
  sessionId,
  subject,
  judgement,
  reason,
  rootCause,
  judgementSummary,
  nextActions,
}: {
  studentId: string;
  sessionId: string;
  subject: string | null | undefined;
  judgement: MasteryJudgement;
  reason?: ReviewInterventionReason;
  rootCause: RootCauseSnapshot;
  judgementSummary: string;
  nextActions: string[];
}) {
  const normalizedReason = reason || 'mastery_risk';
  if (
    !['not_mastered', 'assisted_correct', 'explanation_gap', 'pseudo_mastery'].includes(judgement) &&
    normalizedReason !== 'transfer_evidence_gap'
  ) {
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
    return (
      markers?.session_id === sessionId &&
      markers?.judgement === judgement &&
      (markers?.reason || 'mastery_risk') === normalizedReason
    );
  });

  if (duplicateTask) {
    return duplicateTask.id;
  }

  const rootCauseContext = getRootCauseContext(rootCause);
  const taskDraft = buildReviewInterventionTaskDraft({
    sessionId,
    judgement,
    reason: normalizedReason,
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
  reason,
  rootCause,
  interventionTaskId,
  notificationSummary,
}: {
  studentId: string;
  sessionId: string;
  reviewId: string;
  judgement: MasteryJudgement;
  reason?: ReviewInterventionReason;
  rootCause: RootCauseSnapshot;
  interventionTaskId: string | null;
  notificationSummary?: string | null;
}) {
  const normalizedReason = reason || 'mastery_risk';
  if (
    !['not_mastered', 'assisted_correct', 'explanation_gap', 'pseudo_mastery'].includes(judgement) &&
    normalizedReason !== 'transfer_evidence_gap'
  ) {
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
    const notificationCopy = buildMasteryRiskNotificationCopy({
      studentName: student.display_name,
      judgement,
      reason: normalizedReason,
      causeLabel: rootCauseContext.displayLabel,
      rootCauseStatement: rootCause.statement,
      interventionTaskId,
      notificationSummary,
    });
    if (!notificationCopy) {
      return;
    }

    await supabase.from('notifications').insert({
      user_id: student.parent_id,
      type: 'mastery_update',
      title: notificationCopy.title,
      content: notificationCopy.content,
      data: {
        student_id: studentId,
        session_id: sessionId,
        review_id: reviewId,
        mastery_judgement: judgement,
        risk_type: normalizedReason,
        root_cause_category: rootCause.category,
        root_cause_subtype: rootCause.subtype,
        root_cause_statement: rootCause.statement,
        intervention_task_id: interventionTaskId,
      },
      action_url: `/controls?focus=review&student_id=${studentId}&session_id=${sessionId}`,
      action_text: notificationCopy.actionText,
      is_read: false,
      priority: notificationCopy.priority,
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
      if (isMissingMathErrorLoopMigrationError(error)) {
        return buildMissingMathErrorLoopMigrationResponse('review.attempt.get.load-attempts');
      }

      return NextResponse.json({ error: 'Failed to fetch review attempts' }, { status: 500 });
    }

    const { data: reviewSchedule, error: reviewScheduleError } = await supabase
      .from('review_schedule')
      .select('session_id')
      .eq('id', reviewId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (reviewScheduleError) {
      console.error('[review/attempt] Failed to load review schedule for variant evidence:', reviewScheduleError);
      if (isMissingMathErrorLoopMigrationError(reviewScheduleError)) {
        return buildMissingMathErrorLoopMigrationResponse('review.attempt.get.load-review-schedule');
      }

      return NextResponse.json({ error: 'Failed to load review schedule' }, { status: 500 });
    }

    const variantEvidence = reviewSchedule?.session_id
      ? await loadVariantEvidenceForSession({
          sessionId: reviewSchedule.session_id,
          studentId,
        })
      : summarizeVariantEvidence({ questions: [], logs: [] });

    return NextResponse.json({
      success: true,
      data: data ?? [],
      count: data?.length ?? 0,
      variant_evidence: variantEvidence,
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
      .select('id, session_id, student_id, review_stage, reopened_count, is_completed, next_review_at')
      .eq('id', review_id)
      .eq('student_id', student_id)
      .maybeSingle();

    if (reviewError) {
      console.error('[review/attempt] Failed to load review schedule:', reviewError);
      if (isMissingMathErrorLoopMigrationError(reviewError)) {
        return buildMissingMathErrorLoopMigrationResponse('review.attempt.post.load-review-schedule');
      }

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

    const { data: priorAttempts, error: priorAttemptsError } = await supabase
      .from('review_attempts')
      .select(
        'attempt_mode, independent_first, asked_ai, ai_hint_count, solved_correctly, explained_correctly, variant_passed',
      )
      .eq('review_id', review_id)
      .eq('student_id', student_id)
      .order('attempt_no', { ascending: true });

    if (priorAttemptsError) {
      console.error('[review/attempt] Failed to load existing review attempts:', priorAttemptsError);
      if (isMissingMathErrorLoopMigrationError(priorAttemptsError)) {
        return buildMissingMathErrorLoopMigrationResponse('review.attempt.post.load-prior-attempts');
      }

      return NextResponse.json({ error: 'Failed to load existing review attempts' }, { status: 500 });
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
    const normalizedAttemptMode: AttemptMode =
      typeof attempt_mode === 'string' && VALID_ATTEMPT_MODES.has(attempt_mode)
        ? (attempt_mode as AttemptMode)
        : 'original';

    const currentAttemptEvidence = toAttemptEvidence({
      attemptMode: normalizedAttemptMode,
      independentFirst: normalizedIndependentFirst,
      askedAi: normalizedAskedAi,
      aiHintCount: normalizedAiHintCount,
      solvedCorrectly: normalizedSolvedCorrectly,
      explainedCorrectly: normalizedExplainedCorrectly,
      variantPassed: normalizedVariantPassed,
    });
    const previousAttemptEvidence = ((priorAttempts || []) as ReviewAttemptEvidenceRow[]).map(mapAttemptRowToEvidence);
    const variantEvidence = await loadVariantEvidenceForSession({
      sessionId: review.session_id,
      studentId: student_id,
    });
    const { judgement, closureGate } = determineJudgement({
      currentAttempt: currentAttemptEvidence,
      previousAttempts: previousAttemptEvidence,
      externalVariantEvidencePassed: variantEvidence.qualified_transfer_evidence,
      reviewStage: review.review_stage ?? 1,
    });

    const { data: insertedAttempt, error: insertAttemptError } = await supabase
      .from('review_attempts')
      .insert({
        review_id,
        session_id: review.session_id,
        student_id,
        attempt_no: (priorAttempts?.length || 0) + 1,
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
      if (isMissingMathErrorLoopMigrationError(insertAttemptError)) {
        return buildMissingMathErrorLoopMigrationResponse('review.attempt.post.insert-attempt');
      }

      return NextResponse.json({ error: 'Failed to save review attempt' }, { status: 500 });
    }

    const scheduleUpdate = deriveReviewScheduleUpdate({
      currentReviewStage: review.review_stage ?? 1,
      currentReopenedCount: review.reopened_count ?? 0,
      currentNextReviewAt: review.next_review_at ?? null,
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
      if (isMissingMathErrorLoopMigrationError(updateReviewError)) {
        return buildMissingMathErrorLoopMigrationResponse('review.attempt.post.update-review-schedule');
      }

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
      if (isMissingMathErrorLoopMigrationError(updateSessionError)) {
        return buildMissingMathErrorLoopMigrationResponse('review.attempt.post.update-error-session');
      }

      return NextResponse.json({ error: 'Review attempt saved, but error session update failed' }, { status: 500 });
    }

    const judgementGuidance = buildJudgementGuidance({
      judgement,
      rootCause: rootCauseSnapshot,
    });
    const requiresTransferEvidenceIntervention =
      judgement === 'provisional_mastered' && hasPendingClosureGate(closureGate.pendingGateKeys, 'variant_transfer');
    const interventionReason: ReviewInterventionReason | undefined = requiresTransferEvidenceIntervention
      ? 'transfer_evidence_gap'
      : undefined;
    const interventionSummary = requiresTransferEvidenceIntervention
      ? `${judgementGuidance.summary} ${variantEvidence.coach_summary}`
      : judgementGuidance.summary;
    const interventionActions = requiresTransferEvidenceIntervention
      ? [...judgementGuidance.next_actions, variantEvidence.next_step]
      : judgementGuidance.next_actions;
    const rootCauseContext = getRootCauseContext(rootCauseSnapshot);
    const interventionTaskId = await ensureReviewInterventionTask({
      studentId: student_id,
      sessionId: review.session_id,
      subject: sessionSubject,
      judgement,
      reason: interventionReason,
      rootCause: rootCauseSnapshot,
      judgementSummary: interventionSummary,
      nextActions: interventionActions,
    });

    await sendParentRiskNotification({
      studentId: student_id,
      sessionId: review.session_id,
      reviewId: review_id,
      judgement,
      reason: interventionReason,
      rootCause: rootCauseSnapshot,
      interventionTaskId,
      notificationSummary: requiresTransferEvidenceIntervention ? variantEvidence.parent_summary : interventionSummary,
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
        closure_gate_summary: closureGate.summary,
        closure_gate_pending_keys: closureGate.pendingGateKeys,
        closure_gate_items: closureGate.items,
        variant_evidence: variantEvidence,
        intervention_task_id: interventionTaskId,
      },
    });
  } catch (error: any) {
    console.error('[review/attempt] API error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
