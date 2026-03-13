# 快速启动提示词

> 每次开始新对话时，复制以下内容即可

---

## 复制这段内容：

```
我是 Socra 平台的开发者。请阅读以下文件了解项目当前状态：

1. 读取 D:\github\Socrates_ analysis\socra-platform\docs\md_progress_recall.md 了解项目总览
2. 根据需要阅读：
   - D:\github\Socrates_ analysis\socra-platform\docs\md_progress_socrates.md (错题本平台)
   - D:\github\Socrates_ analysis\socra-platform\docs\md_progress_essay.md (作文批改)

项目目录 (统一 monorepo):
- 主仓库: D:\github\Socrates_ analysis\socra-platform
- Socrates: socra-platform/apps/socrates
- Essay: socra-platform/apps/essay
- Landing: socra-platform/apps/landing
- 共享包: socra-platform/packages
- 文档: D:\github\Socrates_ analysis\socra-platform\docs

请确认已了解项目状态，我需要继续开发：
[在此填写具体需求]
```

## 作文批注工作台续开发模板

```
继续从作文批注工作台最新节点开始，基于 commit bdcdd6d 和 docs/md_progress_essay.md，先确认 v1.4.3 的部署稳定性调整已经生效，再继续优化移动端批注工作台。优先做移动端批注抽屉里的信息层级、手势/关闭逻辑和批注列表可读性，不要回退桌面端方案。
```

---

## 当前版本

| 产品 | 版本 | 部署地址 |
|------|------|----------|
| Socrates | v1.7.4 | https://socrates.socra.cn |
| Essay | v1.4.3 | https://essay.socra.cn |
| Landing | v1.0.0 | https://socra.cn |

---

## 最近更新 (2026-03-13)

- 作文结果页升级为原文批注工作台
- 新增批注导航、审阅进度、键盘快捷键
- 新增批注处理闭环：已采纳 / 稍后处理 / 待处理
- 新增移动端批注工作台与底部抽屉式操作区
- 收口 Vercel Node / pnpm 配置，稳定 GitHub -> Vercel 发布链路

---

*最后更新: 2026-03-13*
