# Socrates 内部闭环执行计划

日期：2026-04-09
状态：执行计划
用途：作为本轮 `socrates` 内部功能闭环优化的统一推进依据

## 0. 2026-04-10 执行更新

- Phase 1 已完成首轮收口：
  - `select-profile` 学生入口默认改为 `/study#quick-start`
  - `/study` 首屏已压缩为“开始录题 / 看错题本 / 看学习记录”三主动作
  - 文案方向已调整为“少说明、先动作”
- 当前进入 Phase 2：
  - 开始收口 `error-book` 列表页与详情页的主动作优先级
  - 目标是把批量管理、导出、删除等次要动作从主链路里降级
- 账号体系新增下一阶段议题：
  - 候选方向为“单账号登录 + 家长二级密码 + 多学生隔离视图”
  - 因涉及 `profiles.role`、家长页权限和家庭关系表，不并入本轮 Phase 2 直接落库

## 0.1 2026-04-11 节点补充

- 已补一轮 `workbench` 稳定性收口，当前口径仍属于 `Phase 2` 前置稳定性修正，不单开新阶段
- 已完成的修正包括：
  - `study/[subject]/problem` 改为服务端直接跳转 `/workbench`，减少中间桥页
  - `workbench` 创建错题会话时会同步写入开场 assistant 消息
  - 恢复旧会话时，如 `chat_messages` 为空，会自动补一条开场消息，避免聊天区空白
  - 去除重复的几何自动解析触发，避免 OCR 后重复请求
  - 补齐学生上下文判断，避免缺少 `student_id` 时误保存错题会话
- 已继续推进 `Phase 2` 的错题闭环动作统一：
  - `error-book` 列表页主动作已统一到 `继续复习 / 继续学习 / 看原题`
  - `error-book/[id]` 详情页头部重复主动作已降级，优先由页内 `Next Step` 卡承接单一下一步
  - 已完成态不再默认回错题列表，改为优先 `看复盘`，无复习记录时回 `复习中心`
- `review` 首页也已补齐同一口径：
  - 有待复习任务时，主动作维持 `继续复习`，辅助动作为 `看原题`
  - 无待复习但存在最近完成记录时，主动作改为 `看复盘`
  - 顶部返回学习入口已统一成 `继续学习`
- `review/session` 完成态出口已继续压缩：
  - 未关单时只保留 `继续学习 + 复习中心`
  - 已关单时只保留 `复习中心 + 看原题`
  - 不再在结果页并列三条去向
- `Phase 2` 最小人工验收已完成，当前未发现主链阻塞问题
- 已补当前主链未登录保护，避免 `error-book / error-book/[id] / review / review/session / workbench` 在未登录时卡在页面 loading
- 已补专项人工验收稿：
  - `docs/md_socrates_phase2_error_loop_acceptance_checklist_20260411.md`
- 已补可直接执行的验收稿：
  - `docs/md_socrates_phase2_error_loop_acceptance_execution_20260411.md`
- 当前已进入收尾阶段，可回填验收记录并整理 checkpoint

## 0.2 2026-04-12 节点补充

- `Phase 2` 最小人工验收已完成，当前未发现 `error-book -> error detail -> review -> workbench` 主链阻塞问题
- 当前主链未登录保护也已补齐，避免 `error-book / error-book/[id] / review / review/session / workbench` 在未登录态卡住页面 loading
- 当日重新核对本地 helper 链路后，判断更新为：
  - `pnpm check:node` 通过，Node 版本仍与仓库基线一致
  - `pnpm socrates:status:local` 返回 `HTTP=307`，本地已有可用 Socrates 服务响应
  - 当前更像 helper 跟踪 PID 丢失，不是应用本体不可用
- Windows 本地剩余阻塞继续收口为 `next build --webpack` 的 worker/fork `spawn EPERM`
- 为避免本地验收链路继续被 full build 卡住，新增本地降级入口：
  - `pnpm socrates:start:dev-local`
  - 该入口走 `next dev`，不要求预先存在 `.next/BUILD_ID`
  - 原 `pnpm socrates:start:local` 仍保持 build 输出驱动的本地 start 语义
- 本轮收尾资料已补齐：
  - `docs/md_socrates_phase2_error_loop_acceptance_execution_20260411.md` 已回填为实际执行结果
  - `docs/md_RELEASE_RUNBOOK.md` 已补当前机器的目录与 fallback 启动说明
  - `docs/md_progress_socrates_20260412_phase2_closure_checkpoint.md` 已整理为本轮独立 checkpoint
  - 当前可按“已保存节点”处理，不再依赖聊天上下文才能继续
- 当前阶段建议从“功能继续扩展”切回“收尾归档 + 本地执行路径明确化”

## 1. 本轮目标

把 `landing -> socrates` 主入口已经接通后的下一阶段工作，明确收口为 `socrates` 站内闭环。

本轮不再讨论外部入口是否存在，而是解决下面这条内部路径是否足够顺：

`select-profile -> 首次进入 -> 录题/错题处理 -> 复习闭环 -> 订阅/支付 -> 支付后继续使用`

目标不是做大而全改版，而是把首批用户真正会走的最短主链路压顺。

## 2. 当前判断

### 2.1 已具备的基础

- `select-profile`、`study`、`error-book`、`subscription`、`payment`、`payment/success` 等核心页面都已存在
- 错题本列表、错题详情、加入复习、进入复习等能力已有代码基础
- 订阅页、支付页、支付成功页也已经能形成基本支付链路

### 2.2 当前主要断点

1. 首次进入不够收口
   - 学生在 `select-profile` 后默认进入 `/study`
   - 但 `/study` 当前更像模块目录，而不是“立刻开始第一步”的执行页
2. 错题主链路虽存在，但入口还不够压缩
   - 列表页、详情页、复习页已经有基础
   - 但从“我现在该做什么”到“我马上进入复习或继续处理”的路径还不够集中
3. 支付成功后的承接太泛
   - 当前更偏向统一回 `dashboard` 或 `/study`
   - 还没有根据用户刚才的真实任务把他送回最应该继续的页面

## 3. 范围边界

### 3.1 本轮要做

- 收口学生首次进入后的主动作
- 收口错题本到复习闭环的主路径
- 收口订阅/支付后回到学习动作的承接

### 3.2 本轮不做

- 不重构 `landing`
- 不重做整个信息架构
- 不改双站模型
- 不推进购书自动履约
- 不做大范围视觉翻新
- 不在这一轮扩张到所有学科的完整策略重写

## 4. 执行阶段

### Phase 1：首次进入收口

目标：

- 让学生完成 `select-profile` 后，不只是“进入一个目录页”，而是看到清晰的第一步动作
- 让 `/study` 承担“学习起点”而不是纯导航页

建议动作：

- 为 `/study` 增加首要动作区
- 明确区分：
  - 首次开始录题
  - 继续看错题本
  - 查看学习记录
- 如果需要，再把 `select-profile` 后的默认去向调整为更稳定的学生主入口

优先涉及文件：

- `apps/socrates/app/(auth)/select-profile/SelectProfilePageV3.tsx`
- `apps/socrates/app/(student)/study/page.tsx`
- 如有必要：
  - `apps/socrates/lib/study/catalog.ts`
  - `apps/socrates/app/(student)/dashboard/page.tsx`

验收标准：

- 学生首次进入后 1 次点击内可以开始主学习动作
- 页面文案能清楚表达“先做什么”
- 不需要用户先理解全部学科模块结构才能开始使用

### Phase 2：错题闭环收口

目标：

- 把 `error-book` 从“可用功能页”推进成“明确的闭环执行页”

建议动作：

- 强化错题列表页中的主动作优先级
- 强化错题详情页中的“加入复习 / 进入复习 / 回看记录”路径
- 减少用户在错题详情和复习页之间的跳转犹豫

优先涉及文件：

- `apps/socrates/app/(student)/error-book/page.tsx`
- `apps/socrates/app/(student)/error-book/[id]/page.tsx`
- `apps/socrates/app/(student)/review/session/[id]/page.tsx`
- 相关 API 如需补齐：
  - `apps/socrates/app/api/review/add/route.ts`
  - `apps/socrates/app/api/review/attempt/route.ts`

验收标准：

- 用户能从错题列表快速进入下一步动作
- 已进入复习的错题能清楚区分“继续复习”和“回看记录”
- 列表、详情、复习三页的动作语义一致

2026-04-10 进度补充：

- `error-book` 列表页已加入 `Next Step` 主动作卡，优先引导 `继续复习 / 加入复习 / 继续学习`
- `error-book/[id]` 已把重复底部动作降级，优先展示单一下一步
- `review` 首页已改成更短入口：
  - 首屏统一只保留一个主动作和一个辅助入口
  - 动作词统一到 `继续学习 / 继续复习 / 看原题 / 看复盘 / 复习中心`
  - 多余说明卡已移除
- `review session` 已完成一轮减字：
  - intro / recall / judge 改成短句
  - 完成态改成单一主动作优先
  - 逻辑仍沿用现有闭环判定，不新增分叉流程

### Phase 3：订阅与支付回流收口

目标：

- 让 `subscription -> payment -> payment/success` 不再是独立商业路径，而是真正服务学习闭环

建议动作：

- 在订阅与支付页保留来源上下文
- 在支付成功页支持回到原学习动作
- 优先保证“从学习被打断去支付，再回到学习”的最短路径

优先涉及文件：

- `apps/socrates/app/(student)/subscription/page.tsx`
- `apps/socrates/app/(student)/payment/page.tsx`
- `apps/socrates/app/(student)/payment/success/page.tsx`
- 如需承接参数：
  - `apps/socrates/lib/navigation/entry-intent.ts`

验收标准：

- 从学习链路进入订阅后，支付完成能回到合理的继续动作
- 支付成功页不再只有泛化落点
- 订阅与支付不会破坏现有登录回跳

2026-04-10 进度补充：

- 已补齐 `subscription -> payment -> payment/success` 参数透传
- 已补齐登录中断时的回流：
  - 未登录进入订阅/支付，会先登录，再回到当前支付链路
- 已补齐支付完成后的落点规则：
  - 优先返回原学习动作
  - 无原动作时，默认回到 `/study#quick-start`
- 已补齐部分高频触发入口：
  - `dashboard` Pro 学科按钮
  - 通用 `FeatureLock`
- 当前口径仍然是“支付服务学习动作”，而不是把用户留在商业页

## 5. 推荐实施顺序

1. 先做 Phase 1
   - 这是首次使用是否顺手的最短瓶颈
2. 再做 Phase 2
   - 这是产品价值是否能持续发生的核心路径
3. 最后做 Phase 3
   - 这是商业闭环与学习闭环真正接上的关键

## 6. 本轮推进口径

本轮推进完成后，理想状态不是“全部功能都更复杂”，而是：

- 新用户更快开始第一步
- 老用户更快回到下一步
- 支付用户更容易续上之前的学习动作

换句话说，本轮的判断标准是“路径更短、更明确、更连续”，不是“页面更多”。
