# Socrates 进展记录 2026-04-27

## 主题

将“复习失败 / 复习补救后仍复发”的风险，正式并入现有 `guardian_signal` 主链路，而不是只停留在 `mastery_update` 通知层。

## 本次目标

- 不新增第二套家长风险系统。
- 继续复用现有聚合链路：
  - `review_attempts`
  - `parent_tasks`
  - `parent/insights`
  - `structured-rollup`
  - `notifications`
- 让家长端的总信号能更早反映：
  - 最近出现了需要家长介入的复习补救任务
  - 复习补救做完后风险仍在重复

## 已完成改动

### 1. 扩展 structured rollup 输入

文件：

- `apps/socrates/lib/error-loop/structured-rollup.ts`

新增可选输入：

- `pendingReviewInterventionCount`
- `reviewInterventionRiskPersistingCount`

说明：

- `guardian_signal` 现在不只看逾期复习、伪掌握、重复卡点，也会直接看“复习补救风险”。

### 2. 调整 guardian signal 分级规则

当前新增规则如下：

- 若 `reviewInterventionRiskPersistingCount > 0`，直接升为 `red`
  - 含义：家长已经做过补救动作，但风险仍重复，说明补救没有打到真正断点
- 若 `pendingReviewInterventionCount >= 2`，直接升为 `red`
  - 含义：同时存在多条复习补救待处理任务，已经不是单点问题
- 若 `pendingReviewInterventionCount > 0`，至少升为 `yellow`
  - 含义：最近复习判断已经暴露出明确风险，需要家长跟进

这样处理后，`review_attempt` 产生的风险，不会只体现在单条通知里，也会被拉进家长总览的主信号语义。

### 3. parent insights 正式接入新指标

文件：

- `apps/socrates/app/api/parent/insights/route.ts`

接入方式：

- 将已存在的：
  - `pendingReviewInterventionCount`
  - `reviewInterventionRiskPersistingCount`
- 传入 `buildStructuredOutcomeRollup(...)`

结果：

- 家长端总览页、家长任务入口、后续 `parent_signal` 通知生成，都会读取同一套升级后的 guardian signal。

## 本次不做的事

- 不新增独立 scheduler
- 不新增独立 parent signal history 表
- 不替换原有 `mastery_update`
- 不在本轮引入新的 review 专用 `parent_signal` 实时事件种类

说明：

- 本轮先保证“总信号语义”被修正，继续保持单链路收口。

## 验证结果

本地已通过：

- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`
- `pnpm.cmd --filter @socra/socrates build`

## 当前效果

现在家长侧风险感知分成两层：

- 事件层：
  - 仍由 `mastery_update` 告知某一次复习判断出了风险
- 总览层：
  - `guardian_signal` 会把复习补救待处理 / 补救后复发并入整体信号

这意味着：

- “复习失败”不再只是局部提醒
- 会直接抬升家长总览、家长任务、家长通知里的主风险语义

## 建议的下一步

下一块最自然的是补“即时性”：

- 在 `review/attempt` 风险产生时，考虑补一条同属 `parent_signal` 类型的事件级信号
- 这样可以避免必须等家长再次打开 `parent/insights`，才看到最新信号升级

当前状态：

- 本轮代码已可继续往下开发
- 无需回退到更早 checkpoint
