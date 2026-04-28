import {
  ANALYSIS_MODE_LABELS,
  GUARDIAN_ERROR_TYPE_LABELS,
  STUCK_STAGE_LABELS,
  type AnalysisMode,
  type GuardianErrorType,
  type StuckStage,
} from '@/lib/error-loop/structured-outcome';

export type GuardianSignalLevel = 'green' | 'yellow' | 'red';

export type StructuredOutcomeLike = {
  guardian_error_type?: string | null;
  root_cause_summary?: string | null;
  guardian_root_cause_summary?: string | null;
  child_poka_yoke_action?: string | null;
  suggested_guardian_action?: string | null;
  false_error_gate?: boolean | null;
  analysis_mode?: string | null;
  stuck_stage?: string | null;
  created_at?: string | null;
};

export type StructuredBreakdownItem = {
  key: string;
  label: string;
  count: number;
};

export type StructuredTopBlocker = {
  key: string | null;
  label: string | null;
  count: number;
  root_cause_summary: string | null;
  child_poka_yoke_action: string | null;
  suggested_guardian_action: string | null;
  false_error_gate: boolean;
  analysis_mode: string | null;
  analysis_mode_label: string | null;
  stuck_stage: string | null;
  stuck_stage_label: string | null;
};

export type StructuredRollupResult = {
  guardian_signal: {
    level: GuardianSignalLevel;
    label: string;
    reason: string;
  };
  top_blocker: StructuredTopBlocker | null;
  focus_summary: string;
  guardian_error_type_breakdown: StructuredBreakdownItem[];
  stuck_stage_summary: StructuredBreakdownItem[];
  structured_diagnosis_count: number;
  false_error_gate_count: number;
  grade9_exam_count: number;
};

type StructuredRollupOptions = {
  pendingReviewCount?: number;
  overdueReviewCount?: number;
  pseudoMasteryCount?: number;
  highSeverityConversationAlertCount?: number;
  openErrorCount?: number;
  pendingReviewInterventionCount?: number;
  reviewInterventionRiskPersistingCount?: number;
};

type Bucket = {
  count: number;
  latestCreatedAt: number;
  latestRecord: StructuredOutcomeLike;
};

function normalizeText(value: string | null | undefined) {
  const text = String(value || '').trim();
  return text || null;
}

function getCreatedAtTime(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function compareBuckets(left: Bucket, right: Bucket) {
  if (right.count !== left.count) {
    return right.count - left.count;
  }

  return right.latestCreatedAt - left.latestCreatedAt;
}

function formatGuardianSignal(level: GuardianSignalLevel) {
  switch (level) {
    case 'red':
      return '红灯';
    case 'yellow':
      return '黄灯';
    default:
      return '绿灯';
  }
}

function resolveGuardianLabel(key: string) {
  if (key in GUARDIAN_ERROR_TYPE_LABELS) {
    return GUARDIAN_ERROR_TYPE_LABELS[key as GuardianErrorType];
  }

  return key;
}

function resolveStageLabel(key: string) {
  if (key in STUCK_STAGE_LABELS) {
    return STUCK_STAGE_LABELS[key as StuckStage];
  }

  return key;
}

function resolveModeLabel(key: string | null | undefined) {
  if (!key) {
    return null;
  }

  if (key in ANALYSIS_MODE_LABELS) {
    return ANALYSIS_MODE_LABELS[key as AnalysisMode];
  }

  return key;
}

function buildBreakdown(
  records: StructuredOutcomeLike[],
  getKey: (record: StructuredOutcomeLike) => string | null | undefined,
  getLabel: (key: string) => string,
) {
  const buckets = new Map<string, number>();

  records.forEach((record) => {
    const key = normalizeText(getKey(record));
    if (!key) {
      return;
    }

    buckets.set(key, (buckets.get(key) || 0) + 1);
  });

  return [...buckets.entries()]
    .map(([key, count]) => ({
      key,
      label: getLabel(key),
      count,
    }))
    .sort((left, right) => right.count - left.count);
}

function buildTopBlocker(records: StructuredOutcomeLike[]) {
  const buckets = new Map<string, Bucket>();

  records.forEach((record) => {
    const key = normalizeText(record.guardian_error_type) || '__unknown__';
    const createdAt = getCreatedAtTime(record.created_at);
    const current = buckets.get(key);

    if (!current) {
      buckets.set(key, {
        count: 1,
        latestCreatedAt: createdAt,
        latestRecord: record,
      });
      return;
    }

    current.count += 1;
    if (createdAt >= current.latestCreatedAt) {
      current.latestCreatedAt = createdAt;
      current.latestRecord = record;
    }
  });

  const topEntry = [...buckets.entries()].sort((left, right) => compareBuckets(left[1], right[1]))[0];
  if (!topEntry) {
    return null;
  }

  const [key, bucket] = topEntry;
  const latest = bucket.latestRecord;
  const rootCauseSummary = normalizeText(latest.root_cause_summary) || normalizeText(latest.guardian_root_cause_summary);
  const analysisMode = normalizeText(latest.analysis_mode);
  const stuckStage = normalizeText(latest.stuck_stage);

  return {
    key: key === '__unknown__' ? null : key,
    label: key === '__unknown__' ? '待补充诊断' : resolveGuardianLabel(key),
    count: bucket.count,
    root_cause_summary: rootCauseSummary,
    child_poka_yoke_action: normalizeText(latest.child_poka_yoke_action),
    suggested_guardian_action: normalizeText(latest.suggested_guardian_action),
    false_error_gate: latest.false_error_gate === true,
    analysis_mode: analysisMode,
    analysis_mode_label: resolveModeLabel(analysisMode),
    stuck_stage: stuckStage,
    stuck_stage_label: stuckStage ? resolveStageLabel(stuckStage) : null,
  } satisfies StructuredTopBlocker;
}

function buildFocusSummary(topBlocker: StructuredTopBlocker | null) {
  if (!topBlocker) {
    return '当前还没有形成稳定重复的结构化卡点，可以继续积累更多诊断样本。';
  }

  const parts = [
    topBlocker.label ? `最近最需要优先盯住的是“${topBlocker.label}”` : '最近已经出现可识别的重复卡点',
    topBlocker.count > 1 ? `最近重复出现 ${topBlocker.count} 次` : null,
    topBlocker.stuck_stage_label ? `主要卡在${topBlocker.stuck_stage_label}` : null,
  ].filter(Boolean);

  const action =
    topBlocker.suggested_guardian_action ||
    topBlocker.child_poka_yoke_action ||
    topBlocker.root_cause_summary ||
    '先聚焦单点卡住位置，再决定是否继续扩展训练。';

  return `${parts.join('，')}。当前建议：${action}`;
}

function buildGuardianSignal(
  topBlocker: StructuredTopBlocker | null,
  {
    pendingReviewCount = 0,
    overdueReviewCount = 0,
    pseudoMasteryCount = 0,
    highSeverityConversationAlertCount = 0,
    openErrorCount = 0,
    pendingReviewInterventionCount = 0,
    reviewInterventionRiskPersistingCount = 0,
  }: StructuredRollupOptions,
) {
  if (highSeverityConversationAlertCount > 0) {
    return {
      level: 'red' as const,
      label: formatGuardianSignal('red'),
      reason: '最近出现高风险对话信号，建议先稳情绪和沟通方式，再推进题目分析。',
    };
  }

  if (overdueReviewCount > 0) {
    return {
      level: 'red' as const,
      label: formatGuardianSignal('red'),
      reason: `当前有 ${overdueReviewCount} 条复习节点已经到期，说明闭环跟进压力已经偏高。`,
    };
  }

  if (reviewInterventionRiskPersistingCount > 0) {
    return {
      level: 'red' as const,
      label: formatGuardianSignal('red'),
      reason: `当前有 ${reviewInterventionRiskPersistingCount} 条复习补救完成后风险仍在重复，说明现有补救动作还没有真正打到断点。`,
    };
  }

  if (pseudoMasteryCount >= 2) {
    return {
      level: 'red' as const,
      label: formatGuardianSignal('red'),
      reason: `最近有 ${pseudoMasteryCount} 次“似懂非懂/假会”信号，需要先防止错误方法固化。`,
    };
  }

  if (topBlocker && topBlocker.count >= 3) {
    return {
      level: 'red' as const,
      label: formatGuardianSignal('red'),
      reason: `同类卡点最近重复出现 ${topBlocker.count} 次，已经不是偶发问题。`,
    };
  }

  if (pendingReviewInterventionCount >= 2) {
    return {
      level: 'red' as const,
      label: formatGuardianSignal('red'),
      reason: `当前有 ${pendingReviewInterventionCount} 条复习补救任务同时待处理，说明复习失败已经不是单点问题。`,
    };
  }

  if (pendingReviewInterventionCount > 0) {
    return {
      level: 'yellow' as const,
      label: formatGuardianSignal('yellow'),
      reason: `当前有 ${pendingReviewInterventionCount} 条复习补救任务待跟进，说明最近的复习判断已经暴露出具体风险。`,
    };
  }

  if (pendingReviewCount > 0) {
    return {
      level: 'yellow' as const,
      label: formatGuardianSignal('yellow'),
      reason: `还有 ${pendingReviewCount} 条复习/补救事项待继续跟进，建议先把当前闭环收紧。`,
    };
  }

  if (topBlocker && (topBlocker.count >= 2 || openErrorCount >= 3)) {
    return {
      level: 'yellow' as const,
      label: formatGuardianSignal('yellow'),
      reason: '已经形成比较明确的重复卡点，适合先集中盯一个问题，不要同时摊太多题。',
    };
  }

  if (topBlocker) {
    return {
      level: 'yellow' as const,
      label: formatGuardianSignal('yellow'),
      reason: '已经能看出当前主要卡点，继续围绕这一类题做小范围巩固即可。',
    };
  }

  return {
    level: 'green' as const,
    label: formatGuardianSignal('green'),
    reason: '暂时没有识别到明显重复卡点，当前可以维持已有学习节奏。',
  };
}

export function buildStructuredOutcomeRollup(
  inputRecords: StructuredOutcomeLike[],
  options: StructuredRollupOptions = {},
): StructuredRollupResult {
  const records = inputRecords.filter(
    (record) =>
      Boolean(
        normalizeText(record.guardian_error_type) ||
          normalizeText(record.root_cause_summary) ||
          normalizeText(record.guardian_root_cause_summary) ||
          normalizeText(record.child_poka_yoke_action),
      ),
  );

  const topBlocker = buildTopBlocker(records);
  const guardianSignal = buildGuardianSignal(topBlocker, options);

  return {
    guardian_signal: guardianSignal,
    top_blocker: topBlocker,
    focus_summary: buildFocusSummary(topBlocker),
    guardian_error_type_breakdown: buildBreakdown(records, (record) => record.guardian_error_type, resolveGuardianLabel),
    stuck_stage_summary: buildBreakdown(records, (record) => record.stuck_stage, resolveStageLabel),
    structured_diagnosis_count: records.length,
    false_error_gate_count: records.filter((record) => record.false_error_gate === true).length,
    grade9_exam_count: records.filter((record) => record.analysis_mode === 'grade9_exam').length,
  };
}
