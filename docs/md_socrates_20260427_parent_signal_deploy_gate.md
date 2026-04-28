# Socrates 2026-04-27 家长信号闭环发布门禁

Date: 2026-04-27
Repo: `D:\github\Socrates_ analysis\socra-platform`
Phase: `发布阶段`

## 1. 本轮发布目标

把这几块作为同一条发布主线一起上线：

- 结构化诊断字段落库
- 家长端 `parent/insights` 聚合输出
- 每日家长 check-in 接口与数据结构
- 复习补救风险并入 `guardian_signal`
- `review/attempt` 即时写入统一 `parent_signal`
- 快照型 `parent_signal` 与事件型 `parent_signal` 历史隔离

当前结论：

- 从代码和本地构建状态看，这一轮已经达到“可进入部署准备”的标准
- 但不能从当前脏工作区直接部署
- 必须先满足数据库迁移、干净 worktree、发布后回归验证三项门槛

## 2. 本轮关键代码范围

核心实现文件：

- `apps/socrates/lib/error-loop/structured-outcome.ts`
- `apps/socrates/lib/error-loop/entry-gate.ts`
- `apps/socrates/lib/error-loop/structured-rollup.ts`
- `apps/socrates/lib/error-loop/guardian-checkin.ts`
- `apps/socrates/lib/notifications/parent-signal.ts`
- `apps/socrates/app/api/parent/insights/route.ts`
- `apps/socrates/app/api/parent-checkins/route.ts`
- `apps/socrates/app/api/review/attempt/route.ts`
- `apps/socrates/app/api/student/stats/route.ts`
- `apps/socrates/app/api/reports/study/route.ts`
- `apps/socrates/components/error-loop/ParentInsightControlPage.tsx`
- `apps/socrates/components/MultiChildOverview.tsx`
- `apps/socrates/components/reports/ReportsDashboard.tsx`
- `apps/socrates/components/NotificationCenter.tsx`
- `apps/socrates/components/notifications/NotificationBell.tsx`
- `apps/socrates/app/(student)/notifications/page.tsx`
- `apps/socrates/app/(parent)/tasks/page.tsx`

## 3. 数据库前置条件

这两份迁移是本轮新增硬依赖：

- `supabase/migrations/20260427_add_structured_outcome_fields.sql`
- `supabase/migrations/20260427_add_parent_daily_checkins.sql`

发布前要求：

1. 在目标 Supabase 项目按顺序执行这两份迁移。
2. 执行后确认以下对象可用：
   - `error_sessions` 已包含结构化字段
   - `error_diagnoses` 已包含结构化字段
   - `parent_daily_checkins` 表存在
3. 若远端尚未执行迁移：
   - `parent/insights`
   - `parent-checkins`
   仍有降级保护，但这不等于正式发布可接受状态。

结论：

- 迁移未执行前，不应把这一轮视为可完整上线。

## 4. 本地已完成验证

本轮已完成并通过：

- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`
- `pnpm.cmd --filter @socra/socrates build`

已确认的代码层效果：

- `guardian_signal` 现在直接吸收：
  - `pendingReviewInterventionCount`
  - `reviewInterventionRiskPersistingCount`
- `review/attempt` 风险事件现在会同步创建：
  - `mastery_update`
  - `parent_signal`
- `parent/insights` 回看最近历史时，只统计快照型 `parent_signal`
  - 不会把即时事件通知错误计入黄灯连续性和升级/恢复判断

## 5. 当前仍未闭合的发布风险

### 风险 1：当前工作区是脏工作区

当前仓库不是干净发布面。

要求：

- 不要从当前 `socra-platform` 主工作区直接部署
- 必须抽出本轮目标文件到干净 `git worktree`

### 风险 2：线上数据库迁移状态未知

当前本地已经有迁移文件，但不能默认远端已执行。

要求：

- 先确认生产 Supabase 已完成本轮迁移

### 风险 3：事件级 `parent_signal` 还没有现成在线 smoke 全自动覆盖

现状：

- 现有 `smoke-transfer-evidence-gap.mjs` 仍主要覆盖：
  - `review_intervention`
  - `mastery_update`
- 还没有一条完全自动化的线上 smoke，能稳定证明：
  - `review/attempt` 触发 `parent_signal`
  - `parent/insights` 历史快照逻辑未被污染

结论：

- 本轮发布后需要补一条手动验收链，不应只看构建通过。

## 6. 正式部署前执行顺序

### A. 准备干净发布工作树

1. 基于当前需要发布的基线创建干净 `git worktree`
2. 仅迁入本轮闭环相关文件
3. 在干净 worktree 内重新执行：
   - `pnpm.cmd install --no-frozen-lockfile`
   - `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`
   - `pnpm.cmd --filter @socra/socrates build`

### B. 生产数据库迁移

在目标 Supabase 项目执行：

1. `20260427_add_structured_outcome_fields.sql`
2. `20260427_add_parent_daily_checkins.sql`

### C. 发布到正确项目

要求：

- Vercel project 必须是 `socra-socrates`
- 不要发布到 `socra-platform`

### D. 发布后自动检查

至少执行：

- `pnpm.cmd smoke:socrates`
- `pnpm.cmd smoke:auth-phone`
- `pnpm.cmd socrates:check:auth-profile-regression`

说明：

- 若当前机器仍无法稳定访问 `https://socrates.socra.cn`
- 优先使用可达的 deployment URL 或 `https://socra-platform.vercel.app`
- 若 deployment URL 受 Vercel 保护，则需使用可绕过保护的验证路径或其他机器执行

## 7. 发布后必须补的手动验收

这轮最关键的手动验收链如下：

### 场景 1：复习失败即时家长信号

1. 学生完成一次会触发风险的 `review/attempt`
2. 确认家长端出现 `mastery_update`
3. 确认家长端同步出现 `parent_signal`
4. 确认 `parent_signal` 类型正确：
   - `review_failure_risk`
   - 或 `review_transfer_gap_risk`

### 场景 2：家长总览信号升级

1. 打开 `/api/parent/insights` 对应页面
2. 确认 `guardian_signal` 已反映：
   - `pendingReviewInterventionCount`
   - `reviewInterventionRiskPersistingCount`
3. 确认红黄灯理由文案与风险现状一致

### 场景 3：快照历史不被事件污染

1. 先触发一次即时 `parent_signal`
2. 再打开家长总览页面
3. 确认：
   - 黄灯连续性判断正常
   - 红灯升级 / 恢复判断正常
   - 没有因为事件通知导致重复升级或误恢复

### 场景 4：每日 check-in 降级/正常路径

1. 若远端已迁移：
   - 确认 `parent_daily_checkins` 可读写
2. 若远端故意未迁移的测试环境：
   - 确认 `parent/insights`
   - `parent-checkins`
   仍能优雅降级，而不是 500

## 8. 部署判断

### 现在是否“代码上可部署”

可以。

前提是：

- 用干净 worktree
- 先执行数据库迁移
- 发布后补自动回归和最小手动验收

### 现在是否“当前这个工作区可以直接部署”

不可以。

原因：

- 当前主工作区仍是脏工作区
- 线上迁移状态未在这里完成确认
- 发布后还需要补这轮新增信号链的手动闭环验收

## 9. 最终建议

当前最合理的下一步不是继续改功能，而是进入发布执行：

1. 抽干净 worktree
2. 执行 Supabase 迁移
3. 发到 `socra-socrates`
4. 跑自动回归
5. 补一轮家长信号手动验收
6. 回写 `docs/LATEST_CHECKPOINT.md`
