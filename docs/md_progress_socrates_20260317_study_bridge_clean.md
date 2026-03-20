# Socrates 学习资产桥接层 Clean 化进度
日期: 2026-03-17

## 本次完成

- 新增 `apps/socrates/lib/study/assets-v2.ts`
- 新增 `apps/socrates/lib/study/bridges-v2.ts`
- 当前生效的学习记录中心、报告面板、中文工作台 V2、英语听力 V2、写作工作台 V2、`api/reports/study`、`api/study/assets/review` 已全部切到新的 clean 桥接层
- `assets-v2.ts` 修复了模块标签和状态标签的坏编码问题
- `bridges-v2.ts` 修复了提取文本、模块标签、focus summary 默认文案等坏编码问题

## 当前状态

- 运行链路已经不再依赖旧的 `assets.ts` / `bridges.ts`
- 旧的 `assets.ts` / `bridges.ts` 仍保留在仓库里，主要是为了不打断旧组件和恢复文件
- 旧的 `ChineseAnalysisStudio.tsx`、`EnglishListeningStudio.tsx`、`WritingStudio.tsx` 也仍保留，但当前模块入口已不再使用它们

## 验证

- `pnpm --dir 'D:\\github\\Socrates_ analysis\\socra-platform' exec tsc --noEmit -p 'apps\\socrates\\tsconfig.json'`
- `SMOKE_BASE_URL=https://socrates.socra.cn SMOKE_STUDY_USER_ID=f59d5551-5f75-474c-9a7e-aa3d545965a5 pnpm --dir 'D:\\github\\Socrates_ analysis\\socra-platform' smoke:study-flow`
- `SMOKE_BASE_URL=https://socrates.socra.cn SMOKE_USER_ID=f59d5551-5f75-474c-9a7e-aa3d545965a5 SMOKE_PARENT_ID=fe19e7e5-4ec7-4143-a11e-6d175057fc1f SMOKE_CHILD_ID=f59d5551-5f75-474c-9a7e-aa3d545965a5 pnpm --dir 'D:\\github\\Socrates_ analysis\\socra-platform' smoke:socrates`

## 备注

- 本机 Node 仍是 `v22.19.0`，仓库期望仍为 `20.x`
- 本轮 smoke 最新写侧样本：
  - `study-flow`: `asset_id=5c2d6751-9000-4cb9-b4bf-a95ea7151ca1`
  - `study-flow`: `review_id=170ad50c-b044-4205-9e55-43e3dcb8d66c`
