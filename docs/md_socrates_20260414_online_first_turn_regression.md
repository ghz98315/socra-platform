# Socrates 首轮在线回归

- 日期：2026-04-14
- 状态：implemented and manually validated
- 范围：验证首轮 prompt scaffold 在真实 `/api/chat` 路径上的返回，而不是只看离线 prompt 结构

## 背景

本机当前存在稳定的 Windows 本地阻塞：

- `next dev` 路径会触发 `spawn EPERM`
- 标准 `pnpm --filter @socra/socrates build` 也会在 Next worker/fork 路径触发 `spawn EPERM`

因此，这轮在线回归没有走标准：

- `socrates:start:dev-local`
- `build -> start:local`

而是使用 probe-only 绕行路径：

1. 先跑隔离 full build probe
2. 使用该 probe 产物临时映射到 `.next`
3. 前台启动 `next start`
4. 对真实 `/api/chat` 发起 3 组首轮样例请求
5. 验证后恢复 `.next` 并清理 `.next-probe`

## 本轮前置验证

成功的 probe build 命令：

```powershell
node scripts/probe-socrates-build.mjs --mode full --isolated-dist --trace-children --disable-telemetry --webpack-build-worker false --worker-threads true --sanitize-export-config --retry-unlink
```

结果：

- full webpack build completed
- isolated `distDir` output created under `apps/socrates/.next-probe/full-1776132598311`
- 未修改产品代码

## 在线回归方法

在线验证时使用：

- probe build 输出目录临时充当 `.next`
- 前台 `next start -H 127.0.0.1 -p 3000`
- 真实 POST `/api/chat`

说明：

- 当前环境未配置可用 AI key，因此 `/api/chat` 实际返回走的是当前 mock fallback 规则
- 但这正好可以验证：
  - 首轮主链是否仍按当前 prompt / fallback 设计输出
  - 首问是否落在预期学科锚点

## 在线样例结果

### 1. Math First Turn

输入：

- `message`: `我不知道从哪一步开始`
- `subject`: `math`
- `questionType`: `proof`
- `questionContent`: `已知三角形ABC中，AB=AC，求证∠B=∠C`

实际返回核心内容：

- `我们先不急着整题往下做。`
- `先别急着算。题目已经明确告诉了你哪个条件？`

判断：

- 通过
- 首轮没有展开长讲解
- 首问落在“已知条件”锚点上

### 2. Geometry Math First Turn

输入：

- `message`: `我看不懂这道图形题`
- `subject`: `math`
- `questionType`: `proof`
- `questionContent`: `如图，已知△ABC中，D为BC中点，求证AD⊥BC？`
- `geometryData.type`: `triangle`

实际返回核心内容：

- `我们先不急着整题往下做。`
- `先别急着想方法。图里最关键的一个点、线或角是哪一个？`

判断：

- 通过
- 首轮没有先讲定理
- 首问已落在点 / 线 / 角对象观察上
- 与几何首轮轻诊断目标一致

### 3. English Reading First Turn

输入：

- `message`: `我不会做这道阅读题`
- `subject`: `english`
- `questionType`: `reading`
- `questionContent`: `Read the passage and choose the best title.`

实际返回核心内容：

- `我们先不急着整题往下做。`
- `先别急着选。题干现在问的是细节、主旨，还是推断？`

判断：

- 通过
- 首轮没有直接给答案
- 首问已落在阅读题型判断上

## 本轮结论

这轮真实在线回归确认：

1. 首轮 scaffold 改动不仅在离线 prompt 结构里生效
2. 真实 `/api/chat` 返回也已经体现出新的首轮行为
3. 三组样例都满足：
   - 先轻诊断
   - 不长讲解
   - 只推进一个最小问题
   - 学科锚点符合预期

## 本轮收尾

为避免污染当前工作区，本轮验证结束后已执行：

- 恢复 `apps/socrates/.next`
- 删除临时 `apps/socrates/.next-probe/full-1776132598311`

## 仍然存在的本机限制

虽然在线回归已完成，但当前机器仍未彻底恢复标准本地链路：

- `next dev` 仍会触发 `spawn EPERM`
- 标准 `next build` 仍会触发 `spawn EPERM`

当前已确认可行的临时策略是：

- 用 probe-only build 输出做一次性在线验证
- 不把 probe 绕行方案直接固化进产品代码

## 当前一句话结论

Socrates 首轮 prompt scaffold 已经在真实在线 `/api/chat` 路径上通过了最小人工回归，下一步可以继续基于这条行为基线推进，而不需要再回到“首轮是不是太重”的讨论阶段。
