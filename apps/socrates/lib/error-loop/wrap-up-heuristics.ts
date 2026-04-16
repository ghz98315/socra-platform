import { isConfusionMessage } from '../chat/mock-response';
import { isLikelyWrapUpSignal } from '../chat/wrap-up-signal';
import type { RootCauseCategory, RootCauseSubtype } from './taxonomy';

export type WrapUpStatus = 'ongoing' | 'ready_to_wrap' | 'needs_more_clarification';

export type WrapUpHeuristicMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export function readLastUserMessage(messages: WrapUpHeuristicMessage[]) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages[userMessages.length - 1]?.content || '';
}

export function stripTranscript(content: string) {
  return content.replace(/\s+/g, ' ').trim();
}

export function isAnswerSeekingTranscript(content: string) {
  return /(?:直接告诉我答案|想看答案|给我答案|提示一下答案|别讲思路|直接说结果|不会做但想看答案)/u.test(
    content,
  );
}

export function detectRootCauseFromTranscript(transcript: string): {
  category: RootCauseCategory;
  subtype: RootCauseSubtype;
} {
  if (isAnswerSeekingTranscript(transcript)) {
    return { category: 'pseudo_mastery', subtype: 'prompt_dependency' };
  }

  if (/(?:看错|漏条件|没看到条件|审题|题目问什么|问的是啥|条件没用上)/u.test(transcript)) {
    return { category: 'problem_reading', subtype: 'missed_condition' };
  }

  if (/(?:负号|符号|算错|计算|乘除|加减|草稿|步骤跳了|列式错)/u.test(transcript)) {
    return { category: 'calculation_execution', subtype: 'sign_operation_slip' };
  }

  if (/(?:公式|定义|概念|定理|语法|单词|不会这个知识点|记不住)/u.test(transcript)) {
    return { category: 'knowledge_gap', subtype: 'definition_recall_unstable' };
  }

  if (/(?:不会下手|没思路|第一步怎么做|从哪开始|不知道怎么开始)/u.test(transcript)) {
    return { category: 'strategy_gap', subtype: 'no_entry_strategy' };
  }

  if (/(?:粗心|马虎|着急|没检查|忘记检查|检查一下|抢答)/u.test(transcript)) {
    return { category: 'habit_issue', subtype: 'verification_routine_missing' };
  }

  if (/(?:太难|紧张|慌|崩了|没耐心|静不下心)/u.test(transcript)) {
    return { category: 'attention_emotion', subtype: 'time_pressure_panic' };
  }

  return { category: 'strategy_gap', subtype: 'no_entry_strategy' };
}

export function showsIndependentReasoning(message: string) {
  const normalized = stripTranscript(message);

  if (!normalized || isConfusionMessage(normalized)) {
    return false;
  }

  const looksLikeAnswerSeeking = isAnswerSeekingTranscript(normalized);
  const hasReasoningCue =
    /(?:我觉得|我认为|因为|所以|先|然后|应该|答案是|我来试试|我来总结|下一步)/u.test(normalized);
  const hasMathChain =
    /[0-9a-zA-Z)\]]\s*=\s*[0-9a-zA-Z([\-]/.test(normalized) ||
    /[+\-*/×÷]\s*\d/.test(normalized);

  return !looksLikeAnswerSeeking && (hasReasoningCue || hasMathChain);
}

export function selectHeuristicRootCause(messages: WrapUpHeuristicMessage[]) {
  const transcript = stripTranscript(messages.map((message) => `${message.role}: ${message.content}`).join('\n'));
  const lastUserMessage = readLastUserMessage(messages);
  const hasEarlierConfusion = messages
    .filter((message) => message.role === 'user')
    .slice(0, -1)
    .some((message) => isConfusionMessage(message.content));
  let rootCause = detectRootCauseFromTranscript(transcript);

  if (
    rootCause.category === 'pseudo_mastery' &&
    rootCause.subtype === 'prompt_dependency' &&
    showsIndependentReasoning(lastUserMessage)
  ) {
    rootCause = hasEarlierConfusion
      ? { category: 'strategy_gap', subtype: 'no_entry_strategy' }
      : { category: 'calculation_execution', subtype: 'sign_operation_slip' };
  }

  return rootCause;
}

export function buildStatusFromMessages(messages: WrapUpHeuristicMessage[]): {
  status: WrapUpStatus;
  title: string;
  summary: string;
} {
  const userMessages = messages.filter((message) => message.role === 'user');
  const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';
  const confusionCount = userMessages.filter((message) => isConfusionMessage(message.content)).length;
  const hasWrapUpSignal = isLikelyWrapUpSignal(lastUserMessage);

  if (userMessages.length < 1) {
    return {
      status: 'ongoing',
      title: '建议再追一轮',
      summary: '当前对话轮次还偏少，先再追问一轮再决定是否收口更稳。',
    };
  }

  if (isConfusionMessage(lastUserMessage) || confusionCount >= 2) {
    return {
      status: 'needs_more_clarification',
      title: '更适合继续追问',
      summary: '学生还在明确表达卡住，建议先继续对话，不要急着收口。',
    };
  }

  if (hasWrapUpSignal) {
    return {
      status: 'ready_to_wrap',
      title: '这道题可以先收口了',
      summary: '当前对话已经积累了足够线索，可以先确认错因和难度并提交到错题库。',
    };
  }

  return {
    status: 'ongoing',
    title: '可以准备收口，但还不稳',
    summary: '已经有初步线索了，如果想更稳一点，可以再追问一轮再提交。',
  };
}
