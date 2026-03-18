# Socrates Registry Metadata Slice 进度
日期: 2026-03-18

## 本次完成

- 扩展 `apps/socrates/lib/study/module-registry-v2.tsx`，让 module registry 开始承载更多展示元数据，而不只是一段 `phaseCopy`。
- 新增 registry 级别字段：
  - `phaseTitle`
  - `principlesTitle`
  - `principles`
- 模块页 `apps/socrates/app/(student)/study/[subject]/[module]/page.tsx` 已改为从 registry 读取“当前定位 / 实施原则”标题和内容，不再把这些说明硬编码在页面组件里。
- 为作文批改和英语听力补入模块级 `principles`，开始形成“模块体验 contract 由 registry 驱动”的路径。

## 当前判断

- 这一步是 module registry 切片的继续推进，目标是把模块页里越来越多的说明性元数据从页面层往 registry 收口。
- 当前 registry 已开始覆盖：
  - phase 文案
  - principles 文案
  - workspace 渲染
  - supplemental bridge
- 页面层现在更接近“取 registry -> 渲染”，后续继续接更多模块时会更稳。

## 影响范围

- `apps/socrates/lib/study/module-registry-v2.tsx`
- `apps/socrates/app/(student)/study/[subject]/[module]/page.tsx`
- `apps/socrates/lib/study/development-progress-v2.ts`

## 下一步建议

- 继续把模块页里还依赖 catalog 的一部分展示 contract 评估是否也并回 registry。
- 继续清理三个 V2 工作台页面层遗留的旧结果动作块，完全并回共享结果组件。
- 在 registry 里继续预留物理、化学接入时需要的模块体验扩展点。

## 验证

- `pnpm exec tsc --noEmit -p apps/socrates/tsconfig.json`
- `pnpm --filter @socra/socrates build`

## 备注

- 本机 Node 仍为 `v22.19.0`，仓库预期仍为 `20.x`。
- 本轮仍未运行 study-flow smoke，因为缺少 `SMOKE_STUDY_USER_ID`。
