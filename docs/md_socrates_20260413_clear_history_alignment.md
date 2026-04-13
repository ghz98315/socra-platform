# Socrates Clear-History 主链对齐
Date: 2026-04-13
Status: implemented

## 本轮目标

- 让 `clear-history` 初始化的新会话与主聊天链使用同一套 system prompt 构建逻辑。
- 避免主链 prompt 已更新，但清空会话后又回到旧提示词的问题。
- 顺手修正本地内存会话存储双轨问题，避免 `chat` 与 `clear-history` 各自维护不同的 Map。

## 已完成内容

### 1. clear-history 改为复用主链 prompt builder

- 删除了 `apps/socrates/app/api/chat/clear-history/route.ts` 里独立维护的旧 `getSystemPrompt(...)`
- 改为直接调用：
  - `buildSystemPrompt(...)`

现在 `clear-history` 初始化新会话时，会和主 `chat` 路由遵守同一套规则，包括：

- 轻诊断优先
- 一次只推进一小步
- 连续“看不懂”时的回退逻辑
- 学生总结要求
- 学科差异化引导

### 2. chat / clear-history 共用同一份内存会话存储

新增共享模块：

- `apps/socrates/lib/chat/conversation-history.ts`

并让以下两个路由都改为使用同一份 store：

- `apps/socrates/app/api/chat/route.ts`
- `apps/socrates/app/api/chat/clear-history/route.ts`

这修正了之前的潜在漂移：

- `chat` 路由原来使用模块内 `Map`
- `clear-history` 路由原来使用 `globalThis.conversationHistory`

两者并不保证共享同一份会话数据。

## 本轮收益

- 清空会话后重新开始，不会掉回旧 prompt 风格。
- 连续“看不懂”的新逻辑在 clear-history 重建后仍然有效。
- 主链 prompt 后续继续迭代时，不需要再手动同步另一套 clear-history prompt。
- 本地内存会话行为更一致，减少“明明清空了但对话状态不一致”的隐患。

## 触达文件

- `apps/socrates/app/api/chat/clear-history/route.ts`
- `apps/socrates/app/api/chat/route.ts`
- `apps/socrates/lib/chat/conversation-history.ts`

## 验证

- Command:
  - `pnpm.cmd -C "D:\github\Socrates_ analysis\socra-platform" --filter @socra/socrates exec tsc --noEmit`
- Result:
  - passed

## 建议回归点

- 先发起一轮对话，再执行 clear-history，再重新开始。
- 确认新会话首轮仍然是当前主链风格，而不是旧版长 prompt 风格。
- 确认清空后同一 session 不会残留旧轮次回答路径。
