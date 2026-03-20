# Socrates 英语学习工作台 Clean 化进度
日期: 2026-03-17

## 本次完成

- 新增 `EnglishListeningStudioV2.tsx`，替换旧英语听力工作台里的坏编码文案与旧摘要外壳
- 新增 `WritingStudioV2.tsx`，统一接管语文写作思路 / 语文作文预批改 / 英语写作思路 / 英语作文批改四个入口
- 模块入口页已切到新的 V2 组件：
  - `/study/english/listening`
  - `/study/english/writing-idea`
  - `/study/english/writing-review`
  - `/study/chinese/composition-idea`
  - `/study/chinese/composition-review`
- 新工作台全部改用 `StudyResultSummaryV2` 展示结构化结果卡
- 旧组件文件保留但不再作为这些模块的主入口，降低对临时恢复文件的干扰

## 当前影响范围

- 新进入上述模块的用户会直接看到 clean 的 UTF-8 文案、结果摘要卡和追问区
- 学习记录沉淀逻辑保持不变，仍然通过 `saveStudyAssetTurn(...)` 写入统一学习资产
- 结果摘要 payload 继续走 clean 的 `result-summary-clean.ts`

## 暂未处理

- 旧的 `EnglishListeningStudio.tsx` / `WritingStudio.tsx` 仍留在仓库中，后续可视情况删除或彻底下线
- 其它已损坏的早期进度文档和零散老组件文案还没有统一清理

## 验证

- `pnpm --dir 'D:\\github\\Socrates_ analysis\\socra-platform' exec tsc --noEmit -p 'apps\\socrates\\tsconfig.json'`
- `SMOKE_BASE_URL=https://socrates.socra.cn SMOKE_STUDY_USER_ID=f59d5551-5f75-474c-9a7e-aa3d545965a5 pnpm --dir 'D:\\github\\Socrates_ analysis\\socra-platform' smoke:study-flow`
- `SMOKE_BASE_URL=https://socrates.socra.cn SMOKE_USER_ID=f59d5551-5f75-474c-9a7e-aa3d545965a5 SMOKE_PARENT_ID=fe19e7e5-4ec7-4143-a11e-6d175057fc1f SMOKE_CHILD_ID=f59d5551-5f75-474c-9a7e-aa3d545965a5 pnpm --dir 'D:\\github\\Socrates_ analysis\\socra-platform' smoke:socrates`

## 备注

- 本机 Node 仍是 `v22.19.0`，仓库期望仍为 `20.x`
- smoke 通过时的最新写侧样本：
  - `study-flow`: `asset_id=91718a6c-eaf8-4882-8f00-3d918c321816`
  - `study-flow`: `review_id=0ccf301b-c7b1-464f-9d50-2114ef6076bd`
