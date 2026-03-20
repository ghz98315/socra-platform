# Socrates 遗留 study 入口 wrapper 收口进度
日期: 2026-03-17

## 本次完成

- 将以下旧入口文件直接收敛为最小 wrapper，避免仓库内继续保留误导性的旧实现正文:
  - `apps/socrates/components/study/ChineseAnalysisStudio.tsx`
  - `apps/socrates/components/study/EnglishListeningStudio.tsx`
  - `apps/socrates/components/study/WritingStudio.tsx`
  - `apps/socrates/components/study/StudyResultSummary.tsx`
  - `apps/socrates/lib/study/assets.ts`
  - `apps/socrates/lib/study/bridges.ts`
  - `apps/socrates/lib/study/result-summary-v2.ts`
- 旧入口现在只做转发:
  - 组件入口转发到 `*V2` 组件
  - study 资产 / bridge / result summary 入口转发到 clean / v2 模块
- 这样即使后续有人直接打开旧文件，也能立即看到当前真实实现入口，不再被乱码正文和过时逻辑误导。

## 当前效果

- `tsconfig` alias 的兼容层继续保留
- 旧路径文件本身也与当前运行入口对齐
- study / detail / reports / review 这条链路的实际行为不变，但源码辨识度更高，后续继续退役 legacy import 的风险更低

## 验证

- `pnpm --dir 'D:\\github\\Socrates_ analysis\\socra-platform' exec tsc --noEmit -p 'apps\\socrates\\tsconfig.json'`
- `SMOKE_BASE_URL=https://socrates.socra.cn SMOKE_USER_ID=f59d5551-5f75-474c-9a7e-aa3d545965a5 SMOKE_PARENT_ID=fe19e7e5-4ec7-4143-a11e-6d175057fc1f SMOKE_CHILD_ID=f59d5551-5f75-474c-9a7e-aa3d545965a5 pnpm --dir 'D:\\github\\Socrates_ analysis\\socra-platform' smoke:socrates`
- `SMOKE_BASE_URL=https://socrates.socra.cn SMOKE_STUDY_USER_ID=f59d5551-5f75-474c-9a7e-aa3d545965a5 pnpm --dir 'D:\\github\\Socrates_ analysis\\socra-platform' smoke:study-flow`

## 样本

- `study-flow`:
  - `asset_id=58256e1f-e4fc-4767-8189-609dce97f5e9`
  - `review_id=11a34553-1432-4dd5-abfa-5c3167c59da8`

## 备注

- 本机 Node 仍为 `v22.19.0`
- 仓库期望 Node 仍为 `20.x`
- 这轮没有继续清理其余 `.codex-fixed` 恢复文件，也没有删除任何用户临时文件
