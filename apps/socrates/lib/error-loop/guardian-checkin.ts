import {
  STUCK_STAGE_LABELS,
  type StuckStage,
} from '@/lib/error-loop/structured-outcome';

export type DailyCheckinStatus = 'completed' | 'stuck' | 'unfinished';
export type GuardianSignalLevel = 'green' | 'yellow' | 'red';

export type CheckinPromptContext = {
  status: DailyCheckinStatus;
  topBlockerLabel?: string | null;
  stuckStage?: string | null;
  childPokaYokeAction?: string | null;
  suggestedGuardianAction?: string | null;
  falseErrorGate?: boolean;
};

export const DAILY_CHECKIN_STATUS_LABELS: Record<DailyCheckinStatus, string> = {
  completed: '已完成',
  stuck: '卡住了',
  unfinished: '未完成',
};

export const GUARDIAN_SIGNAL_LABELS: Record<GuardianSignalLevel, string> = {
  green: '绿灯',
  yellow: '黄灯',
  red: '红灯',
};

export function getShanghaiDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function resolveStuckStagePrompt(stage?: string | null) {
  const normalizedStage = String(stage || '').trim() as StuckStage | '';

  switch (normalizedStage) {
    case 'read_question':
      return '先让孩子复述题目条件和所求，不要立刻讲整题，先确认是不是题意没读准。';
    case 'find_entry':
      return '先只追问第一步准备从哪里下手，不要要求一次把整道题都讲完整。';
    case 'connect_reasoning':
      return '先问这一步和前面知识点的关系是什么，帮助孩子把零散知识连成推理链。';
    case 'stabilize_execution':
      return '先盯过程动作，比如列式、符号、单位和验算，不要只提醒“再细心一点”。';
    case 'summarize_method':
      return '先让孩子用自己的话复述这题的方法和防呆动作，再决定是否进入下一题。';
    default:
      return '先让孩子说清现在卡在哪一步，再决定是继续追问还是回到例题。';
  }
}

export function buildSuggestedParentPrompt(context: CheckinPromptContext) {
  const topBlocker = String(context.topBlockerLabel || '').trim();
  const childAction = String(context.childPokaYokeAction || '').trim();
  const guardianAction = String(context.suggestedGuardianAction || '').trim();

  if (context.status === 'completed') {
    if (childAction) {
      return `今天已完成，收口时让孩子再复述一次“${childAction}”，避免只是做对但没有真正记住。`;
    }

    return '今天已完成，收口时先让孩子复述这题最关键的一步，再结束这轮陪练。';
  }

  if (context.falseErrorGate) {
    return '先让孩子闭卷重做一遍，只检查起手、条件和符号，不要马上进入长讲解。';
  }

  if (context.status === 'unfinished') {
    if (guardianAction) {
      return `今天还没做完，下一轮优先围绕“${topBlocker || '当前卡点'}”继续：${guardianAction}`;
    }

    return `今天还没做完，下一轮优先继续处理“${topBlocker || '当前卡点'}”，不要扩展到太多新题。`;
  }

  if (guardianAction) {
    return guardianAction;
  }

  const stagePrompt = resolveStuckStagePrompt(context.stuckStage);
  if (topBlocker) {
    return `当前主要卡在“${topBlocker}”。${stagePrompt}`;
  }

  return stagePrompt;
}

export function buildDailyCheckinSummary({
  status,
  topBlockerLabel,
  guardianSignal,
}: {
  status: DailyCheckinStatus;
  topBlockerLabel?: string | null;
  guardianSignal?: GuardianSignalLevel | null;
}) {
  const statusLabel = DAILY_CHECKIN_STATUS_LABELS[status];
  const signalLabel = guardianSignal ? GUARDIAN_SIGNAL_LABELS[guardianSignal] : null;

  if (status === 'completed') {
    return signalLabel
      ? `今天已标记为${statusLabel}，当前整体状态为${signalLabel}。`
      : `今天已标记为${statusLabel}。`;
  }

  if (topBlockerLabel) {
    return signalLabel
      ? `今天已标记为${statusLabel}，当前最需要继续盯的是“${topBlockerLabel}”，整体状态为${signalLabel}。`
      : `今天已标记为${statusLabel}，当前最需要继续盯的是“${topBlockerLabel}”。`;
  }

  return signalLabel
    ? `今天已标记为${statusLabel}，当前整体状态为${signalLabel}。`
    : `今天已标记为${statusLabel}。`;
}

export function resolveStuckStageLabel(stage?: string | null) {
  if (!stage) {
    return null;
  }

  return STUCK_STAGE_LABELS[stage as StuckStage] || stage;
}
