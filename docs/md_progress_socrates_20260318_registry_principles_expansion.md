# Socrates Registry Principles Expansion 进度
日期: 2026-03-18

## 本次完成

- 继续扩展 `apps/socrates/lib/study/module-registry-v2.tsx`，把更多模块的 `principles` 并回 registry。
- 本轮补入了以下模块的模块级原则：
  - `chinese/reading`
  - `chinese/foundation`
  - `english/writing-idea`
  - `english/writing-review`
- 现在模块页里的“实施原则”不再只是默认文案，更多模块已经开始读到自己的体验策略。

## 当前判断

- 这一步让 registry 更接近真正的“模块体验 contract”，不再只是挂工作台组件。
- 当前模块体验已经开始同时承载：
  - phase 文案
  - principles 文案
  - workspace 渲染
  - supplemental bridge
- 页面层后续可以继续减少对 catalog 级文案的依赖。

## 影响范围

- `apps/socrates/lib/study/module-registry-v2.tsx`
- `docs/md_progress_socrates_20260318_registry_principles_expansion.md`

## 下一步建议

- 继续把模块页里剩余依赖 catalog 的展示 contract 评估是否继续收回 registry。
- 回头清理三个 V2 工作台页面里遗留的旧结果动作块，彻底并回共享结果组件。

## 验证

- `pnpm exec tsc --noEmit -p apps/socrates/tsconfig.json`
- `pnpm --filter @socra/socrates build`

## 备注

- 本机 Node 仍为 `v22.19.0`，仓库预期仍为 `20.x`。
- 本轮仍未运行 study-flow smoke，因为缺少 `SMOKE_STUDY_USER_ID`。
