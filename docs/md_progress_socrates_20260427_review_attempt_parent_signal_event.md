# Socrates 进展记录 2026-04-27

## 主题

把 `review/attempt` 的复习风险在事件发生当下接入统一的 `parent_signal` 通知链，同时避免这类事件通知污染原有“按天快照型”家长信号历史。

## 本次完成

### 1. review attempt 现在会即时生成 parent_signal

文件：

- `apps/socrates/app/api/review/attempt/route.ts`

新增逻辑：

- 在原有 `mastery_update` 之外，复习判定命中以下风险时，会同步生成 `parent_signal`
  - `not_mastered`
  - `assisted_correct`
  - `explanation_gap`
  - `pseudo_mastery`
  - `transfer_evidence_gap`

设计说明：

- `mastery_update` 继续保留，负责“掌握度风险事件”
- `parent_signal` 新增事件级信号，负责“统一家长风险入口”

这样家长不必等再次打开 `parent/insights`，也能先收到统一信号提醒。

### 2. 新增事件级 parent signal 草稿构建器

文件：

- `apps/socrates/lib/notifications/parent-signal.ts`

新增能力：

- `buildReviewAttemptParentSignalDraft(...)`

新增信号种类：

- `review_failure_risk`
- `review_transfer_gap_risk`

当前分级：

- `not_mastered` -> `red`
- `pseudo_mastery` -> `red`
- `explanation_gap` -> `yellow`
- `assisted_correct` -> `yellow`
- `transfer_evidence_gap` -> `yellow`

同时补充了通知数据字段：

- `session_id`
- `review_id`
- `attempt_id`
- `mastery_judgement`
- `risk_type`
- `intervention_task_id`

### 3. 做了去重保护

事件级 `parent_signal` 使用 `signal_key` 去重。

规则：

- key 中包含：
  - `student_id`
  - `todayKey`
  - `review_id`
  - `attempt_id`
  - `risk_type`
  - `mastery_judgement`

结果：

- 同一条复习尝试不会重复插入同一种家长信号通知。

### 4. 做了“快照信号”和“事件信号”的历史隔离

文件：

- `apps/socrates/lib/notifications/parent-signal.ts`
- `apps/socrates/app/api/parent/insights/route.ts`

新增：

- `isParentSignalSnapshotKind(...)`

处理方式：

- `parent/insights` 在回看最近 7 天家长信号历史时，只统计这些快照型信号：
  - `guardian_red`
  - `guardian_signal_upgrade`
  - `guardian_signal_recovery`
  - `guardian_signal_yellow_persisting`
  - `daily_checkin_stuck`
  - `top_blocker_repeat`

不会纳入：

- `review_failure_risk`
- `review_transfer_gap_risk`

这样可避免两个问题：

- 即时事件通知把“黄灯连续性”算乱
- 即时事件通知误干扰 `guardian_signal` 的升级 / 恢复判断

## 当前效果

现在家长端已经形成两层统一信号：

- 快照层：
  - 由 `parent/insights` 聚合后生成
  - 用于家长总览、红黄绿灯、趋势判断
- 事件层：
  - 由 `review/attempt` 立即生成
  - 用于第一时间把复习失败、假会、迁移证据缺口推到家长侧

两层都复用同一个 `notifications.type = 'parent_signal'`，但语义边界已分开。

## 本地验证

已通过：

- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`
- `pnpm.cmd --filter @socra/socrates build`

## 部署判断

从代码状态看，这一轮改动已经达到“可继续发布准备”的标准。

但真正发版前仍需满足：

- 使用干净 `git worktree`，不要从当前脏工作区直接部署
- 确认远端已执行本阶段依赖的迁移：
  - `supabase/migrations/20260427_add_structured_outcome_fields.sql`
  - `supabase/migrations/20260427_add_parent_daily_checkins.sql`
- 发布后至少做一轮线上回归：
  - 学生完成一次复习尝试
  - 家长侧出现 `mastery_update`
  - 家长侧同步出现新的 `parent_signal`
  - 打开 `parent/insights` 后，历史黄灯/红灯逻辑不被事件通知污染
