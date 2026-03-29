export type AttemptMode = 'original' | 'variant' | 'mixed';

export type MasteryJudgement =
  | 'not_mastered'
  | 'assisted_correct'
  | 'explanation_gap'
  | 'pseudo_mastery'
  | 'provisional_mastered'
  | 'mastered';

export type ClosureGateKey =
  | 'independent_completion'
  | 'no_ai_hints'
  | 'explanation_quality'
  | 'variant_transfer'
  | 'interval_stability';

export type ClosureGateItem = {
  key: ClosureGateKey;
  label: string;
  shortLabel: string;
  passed: boolean;
  detail: string;
};

export type ClosureGateStatusMeta = {
  label: string;
  className: string;
};

export type ClosureGateAttemptEvidence = {
  attemptMode: AttemptMode;
  independentFirst: boolean;
  askedAi: boolean;
  aiHintCount: number;
  solvedCorrectly: boolean;
  explainedCorrectly: boolean;
  variantPassed: boolean | null;
};

export const MIN_CLOSURE_REVIEW_STAGE = 3;

export const ATTEMPT_MODE_OPTIONS: Array<{
  value: AttemptMode;
  label: string;
  description: string;
}> = [
  {
    value: 'original',
    label: '原题复习',
    description: '先验证原题是否能独立做出并讲清思路。',
  },
  {
    value: 'variant',
    label: '变式复习',
    description: '重点检查迁移能力，避免只会记答案。',
  },
  {
    value: 'mixed',
    label: '原题 + 变式',
    description: '同时验证原题稳定性和变式迁移能力。',
  },
];

export const MASTERY_JUDGEMENT_META: Record<
  MasteryJudgement,
  {
    label: string;
    description: string;
    tone: 'red' | 'amber' | 'blue' | 'green';
    messaging: {
      studentSummaryObserved: string;
      studentSummaryImplication: string;
      parentNotificationObserved: string;
    };
  }
> = {
  not_mastered: {
    label: '未掌握',
    description: '这次仍未独立做对，需要回到引导学习，把根因处理掉。',
    tone: 'red',
    messaging: {
      studentSummaryObserved: '还没能独立做对',
      studentSummaryImplication: '没有被真正处理掉',
      parentNotificationObserved: '仍未独立做对',
    },
  },
  assisted_correct: {
    label: '提示后做对',
    description: '结果对了，但依赖了提示，还不能算真正掌握。',
    tone: 'amber',
    messaging: {
      studentSummaryObserved: '结果做对了，但仍依赖提示',
      studentSummaryImplication: '一离开扶手就容易复发',
      parentNotificationObserved: '虽然做对了，但仍依赖提示',
    },
  },
  explanation_gap: {
    label: '会做但讲不清',
    description: '能得到答案，但解释链路不完整，知识还不稳。',
    tone: 'amber',
    messaging: {
      studentSummaryObserved: '能得到答案，但还讲不清依据',
      studentSummaryImplication: '停留在结果层，没有真正内化',
      parentNotificationObserved: '虽然有答案，但还讲不清依据',
    },
  },
  pseudo_mastery: {
    label: '假会',
    description: '原题似乎会，变式不过关，说明还停留在记忆层。',
    tone: 'red',
    messaging: {
      studentSummaryObserved: '原题表现正常，但变式没过',
      studentSummaryImplication: '还没有处理到可迁移层',
      parentNotificationObserved: '出现典型“假会”信号，原题正常但变式没过',
    },
  },
  provisional_mastered: {
    label: '暂时掌握',
    description: '这次独立完成得不错，但还需要下一轮间隔复习继续验证。',
    tone: 'blue',
    messaging: {
      studentSummaryObserved: '已经能独立做对并讲清',
      studentSummaryImplication: '还要跨间隔继续验证是不是真的稳定',
      parentNotificationObserved: '这次独立完成得不错，但还在等待后续稳定性验证',
    },
  },
  mastered: {
    label: '稳定掌握',
    description: '已满足关闭条件，这道题可以进入关闭状态。',
    tone: 'green',
    messaging: {
      studentSummaryObserved: '已经通过独立完成和间隔复习验证',
      studentSummaryImplication: '当前可以视为稳定关闭',
      parentNotificationObserved: '已经满足稳定掌握条件',
    },
  },
};

export function isMasteryJudgement(value: string | null | undefined): value is MasteryJudgement {
  return typeof value === 'string' && value in MASTERY_JUDGEMENT_META;
}

export function getMasteryJudgementMeta(value: string | null | undefined) {
  return isMasteryJudgement(value) ? MASTERY_JUDGEMENT_META[value] : null;
}

export const MASTERY_TONE_STYLES: Record<
  'red' | 'amber' | 'blue' | 'green',
  {
    badge: string;
    panel: string;
  }
> = {
  red: {
    badge: 'bg-red-100 text-red-700',
    panel: 'border-red-200 bg-red-50 text-red-800',
  },
  amber: {
    badge: 'bg-amber-100 text-amber-700',
    panel: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  blue: {
    badge: 'bg-blue-100 text-blue-700',
    panel: 'border-blue-200 bg-blue-50 text-blue-800',
  },
  green: {
    badge: 'bg-emerald-100 text-emerald-700',
    panel: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
};

export type ReviewClosureState = 'open' | 'provisional_mastered' | 'reopened' | 'mastered_closed';

export type ReviewClosureStateMeta = {
  label: string;
  compactLabel: string;
  description: string;
  badgeClassName: string;
  panelClassName: string;
  detailClassName: string;
};

export const REVIEW_CLOSURE_STATE_META: Record<ReviewClosureState, ReviewClosureStateMeta> = {
  open: {
    label: '仍在闭环中',
    compactLabel: '闭环进行中',
    description: '这道题还在复习闭环里，系统会继续根据后续复习证据判断是否能稳定关闭。',
    badgeClassName: 'bg-slate-100 text-slate-700',
    panelClassName: 'border-slate-200 bg-slate-50/80 text-slate-800',
    detailClassName: 'text-slate-700',
  },
  provisional_mastered: {
    label: '暂时会了，还要继续验证',
    compactLabel: '暂时会了，继续验证',
    description: '当前这题本轮表现不错，但还没到最终关闭，系统还在等待跨间隔和迁移证据。',
    badgeClassName: 'bg-blue-100 text-blue-700',
    panelClassName: 'border-blue-200 bg-blue-50/80 text-blue-800',
    detailClassName: 'text-blue-700',
  },
  reopened: {
    label: '重新打开，说明之前是假会',
    compactLabel: '已复开',
    description: '系统发现这题再次暴露问题，说明之前的掌握还不稳定，已经回到闭环里重新练。',
    badgeClassName: 'bg-red-100 text-red-700',
    panelClassName: 'border-red-200 bg-red-50/80 text-red-800',
    detailClassName: 'text-red-700',
  },
  mastered_closed: {
    label: '稳定会了，已关闭',
    compactLabel: '稳定掌握',
    description: '这题已经通过多轮验证并满足关闭条件，暂时不需要继续高频回看。',
    badgeClassName: 'bg-emerald-100 text-emerald-700',
    panelClassName: 'border-emerald-200 bg-emerald-50/80 text-emerald-800',
    detailClassName: 'text-emerald-700',
  },
};

export function isReviewClosureState(value: string | null | undefined): value is ReviewClosureState {
  return typeof value === 'string' && value in REVIEW_CLOSURE_STATE_META;
}

export function getClosureStateMeta(value: string | null | undefined): ReviewClosureStateMeta {
  return isReviewClosureState(value) ? REVIEW_CLOSURE_STATE_META[value] : REVIEW_CLOSURE_STATE_META.open;
}

export function buildClosureGateSummary(pendingLabels: string[]) {
  return pendingLabels.length === 0
    ? '已满足真会关门条件：独立完成、无提示、能讲清、能迁移、并完成跨间隔验证。'
    : `暂不关闭，还差 ${pendingLabels.join('、')}。`;
}

export function getClosureGateStatusMeta(input: {
  isCompleted: boolean;
  eligibleForClosure: boolean;
  closureState?: string | null;
}): ClosureGateStatusMeta {
  if (input.isCompleted) {
    return {
      label: getClosureStateMeta(input.closureState).compactLabel,
      className: 'border-emerald-200 text-emerald-700',
    };
  }

  if (input.eligibleForClosure) {
    return {
      label: '本轮可进入关单判定',
      className: 'border-blue-200 text-blue-700',
    };
  }

  return {
    label: '当前仍有条件未满足',
    className: 'border-amber-200 text-amber-700',
  };
}

export function getClosureOutcomeMeta(input: {
  closed: boolean;
  pendingLabels: string[];
}) {
  return {
    title: input.closed ? '为什么这次可以关闭' : '为什么这次还不能关闭',
    badgeLabel: input.closed ? '全部条件已满足' : `还差 ${input.pendingLabels.length} 项`,
    gateBadgeLabel: input.closed ? '已满足，可关闭' : '仍有条件未满足',
    summary: buildClosureGateSummary(input.pendingLabels),
  };
}

export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 15, 30] as const;

export function getReviewIntervalDays(stage: number) {
  const normalizedStage = Number.isFinite(stage) ? Math.max(1, Math.trunc(stage)) : 1;
  return REVIEW_INTERVAL_DAYS[Math.min(normalizedStage, REVIEW_INTERVAL_DAYS.length) - 1];
}

export function getScheduledReviewDate(stage: number, baseDate: Date = new Date()) {
  const nextReviewDate = new Date(baseDate);
  nextReviewDate.setDate(nextReviewDate.getDate() + getReviewIntervalDays(stage));
  return nextReviewDate.toISOString();
}

export type ReviewScheduleUpdate = {
  review_stage: number;
  next_review_at: string | null;
  is_completed: boolean;
  mastery_state: Exclude<ReviewClosureState, 'open'>;
  last_judgement: MasteryJudgement;
  close_reason: string | null;
  reopened_count: number;
  next_interval_days: number | null;
  closure_state: Exclude<ReviewClosureState, 'open'>;
  error_status: 'guided_learning' | 'mastered';
};

export function deriveReviewScheduleUpdate(input: {
  currentReviewStage: number;
  currentReopenedCount: number;
  currentNextReviewAt: string | null;
  judgement: MasteryJudgement;
  now?: Date;
}): ReviewScheduleUpdate {
  switch (input.judgement) {
    case 'mastered':
      return {
        review_stage: input.currentReviewStage,
        next_review_at: input.currentNextReviewAt || new Date(input.now || new Date()).toISOString(),
        is_completed: true,
        mastery_state: 'mastered_closed',
        last_judgement: input.judgement,
        close_reason: 'stable_independent_recall_with_transfer',
        reopened_count: input.currentReopenedCount,
        next_interval_days: null,
        closure_state: 'mastered_closed',
        error_status: 'mastered',
      };
    case 'provisional_mastered': {
      const nextStage = Math.min(input.currentReviewStage + 1, REVIEW_INTERVAL_DAYS.length);
      const nextIntervalDays = getReviewIntervalDays(nextStage);
      return {
        review_stage: nextStage,
        next_review_at: getScheduledReviewDate(nextStage, input.now),
        is_completed: false,
        mastery_state: 'provisional_mastered',
        last_judgement: input.judgement,
        close_reason: null,
        reopened_count: input.currentReopenedCount,
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
      const restartStage = 1;
      const nextIntervalDays = getReviewIntervalDays(restartStage);
      return {
        review_stage: restartStage,
        next_review_at: getScheduledReviewDate(restartStage, input.now),
        is_completed: false,
        mastery_state: 'reopened',
        last_judgement: input.judgement,
        close_reason: null,
        reopened_count: input.currentReopenedCount + 1,
        next_interval_days: nextIntervalDays,
        closure_state: 'reopened',
        error_status: 'guided_learning',
      };
    }
  }
}

function isIndependentAttempt(attempt: ClosureGateAttemptEvidence) {
  return attempt.solvedCorrectly && attempt.independentFirst && !attempt.askedAi && attempt.aiHintCount <= 0;
}

function hasVariantTransferEvidence(attempt: ClosureGateAttemptEvidence) {
  return (
    (attempt.attemptMode === 'variant' || attempt.attemptMode === 'mixed') &&
    isIndependentAttempt(attempt) &&
    attempt.explainedCorrectly &&
    attempt.variantPassed === true
  );
}

export function evaluateClosureGates(input: {
  reviewStage: number;
  currentAttempt: ClosureGateAttemptEvidence;
  previousAttempts?: ClosureGateAttemptEvidence[];
  externalVariantEvidencePassed?: boolean;
}) {
  const previousAttempts = input.previousAttempts || [];
  const variantEvidencePassed =
    [input.currentAttempt, ...previousAttempts].some(hasVariantTransferEvidence) ||
    input.externalVariantEvidencePassed === true;
  const items: ClosureGateItem[] = [
    {
      key: 'independent_completion',
      label: '独立完成原题/当前复习任务',
      shortLabel: '独立完成',
      passed: input.currentAttempt.solvedCorrectly && input.currentAttempt.independentFirst,
      detail:
        input.currentAttempt.solvedCorrectly && input.currentAttempt.independentFirst
          ? '本轮是先独立作答后再提交。'
          : '还没有做到先独立完成，当前结果不能作为关门依据。',
    },
    {
      key: 'no_ai_hints',
      label: '本轮未依赖 AI 提示',
      shortLabel: '无提示依赖',
      passed: !input.currentAttempt.askedAi && input.currentAttempt.aiHintCount <= 0,
      detail:
        !input.currentAttempt.askedAi && input.currentAttempt.aiHintCount <= 0
          ? '本轮没有使用 AI 扶手，证据有效。'
          : '本轮仍有 AI 提示介入，需要下一轮无提示独立验证。',
    },
    {
      key: 'explanation_quality',
      label: '能讲清楚关键依据',
      shortLabel: '讲清依据',
      passed: input.currentAttempt.explainedCorrectly,
      detail: input.currentAttempt.explainedCorrectly
        ? '不仅做对了，也能把为什么这样做讲清楚。'
        : '答案可能对，但解释链路还不完整，暂时不能视为真会。',
    },
    {
      key: 'variant_transfer',
      label: '有独立通过的变式证据',
      shortLabel: '变式迁移',
      passed: variantEvidencePassed,
      detail: variantEvidencePassed
        ? '已经出现过至少一次独立通过变式的记录，说明方法具备迁移性。'
        : '还缺少独立通过变式的证据，系统不会因为只会原题就关闭。',
    },
    {
      key: 'interval_stability',
      label: `跨间隔稳定到第 ${MIN_CLOSURE_REVIEW_STAGE} 轮`,
      shortLabel: '跨间隔稳定',
      passed: input.reviewStage >= MIN_CLOSURE_REVIEW_STAGE,
      detail:
        input.reviewStage >= MIN_CLOSURE_REVIEW_STAGE
          ? `当前已到第 ${input.reviewStage} 轮复习，满足跨间隔稳定验证。`
          : `当前是第 ${input.reviewStage} 轮，至少需要到第 ${MIN_CLOSURE_REVIEW_STAGE} 轮再关门。`,
    },
  ];
  const pendingItems = items.filter((item) => !item.passed);

  return {
    eligibleForClosure: pendingItems.length === 0,
    minClosureReviewStage: MIN_CLOSURE_REVIEW_STAGE,
    pendingGateKeys: pendingItems.map((item) => item.key),
    items,
    summary: buildClosureGateSummary(pendingItems.map((item) => item.shortLabel)),
  };
}

export type ReviewInterventionTaskDraft = {
  title: string;
  description: string;
  taskType: 'review_intervention';
  subject: string;
  targetCount: number;
  targetDuration: number;
  priority: 1 | 2 | 3;
  rewardPoints: number;
};

export type ReviewInterventionReason = 'mastery_risk' | 'transfer_evidence_gap';
export type ReviewInterventionEffect = 'pending' | 'risk_lowered' | 'risk_persisting';

export const REVIEW_INTERVENTION_RISK_JUDGEMENTS = new Set<MasteryJudgement>([
  'not_mastered',
  'assisted_correct',
  'explanation_gap',
  'pseudo_mastery',
]);

export function evaluateReviewInterventionEffect(input: {
  status: string | null | undefined;
  completedAt: string | null | undefined;
  judgement: string;
  reason?: string | null;
  followupAttempts: Array<{
    mastery_judgement: string;
    created_at: string;
  }>;
}) {
  const status = input.status ?? 'pending';
  if (status !== 'completed' || !input.completedAt) {
    return {
      effect: 'pending' as ReviewInterventionEffect,
      postInterventionRepeatCount: 0,
      hasSafeFollowup: false,
    };
  }

  const followupAttempts = input.followupAttempts.filter(
    (attempt) => new Date(attempt.created_at).getTime() > new Date(input.completedAt || 0).getTime(),
  );
  const postInterventionRepeatCount =
    input.reason === 'transfer_evidence_gap'
      ? followupAttempts.filter((attempt) => attempt.mastery_judgement === 'provisional_mastered').length
      : followupAttempts.filter((attempt) => attempt.mastery_judgement === input.judgement).length;
  const hasSafeFollowup =
    input.reason === 'transfer_evidence_gap'
      ? followupAttempts.some((attempt) => attempt.mastery_judgement === 'mastered')
      : followupAttempts.some(
          (attempt) =>
            !REVIEW_INTERVENTION_RISK_JUDGEMENTS.has(attempt.mastery_judgement as MasteryJudgement),
        );

  return {
    effect:
      postInterventionRepeatCount > 0
        ? ('risk_persisting' as ReviewInterventionEffect)
        : hasSafeFollowup
          ? ('risk_lowered' as ReviewInterventionEffect)
          : ('pending' as ReviewInterventionEffect),
    postInterventionRepeatCount,
    hasSafeFollowup,
  };
}

export function parseReviewInterventionTaskMarkers(description: string | null | undefined) {
  const content = description || '';
  const sessionMatch = content.match(/\[review-session:([^\]]+)\]/);
  const judgementMatch = content.match(/\[review-judgement:([^\]]+)\]/);
  const reasonMatch = content.match(/\[review-reason:([^\]]+)\]/);

  if (!sessionMatch || !judgementMatch) {
    return null;
  }

  return {
    session_id: sessionMatch[1],
    judgement: judgementMatch[1],
    reason: reasonMatch?.[1] || null,
  };
}

export function buildReviewInterventionTaskDraft(input: {
  sessionId: string;
  judgement: MasteryJudgement;
  reason?: ReviewInterventionReason;
  subject?: string | null;
  rootCauseDisplayLabel?: string | null;
  rootCauseStatement?: string | null;
  judgementSummary: string;
  nextActions: string[];
}) : ReviewInterventionTaskDraft {
  const reason = input.reason || 'mastery_risk';
  const priority: 1 | 2 | 3 =
    reason === 'transfer_evidence_gap'
      ? 2
      : input.judgement === 'not_mastered' || input.judgement === 'pseudo_mastery'
        ? 1
        : 2;
  const targetDuration =
    reason === 'transfer_evidence_gap'
      ? 15
      : input.judgement === 'not_mastered'
        ? 25
        : input.judgement === 'pseudo_mastery'
          ? 20
          : 15;
  const label =
    reason === 'transfer_evidence_gap' ? '补齐迁移证据' : MASTERY_JUDGEMENT_META[input.judgement].label;
  const causeLine = input.rootCauseDisplayLabel ? `当前细分根因: ${input.rootCauseDisplayLabel}` : null;
  const statementLine = input.rootCauseStatement ? `稳定模式: ${input.rootCauseStatement}` : null;

  return {
    title: `复习补救: ${label}${input.rootCauseDisplayLabel ? ` - ${input.rootCauseDisplayLabel}` : ''}`,
    description: [
      input.judgementSummary,
      causeLine,
      statementLine,
      '建议家长陪练动作:',
      ...input.nextActions.map((action, index) => `${index + 1}. ${action}`),
      `[review-session:${input.sessionId}]`,
      `[review-judgement:${input.judgement}]`,
      `[review-reason:${reason}]`,
    ]
      .filter(Boolean)
      .join('\n'),
    taskType: 'review_intervention',
    subject: input.subject || 'math',
    targetCount: 1,
    targetDuration,
    priority,
    rewardPoints: 0,
  };
}
