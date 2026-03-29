import {
  getMasteryJudgementMeta,
  REVIEW_INTERVENTION_RISK_JUDGEMENTS,
  type MasteryJudgement,
  type ReviewInterventionEffect,
  type ReviewInterventionReason,
} from '@/lib/error-loop/review';

export type ConversationInterventionStatusData = {
  intervention_status?: string | null;
  intervention_effect?: ReviewInterventionEffect | null;
};

export type MasteryInterventionStatusData = {
  risk_type?: 'mastery_risk' | 'transfer_evidence_gap' | string;
  intervention_status?: string | null;
  intervention_effect?: ReviewInterventionEffect | null;
  intervention_task_title?: string | null;
  intervention_feedback_note?: string | null;
};

export type MasteryRiskNotificationCopy = {
  title: string;
  content: string;
  actionText: string;
  priority: 1 | 2;
};

export type ParentMasteryInterventionTaskMeta = {
  title: string;
  summary: string;
  badgeLabel: string;
  badgeClassName: string;
  actionLabel: string;
  stateLabel: string;
  stateClassName: string;
};

export type ConversationInterventionEffectMeta = {
  label: string;
  badgeClassName: string;
};

function buildMasteryRiskCauseSuffix(input: {
  causeLabel?: string | null;
  rootCauseStatement?: string | null;
}) {
  const causePrefix = input.causeLabel ? `当前反复暴露的是「${input.causeLabel}」。` : '';
  const statementSuffix = input.rootCauseStatement ? `稳定模式：${input.rootCauseStatement}` : '';
  return `${causePrefix}${statementSuffix}`;
}

export function buildMasteryRiskNotificationCopy(input: {
  studentName?: string | null;
  judgement: MasteryJudgement;
  reason?: ReviewInterventionReason | string | null;
  causeLabel?: string | null;
  rootCauseStatement?: string | null;
  interventionTaskId?: string | null;
  notificationSummary?: string | null;
}): MasteryRiskNotificationCopy | null {
  const normalizedReason = input.reason || 'mastery_risk';
  const studentName = input.studentName || '孩子';
  const causeSuffix = buildMasteryRiskCauseSuffix({
    causeLabel: input.causeLabel,
    rootCauseStatement: input.rootCauseStatement,
  });

  if (normalizedReason === 'transfer_evidence_gap') {
    return {
      title: `${studentName}还缺迁移证据`,
      content:
        input.notificationSummary ||
        '这题虽然本轮做对了，但还没有形成独立迁移证据，暂时不能按真会关闭。',
      actionText: '查看迁移证据缺口',
      priority: 1,
    };
  }

  if (!REVIEW_INTERVENTION_RISK_JUDGEMENTS.has(input.judgement)) {
    return null;
  }

  const judgementMeta = getMasteryJudgementMeta(input.judgement);
  if (!judgementMeta) {
    return null;
  }

  return {
    title: `${studentName}出现掌握风险提醒`,
    content: `本轮复习${judgementMeta.messaging.parentNotificationObserved}。${causeSuffix}`,
    actionText: input.interventionTaskId ? '查看复习补救闭环' : '查看复习风险',
    priority: 2,
  };
}

export function formatConversationInterventionStatus(
  data: ConversationInterventionStatusData | null | undefined,
) {
  if (data?.intervention_effect === 'risk_lowered') {
    return '已沟通，风险下降';
  }

  if (data?.intervention_effect === 'risk_persisting') {
    return '已沟通，风险仍在';
  }

  if (data?.intervention_status === 'completed') {
    return '已沟通，待继续观察';
  }

  if (data?.intervention_status) {
    return '已建干预任务';
  }

  return null;
}

export function formatMasteryInterventionStatus(
  data: MasteryInterventionStatusData | null | undefined,
) {
  if (!data?.intervention_status) {
    return null;
  }

  const isTransferEvidenceGap = data.risk_type === 'transfer_evidence_gap';
  const completedLabel = isTransferEvidenceGap ? '补齐迁移证据任务' : '补救任务';
  const createdLabel = isTransferEvidenceGap ? '已生成迁移证据任务' : '已生成补救任务';

  if (data.intervention_effect === 'risk_lowered') {
    return isTransferEvidenceGap ? '补做后已形成迁移证据' : '补救后风险已下降';
  }

  if (data.intervention_effect === 'risk_persisting') {
    return isTransferEvidenceGap ? '补做后仍缺迁移证据' : '补救后同类风险仍在重复';
  }

  if (data.intervention_status === 'completed') {
    return data.intervention_feedback_note
      ? `${completedLabel}已完成，等待后续验证: ${data.intervention_feedback_note}`
      : `${completedLabel}已完成，等待后续验证`;
  }

  return data.intervention_task_title
    ? `${createdLabel}: ${data.intervention_task_title}`
    : createdLabel;
}

export function getConversationInterventionEffectMeta(
  effect: ReviewInterventionEffect | null | undefined,
): ConversationInterventionEffectMeta {
  switch (effect) {
    case 'risk_lowered':
      return {
        label: '风险暂时下降',
        badgeClassName: 'bg-emerald-100 text-emerald-700',
      };
    case 'risk_persisting':
      return {
        label: '风险仍在重复',
        badgeClassName: 'bg-red-100 text-red-700',
      };
    case 'pending':
      return {
        label: '待反馈',
        badgeClassName: 'bg-amber-100 text-amber-700',
      };
    default:
      return {
        label: '未开始',
        badgeClassName: 'bg-slate-100 text-slate-700',
      };
  }
}

export function getConversationInterventionStatusLabel(status: string | null | undefined) {
  switch (status) {
    case 'completed':
      return '已沟通';
    case 'in_progress':
      return '进行中';
    case 'pending':
      return '待执行';
    default:
      return '未建任务';
  }
}

export function getConversationInterventionFeedbackFallback(input: {
  status?: string | null;
  effect?: ReviewInterventionEffect | null;
  postInterventionRepeatCount?: number | null;
}) {
  if (input.effect === 'risk_persisting') {
    return `干预后又出现 ${input.postInterventionRepeatCount ?? 0} 次同类风险信号，需要继续跟进。`;
  }

  if (input.status === 'completed') {
    return '暂无家长反馈备注';
  }

  return '待执行，尚未填写家长反馈';
}

export function getParentMasteryInterventionTaskMeta(input: {
  riskType?: 'mastery_risk' | 'transfer_evidence_gap' | string | null;
  status?: string | null;
  effect?: ReviewInterventionEffect | null;
  completionNotes?: string | null;
  postInterventionRepeatCount?: number | null;
}) : ParentMasteryInterventionTaskMeta {
  const isTransferEvidenceGap = input.riskType === 'transfer_evidence_gap';
  const hasFeedbackNote = Boolean(input.completionNotes?.trim());
  const badgeLabel = isTransferEvidenceGap ? '迁移证据缺口' : '掌握风险补救';
  const badgeClassName = isTransferEvidenceGap ? 'border-amber-200 text-amber-700' : 'border-rose-200 text-rose-700';

  if (input.status === 'completed' && input.effect === 'risk_persisting') {
    return {
      title: isTransferEvidenceGap ? '补做后仍缺迁移证据' : '补救后风险仍在重复',
      summary: input.completionNotes
        ? `反馈备注: ${input.completionNotes}`
        : isTransferEvidenceGap
          ? '迁移证据补做已完成，但后续结果仍未形成独立迁移证据，说明还不能按真会关闭。'
          : `这条补救任务完成后又出现 ${input.postInterventionRepeatCount ?? 0} 次同类风险，建议回到家长洞察复盘到底卡在哪一步。`,
      badgeLabel,
      badgeClassName,
      actionLabel: '回到风险闭环',
      stateLabel: isTransferEvidenceGap ? '证据仍缺' : `${input.postInterventionRepeatCount ?? 0} 次复发`,
      stateClassName: 'bg-red-100 text-red-700',
    };
  }

  if (input.status === 'completed' && input.effect === 'risk_lowered') {
    return {
      title: isTransferEvidenceGap ? '补做后已形成迁移证据' : '补救后风险已下降',
      summary: input.completionNotes
        ? `反馈备注: ${input.completionNotes}`
        : isTransferEvidenceGap
          ? '迁移证据补做已完成，后续结果也开始出现独立迁移成功的记录，可以保留这套有效陪练动作。'
          : '补救任务已完成，且后续复习没有再出现同类高风险信号，可以保留这套有效陪练动作。',
      badgeLabel,
      badgeClassName,
      actionLabel: '查看对应闭环',
      stateLabel: isTransferEvidenceGap ? '已形成迁移证据' : '风险已下降',
      stateClassName: 'bg-emerald-100 text-emerald-700',
    };
  }

  if (input.status === 'completed') {
    return {
      title: '已完成，等待后续复习验证',
      summary: input.completionNotes
        ? `反馈备注: ${input.completionNotes}`
        : isTransferEvidenceGap
          ? '迁移证据补做已完成，但系统还没有看到足够的后续复习结果来判断是否真正形成独立迁移。'
          : '补救任务已完成，但系统还没有看到足够的后续复习结果来判断风险是否真正下降。',
      badgeLabel,
      badgeClassName,
      actionLabel: '查看后续复习',
      stateLabel: '待后续验证',
      stateClassName: 'bg-slate-100 text-slate-700',
    };
  }

  if (!hasFeedbackNote) {
    return {
      title: isTransferEvidenceGap ? '待补齐迁移证据并回填结果' : '待执行复习补救并回填结果',
      summary: isTransferEvidenceGap
        ? '这题当前不是普通做错，而是还缺独立迁移证据。先陪孩子补做变式，再把本次结果回填进系统。'
        : '这是由复习失败、假会或解释断层自动回流生成的家长补救任务，先按任务说明陪练，再补反馈备注。',
      badgeLabel,
      badgeClassName,
      actionLabel: isTransferEvidenceGap ? '查看迁移证据缺口' : '查看家长洞察',
      stateLabel: '待反馈',
      stateClassName: 'bg-amber-100 text-amber-700',
    };
  }

  return {
    title: '复习补救进行中',
    summary: `反馈备注: ${input.completionNotes}`,
    badgeLabel,
    badgeClassName,
    actionLabel: '继续查看闭环',
    stateLabel: '有反馈待跟进',
    stateClassName: 'bg-blue-100 text-blue-700',
  };
}
