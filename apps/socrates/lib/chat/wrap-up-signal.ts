import { isConfusionMessage } from './mock-response';

export function isLikelyWrapUpSignal(message: string): boolean {
  const normalized = message.trim();

  if (!normalized || isConfusionMessage(normalized)) {
    return false;
  }

  return /我觉得|我认为|应该是|所以|因此|因为|先.*再|然后|最后|我的思路|我来总结|我会了|我懂了|我明白了|下一步|答案是|结果是|我选|应该选|可以设|可得|推出|证明|解得|等于|=|≈|\d+\s*$/.test(
    normalized,
  );
}
