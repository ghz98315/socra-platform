# Socrates 阶段进展：父端信号通知生成

日期：2026-04-27

## 本轮目标

把已经完成的父端信号层从“页面可见”推进到“主动提醒”：

- 不新增通知系统
- 不新增提醒表
- 直接复用现有 `notifications`
- 继续以 `parent/insights` 为唯一信号聚合源

## 本轮完成内容

### 1. 新增父端信号通知草稿层

新增文件：

- `apps/socrates/lib/notifications/parent-signal.ts`

职责：

- 定义父端信号通知数据结构
- 统一生成 3 类高价值提醒草稿

当前已接入的提醒类型：

1. `guardian_red`
- 当 `guardian_signal.level === red`

2. `daily_checkin_stuck`
- 当当日 `daily_checkin_status.status === stuck`

3. `top_blocker_repeat`
- 当同类 `top_blocker.count >= 3`

### 2. 在 `parent/insights` 聚合完成后自动生成通知

修改文件：

- `apps/socrates/app/api/parent/insights/route.ts`

完成内容：

- 在返回家长洞察结果前，调用 `buildParentSignalNotificationDrafts(...)`
- 使用 `ensureParentSignalNotifications(...)` 进行通知去重与插入
- 继续使用已有 `supabaseAdmin -> notifications`

### 3. 去重策略已落地

当前去重规则：

- 只针对 `type = parent_signal`
- 查询最近 7 天已生成的同类通知
- 通过 `data.signal_key` 去重

当前 `signal_key` 设计为：

- `guardian_red:studentId:date:blocker:stage`
- `daily_checkin_stuck:studentId:date:blocker`
- `top_blocker_repeat:studentId:date:blocker`

结果：

- 同一天内重复打开页面，不会重复插入同一条提醒
- 重复卡点提醒不会因为次数从 3 变 4 就在同一天再次刷一条

## 提醒内容

提醒里已带入以下关键信息：

- 当前孩子
- 红黄绿信号标签
- 今日 check-in 状态
- 最大卡点
- 卡点阶段
- 家长建议动作
- 页面跳转入口

## 展示层适配

已适配以下展示入口：

- `apps/socrates/components/NotificationCenter.tsx`
- `apps/socrates/components/notifications/NotificationBell.tsx`
- `apps/socrates/app/(student)/notifications/page.tsx`

适配效果：

- `parent_signal` 类型现在有独立显示样式
- 可展示：
  - 信号标签
  - check-in 状态
  - 当前卡点
  - 卡住阶段

## 当前形成的闭环

现在父端通知链路已经变成：

1. 学生诊断数据进入结构化汇总
2. `parent/insights` 计算：
- `guardian_signal`
- `daily_checkin_status`
- `top_blocker`

3. 高价值状态被自动翻译成 `parent_signal` 通知
4. 家长可在：
- 顶栏通知入口
- 通知中心页
- 任务页 / 控制页

之间顺滑跳转

## 本轮验证

本地已验证：

- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`
- `pnpm.cmd --filter @socra/socrates build`

结果：

- TypeScript：通过
- Build：通过

## 下一步建议

当前这轮已经完成“信号转提醒”的最小闭环。下一刀最适合继续做：

1. 信号升级/降级提醒
- 黄灯升红灯
- 红灯降黄灯

2. 提醒收敛与恢复
- 风险消失后自动给出“已缓解”通知

3. 与复习链路联动
- 结合 `1/3/7/15`
- 在复习失败时自动补发父端提醒

## 本轮涉及文件

- `apps/socrates/lib/notifications/parent-signal.ts`
- `apps/socrates/app/api/parent/insights/route.ts`
- `apps/socrates/components/NotificationCenter.tsx`
- `apps/socrates/components/notifications/NotificationBell.tsx`
- `apps/socrates/app/(student)/notifications/page.tsx`
