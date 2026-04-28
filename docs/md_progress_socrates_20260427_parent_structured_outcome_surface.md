# Socrates 家长端结构化诊断上屏进展
Date: 2026-04-27

## 本次完成

- 延续 2026-04-27 的结构化诊断 Phase 1 基础层，不回退到更早 checkpoint。
- 在 `apps/socrates/components/error-loop/ParentInsightControlPage.tsx` 补齐家长端可见接线：
  - 新增 `diagnosis_cards` 前端类型接收
  - 新增“统一诊断结果”主卡片
  - 新增“诊断摘要列表”侧卡片
  - 直接展示后端已返回的结构化诊断字段：
    - `guardian_error_type_label`
    - `root_cause_summary`
    - `child_poka_yoke_action`
    - `suggested_guardian_action`
    - `analysis_mode_label`
    - `stuck_stage_label`
    - `false_error_gate`

## 这一步解决了什么

- 之前后端已经能产出统一诊断结果，但家长端页面还看不到，导致“分析能力已经存在，家长感知却仍停留在热力图和风险列表”。
- 这次补齐后，家长端不再只看到“数据很多”，而是能先看到：
  - 今天最大卡点是什么
  - 这是知识盲点、审题失误还是思维断层
  - 孩子下一步要做什么防呆动作
  - 家长这次应该怎么介入
- 这一步本质上是在把“诊断能力”变成“家长可执行判断”，而不是继续堆更多指标。

## 当前产品含义

- 家长端开始从“结果看板”向“陪学决策台”过渡。
- 结构化诊断没有新开第二套系统，而是继续复用现有主链路：
  - `error_sessions`
  - `error_diagnoses`
  - `parent/insights`
  - 家长端洞察页
- 这保证后续继续扩展时，家长视图、学生统计、学习报告可以共用同一套诊断口径，而不是各写一套解释。

## 验证结果

- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`
  - result: passed
- `pnpm.cmd --filter @socra/socrates build`
  - result: passed

## 当前边界

- 这次是页面接线和可见结果补齐，不包含线上部署。
- `supabase/migrations/20260427_add_structured_outcome_fields.sql` 仍只是本地迁移草案，尚未确认已在目标环境执行。
- 因此：
  - 本地代码层、类型层、构建层已通过
  - 真实运行时若要稳定读取新字段，仍需要数据库迁移落地

## 影响文件

- `apps/socrates/components/error-loop/ParentInsightControlPage.tsx`
- `docs/md_progress_socrates_20260427_parent_structured_outcome_surface.md`

## 可复用对外表达素材

- 角度 1：
  家长真正需要的不是更多热力图，而是“今天到底卡在哪、我该怎么陪”。
- 角度 2：
  AI 助教如果只会追问，不会把诊断结果整理成家长能执行的动作，闭环就仍然断在最后一公里。
- 角度 3：
  我们没有重做第二套家长系统，而是把已有错题诊断主链路上的结果统一上屏，这样后续报告、统计、家长端建议才能共享同一套口径。

## 下一步建议

- 继续补家长端“学生阶段总结/趋势视图”，把结构化诊断从单题结果推进到阶段性总结。
- 继续补“知识点未学透判断”和“初三场景优先级”规则，让 `grade9_exam` 模式不只是标签，而能真正影响家长端建议。
- 在数据库迁移正式执行后，再安排一轮包含真实诊断字段写入的联调回归。
