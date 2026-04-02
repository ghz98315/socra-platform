# Socra Platform - 开发进度总览

> 最后更新: 2026-04-02
> 用途: 给接手当前仓库的人一个最短的全局入口

---

## 一、产品矩阵

```text
┌─────────────────────────────────────────────────────────────────┐
│                         socra.cn                                │
│                      Landing 品牌首页                            │
├─────────────────────────────────────────────────────────────────┤
│                              │                                   │
│        ┌─────────────────────┴─────────────────────┐            │
│        ▼                                           ▼            │
│  ┌─────────────────────┐              ┌─────────────────────┐   │
│  │   Socrates 错题本    │              │   Essay 作文批改    │   │
│  │  socrates.socra.cn  │              │   essay.socra.cn    │   │
│  ├─────────────────────┤              ├─────────────────────┤   │
│  │ • 错题学习闭环       │              │ • 作文图片上传      │   │
│  │ • AI 苏格拉底对话    │              │ • AI 批改评分       │   │
│  │ • 复习与报告         │              │ • 闪光点与建议      │   │
│  │ • 家长跟进链路       │              │ • PDF 导出          │   │
│  │ • 订阅与支付         │              │                     │   │
│  └─────────────────────┘              └─────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│                   ┌─────────────────────┐                       │
│                   │   Supabase Auth     │                       │
│                   │   共享账号体系       │                       │
│                   └─────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、当前状态

### Socrates

- 当前状态: 已完成主功能开发，进入全功能重测准备阶段
- 正式域名: `https://socrates.socra.cn`
- 生产 alias: `https://socra-platform.vercel.app`
- 正式 Vercel 项目: `socra-socrates`
- 关键主文档:
  - `docs/md_progress_socrates.md`
  - `docs/md_RELEASE_RUNBOOK.md`
  - `docs/md_deployment_cn.md`
  - `docs/md_TEST_GUIDE.md`
  - `docs/md_socrates_full_test_execution_20260402.md`

### Landing

- 当前状态: 已完成多轮规划与实验性改版，现等待外部设计稿 / 代码迁移
- 正式域名: `https://socra.cn`
- 正式 Vercel 项目: `socra-landing`
- 当前主文档:
  - `docs/md_progress_landing.md`
  - `docs/md_landing_homepage_book_style_refresh_20260401.md`
  - `docs/md_landing_prd_20260401.md`
  - `docs/md_landing_final_page_spec_20260401.md`

### Essay

- 当前状态: 已有可用产品形态，继续作为独立入口运行
- 正式域名: `https://essay.socra.cn`
- 正式 Vercel 项目: `socra-essay`
- 主文档:
  - `docs/md_progress_essay.md`

---

## 三、当前开发重点

### P0

- Socrates 全功能重测
- 用统一执行版文档收口测试过程与问题记录
- 保持对主域名 / alias / Cloudflare 问题的正确诊断顺序

### P1

- Landing 等待新的完整设计稿或页面代码后迁移
- 不再沿旧首页方向继续微调

### P2

- 继续压缩 docs 碎片，保持主文档优先

---

## 四、当前必须记住的判断

1. Socrates 正式 Vercel 项目只有 `socra-socrates`
2. `socrates.socra.cn` 出问题时，先排 Cloudflare / 域名链路，不直接判应用回归
3. 某些机器对 `*.vercel.app` 也可能出现 DNS / 网络路径异常，单机结果不能直接下结论
4. Landing 当前不应再从旧碎片文档重建方案，应从 2026-04-01 主文档继续
5. 文档整理后，优先从 `docs/md_README_DOCS.md` 进入

---

## 五、推荐阅读顺序

1. `docs/md_README_DOCS.md`
2. `docs/md_progress_socrates.md`
3. `docs/md_RELEASE_RUNBOOK.md`
4. `docs/md_deployment_cn.md`
5. `docs/md_TEST_GUIDE.md`
6. `docs/md_socrates_full_test_execution_20260402.md`

如果处理 landing，再看:

1. `docs/md_progress_landing.md`
2. `docs/md_landing_homepage_book_style_refresh_20260401.md`
3. `docs/md_landing_prd_20260401.md`
4. `docs/md_landing_dev_execution_plan_20260401.md`

---

## 六、当前推荐操作

### 做 Socrates 测试前

```bash
pnpm check:node
pnpm check:env
pnpm check:vercel-links
pnpm probe:socrates-domain
```

### 做本地 Socrates 运行态检查

```bash
pnpm socrates:status:local
```

---

## 七、快速恢复提示

如果需要在新会话恢复上下文，优先使用:

- `docs/md_QUICKSTART_20260330_restart_resume.md`
