# Socrates Phase 2 错题闭环验收执行稿

日期：2026-04-11
用途：面向实际验收执行，按顺序打勾并记录结果
关联清单：`docs/md_socrates_phase2_error_loop_acceptance_checklist_20260411.md`

## 0. 执行信息

- 验收环境：Windows 本地浏览器手动验收
- 验收人：人工验收
- 测试账号：已登录学生账号
- 执行时间：2026-04-11 至 2026-04-12
- 代码基线：`Phase 2` 主链收口 + 未登录 loading 保护修复
- 推荐本地执行命令：
  - `pnpm.cmd -C "D:\github\Socrates_ analysis\socra-platform" socrates:start:dev-local`
  - `pnpm.cmd -C "D:\github\Socrates_ analysis\socra-platform" socrates:status:local`
- 是否已准备好本地验收入口：
  - [ ] `pnpm.cmd -C "D:\github\Socrates_ analysis\socra-platform" --filter @socra/socrates build`
  - [x] 或 `pnpm.cmd -C "D:\github\Socrates_ analysis\socra-platform" socrates:start:dev-local`（当 Windows 本地 `build` 被 `spawn EPERM` 阻塞时）
- 当前结果：
  - [x] 最小人工验收已完成，暂未发现主链阻塞问题
  - [x] 当前主链未登录 loading 卡死问题已修复
  - [ ] 本地 `build -> start:local` helper 仍需单独处理 Windows `spawn EPERM`

## 1. 五分钟最小执行单

### Step 1：错题列表首页

- [x] 打开 `error-book`
- [x] 顶部 `Next Step` 只有 1 个主按钮
- [ ] 主按钮文案只可能是：
  - [x] `继续复习`
  - [x] `继续学习`
  - [x] `看原题`
  - [x] `开始录题`
- 结果记录：已人工检查，未发现顶部主动作并列或泛化按钮回退
- URL 证据：`/error-book`

### Step 2：错题详情页

- [x] 打开任一 `error-book/[id]`
- [x] 页内 `Next Step` 卡只强调 1 条主动作
- [x] 头部不再重复出现 `继续学习 / 继续复习 / 加入复习`
- [x] 头部 `导出PDF` 可点击
- 结果记录：已人工检查，详情页主动作由页内 `Next Step` 单点承接，头部未再抢主链焦点
- URL 证据：`/error-book/[id]`

### Step 3：复习首页

- [x] 打开 `review`
- [ ] 若当前有待复习题：
  - [x] 主动作是 `继续复习`
  - [x] 辅助动作是 `看原题`
- [ ] 若当前无待复习但有最近完成记录：
  - [x] 主动作是 `看复盘`
  - [x] 辅助动作是 `继续学习`
- 结果记录：已人工检查，两种状态下的主辅动作符合预期，未发现错误回退到泛化入口
- URL 证据：`/review`

### Step 4：单题复习完成态

- [x] 打开 `review/session/[id]`
- [x] 完成一次判定进入结果页
- [ ] 若本轮未关单：
  - [x] 只保留 `继续学习 + 复习中心`
- [ ] 若本轮已关单：
  - [x] 只保留 `复习中心 + 看原题`
- [x] 完成态不再三出口并列
- 结果记录：已人工检查，完成态出口压缩符合预期
- URL 证据：`/review/session/[id]`

### Step 5：工作台恢复

- [x] 从 `error-book` 或 `review` 进入 `study/[subject]/problem?session=...`
- [x] 直接进入 `workbench`
- [x] 聊天区不是空白
- [x] 无明显重复几何解析闪动
- 结果记录：已人工检查，旧会话恢复路径可直接进入 `workbench`，未再出现空白聊天区
- URL 证据：`/study/[subject]/problem?session=...` -> `/workbench`

## 2. 最小结论

- [x] 错题列表、详情、复习首页都只强调单一下一步
- [x] 已完成态不再默认回泛化列表
- [x] `review/session` 完成页不再并列三条出口
- [x] 旧题恢复到 `workbench` 时聊天区不空白

结论：

- [x] 通过，可继续下一阶段
- [ ] 有阻塞，需修复后复验

## 3. 阻塞记录

- 阻塞 1：
- 复现步骤：
- 预期：
- 实际：
- 截图 / URL：

- 阻塞 2：
- 复现步骤：
- 预期：
- 实际：
- 截图 / URL：

## 4. 补充备注

- 备注 1：当前人工验收期间，未发现 `error-book -> error detail -> review -> workbench` 主链阻塞问题。
- 备注 2：Windows 本地 `build -> start:local` 仍可能被 `spawn EPERM` 阻塞；本轮建议优先使用 `socrates:start:dev-local` 做本地验收。
- 备注 3：本执行稿已作为当前轮次的保存节点，可直接用于后续 checkpoint / commit 文案整理。
