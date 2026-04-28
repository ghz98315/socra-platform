# Socrates 家长每日三态闭环进展
Date: 2026-04-27

## 本次完成

- 新增家长每日三态闭环的数据落点：
  - `supabase/migrations/20260427_add_parent_daily_checkins.sql`
- 新增家长每日状态 API：
  - `app/api/parent-checkins/route.ts`
- 新增家长每日状态 helper：
  - `lib/error-loop/guardian-checkin.ts`

## 功能变化

- 家长端现在可以对当天状态做一键记录：
  - `已完成`
  - `卡住了`
  - `未完成`
- `parent/insights` 现在会额外返回：
  - `daily_checkin_status`
  - `suggested_parent_prompt`
- `ParentInsightControlPage` 新增“每日三态 check-in”区块：
  - 点击状态后直接落库
  - 自动回填当日状态摘要
  - 自动展示当前卡住阶段
  - 自动给出家长提示话术

## 这一步解决了什么

- 之前家长端已经能看到大量洞察，但还没有“今天到底属于哪种状态”的低门槛闭环。
- 这次补上后，家长不需要先看完整热力图和风险列表，再自己判断今天该怎么陪。
- 家长可以先点一个状态，系统再顺着当前最大卡点和卡住阶段给出提示。

## 设计取舍

- 这次没有把三态状态硬塞进 `parent_tasks` 或 `notifications`。
- 而是单独用一张轻量表承接“当天状态快照”：
  - 语义更清楚
  - 后续接提醒、复习回流、统计分析更顺
  - 不会把任务状态和每日陪学状态混成一层

## 风险控制

- `parent/insights` 对 `parent_daily_checkins` 缺表做了降级保护。
- 也就是说：
  - 如果迁移尚未执行，家长洞察页不会因为新表缺失直接崩掉
  - 但真正写入每日状态前，仍需要先执行最新 Supabase migration

## 验证结果

- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`
  - result: passed
- `pnpm.cmd --filter @socra/socrates build`
  - result: passed

## 影响文件

- `supabase/migrations/20260427_add_parent_daily_checkins.sql`
- `apps/socrates/lib/error-loop/guardian-checkin.ts`
- `apps/socrates/app/api/parent-checkins/route.ts`
- `apps/socrates/app/api/parent/insights/route.ts`
- `apps/socrates/components/error-loop/ParentInsightControlPage.tsx`
- `docs/md_progress_socrates_20260427_parent_daily_checkin_loop.md`

## 下一步建议

- 继续做 Phase 2 剩余两块：
  - `RQ-06` 卡住位置提示层继续细化
  - `RQ-07` 红黄绿信号引擎继续产品化
- 之后再进入 Phase 3：
  - `1/3/7/15` 复习节点收口
  - 家长确认通过 / 不通过
  - 不通过后的简化版回流三问
