# Socrates Study Asset 后链路补齐进度
日期: 2026-03-18

## 本次完成

- `WritingStudioV2.tsx` 已补齐写作类工作台的 `study_asset` 后链路入口：
  - 查看统一学习记录详情
  - 聚焦单条记录生成学习报告
  - 直接加入复习清单并跳转到复习页
- `EnglishListeningStudioV2.tsx` 已补齐同样的后链路入口，不再只停留在“结果摘要 + 历史记录”。
- 写作与听力工作台现在和语文阅读 / 基础知识工作台保持一致的最小闭环：
  - 模块内发起分析
  - 写入 `study_assets`
  - 回看详情
  - 进入报告
  - 桥接到复习

## 影响范围

- `/study/chinese/composition-idea`
- `/study/chinese/composition-review`
- `/study/english/writing-idea`
- `/study/english/writing-review`
- `/study/english/listening`

## 当前判断

- 这一轮补的是统一学习资产层的“后半段动作”，不是重写写作或听力主工作流。
- 这样做把多学科新工作台进一步并回 `study / reports / review` 主链，符合阶段文档里“统一学习记录继续收口”的下一步。
- `Essay` 深度并轨、统一 `StudySession` 抽象、音频上传与播放器仍然是后续阶段，不在这次范围内。

## 验证

- `pnpm exec tsc --noEmit -p apps/socrates/tsconfig.json`

## 备注

- 本机 Node 仍是 `v22.19.0`，仓库期望仍为 `20.x`。
- 本次未执行线上 smoke；这轮改动是前端接线补齐，优先先过类型检查。
