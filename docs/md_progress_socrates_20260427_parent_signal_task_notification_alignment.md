# Socrates 阶段进展：父端信号接入任务页与通知中心

日期：2026-04-27

## 本轮目标

在不新增第二套后端系统的前提下，把已经落地的结构化诊断链路继续产品化到父端日常入口：

- `parent/insights`
- `ParentInsightControlPage`
- `tasks`
- `NotificationCenter`

核心原则：

- 不重建新的家长洞察接口
- 不重建新的提醒表或任务表
- 继续复用已落地的：
  - `guardian_signal`
  - `top_blocker`
  - `focus_summary`
  - `stuck_stage_summary`
  - `daily_checkin_status`
  - `suggested_parent_prompt`

## 本轮完成内容

### 1. 通知中心接入父端信号摘要

文件：

- `apps/socrates/components/NotificationCenter.tsx`

完成内容：

- 在通知下拉层内新增父端信号摘要区块
- 打开通知中心时，除了拉取 `notifications`，同时拉取 `/api/parent/insights`
- 摘要区块直接展示：
  - 当前孩子
  - `guardian_signal`
  - `daily_checkin_status`
  - `top_blocker`
  - `focus_summary`
  - 家长动作
  - 孩子动作
- 增加两个直接动作入口：
  - 去看陪学看板
  - 查看任务

这样通知中心不再只是“消息列表”，而是变成家长可以即时判断今天该不该介入、介入什么的轻量入口。

### 2. 家长任务页接入当前陪学信号卡

文件：

- `apps/socrates/app/(parent)/tasks/page.tsx`

完成内容：

- 在任务列表顶部增加“当前陪学信号”卡片
- 卡片复用 `/api/parent/insights?student_id=...`
- 展示内容包括：
  - `guardian_signal`
  - `daily_checkin_status`
  - `top_blocker`
  - `focus_summary`
  - 家长动作
  - 孩子动作
  - `stuck_stage_summary`
- 当家长处于“全部孩子”视图时，明确提示：
  - 当前任务列表显示全部孩子
  - 当前信号卡基于默认孩子/当前孩子
  - 可一键切换为“只看该孩子任务”
- 干预任务的入口按钮现在会带上对应 `student_id`，让跳转到 `/controls` 后上下文更一致

### 3. 任务页支持从外部带 child context 进入

文件：

- `apps/socrates/app/(parent)/tasks/page.tsx`

完成内容：

- 新增 `child_id` 查询参数接入
- 当从通知中心点击“查看任务”进入时，可直接落到该孩子上下文

这一步是为了把“提醒 -> 任务 -> 陪学动作”链路闭合起来，而不是只做静态展示。

## 当前结果

父端现在已经形成更完整的最小闭环：

1. 学生错题/复盘形成结构化诊断
2. `parent/insights` 汇总出信号、卡点、阶段、建议动作
3. 家长在 `/controls` 可以看完整看板
4. 家长在 `/tasks` 可以直接看到当前信号与对应任务
5. 家长在通知中心打开时，也能先看到“今天最该盯哪里”

也就是说，最新这一步补齐的是“父端轻入口层”，不是再造新引擎。

## 本轮验证

本地验证已完成：

- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`
- `pnpm.cmd --filter @socra/socrates build`

结果：

- TypeScript：通过
- Socrates build：通过

## 下一步建议

基于当前代码状态，下一阶段最顺手的继续项是：

1. 让 `notifications` 真正产出信号型提醒
- 例如：
  - `daily_checkin_status = stuck`
  - `guardian_signal = red`
  - `top_blocker` 连续重复

2. 把信号变化做成“升级/降级”提醒，而不只是静态展示
- 例如：
  - 由黄灯升红灯
  - 由红灯降黄灯
  - 连续 3 次卡在同一阶段

3. 继续进入 Phase 3
- 对齐 `1/3/7/15`
- 增加家长复习通过/未通过确认
- 失败后走 3 问降级补救链路

## 本轮涉及文件

- `apps/socrates/components/NotificationCenter.tsx`
- `apps/socrates/app/(parent)/tasks/page.tsx`
