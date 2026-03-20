# Socrates 中文结果摘要 Clean 化进度
日期: 2026-03-17

## 本次完成

- `/study/chinese/reading` 与 `/study/chinese/foundation` 已切换到新的 `ChineseAnalysisStudioV2`
- 新增 `result-summary-clean.ts`，用干净 UTF-8 文本重新定义结构化结果分段与解析逻辑
- 新增 `StudyResultSummaryV2.tsx`，把结果展示改成更接近专属结果页的样式，首要结论单独突出
- `StudyAssetDetail` 已切到新摘要组件，并在有 assistant 原文时优先重新解析，避免旧 payload 里的脏标题继续展示
- `assets.ts`、`bridges.ts`、中文工作台的新存档链路都已切到 clean 摘要读取/写入逻辑

## 当前影响范围

- 新产生的语文阅读 / 基础知识学习记录会写入 clean 的 `resultSummary`
- 中文工作台内的摘要区、详情跳转、报告跳转、加入复习操作保持可用
- 学习记录详情页在存在消息正文时，会优先显示重新解析后的 clean 结构化摘要

## 暂未处理

- 旧的 `StudyResultSummary.tsx` 仍被英语听力 / 写作工作台使用，这部分结果摘要文案还未一起 clean 化
- 历史坏编码数据如果只剩 payload、没有可重建的 assistant 正文，仍可能继续显示旧标题
- 多份早期进度文档本身存在编码污染，后续需要单独清理，不和当前功能开发混做

## 验证

- `pnpm --dir 'D:\\github\\Socrates_ analysis\\socra-platform' exec tsc --noEmit -p 'apps\\socrates\\tsconfig.json'`
- `SMOKE_BASE_URL=https://socrates.socra.cn SMOKE_STUDY_USER_ID=f59d5551-5f75-474c-9a7e-aa3d545965a5 pnpm --dir 'D:\\github\\Socrates_ analysis\\socra-platform' smoke:study-flow`
- `SMOKE_BASE_URL=https://socrates.socra.cn SMOKE_USER_ID=f59d5551-5f75-474c-9a7e-aa3d545965a5 SMOKE_PARENT_ID=fe19e7e5-4ec7-4143-a11e-6d175057fc1f SMOKE_CHILD_ID=f59d5551-5f75-474c-9a7e-aa3d545965a5 pnpm --dir 'D:\\github\\Socrates_ analysis\\socra-platform' smoke:socrates`

## 备注

- 本机 Node 仍是 `v22.19.0`，仓库期望仍为 `20.x`
- 两条 smoke 已在部署环境 `https://socrates.socra.cn` 上通过
