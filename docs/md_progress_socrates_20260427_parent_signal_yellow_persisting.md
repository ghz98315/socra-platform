# Socrates 阶段进展：连续黄灯滞留提醒

日期：2026-04-27

## 本轮目标

继续补齐父端信号提醒层，把“没有爆成红灯，但一直黄灯不退”的情况也主动提醒出来。

约束保持不变：

- 不新增表
- 不新增状态历史系统
- 继续复用 `notifications` 里的 `parent_signal`

## 本轮完成内容

### 1. 新增黄灯滞留提醒类型

文件：

- `apps/socrates/lib/notifications/parent-signal.ts`

新增通知类型：

- `guardian_signal_yellow_persisting`

触发规则：

- 当前 `guardian_signal.level === yellow`
- 最近连续若干次历史信号快照也仍然是 `yellow`
- 当前阈值：
  - 连续 3 次快照黄灯

### 2. 当前判断口径

这次没有做成“严格自然日连续黄灯”，而是做成：

- 连续信号快照黄灯

原因：

- 当前历史来源是 `parent_signal`
- 它依赖家长实际打开父端入口时才会产生快照
- 因此不能假设每天一定都有完整记录

所以当前更稳的定义是：

- 最近连续 3 次有效父端信号快照仍为黄灯

这比“自然日连续”更符合现有数据现实，也不会因为家长某天没打开系统就把判断做坏。

### 3. 历史读取方式

文件：

- `apps/socrates/app/api/parent/insights/route.ts`

实现方式：

- 查询最近 7 天 `parent_signal`
- 只保留当前孩子的记录
- 通过 `signal_key` 中的日期段做按天去重
- 取每个信号日的最新信号等级
- 再排除“今天已经存在的旧快照”

这样可以避免：

- 同一天重复打开页面，把黄灯次数虚增

### 4. 当前提醒文案含义

现在这类提醒表达的是：

- 家长已经连续几次看到黄灯
- 风险没有回绿
- 需要主动处理，避免继续拖成红灯

## 当前父端信号通知类型

截至这一轮，`parent_signal` 已支持：

1. `guardian_red`
2. `guardian_signal_upgrade`
3. `guardian_signal_recovery`
4. `guardian_signal_yellow_persisting`
5. `daily_checkin_stuck`
6. `top_blocker_repeat`

## 去重策略

黄灯滞留提醒仍然走 `signal_key` 去重。

当前 key 形态：

- `guardian_signal_yellow_persisting:studentId:date:blocker`

结果：

- 同一天同一孩子同一黄灯卡点只发一次

## 本轮验证

本地已验证：

- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`
- `pnpm.cmd --filter @socra/socrates build`

结果：

- TypeScript：通过
- Build：通过

## 下一步建议

下一刀最合适继续做：

1. 黄灯 -> 红灯的提前防呆动作
- 在黄灯滞留提醒里直接带一条更明确的“现在就做什么”

2. 复习链路联动
- 如果 `1/3/7/15` 某一轮失败，直接把黄灯滞留和复习失败串起来

3. 后续如果需要更严格自然日逻辑
- 再考虑引入专门的日级信号快照表
- 当前阶段没必要为这个单点需求加表

## 本轮涉及文件

- `apps/socrates/lib/notifications/parent-signal.ts`
- `apps/socrates/app/api/parent/insights/route.ts`
