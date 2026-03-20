# Socrates 遗留模块别名退役层进度
日期: 2026-03-17

## 本次完成

- 在 `apps/socrates/tsconfig.json` 中增加精确路径别名，把旧模块名导向新的 clean 实现：
  - `@/components/study/ChineseAnalysisStudio` -> `ChineseAnalysisStudioV2`
  - `@/components/study/EnglishListeningStudio` -> `EnglishListeningStudioV2`
  - `@/components/study/WritingStudio` -> `WritingStudioV2`
  - `@/components/study/StudyResultSummary` -> `StudyResultSummaryV2`
  - `@/lib/study/assets` -> `assets-v2`
  - `@/lib/study/bridges` -> `bridges-v2`
  - `@/lib/study/result-summary-v2` -> `result-summary-clean`
- 在 V2 组件中补上兼容导出名，确保旧 import 名称仍能通过类型检查

## 当前效果

- 运行链路继续使用 V2 / clean 实现
- `.codex-fixed` 恢复文件和旧组件里的老 import 名也不会再把编译拉挂
- 旧坏编码文件仍然留在仓库里，但已被路径别名和运行入口双重隔离

## 验证

- `pnpm --dir 'D:\\github\\Socrates_ analysis\\socra-platform' exec tsc --noEmit -p 'apps\\socrates\\tsconfig.json'`
- `SMOKE_BASE_URL=https://socrates.socra.cn SMOKE_STUDY_USER_ID=f59d5551-5f75-474c-9a7e-aa3d545965a5 pnpm --dir 'D:\\github\\Socrates_ analysis\\socra-platform' smoke:study-flow`
- `SMOKE_BASE_URL=https://socrates.socra.cn SMOKE_USER_ID=f59d5551-5f75-474c-9a7e-aa3d545965a5 SMOKE_PARENT_ID=fe19e7e5-4ec7-4143-a11e-6d175057fc1f SMOKE_CHILD_ID=f59d5551-5f75-474c-9a7e-aa3d545965a5 pnpm --dir 'D:\\github\\Socrates_ analysis\\socra-platform' smoke:socrates`

## 备注

- 本机 Node 仍是 `v22.19.0`，仓库期望仍为 `20.x`
- 本轮 smoke 最新写侧样本：
  - `study-flow`: `asset_id=46d71b88-43de-4eb3-88d7-6d5eceb3c554`
  - `study-flow`: `review_id=40a02e57-7815-4a0a-a7ae-930669bbc495`
