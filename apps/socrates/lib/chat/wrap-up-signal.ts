import { isConfusionMessage } from './mock-response';

function normalizeWrapUpText(message: string) {
  return message.replace(/\s+/g, ' ').trim();
}

export function isLikelyWrapUpSignal(message: string): boolean {
  const normalized = normalizeWrapUpText(message);

  if (!normalized || isConfusionMessage(normalized)) {
    return false;
  }

  const hasStrongSummaryCue =
    /(?:我来总结|我的思路是|这题的思路是|这题应该先.+再.+|先.+再.+最后.+|因为.+所以.+|我会了|我懂了|我明白了|我已经会做了)/u.test(
      normalized,
    );
  const hasExplicitAnswerCue =
    /(?:答案(?:应该)?是|结果(?:应该)?是|我选[ABCD]|应该选[ABCD]|可得|推出|证明得|解得|所以得到)/u.test(
      normalized,
    );
  const hasEquationChain =
    /[0-9a-zA-Z)\]]\s*=\s*[0-9a-zA-Z([\-]/.test(normalized) ||
    /(?:≈|≠|≤|≥)/u.test(normalized) ||
    /(?:\d+\s*[+\-*/×÷]\s*\d)/u.test(normalized) ||
    /^[A-Da-d]\.?$/u.test(normalized) ||
    /^\d+(?:\.\d+)?$/u.test(normalized);

  return hasStrongSummaryCue || hasExplicitAnswerCue || hasEquationChain;
}

export function hasAssistantSummaryRequest(message: string): boolean {
  const normalized = normalizeWrapUpText(message);

  if (!normalized) {
    return false;
  }

  return /(?:用自己的话再说一遍|用自己的话总结|你来总结一下|你来复述一下|先把这题思路说一遍|先总结一下这题|你先总结本题)/u.test(
    normalized,
  );
}

export function hasAssistantWrapUpCue(message: string): boolean {
  const normalized = normalizeWrapUpText(message);

  if (!normalized) {
    return false;
  }

  return /(?:可以收口|可以结束本次对话|可以提交到错题库|确认错因和难度后提交|这题可以先结束|进入收口|提交到错题库后本轮结束)/u.test(
    normalized,
  );
}
