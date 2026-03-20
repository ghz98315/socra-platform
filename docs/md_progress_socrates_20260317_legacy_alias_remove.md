# Socrates legacy alias 兼容层退役进度
日期: 2026-03-17

## 本次完成

- 移除 `apps/socrates/tsconfig.json` 中为 study legacy 入口临时添加的精确路径 alias:
  - `@/components/study/ChineseAnalysisStudio`
  - `@/components/study/EnglishListeningStudio`
  - `@/components/study/WritingStudio`
  - `@/components/study/StudyResultSummary`
  - `@/lib/study/assets`
  - `@/lib/study/bridges`
  - `@/lib/study/result-summary-v2`
- `paths` 现已回到只保留通用 `@/* -> ./*`
- 旧路径现在完全由同路径 wrapper 文件承接，不再依赖编译配置做额外转发

## 当前效果

- `apps/socrates` 的实际运行入口继续指向 V2 / clean 实现
- legacy import 若仍存在，会直接落到旧路径 wrapper，而不是被 `tsconfig` 静默重写
- 这让源码解析更直接，也减少了后续排查 import 分辨率时的隐性分支

## 验证

- 通过:
  - `pnpm --dir 'D:\\github\\Socrates_ analysis\\socra-platform' exec tsc --noEmit -p 'apps\\socrates\\tsconfig.json'`
- 受环境网络影响未完成:
  - `pnpm smoke:socrates`
  - `pnpm smoke:study-flow`
- 本轮 smoke 失败形态一致，均不是业务断言失败，而是在访问 `https://socrates.socra.cn` 时出现 TLS 握手 / `fetch failed`:
  - `ECONNRESET`
  - `Client network socket disconnected before secure TLS connection was established`
  - `curl.exe -i https://socrates.socra.cn/api/study/assets` 也返回 `schannel: failed to receive handshake`

## 备注

- 本机 Node 仍为 `v22.19.0`
- 仓库期望 Node 仍为 `20.x`
- 由于这轮仅移除 `tsconfig` alias，而同路径 wrapper 与上一轮通过 smoke 的入口保持一致，因此当前更像是环境连通性阻塞，而不是本轮代码回归
