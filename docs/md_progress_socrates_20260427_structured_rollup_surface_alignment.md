# Socrates 结构化摘要层三端对齐进展
Date: 2026-04-27

## 本次完成

- 在 `apps/socrates/lib/error-loop/structured-rollup.ts` 新增共享摘要 helper：
  - 统一计算 `guardian_signal`
  - 统一计算 `top_blocker`
  - 统一输出 `focus_summary`
  - 统一输出 `stuck_stage_summary`
- 把这层摘要同时接入三条现有主链，而不是重做新接口：
  - `app/api/parent/insights/route.ts`
  - `app/api/student/stats/route.ts`
  - `app/api/reports/study/route.ts`

## 页面层补齐

- `components/error-loop/ParentInsightControlPage.tsx`
  - 新增首屏三块摘要：
    - 今日状态
    - 本周最大问题
    - 现在该做什么
  - 家长进入页面后，可以先看到信号灯、最大卡点和动作建议，再决定是否展开热力图与风险列表
- `components/MultiChildOverview.tsx`
  - 每个孩子卡片新增：
    - 红黄绿陪学信号
    - 当前最大卡点摘要
  - 多孩子场景下，家长不用先点进每个孩子才能判断优先级
- `components/reports/ReportsDashboard.tsx`
  - 学习报告页新增：
    - 本阶段最大卡点
    - 陪学信号
    - 卡点阶段分布
  - 报告页开始从“统计结果页”向“阶段总结页”收口

## 这一步解决的问题

- 之前 `parent/insights`、`student/stats`、`reports/study` 都在做统计，但语义各自为战。
- 这次先不重做系统，而是补了一层共享摘要，统一回答三个问题：
  - 现在是什么状态
  - 当前最大卡点是什么
  - 下一步该做什么
- 这让后续做：
  - 家长每日三态 check-in
  - 红黄绿信号引擎
  - 初三专项高危提醒
  - 报告口径统一
  时不需要再在每个接口里各写一套判断逻辑

## 当前产品含义

- 家长端开始真正往“家长只看结论”靠，而不是让家长自己读图、猜卡点、再自己想动作。
- 多孩子概览也开始具备“优先处理谁”的排序价值，而不只是展示活跃度和掌握率。
- 学习报告页不再只讲“学了多少”，开始讲“问题主要卡在哪里”。

## 验证结果

- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`
  - result: passed
- `pnpm.cmd --filter @socra/socrates build`
  - result: passed

## 影响文件

- `apps/socrates/lib/error-loop/structured-rollup.ts`
- `apps/socrates/app/api/parent/insights/route.ts`
- `apps/socrates/app/api/student/stats/route.ts`
- `apps/socrates/app/api/reports/study/route.ts`
- `apps/socrates/components/error-loop/ParentInsightControlPage.tsx`
- `apps/socrates/components/MultiChildOverview.tsx`
- `apps/socrates/components/reports/ReportsDashboard.tsx`
- `docs/md_progress_socrates_20260427_structured_rollup_surface_alignment.md`

## 下一步建议

- 继续做 `RQ-05 / RQ-06 / RQ-07`
  - 家长每日三态 check-in
  - 卡住位置提示层
  - 红黄绿信号引擎进一步产品化
- 在这层摘要已经统一后，再推进 `RQ-12`
  - 让 `grade_level=9` 的高危重复卡点升级为“初三专项提醒”
