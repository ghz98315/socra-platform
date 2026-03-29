import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getRootCauseSubtypeOption, type RootCauseCategory, type RootCauseSubtype } from '@/lib/error-loop/taxonomy';
import {
  HEAT_SCORE_MODEL,
  computeHeatScore,
  describeHeatLevel,
  getParentSupportPlaybook,
  getRootCauseLabel,
} from '@/lib/error-loop/parent-insights';
import {
  aggregateConversationRiskSignals,
  evaluateConversationInterventionEffect,
} from '@/lib/error-loop/conversation-risk';
import {
  getParentInterventionTaskPriorityWeight,
  getParentRecentRiskPriorityWeight,
} from '@/lib/error-loop/parent-priority';
import {
  MASTERY_JUDGEMENT_META,
  REVIEW_INTERVENTION_RISK_JUDGEMENTS,
  evaluateReviewInterventionEffect,
  evaluateClosureGates,
  isMasteryJudgement,
  parseReviewInterventionTaskMarkers,
  type AttemptMode,
  type ClosureGateAttemptEvidence,
  type ReviewInterventionEffect,
} from '@/lib/error-loop/review';
import {
  summarizeVariantEvidence,
  type VariantPracticeLogEvidenceRow,
  type VariantQuestionEvidenceRow,
} from '@/lib/error-loop/variant-evidence';
import {
  getParentMasteryBalanceCopy,
  getParentOverdueReviewActionCopy,
  getParentPseudoMasteryActionCopy,
  getParentRecentRiskTitle,
  getParentReviewInterventionFocusCopy,
  getParentReviewInterventionPendingActionCopy,
  getParentReviewInterventionPersistingActionCopy,
  getParentReviewInterventionLoweredActionCopy,
  getParentSurfaceReflectionActionCopy,
  getParentTransferGapInsightCopy,
} from '@/lib/error-loop/parent-insight-copy';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const VALID_SUBJECTS = new Set(['math', 'chinese', 'english', 'physics', 'chemistry', 'generic']);
const RISK_JUDGEMENTS = REVIEW_INTERVENTION_RISK_JUDGEMENTS;

type StudentRow = {
  id: string;
  display_name: string | null;
  grade_level: number | null;
};

type ErrorSessionRow = {
  id: string;
  extracted_text: string | null;
  concept_tags: unknown;
  status: string | null;
  closure_state: string | null;
  primary_root_cause_category: RootCauseCategory | null;
  primary_root_cause_subtype: RootCauseSubtype | null;
  primary_root_cause_statement: string | null;
  created_at: string;
};

type DiagnosisRow = {
  session_id: string;
  root_cause_category: RootCauseCategory;
  root_cause_subtype: RootCauseSubtype | null;
  root_cause_statement: string;
  guided_reflection: Record<string, unknown> | null;
  knowledge_tags: unknown;
  habit_tags: unknown;
  surface_labels: unknown;
  risk_flags: unknown;
  updated_at: string;
  created_at: string;
};

type ReviewScheduleRow = {
  id: string;
  session_id: string;
  review_stage: number | null;
  next_review_at: string | null;
  is_completed: boolean | null;
  mastery_state: string | null;
  last_judgement: string | null;
  reopened_count: number | null;
  next_interval_days: number | null;
  updated_at: string | null;
  error_sessions:
      | {
        id: string;
        extracted_text: string | null;
        concept_tags: unknown;
        primary_root_cause_category: RootCauseCategory | null;
        primary_root_cause_subtype: RootCauseSubtype | null;
        primary_root_cause_statement: string | null;
      }
    | Array<{
        id: string;
        extracted_text: string | null;
        concept_tags: unknown;
        primary_root_cause_category: RootCauseCategory | null;
        primary_root_cause_subtype: RootCauseSubtype | null;
        primary_root_cause_statement: string | null;
      }>
    | null;
};

type ReviewAttemptRow = {
  id: string;
  review_id: string;
  session_id: string;
  attempt_mode: AttemptMode;
  independent_first: boolean | null;
  asked_ai: boolean | null;
  ai_hint_count: number | null;
  solved_correctly: boolean | null;
  explained_correctly: boolean | null;
  variant_passed: boolean | null;
  mastery_judgement: string;
  created_at: string;
};

type VariantQuestionRow = VariantQuestionEvidenceRow & {
  original_session_id: string;
  student_id: string;
};

type VariantPracticeLogRow = VariantPracticeLogEvidenceRow;

type ChatMessageRow = {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
};

type TaskCompletionRow = {
  progress_count: number | null;
  progress_duration: number | null;
  notes: string | null;
  completed_at: string | null;
  updated_at: string | null;
};

type ParentTaskRow = {
  id: string;
  title: string;
  description: string | null;
  task_type: string | null;
  status: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
  task_completions: TaskCompletionRow[] | null;
};

type InterventionTaskSnapshot = {
  task_id: string;
  session_id: string;
  category: string;
  task_type: 'conversation_intervention' | 'review_intervention';
  task_type_label: string;
  title: string;
  status: string;
  feedback_note: string | null;
  completed_at: string | null;
  updated_at: string | null;
  effect: ReviewInterventionEffect;
  post_intervention_repeat_count: number;
  root_cause_display_label: string | null;
  root_cause_statement: string | null;
};

type AggregateBucket = {
  key: string;
  category?: RootCauseCategory;
  subtype?: RootCauseSubtype | null;
  count: number;
  recentCount: number;
  reopenedCount: number;
  pseudoMasteryCount: number;
  pendingCount: number;
  statements: Map<string, number>;
  sessionIds: Set<string>;
};

type ReflectionQualitySnapshot = {
  depth_label: 'surface' | 'partial' | 'deep';
  surface_only_risk: boolean;
  coach_signal: string | null;
};

function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

function isRecentIso(dateValue: string | null | undefined, days = 7) {
  if (!dateValue) {
    return false;
  }

  const createdAt = new Date(dateValue).getTime();
  if (Number.isNaN(createdAt)) {
    return false;
  }

  return Date.now() - createdAt <= days * 24 * 60 * 60 * 1000;
}

function isOverdue(dateValue: string | null | undefined) {
  if (!dateValue) {
    return false;
  }

  const dueAt = new Date(dateValue).getTime();
  if (Number.isNaN(dueAt)) {
    return false;
  }

  return dueAt <= Date.now();
}

function toAttemptEvidence(attempt: ReviewAttemptRow): ClosureGateAttemptEvidence {
  return {
    attemptMode: attempt.attempt_mode,
    independentFirst: attempt.independent_first !== false,
    askedAi: attempt.asked_ai === true,
    aiHintCount: Number.isFinite(attempt.ai_hint_count) ? Number(attempt.ai_hint_count) : 0,
    solvedCorrectly: attempt.solved_correctly === true,
    explainedCorrectly: attempt.explained_correctly === true,
    variantPassed: attempt.variant_passed === true ? true : attempt.variant_passed === false ? false : null,
  };
}

function excerpt(value: string | null | undefined, maxLength = 40) {
  const text = (value || '').replace(/\s+/g, ' ').trim();
  if (!text) {
    return '未命名错题';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}

function getReflectionQualitySnapshot(value: unknown): ReflectionQualitySnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const quality =
    raw.reflection_quality && typeof raw.reflection_quality === 'object' && !Array.isArray(raw.reflection_quality)
      ? (raw.reflection_quality as Record<string, unknown>)
      : null;

  if (!quality) {
    return null;
  }

  const depthLabel =
    quality.depth_label === 'deep' || quality.depth_label === 'partial' || quality.depth_label === 'surface'
      ? quality.depth_label
      : 'surface';

  return {
    depth_label: depthLabel,
    surface_only_risk: quality.surface_only_risk === true,
    coach_signal: typeof quality.coach_signal === 'string' ? quality.coach_signal : null,
  };
}

function getRootCauseContext(
  category: RootCauseCategory | null | undefined,
  subtype: RootCauseSubtype | null | undefined,
) {
  const rootCauseLabel = category ? getRootCauseLabel(category) : null;
  const rootCauseSubtypeLabel = subtype ? getRootCauseSubtypeOption(subtype)?.label ?? subtype : null;

  return {
    rootCauseLabel,
    rootCauseSubtypeLabel,
    rootCauseDisplayLabel: rootCauseSubtypeLabel || rootCauseLabel,
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Internal server error';
}

function toPercent(part: number, total: number) {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return Math.round((part / total) * 100);
}

function getTaskCompletion(task: ParentTaskRow) {
  if (!Array.isArray(task.task_completions) || task.task_completions.length === 0) {
    return null;
  }

  return task.task_completions[0] ?? null;
}

function parseConversationTaskMarkers(description: string | null | undefined) {
  const content = description || '';
  const sessionMatch = content.match(/\[conversation-session:([^\]]+)\]/);
  const categoryMatch = content.match(/\[conversation-risk:([^\]]+)\]/);

  if (!sessionMatch || !categoryMatch) {
    return null;
  }

  return {
    sessionId: sessionMatch[1],
    category: categoryMatch[1],
  };
}

function buildConversationTaskKey(sessionId: string, category: string) {
  return `${sessionId}:${category}`;
}

function buildReviewTaskKey(sessionId: string, judgement: string) {
  return `${sessionId}:${judgement}`;
}

function compareIsoDesc(left: string | null | undefined, right: string | null | undefined) {
  return new Date(right || 0).getTime() - new Date(left || 0).getTime();
}

function pushIntoAggregate(
  map: Map<string, AggregateBucket>,
  {
    key,
    statement,
    sessionId,
    recent,
    reopenedCount,
    pseudoMasteryCount,
    pendingCount,
    category,
    subtype,
  }: {
    key: string;
    statement: string;
    sessionId: string;
    recent: boolean;
    reopenedCount: number;
    pseudoMasteryCount: number;
    pendingCount: number;
    category?: RootCauseCategory;
    subtype?: RootCauseSubtype | null;
  },
) {
  const bucket = map.get(key) ?? {
    key,
    category,
    subtype,
    count: 0,
    recentCount: 0,
    reopenedCount: 0,
    pseudoMasteryCount: 0,
    pendingCount: 0,
    statements: new Map<string, number>(),
    sessionIds: new Set<string>(),
  };

  bucket.count += 1;
  bucket.recentCount += recent ? 1 : 0;
  bucket.reopenedCount += reopenedCount;
  bucket.pseudoMasteryCount += pseudoMasteryCount;
  bucket.pendingCount += pendingCount;
  bucket.sessionIds.add(sessionId);
  if (category) {
    bucket.category = category;
  }
  if (typeof subtype !== 'undefined') {
    bucket.subtype = subtype;
  }

  const normalizedStatement = statement.trim();
  if (normalizedStatement) {
    bucket.statements.set(normalizedStatement, (bucket.statements.get(normalizedStatement) ?? 0) + 1);
  }

  map.set(key, bucket);
}

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
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

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

export async function GET(req: NextRequest) {
  try {
    const parentUser = await getParentUser();
    if (!parentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestedStudentId = req.nextUrl.searchParams.get('student_id');
    const requestedSubject = req.nextUrl.searchParams.get('subject') || 'math';
    const subject = VALID_SUBJECTS.has(requestedSubject) ? requestedSubject : 'math';

    const { data: students, error: studentsError } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, grade_level')
      .eq('role', 'student')
      .eq('parent_id', parentUser.id)
      .order('display_name', { ascending: true });

    if (studentsError) {
      console.error('[parent/insights] Failed to load students:', studentsError);
      return NextResponse.json({ error: 'Failed to load children' }, { status: 500 });
    }

    const childList = (students ?? []) as StudentRow[];
    if (childList.length === 0) {
      return NextResponse.json({
        students: [],
        selected_student: null,
        subject,
        summary: {
          total_errors: 0,
          open_errors: 0,
          pending_review_count: 0,
          overdue_review_count: 0,
          mastered_closed_count: 0,
          provisional_mastered_count: 0,
          pseudo_mastery_count: 0,
          missing_transfer_evidence_count: 0,
          reopened_total: 0,
        },
        summary_chain: {
          mastery_signal_total: 0,
          stable_mastery_rate: 0,
          provisional_mastery_rate: 0,
          pseudo_mastery_rate: 0,
          transfer_gap_rate: 0,
          intervention_focus_value: 0,
          intervention_focus_value_label: '当前无积压',
          review_intervention_pending: 0,
          mastery_balance_label: '暂无足够样本',
          mastery_balance_summary: '等孩子完成更多复习判定后，再看真掌握和假会的比例。',
          transfer_gap_label: '暂无迁移缺口',
          transfer_gap_summary: '当前还没有可用于计算迁移证据缺口的开放题样本。',
          intervention_focus_label: '暂无待跟进项',
          intervention_focus_summary: '当前没有待处理的复习补救任务。',
        },
        root_cause_heatmap: [],
        knowledge_hotspots: [],
        habit_hotspots: [],
        recent_risks: [],
        conversation_alerts: [],
        intervention_summary: {
          total: 0,
          pending: 0,
          completed: 0,
          risk_lowered: 0,
          risk_persisting: 0,
          conversation_total: 0,
          review_total: 0,
          review_pending: 0,
        },
        intervention_outcomes: [],
        parent_actions: [],
        scoring_model: HEAT_SCORE_MODEL,
      });
    }

    const selectedStudent =
      childList.find((student) => student.id === requestedStudentId) ??
      childList[0];

    const { data: errorSessions, error: errorSessionsError } = await supabaseAdmin
      .from('error_sessions')
      .select(
        'id, extracted_text, concept_tags, status, closure_state, primary_root_cause_category, primary_root_cause_subtype, primary_root_cause_statement, created_at',
      )
      .eq('student_id', selectedStudent.id)
      .eq('subject', subject)
      .order('created_at', { ascending: false });

    if (errorSessionsError) {
      console.error('[parent/insights] Failed to load error sessions:', errorSessionsError);
      return NextResponse.json({ error: 'Failed to load error sessions' }, { status: 500 });
    }

    const sessions = (errorSessions ?? []) as ErrorSessionRow[];
    const sessionIds = sessions.map((session) => session.id);
    const sessionMap = new Map(sessions.map((session) => [session.id, session]));

    const [
      diagnosesResult,
      reviewSchedulesResult,
      reviewAttemptsResult,
      variantQuestionsResult,
      variantPracticeLogsResult,
      chatMessagesResult,
      interventionTasksResult,
    ] = await Promise.all([
      sessionIds.length > 0
          ? supabaseAdmin
            .from('error_diagnoses')
            .select(
              'session_id, root_cause_category, root_cause_subtype, root_cause_statement, guided_reflection, knowledge_tags, habit_tags, surface_labels, risk_flags, updated_at, created_at',
            )
            .eq('student_id', selectedStudent.id)
            .in('session_id', sessionIds)
        : Promise.resolve({ data: [], error: null }),
      sessionIds.length > 0
        ? supabaseAdmin
            .from('review_schedule')
            .select(
              `
                id,
                session_id,
                review_stage,
                next_review_at,
                is_completed,
                mastery_state,
                last_judgement,
                reopened_count,
                next_interval_days,
                updated_at,
                error_sessions (
                  id,
                  extracted_text,
                  concept_tags,
                  primary_root_cause_category,
                  primary_root_cause_subtype,
                  primary_root_cause_statement
                )
              `,
            )
            .eq('student_id', selectedStudent.id)
            .in('session_id', sessionIds)
        : Promise.resolve({ data: [], error: null }),
      sessionIds.length > 0
        ? supabaseAdmin
            .from('review_attempts')
            .select(
              'id, review_id, session_id, attempt_mode, independent_first, asked_ai, ai_hint_count, solved_correctly, explained_correctly, variant_passed, mastery_judgement, created_at',
            )
            .eq('student_id', selectedStudent.id)
            .in('session_id', sessionIds)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      sessionIds.length > 0
        ? supabaseAdmin
            .from('variant_questions')
            .select('id, original_session_id, student_id, status, attempts, correct_attempts, last_practiced_at, completed_at, created_at')
            .eq('student_id', selectedStudent.id)
            .in('original_session_id', sessionIds)
        : Promise.resolve({ data: [], error: null }),
      sessionIds.length > 0
        ? supabaseAdmin
            .from('variant_practice_logs')
            .select('variant_id, is_correct, hints_used, created_at')
            .eq('student_id', selectedStudent.id)
            .order('created_at', { ascending: false })
            .limit(500)
        : Promise.resolve({ data: [], error: null }),
      sessionIds.length > 0
        ? supabaseAdmin
            .from('chat_messages')
            .select('id, session_id, role, content, created_at')
            .in('session_id', sessionIds)
            .order('created_at', { ascending: false })
            .limit(180)
        : Promise.resolve({ data: [], error: null }),
      supabaseAdmin
        .from('parent_tasks')
        .select(
          `
            id,
            title,
            description,
            task_type,
            status,
            completed_at,
            created_at,
            updated_at,
            task_completions (
              progress_count,
              progress_duration,
              notes,
              completed_at,
              updated_at
            )
          `,
        )
        .eq('parent_id', parentUser.id)
        .eq('child_id', selectedStudent.id)
        .in('task_type', ['conversation_intervention', 'review_intervention'])
        .order('created_at', { ascending: false }),
    ]);

    if (diagnosesResult.error) {
      console.error('[parent/insights] Failed to load diagnoses:', diagnosesResult.error);
      return NextResponse.json({ error: 'Failed to load diagnoses' }, { status: 500 });
    }

    if (reviewSchedulesResult.error) {
      console.error('[parent/insights] Failed to load review schedules:', reviewSchedulesResult.error);
      return NextResponse.json({ error: 'Failed to load review schedules' }, { status: 500 });
    }

    if (reviewAttemptsResult.error) {
      console.error('[parent/insights] Failed to load review attempts:', reviewAttemptsResult.error);
      return NextResponse.json({ error: 'Failed to load review attempts' }, { status: 500 });
    }

    if (variantQuestionsResult.error) {
      console.error('[parent/insights] Failed to load variant questions:', variantQuestionsResult.error);
      return NextResponse.json({ error: 'Failed to load variant questions' }, { status: 500 });
    }

    if (variantPracticeLogsResult.error) {
      console.error('[parent/insights] Failed to load variant practice logs:', variantPracticeLogsResult.error);
      return NextResponse.json({ error: 'Failed to load variant practice logs' }, { status: 500 });
    }

    if (chatMessagesResult.error) {
      console.error('[parent/insights] Failed to load chat messages:', chatMessagesResult.error);
      return NextResponse.json({ error: 'Failed to load chat messages' }, { status: 500 });
    }

    if (interventionTasksResult.error) {
      console.error('[parent/insights] Failed to load intervention tasks:', interventionTasksResult.error);
      return NextResponse.json({ error: 'Failed to load intervention tasks' }, { status: 500 });
    }

    const diagnoses = (diagnosesResult.data ?? []) as DiagnosisRow[];
    const reviewSchedules = (reviewSchedulesResult.data ?? []) as ReviewScheduleRow[];
    const reviewAttempts = (reviewAttemptsResult.data ?? []) as ReviewAttemptRow[];
    const variantQuestions = (variantQuestionsResult.data ?? []) as VariantQuestionRow[];
    const variantPracticeLogs = (variantPracticeLogsResult.data ?? []) as VariantPracticeLogRow[];
    const chatMessages = (chatMessagesResult.data ?? []) as ChatMessageRow[];
    const interventionTasks = (interventionTasksResult.data ?? []) as ParentTaskRow[];

    const reviewMap = new Map(reviewSchedules.map((review) => [review.session_id, review]));
    const attemptsBySession = new Map<string, ReviewAttemptRow[]>();
    for (const attempt of reviewAttempts) {
      const current = attemptsBySession.get(attempt.session_id) ?? [];
      current.push(attempt);
      attemptsBySession.set(attempt.session_id, current);
    }
    const variantQuestionIds = new Set(variantQuestions.map((question) => question.id));
    const variantQuestionsBySession = new Map<string, VariantQuestionRow[]>();
    for (const question of variantQuestions) {
      const current = variantQuestionsBySession.get(question.original_session_id) ?? [];
      current.push(question);
      variantQuestionsBySession.set(question.original_session_id, current);
    }
    const variantLogsByVariantId = new Map<string, VariantPracticeLogRow[]>();
    for (const log of variantPracticeLogs) {
      if (!variantQuestionIds.has(log.variant_id)) {
        continue;
      }

      const current = variantLogsByVariantId.get(log.variant_id) ?? [];
      current.push(log);
      variantLogsByVariantId.set(log.variant_id, current);
    }

    const rootCauseAggregates = new Map<string, AggregateBucket>();
    const knowledgeAggregates = new Map<string, AggregateBucket>();
    const habitAggregates = new Map<string, AggregateBucket>();

    for (const diagnosis of diagnoses) {
      const review = reviewMap.get(diagnosis.session_id);
      const sessionAttempts = attemptsBySession.get(diagnosis.session_id) ?? [];
      const pseudoMasteryCount = sessionAttempts.filter((item) => item.mastery_judgement === 'pseudo_mastery').length;
      const pendingCount = review && review.is_completed === false ? 1 : 0;
      const reopenedCount = review?.reopened_count ?? 0;
      const recent = isRecentIso(diagnosis.updated_at || diagnosis.created_at, 7);
      const rootCauseKey = diagnosis.root_cause_subtype || diagnosis.root_cause_category;

      pushIntoAggregate(rootCauseAggregates, {
        key: rootCauseKey,
        statement: diagnosis.root_cause_statement,
        sessionId: diagnosis.session_id,
        recent,
        reopenedCount,
        pseudoMasteryCount,
        pendingCount,
        category: diagnosis.root_cause_category,
        subtype: diagnosis.root_cause_subtype,
      });

      const knowledgeTags = normalizeStringList(diagnosis.knowledge_tags);
      const habitTags = normalizeStringList(diagnosis.habit_tags);
      const sessionConceptTags = normalizeStringList(sessionMap.get(diagnosis.session_id)?.concept_tags);
      const tagsForKnowledge = knowledgeTags.length > 0 ? knowledgeTags : sessionConceptTags;

      for (const tag of tagsForKnowledge) {
        pushIntoAggregate(knowledgeAggregates, {
          key: tag,
          statement: diagnosis.root_cause_statement,
          sessionId: diagnosis.session_id,
          recent,
          reopenedCount,
          pseudoMasteryCount,
          pendingCount,
        });
      }

      for (const tag of habitTags) {
        pushIntoAggregate(habitAggregates, {
          key: tag,
          statement: diagnosis.root_cause_statement,
          sessionId: diagnosis.session_id,
          recent,
          reopenedCount,
          pseudoMasteryCount,
          pendingCount,
        });
      }
    }

    const rawRootCauseItems = Array.from(rootCauseAggregates.values()).map((bucket) => ({
      category: bucket.category as RootCauseCategory,
      label: getRootCauseLabel(bucket.category as RootCauseCategory),
      subtype: bucket.subtype ?? null,
      subtype_label: bucket.subtype ? getRootCauseSubtypeOption(bucket.subtype)?.label ?? bucket.subtype : null,
      count: bucket.count,
      recent_count: bucket.recentCount,
      reopened_count: bucket.reopenedCount,
      pseudo_mastery_count: bucket.pseudoMasteryCount,
      pending_count: bucket.pendingCount,
      raw_heat_score: computeHeatScore({
        count: bucket.count,
        recentCount: bucket.recentCount,
        reopenedCount: bucket.reopenedCount,
        pseudoMasteryCount: bucket.pseudoMasteryCount,
        pendingCount: bucket.pendingCount,
      }),
      sample_root_statements: Array.from(bucket.statements.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([statement]) => statement),
      playbook: getParentSupportPlaybook(bucket.category as RootCauseCategory, bucket.subtype ?? null),
    }));

    const maxRootCauseScore =
      rawRootCauseItems.reduce((max, item) => Math.max(max, item.raw_heat_score), 0) || 1;

    const rootCauseHeatmap = rawRootCauseItems
      .map((item) => {
        const heatScore = Math.round((item.raw_heat_score / maxRootCauseScore) * 100);
        return {
          ...item,
          heat_score: heatScore,
          heat_level: describeHeatLevel(heatScore),
        };
      })
      .sort((a, b) => {
        if (b.heat_score !== a.heat_score) {
          return b.heat_score - a.heat_score;
        }
        return b.count - a.count;
      });

    const buildHotspotList = (aggregateMap: Map<string, AggregateBucket>) => {
      const rawItems = Array.from(aggregateMap.values()).map((bucket) => ({
        tag: bucket.key,
        count: bucket.count,
        recent_count: bucket.recentCount,
        reopened_count: bucket.reopenedCount,
        pseudo_mastery_count: bucket.pseudoMasteryCount,
        pending_count: bucket.pendingCount,
        raw_heat_score: computeHeatScore({
          count: bucket.count,
          recentCount: bucket.recentCount,
          reopenedCount: bucket.reopenedCount,
          pseudoMasteryCount: bucket.pseudoMasteryCount,
          pendingCount: bucket.pendingCount,
        }),
        sample_root_statements: Array.from(bucket.statements.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([statement]) => statement),
      }));

      const maxScore = rawItems.reduce((max, item) => Math.max(max, item.raw_heat_score), 0) || 1;

      return rawItems
        .map((item) => {
          const heatScore = Math.round((item.raw_heat_score / maxScore) * 100);
          return {
            ...item,
            heat_score: heatScore,
            heat_level: describeHeatLevel(heatScore),
          };
        })
        .sort((a, b) => {
          if (b.heat_score !== a.heat_score) {
            return b.heat_score - a.heat_score;
          }
          return b.count - a.count;
        })
        .slice(0, 8);
    };

    const knowledgeHotspots = buildHotspotList(knowledgeAggregates);
    const habitHotspots = buildHotspotList(habitAggregates);

    const rawRecentRisks = sessions
      .map((session) => {
        const review = reviewMap.get(session.id);
        const attempts = attemptsBySession.get(session.id) ?? [];
        const latestAttempt = attempts[0];
        const diagnosis = diagnoses.find((item) => item.session_id === session.id);
        const reflectionQuality = getReflectionQualitySnapshot(diagnosis?.guided_reflection);
        const sessionVariantQuestions = variantQuestionsBySession.get(session.id) ?? [];
        const variantEvidence = summarizeVariantEvidence({
          questions: sessionVariantQuestions,
          logs: sessionVariantQuestions.flatMap((question) => variantLogsByVariantId.get(question.id) ?? []),
        });
        const closureGate =
          review && latestAttempt
            ? evaluateClosureGates({
                reviewStage: review.review_stage ?? 1,
                currentAttempt: toAttemptEvidence(latestAttempt),
                previousAttempts: attempts.slice(1).map(toAttemptEvidence),
                externalVariantEvidencePassed: variantEvidence.qualified_transfer_evidence,
              })
            : null;
        const pendingClosureLabels =
          review?.is_completed === false && review?.mastery_state === 'provisional_mastered' && closureGate
            ? closureGate.items.filter((gate) => !gate.passed).map((gate) => gate.shortLabel)
            : [];
        const rootCauseContext = getRootCauseContext(
          session.primary_root_cause_category,
          session.primary_root_cause_subtype,
        );
        const riskScore =
          (review?.reopened_count ?? 0) * 3 +
          (review?.last_judgement === 'pseudo_mastery' ? 4 : 0) +
          (review?.last_judgement && isMasteryJudgement(review.last_judgement) && RISK_JUDGEMENTS.has(review.last_judgement) ? 2 : 0) +
          (review && review.is_completed === false && isOverdue(review.next_review_at) ? 2 : 0) +
          (pendingClosureLabels.length > 0 ? 1 : 0) +
          (reflectionQuality?.surface_only_risk ? 1 : 0);

        if (riskScore === 0) {
          return null;
        }

        const riskLabel = getParentRecentRiskTitle({
          masteryJudgement: review?.last_judgement ?? latestAttempt?.mastery_judgement ?? null,
          isOverdue: Boolean(review && review.is_completed === false && isOverdue(review.next_review_at)),
          reopenedCount: review?.reopened_count ?? 0,
          hasPendingClosureLabels: pendingClosureLabels.length > 0,
          hasSurfaceReflectionRisk: reflectionQuality?.surface_only_risk ?? false,
        });

        return {
          session_id: session.id,
          title: riskLabel,
          excerpt: excerpt(session.extracted_text),
          root_cause_label: rootCauseContext.rootCauseLabel || '待归因',
          root_cause_subtype_label: rootCauseContext.rootCauseSubtypeLabel,
          root_cause_display_label: rootCauseContext.rootCauseDisplayLabel || '待归因',
          root_cause_statement: session.primary_root_cause_statement,
          mastery_judgement: review?.last_judgement ?? latestAttempt?.mastery_judgement ?? null,
          reopened_count: review?.reopened_count ?? 0,
          next_review_at: review?.next_review_at ?? null,
          transfer_evidence_status_label: variantEvidence.status_label,
          transfer_evidence_summary: variantEvidence.parent_summary,
          transfer_evidence_next_step: variantEvidence.next_step,
          transfer_evidence_ready: variantEvidence.qualified_transfer_evidence,
          closure_gate_summary: pendingClosureLabels.length > 0 ? closureGate?.summary ?? null : null,
          closure_pending_labels: pendingClosureLabels,
          closure_pending_count: pendingClosureLabels.length,
          transfer_evidence_pending: Boolean(closureGate?.pendingGateKeys.includes('variant_transfer')),
          reflection_depth_label: reflectionQuality?.depth_label ?? null,
          reflection_coach_signal: reflectionQuality?.coach_signal ?? null,
          reflection_surface_only_risk: reflectionQuality?.surface_only_risk ?? false,
          risk_score: riskScore,
          created_at: latestAttempt?.created_at ?? review?.updated_at ?? session.created_at,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const left = a as NonNullable<typeof a>;
        const right = b as NonNullable<typeof b>;
        if (right.risk_score !== left.risk_score) {
          return right.risk_score - left.risk_score;
        }
        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
      });

    const conversationAlertSignals = aggregateConversationRiskSignals(
      chatMessages
        .filter((message) => message.role === 'user')
        .map((message) => ({
          sessionId: message.session_id,
          messageId: message.id,
          createdAt: message.created_at,
          messageText: message.content,
        })),
    );

    const conversationSignalsByKey = new Map<string, typeof conversationAlertSignals>();
    for (const signal of conversationAlertSignals) {
      const key = buildConversationTaskKey(signal.session_id, signal.category);
      const current = conversationSignalsByKey.get(key) ?? [];
      current.push(signal);
      conversationSignalsByKey.set(key, current);
    }

    const interventionTaskSnapshots = interventionTasks
      .map((task) => {
        const session = sessionMap.get(task.task_type === 'review_intervention' ? parseReviewInterventionTaskMarkers(task.description)?.session_id || '' : parseConversationTaskMarkers(task.description)?.sessionId || '');

        if (task.task_type === 'review_intervention') {
          const markers = parseReviewInterventionTaskMarkers(task.description);
          if (!markers) {
            return null;
          }

          const completion = getTaskCompletion(task);
          const completedAt = completion?.completed_at ?? task.completed_at ?? null;
          const status = task.status ?? (completedAt ? 'completed' : 'pending');
          const followupAttempts = completedAt
            ? (attemptsBySession.get(markers.session_id) ?? []).filter(
                (attempt) => new Date(attempt.created_at).getTime() > new Date(completedAt).getTime(),
              )
            : [];
          const { effect, postInterventionRepeatCount } = evaluateReviewInterventionEffect({
            status,
            completedAt,
            judgement: markers.judgement,
            reason: markers.reason,
            followupAttempts,
          });
          const rootCauseContext = getRootCauseContext(
            session?.primary_root_cause_category,
            session?.primary_root_cause_subtype,
          );

          return {
            task_id: task.id,
            session_id: markers.session_id,
            category: markers.judgement,
            task_type: 'review_intervention',
            task_type_label: '复习补救',
            title:
              task.title ||
              `复习补救: ${MASTERY_JUDGEMENT_META[markers.judgement as keyof typeof MASTERY_JUDGEMENT_META]?.label ?? markers.judgement}`,
            status,
            feedback_note: completion?.notes ?? null,
            completed_at: completedAt,
            updated_at: completion?.updated_at ?? task.updated_at ?? null,
            effect,
            post_intervention_repeat_count: postInterventionRepeatCount,
            root_cause_display_label: rootCauseContext.rootCauseDisplayLabel,
            root_cause_statement: session?.primary_root_cause_statement ?? null,
          } satisfies InterventionTaskSnapshot;
        }

        const markers = parseConversationTaskMarkers(task.description);
        if (!markers) {
          return null;
        }

        const completion = getTaskCompletion(task);
        const completedAt = completion?.completed_at ?? task.completed_at ?? null;
        const status = task.status ?? (completedAt ? 'completed' : 'pending');
        const taskKey = buildConversationTaskKey(markers.sessionId, markers.category);
        const relatedSignals = conversationSignalsByKey.get(taskKey) ?? [];
        const { effect, postInterventionRepeatCount } = evaluateConversationInterventionEffect({
          status,
          completedAt,
          signalTimestamps: relatedSignals.map((signal) => signal.created_at),
        });
        const rootCauseContext = getRootCauseContext(
          session?.primary_root_cause_category,
          session?.primary_root_cause_subtype,
        );

        return {
          task_id: task.id,
          session_id: markers.sessionId,
          category: markers.category,
          task_type: 'conversation_intervention',
          task_type_label: '沟通干预',
          title: task.title,
          status,
          feedback_note: completion?.notes ?? null,
          completed_at: completedAt,
          updated_at: completion?.updated_at ?? task.updated_at ?? null,
          effect,
          post_intervention_repeat_count: postInterventionRepeatCount,
          root_cause_display_label: rootCauseContext.rootCauseDisplayLabel,
          root_cause_statement: session?.primary_root_cause_statement ?? null,
        } satisfies InterventionTaskSnapshot;
      })
      .filter((item): item is InterventionTaskSnapshot => item !== null)
      .sort((a, b) => {
        const leftPriority = getParentInterventionTaskPriorityWeight({
          taskType: a.task_type,
          status: a.status,
          effect: a.effect,
          hasFeedbackNote: Boolean(a.feedback_note?.trim()),
        });
        const rightPriority = getParentInterventionTaskPriorityWeight({
          taskType: b.task_type,
          status: b.status,
          effect: b.effect,
          hasFeedbackNote: Boolean(b.feedback_note?.trim()),
        });

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }

        return compareIsoDesc(a.updated_at ?? a.completed_at, b.updated_at ?? b.completed_at);
      });

    const interventionTaskMap = new Map<string, InterventionTaskSnapshot>();
    for (const task of interventionTaskSnapshots) {
      const key = buildConversationTaskKey(task.session_id, task.category);
      if (!interventionTaskMap.has(key)) {
        interventionTaskMap.set(key, task);
      }
    }
    const reviewInterventionTaskMap = new Map<string, InterventionTaskSnapshot>();
    for (const task of interventionTaskSnapshots) {
      if (task.task_type !== 'review_intervention') {
        continue;
      }

      const key = buildReviewTaskKey(task.session_id, task.category);
      if (!reviewInterventionTaskMap.has(key)) {
        reviewInterventionTaskMap.set(key, task);
      }
    }

    const recentRisks = rawRecentRisks
      .filter((item): item is NonNullable<(typeof rawRecentRisks)[number]> => item !== null)
      .map((item) => {
      const reviewTask =
        item.mastery_judgement &&
        ((isMasteryJudgement(item.mastery_judgement) && RISK_JUDGEMENTS.has(item.mastery_judgement)) ||
          (item.mastery_judgement === 'provisional_mastered' && item.transfer_evidence_pending))
          ? reviewInterventionTaskMap.get(buildReviewTaskKey(item.session_id, item.mastery_judgement))
          : undefined;

      return {
        ...item,
        intervention_task_id: reviewTask?.task_id ?? null,
        intervention_status: reviewTask?.status ?? null,
        intervention_effect: reviewTask?.effect ?? null,
        intervention_task_type_label: reviewTask?.task_type_label ?? null,
      };
    })
      .sort((a, b) => {
        const leftPriority = getParentRecentRiskPriorityWeight({
          interventionEffect: a.intervention_effect,
          hasInterventionTask: Boolean(a.intervention_task_id),
          interventionStatus: a.intervention_status,
          closurePendingCount: a.closure_pending_count,
        });
        const rightPriority = getParentRecentRiskPriorityWeight({
          interventionEffect: b.intervention_effect,
          hasInterventionTask: Boolean(b.intervention_task_id),
          interventionStatus: b.intervention_status,
          closurePendingCount: b.closure_pending_count,
        });

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }
        if (b.risk_score !== a.risk_score) {
          return b.risk_score - a.risk_score;
        }
        return compareIsoDesc(a.created_at, b.created_at);
      })
      .slice(0, 6);

    const conversationAlerts = conversationAlertSignals
      .map((item) => {
        const session = sessionMap.get(item.session_id);
        const interventionTask = interventionTaskMap.get(
          buildConversationTaskKey(item.session_id, item.category),
        );
        const rootCauseContext = getRootCauseContext(
          session?.primary_root_cause_category,
          session?.primary_root_cause_subtype,
        );
        return {
          session_id: item.session_id,
          message_id: item.message_id,
          created_at: item.created_at,
          category: item.category,
          severity: item.severity,
          score: item.score,
          title: item.title,
          summary: item.summary,
          message_excerpt: excerpt(item.messageText, 80),
          question_excerpt: excerpt(session?.extracted_text, 46),
          root_cause_label: rootCauseContext.rootCauseLabel,
          root_cause_subtype_label: rootCauseContext.rootCauseSubtypeLabel,
          root_cause_display_label: rootCauseContext.rootCauseDisplayLabel,
          root_cause_statement: session?.primary_root_cause_statement ?? null,
          parent_opening: item.parentOpening,
          parent_actions: item.parentActions,
          intervention_task_id: interventionTask?.task_id ?? null,
          intervention_status: interventionTask?.status ?? null,
          intervention_feedback_note: interventionTask?.feedback_note ?? null,
          intervention_completed_at: interventionTask?.completed_at ?? null,
          intervention_effect: interventionTask?.effect ?? null,
          post_intervention_repeat_count: interventionTask?.post_intervention_repeat_count ?? 0,
        };
      })
      .slice(0, 8);

    const completedInterventionCount = interventionTaskSnapshots.filter(
      (task) => task.status === 'completed',
    ).length;
    const pendingInterventionCount = interventionTaskSnapshots.filter(
      (task) => task.status !== 'completed',
    ).length;
    const conversationInterventionTotal = interventionTaskSnapshots.filter(
      (task) => task.task_type === 'conversation_intervention',
    ).length;
    const reviewInterventionTotal = interventionTaskSnapshots.filter(
      (task) => task.task_type === 'review_intervention',
    ).length;
    const pendingReviewInterventionCount = interventionTaskSnapshots.filter(
      (task) => task.task_type === 'review_intervention' && task.status !== 'completed',
    ).length;
    const pendingReviewInterventionWithoutFeedbackCount = interventionTaskSnapshots.filter(
      (task) =>
        task.task_type === 'review_intervention' &&
        task.status !== 'completed' &&
        !(task.feedback_note || '').trim(),
    ).length;
    const reviewInterventionRiskPersistingCount = interventionTaskSnapshots.filter(
      (task) => task.task_type === 'review_intervention' && task.effect === 'risk_persisting',
    ).length;
    const reviewInterventionRiskLoweredCount = interventionTaskSnapshots.filter(
      (task) => task.task_type === 'review_intervention' && task.effect === 'risk_lowered',
    ).length;
    const loweredRiskInterventionCount = interventionTaskSnapshots.filter(
      (task) => task.effect === 'risk_lowered',
    ).length;
    const persistingRiskInterventionCount = interventionTaskSnapshots.filter(
      (task) => task.effect === 'risk_persisting',
    ).length;

    const pseudoMasteryCount = reviewAttempts.filter((attempt) => attempt.mastery_judgement === 'pseudo_mastery').length;
    const pendingReviewCount = reviewSchedules.filter((review) => review.is_completed === false).length;
    const overdueReviewCount = reviewSchedules.filter(
      (review) => review.is_completed === false && isOverdue(review.next_review_at),
    ).length;
    const surfaceOnlyReflectionCount = diagnoses.filter(
      (diagnosis) => getReflectionQualitySnapshot(diagnosis.guided_reflection)?.surface_only_risk === true,
    ).length;
    const reopenedTotal = reviewSchedules.reduce((sum, review) => sum + (review.reopened_count ?? 0), 0);
    const masteredClosedCount = reviewSchedules.filter((review) => review.mastery_state === 'mastered_closed').length;
    const provisionalMasteredCount = reviewSchedules.filter(
      (review) => review.mastery_state === 'provisional_mastered',
    ).length;
    const missingTransferEvidenceCount = sessions.filter((session) => {
      const sessionVariantQuestions = variantQuestionsBySession.get(session.id) ?? [];
      const variantEvidence = summarizeVariantEvidence({
        questions: sessionVariantQuestions,
        logs: sessionVariantQuestions.flatMap((question) => variantLogsByVariantId.get(question.id) ?? []),
      });

      return session.closure_state !== 'mastered_closed' && !variantEvidence.qualified_transfer_evidence;
    }).length;
    const openErrorsCount = sessions.filter((session) => session.closure_state !== 'mastered_closed').length;
    const masterySignalTotal = masteredClosedCount + provisionalMasteredCount + pseudoMasteryCount;
    const stableMasteryRate = toPercent(masteredClosedCount, masterySignalTotal);
    const provisionalMasteryRate = toPercent(provisionalMasteredCount, masterySignalTotal);
    const pseudoMasteryRate = toPercent(pseudoMasteryCount, masterySignalTotal);
    const transferGapRate = toPercent(missingTransferEvidenceCount, openErrorsCount);
    const highSeverityConversationAlertCount = conversationAlerts.filter((item) => item.severity === 'high').length;
    const masteryBalanceCopy = getParentMasteryBalanceCopy({
      masterySignalTotal,
      masteredClosedCount,
      provisionalMasteredCount,
      pseudoMasteryCount,
    });
    const masteryBalanceLabel = masteryBalanceCopy.label;
    const masteryBalanceSummary = masteryBalanceCopy.summary;
    const transferGapInsightCopy = getParentTransferGapInsightCopy({
      openErrorsCount,
      missingTransferEvidenceCount,
      transferGapRate,
    });
    const transferGapLabel = transferGapInsightCopy.label;
    const transferGapSummary = transferGapInsightCopy.summary;
    const reviewInterventionFocusCopy = getParentReviewInterventionFocusCopy({
      reviewInterventionRiskPersistingCount,
      pendingReviewInterventionCount,
      pendingReviewInterventionWithoutFeedbackCount,
      overdueReviewCount,
    });
    const interventionFocusLabel = reviewInterventionFocusCopy.label;
    const interventionFocusSummary = reviewInterventionFocusCopy.summary;
    const interventionFocusValue = reviewInterventionFocusCopy.value;
    const interventionFocusValueLabel = reviewInterventionFocusCopy.valueLabel;
    const reviewInterventionPersistingActionCopy = getParentReviewInterventionPersistingActionCopy({
      reviewInterventionRiskPersistingCount,
    });
    const reviewInterventionPendingActionCopy = getParentReviewInterventionPendingActionCopy({
      pendingReviewInterventionCount,
      pendingReviewInterventionWithoutFeedbackCount,
    });
    const reviewInterventionLoweredActionCopy = getParentReviewInterventionLoweredActionCopy({
      reviewInterventionRiskLoweredCount,
    });
    const overdueReviewActionCopy = getParentOverdueReviewActionCopy({
      overdueReviewCount,
    });
    const pseudoMasteryActionCopy = getParentPseudoMasteryActionCopy({
      pseudoMasteryCount,
      pseudoMasteryRate,
    });
    const surfaceReflectionActionCopy = getParentSurfaceReflectionActionCopy({
      surfaceOnlyReflectionCount,
    });

    const parentActions = [
      ...(overdueReviewActionCopy
        ? [
            {
              title: overdueReviewActionCopy.title,
              summary: overdueReviewActionCopy.summary,
              priority: 'high',
              driver_label: overdueReviewActionCopy.driverLabel,
              driver_value: overdueReviewActionCopy.driverValue,
            },
          ]
        : []),
      ...(pseudoMasteryActionCopy
        ? [
            {
              title: pseudoMasteryActionCopy.title,
              summary: pseudoMasteryActionCopy.summary,
              priority: 'high',
              driver_label: pseudoMasteryActionCopy.driverLabel,
              driver_value: pseudoMasteryActionCopy.driverValue,
            },
          ]
        : []),
      ...(missingTransferEvidenceCount > 0
        ? [
            {
              title: transferGapInsightCopy.actionTitle!,
              summary: transferGapInsightCopy.actionSummary!,
              priority: 'high',
              driver_label: transferGapInsightCopy.driverLabel,
              driver_value: transferGapInsightCopy.driverValue,
            },
          ]
        : []),
      ...(reviewInterventionPersistingActionCopy
        ? [
            {
              title: reviewInterventionPersistingActionCopy.title,
              summary: reviewInterventionPersistingActionCopy.summary,
              priority: 'high',
              driver_label: reviewInterventionPersistingActionCopy.driverLabel,
              driver_value: reviewInterventionPersistingActionCopy.driverValue,
            },
          ]
        : []),
      ...(reviewInterventionPendingActionCopy
        ? [
            {
              title: reviewInterventionPendingActionCopy.title,
              summary: reviewInterventionPendingActionCopy.summary,
              priority: 'high',
              driver_label: reviewInterventionPendingActionCopy.driverLabel,
              driver_value: reviewInterventionPendingActionCopy.driverValue,
            },
          ]
        : []),
      ...(reviewInterventionLoweredActionCopy
        ? [
            {
              title: reviewInterventionLoweredActionCopy.title,
              summary: reviewInterventionLoweredActionCopy.summary,
              priority: 'medium',
              driver_label: reviewInterventionLoweredActionCopy.driverLabel,
              driver_value: reviewInterventionLoweredActionCopy.driverValue,
            },
          ]
        : []),
      ...(surfaceReflectionActionCopy
        ? [
            {
              title: surfaceReflectionActionCopy.title,
              summary: surfaceReflectionActionCopy.summary,
              priority: 'high',
              driver_label: surfaceReflectionActionCopy.driverLabel,
              driver_value: surfaceReflectionActionCopy.driverValue,
            },
          ]
        : []),
      ...(highSeverityConversationAlertCount > 0
        ? [
            {
              title: '优先处理高风险对话信号',
              summary: '最近对话里出现了高强度情绪/边界/自我否定表达，建议先稳关系和情绪，再推进讲题。',
              priority: 'high',
              driver_label: '高风险对话',
              driver_value: `${highSeverityConversationAlertCount} 条高风险`,
            },
          ]
        : []),
      ...rootCauseHeatmap.slice(0, 3).map((item, index) => ({
        title: `${index + 1}. ${item.subtype_label || item.label}`,
        summary: item.subtype_label ? `${item.subtype_label} 属于「${item.label}」问题。${item.playbook.summary}` : item.playbook.summary,
        priority: index === 0 ? 'high' : 'medium',
        driver_label: '错因热区',
        driver_value: `热力 ${item.heat_score} / 近7天 ${item.recent_count} 次`,
        actions: item.playbook.actions,
        watch_fors: item.playbook.watchFors,
      })),
    ];

    return NextResponse.json({
      students: childList,
      selected_student: selectedStudent,
      subject,
      summary: {
        total_errors: sessions.length,
        open_errors: openErrorsCount,
        pending_review_count: pendingReviewCount,
        overdue_review_count: overdueReviewCount,
        mastered_closed_count: masteredClosedCount,
        provisional_mastered_count: provisionalMasteredCount,
        pseudo_mastery_count: pseudoMasteryCount,
        missing_transfer_evidence_count: missingTransferEvidenceCount,
        reopened_total: reopenedTotal,
      },
      summary_chain: {
        mastery_signal_total: masterySignalTotal,
        stable_mastery_rate: stableMasteryRate,
        provisional_mastery_rate: provisionalMasteryRate,
        pseudo_mastery_rate: pseudoMasteryRate,
        transfer_gap_rate: transferGapRate,
        intervention_focus_value: interventionFocusValue,
        intervention_focus_value_label: interventionFocusValueLabel,
        review_intervention_pending: pendingReviewInterventionCount,
        mastery_balance_label: masteryBalanceLabel,
        mastery_balance_summary: masteryBalanceSummary,
        transfer_gap_label: transferGapLabel,
        transfer_gap_summary: transferGapSummary,
        intervention_focus_label: interventionFocusLabel,
        intervention_focus_summary: interventionFocusSummary,
      },
      root_cause_heatmap: rootCauseHeatmap.slice(0, 8),
      knowledge_hotspots: knowledgeHotspots,
      habit_hotspots: habitHotspots,
      recent_risks: recentRisks,
      conversation_alerts: conversationAlerts,
      intervention_summary: {
        total: interventionTaskSnapshots.length,
        pending: pendingInterventionCount,
        completed: completedInterventionCount,
        risk_lowered: loweredRiskInterventionCount,
        risk_persisting: persistingRiskInterventionCount,
        conversation_total: conversationInterventionTotal,
        review_total: reviewInterventionTotal,
        review_pending: pendingReviewInterventionCount,
      },
      intervention_outcomes: interventionTaskSnapshots
        .slice(0, 8),
      parent_actions: parentActions,
      scoring_model: {
        ...HEAT_SCORE_MODEL,
        explanation:
          '热力值由频次、近7天出现次数、复开次数、假会次数、当前待处理压力共同计算，再按当前孩子的最高风险点归一化到 100 分。',
      },
    });
  } catch (error: unknown) {
    console.error('[parent/insights] API error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
