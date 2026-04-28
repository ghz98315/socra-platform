import { getMasteryJudgementMeta, type MasteryJudgement } from '@/lib/error-loop/review';

export type ParentSignalNotificationKind =
  | 'guardian_red'
  | 'guardian_signal_upgrade'
  | 'guardian_signal_recovery'
  | 'guardian_signal_yellow_persisting'
  | 'daily_checkin_stuck'
  | 'top_blocker_repeat'
  | 'review_failure_risk'
  | 'review_transfer_gap_risk';

export type ParentSignalLevel = 'green' | 'yellow' | 'red';
export type ParentDailyCheckinStatus = 'completed' | 'stuck' | 'unfinished';

export type ParentSignalNotificationData = {
  signal_kind: ParentSignalNotificationKind;
  signal_key: string;
  student_id: string;
  student_name: string | null;
  guardian_signal_level: ParentSignalLevel;
  guardian_signal_label: string;
  guardian_signal_reason: string;
  daily_checkin_status: ParentDailyCheckinStatus | null;
  daily_checkin_status_label: string | null;
  top_blocker_label: string | null;
  stuck_stage_label: string | null;
  suggested_parent_prompt: string | null;
  focus_summary: string;
  session_id?: string | null;
  review_id?: string | null;
  attempt_id?: string | null;
  mastery_judgement?: string | null;
  risk_type?: string | null;
  intervention_task_id?: string | null;
};

export type ParentSignalNotificationContext = {
  studentId: string;
  studentName: string | null;
  todayKey: string;
  guardianSignal: {
    level: ParentSignalLevel;
    label: string;
    reason: string;
  };
  dailyCheckinStatus: {
    status: ParentDailyCheckinStatus;
    status_label: string;
    stuck_stage_label: string | null;
    suggested_parent_prompt: string | null;
  } | null;
  topBlocker: {
    key: string | null;
    label: string | null;
    count: number;
    stuck_stage_label: string | null;
  } | null;
  suggestedParentPrompt: string;
  focusSummary: string;
};

export type ParentSignalNotificationDraft = {
  signalKey: string;
  title: string;
  content: string;
  actionUrl: string;
  actionText: string;
  priority: number;
  data: ParentSignalNotificationData;
};

export type ParentSignalNotificationBuildOptions = {
  previousGuardianSignalLevel?: ParentSignalLevel | null;
  recentGuardianSignalLevels?: ParentSignalLevel[];
};

export type ReviewAttemptParentSignalDraftInput = {
  studentId: string;
  studentName: string | null;
  sessionId: string;
  reviewId: string;
  attemptId: string;
  todayKey: string;
  judgement: MasteryJudgement;
  reason: 'mastery_risk' | 'transfer_evidence_gap';
  rootCauseLabel?: string | null;
  rootCauseStatement?: string | null;
  interventionTaskId?: string | null;
  notificationSummary?: string | null;
};

const SNAPSHOT_SIGNAL_KINDS: ParentSignalNotificationKind[] = [
  'guardian_red',
  'guardian_signal_upgrade',
  'guardian_signal_recovery',
  'guardian_signal_yellow_persisting',
  'daily_checkin_stuck',
  'top_blocker_repeat',
];

const SNAPSHOT_SIGNAL_KIND_SET = new Set<ParentSignalNotificationKind>(SNAPSHOT_SIGNAL_KINDS);

export function isParentSignalSnapshotKind(
  kind: ParentSignalNotificationKind | string | null | undefined,
): kind is ParentSignalNotificationKind {
  return typeof kind === 'string' && SNAPSHOT_SIGNAL_KIND_SET.has(kind as ParentSignalNotificationKind);
}

function formatGuardianSignal(level: ParentSignalLevel) {
  switch (level) {
    case 'red':
      return '红灯';
    case 'yellow':
      return '黄灯';
    default:
      return '绿灯';
  }
}

function buildBaseData(
  context: ParentSignalNotificationContext,
  kind: ParentSignalNotificationKind,
  signalKey: string,
): ParentSignalNotificationData {
  return {
    signal_kind: kind,
    signal_key: signalKey,
    student_id: context.studentId,
    student_name: context.studentName,
    guardian_signal_level: context.guardianSignal.level,
    guardian_signal_label: context.guardianSignal.label,
    guardian_signal_reason: context.guardianSignal.reason,
    daily_checkin_status: context.dailyCheckinStatus?.status || null,
    daily_checkin_status_label: context.dailyCheckinStatus?.status_label || null,
    top_blocker_label: context.topBlocker?.label || null,
    stuck_stage_label:
      context.dailyCheckinStatus?.stuck_stage_label || context.topBlocker?.stuck_stage_label || null,
    suggested_parent_prompt:
      context.dailyCheckinStatus?.suggested_parent_prompt || context.suggestedParentPrompt,
    focus_summary: context.focusSummary,
  };
}

export function buildParentSignalNotificationDrafts(
  context: ParentSignalNotificationContext,
  options: ParentSignalNotificationBuildOptions = {},
): ParentSignalNotificationDraft[] {
  const drafts: ParentSignalNotificationDraft[] = [];
  const studentName = context.studentName || '孩子';
  const controlsUrl = `/controls?student_id=${context.studentId}`;
  const tasksUrl = `/tasks?child_id=${context.studentId}`;
  const topBlockerLabel = context.topBlocker?.label || '当前卡点';
  const topBlockerKey = context.topBlocker?.key || topBlockerLabel;
  const stuckStageLabel =
    context.dailyCheckinStatus?.stuck_stage_label || context.topBlocker?.stuck_stage_label || null;
  const previousGuardianSignalLevel = options.previousGuardianSignalLevel || null;
  const trailingYellowSnapshots =
    context.guardianSignal.level === 'yellow'
      ? 1 + (options.recentGuardianSignalLevels || []).filter((level) => level === 'yellow').length
      : 0;

  if (context.guardianSignal.level === 'red' && previousGuardianSignalLevel && previousGuardianSignalLevel !== 'red') {
    const signalKey = [
      'guardian_signal_upgrade',
      context.studentId,
      context.todayKey,
      previousGuardianSignalLevel,
      'red',
      topBlockerKey,
    ].join(':');

    drafts.push({
      signalKey,
      title: `${studentName} 的家长信号升级为红灯`,
      content: `${context.guardianSignal.reason}${stuckStageLabel ? ` 当前卡在${stuckStageLabel}。` : '。'}${context.focusSummary}`,
      actionUrl: controlsUrl,
      actionText: '查看陪学建议',
      priority: 95,
      data: buildBaseData(context, 'guardian_signal_upgrade', signalKey),
    });
  }

  if (previousGuardianSignalLevel === 'red' && context.guardianSignal.level !== 'red') {
    const signalKey = [
      'guardian_signal_recovery',
      context.studentId,
      context.todayKey,
      'red',
      context.guardianSignal.level,
      topBlockerKey,
    ].join(':');

    drafts.push({
      signalKey,
      title: `${studentName} 的家长信号已从红灯回落`,
      content: `当前状态为${context.guardianSignal.label}。${context.guardianSignal.reason}`,
      actionUrl: controlsUrl,
      actionText: '查看最新状态',
      priority: 65,
      data: buildBaseData(context, 'guardian_signal_recovery', signalKey),
    });
  }

  if (context.guardianSignal.level === 'yellow' && trailingYellowSnapshots >= 3) {
    const signalKey = ['guardian_signal_yellow_persisting', context.studentId, context.todayKey, topBlockerKey].join(':');

    drafts.push({
      signalKey,
      title: `${studentName} 连续黄灯仍未回落`,
      content: `最近连续 ${trailingYellowSnapshots} 次信号快照仍为黄灯。${context.guardianSignal.reason}${stuckStageLabel ? ` 当前卡在${stuckStageLabel}。` : ''}`,
      actionUrl: controlsUrl,
      actionText: '查看黄灯原因',
      priority: 75,
      data: buildBaseData(context, 'guardian_signal_yellow_persisting', signalKey),
    });
  }

  if (context.guardianSignal.level === 'red') {
    const signalKey = [
      'guardian_red',
      context.studentId,
      context.todayKey,
      topBlockerKey,
      stuckStageLabel || 'none',
    ].join(':');

    drafts.push({
      signalKey,
      title: `${studentName} 进入红灯陪学状态`,
      content: `${context.guardianSignal.reason}${stuckStageLabel ? ` 当前卡在${stuckStageLabel}。` : '。'}${context.focusSummary}`,
      actionUrl: controlsUrl,
      actionText: '立即查看陪学建议',
      priority: 90,
      data: buildBaseData(context, 'guardian_red', signalKey),
    });
  }

  if (context.dailyCheckinStatus?.status === 'stuck') {
    const signalKey = ['daily_checkin_stuck', context.studentId, context.todayKey, topBlockerKey].join(':');

    drafts.push({
      signalKey,
      title: `${studentName} 今日 check-in 显示卡住`,
      content: `${context.dailyCheckinStatus.status_label}，${topBlockerLabel}${stuckStageLabel ? `，卡在${stuckStageLabel}` : ''}。${context.dailyCheckinStatus.suggested_parent_prompt || context.suggestedParentPrompt}`,
      actionUrl: tasksUrl,
      actionText: '查看今日任务',
      priority: 80,
      data: buildBaseData(context, 'daily_checkin_stuck', signalKey),
    });
  }

  if ((context.topBlocker?.count || 0) >= 3) {
    const signalKey = ['top_blocker_repeat', context.studentId, context.todayKey, topBlockerKey].join(':');

    drafts.push({
      signalKey,
      title: `${studentName} 同类卡点重复出现`,
      content: `${topBlockerLabel} 最近重复出现 ${context.topBlocker?.count || 0} 次${stuckStageLabel ? `，主要卡在${stuckStageLabel}` : ''}。建议优先处理这个问题。`,
      actionUrl: controlsUrl,
      actionText: '查看重复卡点',
      priority: 70,
      data: buildBaseData(context, 'top_blocker_repeat', signalKey),
    });
  }

  return drafts;
}

function buildReviewReasonCopy(input: {
  judgement: MasteryJudgement;
  reason: 'mastery_risk' | 'transfer_evidence_gap';
}) {
  if (input.reason === 'transfer_evidence_gap') {
    return {
      kind: 'review_transfer_gap_risk' as const,
      level: 'yellow' as const,
      priority: 82,
      reason: '这次复习还没有补齐迁移证据，暂时不能视为稳定掌握。',
      suggestedPrompt: '先别急着判断已经会了，先让孩子讲清通用方法，再换一道变式题独立做一遍。',
    };
  }

  switch (input.judgement) {
    case 'not_mastered':
      return {
        kind: 'review_failure_risk' as const,
        level: 'red' as const,
        priority: 92,
        reason: '这次复习仍未能独立做对，说明原卡点还没有解除。',
        suggestedPrompt: '先别继续加题，先追问孩子到底是题意没看懂、步骤断了，还是方法没有建立起来。',
      };
    case 'pseudo_mastery':
      return {
        kind: 'review_failure_risk' as const,
        level: 'red' as const,
        priority: 90,
        reason: '这次复习出现“原题会、变式不会”，存在明显假会风险。',
        suggestedPrompt: '先让孩子说出通用判断标准，再用一题变式验证是不是真的会迁移。',
      };
    case 'explanation_gap':
      return {
        kind: 'review_failure_risk' as const,
        level: 'yellow' as const,
        priority: 80,
        reason: '这次复习虽然能做出结果，但讲不清依据，理解还停留在表层。',
        suggestedPrompt: '先别只看答案对不对，让孩子用自己的话复述为什么这么做，再判断是否过关。',
      };
    case 'assisted_correct':
      return {
        kind: 'review_failure_risk' as const,
        level: 'yellow' as const,
        priority: 78,
        reason: '这次复习虽然做对了，但仍依赖提示，暂时不能算真正掌握。',
        suggestedPrompt: '下一轮先让孩子独立尝试 2 分钟，再决定是否提示，避免把“扶着做对”误判成掌握。',
      };
    default:
      return null;
  }
}

export function buildReviewAttemptParentSignalDraft(
  input: ReviewAttemptParentSignalDraftInput,
): ParentSignalNotificationDraft | null {
  const reasonCopy = buildReviewReasonCopy({
    judgement: input.judgement,
    reason: input.reason,
  });
  if (!reasonCopy) {
    return null;
  }

  const judgementMeta = getMasteryJudgementMeta(input.judgement);
  const studentName = input.studentName || '孩子';
  const blockerLabel = input.rootCauseLabel || judgementMeta?.label || '当前复习风险';
  const detail = input.rootCauseStatement ? `稳定暴露点：${input.rootCauseStatement}` : null;
  const summary = input.notificationSummary?.trim() || reasonCopy.reason;
  const signalKey = [
    reasonCopy.kind,
    input.studentId,
    input.todayKey,
    input.reviewId,
    input.attemptId,
    input.reason,
    input.judgement,
  ].join(':');
  const guardianSignalLabel = formatGuardianSignal(reasonCopy.level);
  const actionUrl = `/controls?focus=review&student_id=${input.studentId}&session_id=${input.sessionId}`;
  const contentParts = [summary, detail, reasonCopy.suggestedPrompt].filter(Boolean);

  return {
    signalKey,
    title:
      input.reason === 'transfer_evidence_gap'
        ? `${studentName} 当前复习仍缺迁移证据`
        : `${studentName} 本次复习触发家长风险信号`,
    content: contentParts.join(' '),
    actionUrl,
    actionText: '查看复习风险',
    priority: reasonCopy.priority,
    data: {
      signal_kind: reasonCopy.kind,
      signal_key: signalKey,
      student_id: input.studentId,
      student_name: input.studentName,
      guardian_signal_level: reasonCopy.level,
      guardian_signal_label: guardianSignalLabel,
      guardian_signal_reason: reasonCopy.reason,
      daily_checkin_status: null,
      daily_checkin_status_label: null,
      top_blocker_label: blockerLabel,
      stuck_stage_label: null,
      suggested_parent_prompt: reasonCopy.suggestedPrompt,
      focus_summary: summary,
      session_id: input.sessionId,
      review_id: input.reviewId,
      attempt_id: input.attemptId,
      mastery_judgement: input.judgement,
      risk_type: input.reason,
      intervention_task_id: input.interventionTaskId || null,
    },
  };
}
