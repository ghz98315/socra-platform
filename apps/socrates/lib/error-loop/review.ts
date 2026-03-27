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
  }
> = {
  not_mastered: {
    label: '未掌握',
    description: '这次仍未独立做对，需要回到引导学习，把根因处理掉。',
    tone: 'red',
  },
  assisted_correct: {
    label: '提示后做对',
    description: '结果对了，但依赖了提示，还不能算真正掌握。',
    tone: 'amber',
  },
  explanation_gap: {
    label: '会做但讲不清',
    description: '能得到答案，但解释链路不完整，知识还不稳。',
    tone: 'amber',
  },
  pseudo_mastery: {
    label: '假会',
    description: '原题似乎会，变式不过关，说明还停留在记忆层。',
    tone: 'red',
  },
  provisional_mastered: {
    label: '暂时掌握',
    description: '这次独立完成得不错，但还需要下一轮间隔复习继续验证。',
    tone: 'blue',
  },
  mastered: {
    label: '稳定掌握',
    description: '已满足关闭条件，这道题可以进入关闭状态。',
    tone: 'green',
  },
};

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
    summary:
      pendingItems.length === 0
        ? '已满足真会关门条件：独立完成、无提示、能讲清、能迁移、并完成跨间隔验证。'
        : `暂不关闭，还差 ${pendingItems.map((item) => item.shortLabel).join('、')}。`,
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
