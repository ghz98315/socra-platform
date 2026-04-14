# Socrates 首轮 Prompt Scaffold 收紧

- 日期：2026-04-14
- 状态：implemented
- 范围：只收紧主对话首轮 prompt scaffold，不改 OCR / geometry parse prompt

## 本轮目标

- 继续推进新阶段里的 prompt 待确认项
- 不重开几何链路
- 不重写整套 prompt 文本
- 只把首轮 system prompt 再压短一层，让首轮回复更像轻诊断，而不是长说明

## 本轮改动

代码位置：

- `apps/socrates/lib/prompts/builder.ts`

本轮实现：

1. 新增 `buildFirstTurnFocus(options)`
2. 首轮对话不再继续拼完整的：
   - grade routing base
   - generic strategies
   - full subject strategy
3. 首轮改为使用一个更轻的 `first_turn_focus` 层
4. 这个轻量层按学科给出首轮优先动作：
   - 数学：先看已知 / 目标 / 搭桥关系
   - 几何数学：先看点线角和已知关系
   - 语文：先回题干任务、关键词、原文定位
   - 英语：先看局部语境、句子结构、题型
   - generic：先确认已知、目标、当前卡点

## 这样做的原因

- 当前主链 prompt 已经做过一轮收口，不需要再从零重写
- 但首轮 prompt 仍然容易携带过重的说明层
- 首轮真正需要的是：
  - 快速判断卡点
  - 抓一个最小锚点
  - 只问一个可执行问题

## 边界

本轮刻意不做：

- `apps/socrates/app/api/geometry/route.ts`
- `apps/socrates/app/api/ocr/route.ts`
- 学科长策略文本整体重写
- 新功能扩张

## 预期效果

- 首轮 system prompt 更短
- 首轮回复更偏轻诊断
- 首轮更不容易并列多个方法或提前给完整解题计划
- 后续轮次仍保留原有完整策略层

## 验证

- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`
- 结果：passed

离线 prompt 生成验证：

- 首轮 `math` 样例：
  - `HAS_FIRST_TURN_FOCUS=true`
  - `HAS_KNOWLEDGE=false`
  - `HAS_FEWSHOT=false`
- 首轮 `geometry math` 样例：
  - `HAS_FIRST_TURN_FOCUS=true`
  - `HAS_KNOWLEDGE=false`
  - `HAS_FEWSHOT=false`
- 首轮 `english reading` 样例：
  - `HAS_FIRST_TURN_FOCUS=true`
  - `HAS_KNOWLEDGE=false`
  - `HAS_FEWSHOT=false`
- 非首轮 `math` 样例：
  - `HAS_FIRST_TURN_FOCUS=false`
  - `HAS_KNOWLEDGE=true`
  - `HAS_FEWSHOT=true`

本机 runtime 验证阻塞：

- `pnpm.cmd socrates:start:dev-local` 未成功进入健康态
- 最新本地启动错误日志显示：Windows `next dev` 路径触发 `spawn EPERM`
- 因此本轮未做真实本地 `/api/chat` 在线回归，改用离线 `buildSystemPrompt(...)` 生成验证

## 当前结论

这轮属于新阶段里的 `P2` 最小实现：继续收紧 prompt 主链首轮行为，同时保持几何基线冻结，不把 OCR / geometry parse 重新混进来。
