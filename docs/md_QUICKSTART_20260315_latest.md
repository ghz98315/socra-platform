# Quickstart Prompt - 2026-03-15

## Recommended Resume Prompt

```text
我是 Socra 平台的开发者。请先阅读以下文件，基于最新节点继续开发，不要重复做已经完成的内容：

1. D:\github\Socrates_ analysis\socra-platform\docs\md_progress_recall.md
2. D:\github\Socrates_ analysis\socra-platform\docs\md_progress_socrates_20260315_auth_ui_handoff.md
3. D:\github\Socrates_ analysis\socra-platform\docs\md_progress_socrates_20260315_errorbook_review_handoff.md
4. 如涉及作文批改，再补读 D:\github\Socrates_ analysis\socra-platform\docs\md_progress_essay.md

当前代码仓库：
- D:\github\Socrates_ analysis\socra-platform

当前最新有效提交：
- 8ca6ae1 fix(socrates): resolve text overlap in auth ui

你需要记住以下现状：
- 注册页已经改成一次性选择学生头像和家长头像
- 角色选择页不再重复选头像
- 设置页已经支持中文账户信息编辑
- 学生/家长切换已经和实际平台视图同步
- 最近一轮已修复 auth 相关页面的文字重叠问题
- docs/md_platform_architecture_ascii.md 目前是未跟踪文档，不要误提交，除非我明确要求

本轮继续目标：
- 先复核当前主流程是否稳定
- 然后优先处理学习主链路里的问题，而不是再回到 auth UI
- 优先级按这个顺序推进：
  1. 数学几何图形识别与生成稳定性
  2. 错题本列表偶发偏慢
  3. 复习页面清单、难度评估、闭环体验
  4. 学生端与家长端切换后的路径和信息一致性

工作要求：
- 先检查代码现状再动手
- 直接实施，不要只停留在方案
- 修改前给简短进度说明
- 用 apply_patch 改文件
- 不要提交未跟踪的无关文档
```

## Short Prompt

```text
继续从 8ca6ae1 这个节点开始，先读 docs/md_progress_socrates_20260315_auth_ui_handoff.md，然后按“几何识别 -> 错题本速度 -> 复习页闭环”这个优先级继续做，不要回退已完成的 auth UI 和头像流程。
```

## What Was Last Confirmed

- auth UI overlap fix is accepted
- latest pushed commit is `8ca6ae1`
- repo branch is `main`
- no need to reopen auth/avatar flow unless a new bug appears
