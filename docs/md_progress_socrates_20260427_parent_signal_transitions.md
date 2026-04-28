# Socrates 阶段进展：父端信号跃迁提醒

日期：2026-04-27

## 本轮目标

在已完成的 `parent_signal` 通知基础上，继续补“状态变化提醒”：

- 黄灯 -> 红灯
- 绿灯 -> 红灯
- 红灯 -> 黄灯 / 绿灯

要求：

- 不新增状态历史表
- 不新增通知链路
- 继续复用现有 `notifications`

## 本轮完成内容

### 1. 父端信号通知草稿层升级

文件：

- `apps/socrates/lib/notifications/parent-signal.ts`

新增提醒类型：

- `guardian_signal_upgrade`
- `guardian_signal_recovery`

现在 `parent_signal` 支持 5 类通知：

1. `guardian_red`
2. `guardian_signal_upgrade`
3. `guardian_signal_recovery`
4. `daily_checkin_stuck`
5. `top_blocker_repeat`

### 2. 上一状态来源

文件：

- `apps/socrates/app/api/parent/insights/route.ts`

实现方式：

- 继续从 `notifications` 表查询最近 7 天的 `parent_signal`
- 取当前孩子最近一条记录中的：
  - `data.guardian_signal_level`

把这个值作为：

- `previousGuardianSignalLevel`

再传入 `buildParentSignalNotificationDrafts(...)`

这样不需要维护独立状态历史表，也能识别“升级”和“回落”。

### 3. 当前跃迁规则

#### 升级提醒

触发条件：

- 当前 `guardian_signal.level === red`
- 上一状态存在
- 上一状态不是 `red`

生成：

- `guardian_signal_upgrade`

#### 缓解提醒

触发条件：

- 上一状态是 `red`
- 当前状态不是 `red`

生成：

- `guardian_signal_recovery`

### 4. 去重策略继续生效

仍然使用 `signal_key` 去重。

新增两类 key 形态：

- `guardian_signal_upgrade:studentId:date:from:to:blocker`
- `guardian_signal_recovery:studentId:date:from:to:blocker`

结果：

- 同一天同一跃迁只发一次
- 重复打开页面不会反复插入同一条升级/缓解提醒

## 当前形成的通知层闭环

现在父端信号通知已经覆盖两类价值：

### 1. 状态本身

- 红灯
- 今日卡住
- 重复卡点

### 2. 状态变化

- 风险升级为红灯
- 风险从红灯回落

这意味着家长不仅能看到“现在怎么样”，还会被提醒“情况是不是在变坏 / 变好”。

## 本轮验证

本地已完成：

- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`
- `pnpm.cmd --filter @socra/socrates build`

结果：

- TypeScript：通过
- Build：通过

## 下一步建议

接下来最自然的一刀是继续补“状态变化后的动作收敛”：

1. 红灯回落后补“已缓解建议”
- 不只是发一条回落提醒
- 还给出接下来 1-2 天该怎么守住

2. 黄灯长期不退的持续风险提醒
- 例如连续 3 天黄灯但始终没回绿灯

3. 与复习节奏联动
- 在 `1/3/7/15` 的复习失败后直接提升父端信号

## 本轮涉及文件

- `apps/socrates/lib/notifications/parent-signal.ts`
- `apps/socrates/app/api/parent/insights/route.ts`
