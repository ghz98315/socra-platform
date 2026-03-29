export function getParentTransferGapInsightCopy(input: {
  openErrorsCount: number;
  missingTransferEvidenceCount: number;
  transferGapRate: number;
}) {
  const { openErrorsCount, missingTransferEvidenceCount, transferGapRate } = input;

  if (openErrorsCount === 0) {
    return {
      label: '暂无迁移缺口',
      summary: '当前没有开放中的错题需要补迁移证据。',
      actionTitle: null,
      actionSummary: null,
      driverLabel: '迁移证据缺口',
      driverValue: '0 题 / 0%',
    };
  }

  return {
    label:
      transferGapRate >= 60
        ? '迁移证据缺口偏高'
        : transferGapRate >= 30
          ? '迁移证据仍需补齐'
          : '迁移证据相对稳定',
    summary: `${openErrorsCount} 道开放题里有 ${missingTransferEvidenceCount} 道还缺独立迁移证据，占比 ${transferGapRate}%。不要只看原题会不会，要专门看换题后能不能独立做对。`,
    actionTitle: '优先补齐迁移证据',
    actionSummary: `当前还有 ${missingTransferEvidenceCount} 道开放中的题缺少独立迁移证据。家长陪练时不要只问“原题会不会”，要专门检查孩子离开原题后能不能不靠提示换题也做对。`,
    driverLabel: '迁移证据缺口',
    driverValue: `${missingTransferEvidenceCount} 题 / ${transferGapRate}%`,
  };
}

export function getParentMasteryBalanceCopy(input: {
  masterySignalTotal: number;
  masteredClosedCount: number;
  provisionalMasteredCount: number;
  pseudoMasteryCount: number;
}) {
  const {
    masterySignalTotal,
    masteredClosedCount,
    provisionalMasteredCount,
    pseudoMasteryCount,
  } = input;

  return {
    label:
      masterySignalTotal === 0
        ? '暂无足够样本'
        : pseudoMasteryCount > masteredClosedCount
          ? '假会信号高于真掌握'
          : masteredClosedCount > pseudoMasteryCount
            ? '真掌握多于假会'
            : '真掌握与假会接近',
    summary:
      masterySignalTotal === 0
        ? '等孩子完成更多复习判定后，再看真掌握和假会的比例。'
        : `当前稳定掌握 ${masteredClosedCount} 个，假会信号 ${pseudoMasteryCount} 次，暂时掌握 ${provisionalMasteredCount} 个。家长陪练时要优先把“做对但不稳定”的题拉出来继续验证。`,
  };
}

export function getParentOverdueReviewActionCopy(input: {
  overdueReviewCount: number;
}) {
  const { overdueReviewCount } = input;
  if (overdueReviewCount <= 0) {
    return null;
  }

  return {
    title: '先清掉到期复习',
    summary: `当前有 ${overdueReviewCount} 个复习点已到期，建议优先处理这些题，避免错误记忆继续固化。`,
    driverLabel: '到期复习压力',
    driverValue: `${overdueReviewCount} 个到期`,
  };
}

export function getParentPseudoMasteryActionCopy(input: {
  pseudoMasteryCount: number;
  pseudoMasteryRate: number;
}) {
  const { pseudoMasteryCount, pseudoMasteryRate } = input;
  if (pseudoMasteryCount <= 0) {
    return null;
  }

  return {
    title: '专项盯“假会”',
    summary: `最近共有 ${pseudoMasteryCount} 次假会信号。原题做对不代表真的会，家长陪练时要加一道变式题和一次讲解复述。`,
    driverLabel: '假会信号',
    driverValue: `${pseudoMasteryCount} 次 / ${pseudoMasteryRate}%`,
  };
}

export function getParentSurfaceReflectionActionCopy(input: {
  surfaceOnlyReflectionCount: number;
}) {
  const { surfaceOnlyReflectionCount } = input;
  if (surfaceOnlyReflectionCount <= 0) {
    return null;
  }

  return {
    title: '继续追问表面归因',
    summary: `当前还有 ${surfaceOnlyReflectionCount} 道题的学生反思仍停留在表层描述。家长先不要急着讲解，优先追到“具体哪一步断了、背后是什么稳定模式、下次先做什么”。`,
    driverLabel: '表面归因',
    driverValue: `${surfaceOnlyReflectionCount} 题待追深`,
  };
}

export function getParentRecentRiskTitle(input: {
  masteryJudgement?: string | null;
  isOverdue?: boolean;
  reopenedCount?: number;
  hasPendingClosureLabels?: boolean;
  hasSurfaceReflectionRisk?: boolean;
}) {
  if (input.hasPendingClosureLabels) {
    return '待关门验证';
  }

  if (input.hasSurfaceReflectionRisk) {
    return '根因仍偏表面';
  }

  if (input.masteryJudgement === 'pseudo_mastery') {
    return '假会风险';
  }

  if (input.masteryJudgement === 'not_mastered') {
    return '复习未过';
  }

  if (input.isOverdue) {
    return '复习已到期';
  }

  if ((input.reopenedCount ?? 0) > 0) {
    return '重复复开';
  }

  return '需要关注';
}

export function getParentReviewInterventionFocusCopy(input: {
  reviewInterventionRiskPersistingCount: number;
  pendingReviewInterventionCount: number;
  pendingReviewInterventionWithoutFeedbackCount: number;
  overdueReviewCount: number;
}) {
  const {
    reviewInterventionRiskPersistingCount,
    pendingReviewInterventionCount,
    pendingReviewInterventionWithoutFeedbackCount,
    overdueReviewCount,
  } = input;

  if (reviewInterventionRiskPersistingCount > 0) {
    return {
      label: '先复盘失效补救',
      summary: `当前有 ${reviewInterventionRiskPersistingCount} 条复习补救任务完成后风险仍在重复，说明原补救动作还没有打到真正断点，先复盘哪一步依旧断、哪类变式仍会失手。`,
      value: reviewInterventionRiskPersistingCount,
      valueLabel: '补救后仍重复',
    };
  }

  if (pendingReviewInterventionCount > 0) {
    return {
      label: '先处理复习补救任务',
      summary:
        pendingReviewInterventionWithoutFeedbackCount > 0
          ? `当前还有 ${pendingReviewInterventionCount} 条复习补救任务待完成，其中 ${pendingReviewInterventionWithoutFeedbackCount} 条还没有家长反馈记录。`
          : `当前还有 ${pendingReviewInterventionCount} 条复习补救任务待完成，这些任务直接对应孩子最近的假会、未掌握或讲不清风险。`,
      value: pendingReviewInterventionCount,
      valueLabel: '待处理复习补救任务',
    };
  }

  if (overdueReviewCount > 0) {
    return {
      label: '先清到期复习',
      summary: `当前有 ${overdueReviewCount} 个复习点已到期，先把这些题处理掉，避免错误记忆继续固化。`,
      value: overdueReviewCount,
      valueLabel: '到期复习点',
    };
  }

  return {
    label: '当前复习任务可控',
    summary: '当前没有明显积压的复习补救任务，可以继续按节奏处理高热错因。',
    value: 0,
    valueLabel: '当前无积压',
  };
}

export function getParentReviewInterventionPersistingActionCopy(input: {
  reviewInterventionRiskPersistingCount: number;
}) {
  const { reviewInterventionRiskPersistingCount } = input;
  if (reviewInterventionRiskPersistingCount <= 0) {
    return null;
  }

  return {
    title: '先复盘仍在重复的补救任务',
    summary: `已有 ${reviewInterventionRiskPersistingCount} 条复习补救任务完成后风险仍在重复，说明当前陪练动作可能没有打到根因。先回看孩子究竟卡在题意、步骤、讲解还是迁移变式。`,
    driverLabel: '补救后风险仍持续',
    driverValue: `${reviewInterventionRiskPersistingCount} 条仍重复`,
  };
}

export function getParentReviewInterventionPendingActionCopy(input: {
  pendingReviewInterventionCount: number;
  pendingReviewInterventionWithoutFeedbackCount: number;
}) {
  const {
    pendingReviewInterventionCount,
    pendingReviewInterventionWithoutFeedbackCount,
  } = input;
  if (pendingReviewInterventionCount <= 0) {
    return null;
  }

  return {
    title: '优先处理复习补救任务',
    summary:
      pendingReviewInterventionWithoutFeedbackCount > 0
        ? `当前还有 ${pendingReviewInterventionCount} 条复习补救任务待完成，其中 ${pendingReviewInterventionWithoutFeedbackCount} 条还没有家长反馈记录。先完成任务，再把本次陪练结果回填进系统。`
        : `当前还有 ${pendingReviewInterventionCount} 条复习补救任务待完成，这些任务直接对应孩子最近的假会、未掌握或讲不清风险。`,
    driverLabel: '复习补救积压',
    driverValue: `${pendingReviewInterventionCount} 条待处理`,
  };
}

export function getParentReviewInterventionLoweredActionCopy(input: {
  reviewInterventionRiskLoweredCount: number;
}) {
  const { reviewInterventionRiskLoweredCount } = input;
  if (reviewInterventionRiskLoweredCount <= 0) {
    return null;
  }

  return {
    title: '保留已经有效的补救动作',
    summary: `已有 ${reviewInterventionRiskLoweredCount} 条复习补救任务在完成后风险下降，建议保留这些有效动作，复用到同类题型上。`,
    driverLabel: '补救后风险下降',
    driverValue: `${reviewInterventionRiskLoweredCount} 条已降低`,
  };
}
