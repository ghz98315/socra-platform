# Project Socrates - 国内部署指南

> 版本: v2.3
> 更新日期: 2026-03-14
> 域名: socra.cn
> 状态: ✅ 已部署完成

---

## 当前部署架构

```
用户(国内) → Cloudflare CDN → Vercel (香港节点 hkg1)
```

### 已配置域名

| 域名 | 应用 | 状态 |
|------|------|------|
| socra.cn | apps/landing (落地页) | ✅ |
| socrates.socra.cn | apps/socrates (苏格拉底) | ✅ |
| essay.socra.cn | apps/essay (作文批改) | ✅ |

---

## Vercel 项目配置

### 项目列表

| 项目名 | Root Directory | 域名 | 状态 |
|--------|----------------|------|------|
| socra-landing | apps/landing | socra.cn | ✅ 已部署 |
| socra-socrates | apps/socrates | socrates.socra.cn | ✅ 已部署 |
| socra-essay | apps/essay | essay.socra.cn | ✅ 已部署 |

> 规则: 线上只维护 `socra-landing`、`socra-socrates`、`socra-essay` 这 3 个项目，不单独部署根目录 `socra-platform`。

### .vercel/project.json 配置

**apps/landing/.vercel/project.json**
```json
{
  "projectId": "prj_c3so0fHNZadONoXDM5hp7RObCOE5",
  "orgId": "team_oGAI73uHlj5rSJavgqQ1mANw",
  "projectName": "socra-landing"
}
```

**apps/socrates/.vercel/project.json**
```json
{
  "projectId": "prj_f4pBZ4BLpWGEK5N5hEcStj0cRs2A",
  "orgId": "team_oGAI73uHlj5rSJavgqQ1mANw",
  "projectName": "socra-socrates"
}
```

**apps/essay/.vercel/project.json**
```json
{
  "projectId": "prj_30eHoHt8CCkzaLZDQ0IHgVZ5x8K2",
  "orgId": "team_oGAI73uHlj5rSJavgqQ1mANw",
  "projectName": "socra-essay"
}
```

### 2026-03-29 Audit Note

- The canonical production projects are `socra-landing`, `socra-socrates`, and `socra-essay`.
- A stray project named `socrates` was created on 2026-03-29 by an accidental local relink. Do not use it for production deployment or project inspection.
- Run `pnpm check:vercel-links` before any manual Vercel CLI deployment to confirm the local `.vercel/project.json` files still point at the canonical projects.
- Vercel monorepos do not become "single-app deploy only" from repo code alone. Unaffected-project skipping and ignored-build-step behavior are controlled in each project's Vercel Dashboard settings.
- This repo now ships app-local `ignoreCommand` rules in each `vercel.json`:
  - `apps/landing` -> `node ../../scripts/vercel-ignore-build.mjs --app landing`
  - `apps/socrates` -> `node ../../scripts/vercel-ignore-build.mjs --app socrates`
  - `apps/essay` -> `node ../../scripts/vercel-ignore-build.mjs --app essay`
- These rules skip deploys when the latest commit does not touch the app itself or its declared internal dependencies.

---

## 部署方式

## 发布 SOP

### 默认流程: 只走 Git Push

这是唯一默认流程，优先级最高。

```bash
# 1. 本地验证
pnpm --filter @socra/landing build
pnpm --filter @socra/socrates build
pnpm --filter @socra/essay build

# 2. 提交并推送
git add .
git commit -m "your message"
git push origin main
```

推送后由 Vercel 自动部署以下 3 个项目：

- `socra-landing`
- `socra-socrates`
- `socra-essay`

### 禁止事项

- 不要从 monorepo 根目录运行 `vercel`
- 不要在 `git push origin main` 之后，再手动执行一次 `vercel`
- 不要把 Preview 部署当成正式发布结果
- 不要新增第 4 个根项目 `socra-platform`

### 例外流程: 仅在自动部署失败时手动补发

只有 Git 自动部署失败，才允许手动执行 Vercel CLI。

```bash
# Landing
cd socra-platform/apps/landing
npx vercel --prod

# Socrates
cd socra-platform/apps/socrates
npx vercel --prod

# Essay
cd socra-platform/apps/essay
npx vercel --prod
```

手动补发时必须满足：

- 只能在对应 app 目录执行
- 必须使用 `--prod`
- 一次只补发一个项目
- 补发前先确认该项目没有正在运行的 Production 部署

### 本地 Vercel 链接校验

如果 CLI 输出的项目名不对，先检查各应用目录下的 `.vercel/project.json`：

- `apps/landing` -> `socra-landing`
- `apps/socrates` -> `socra-socrates`
- `apps/essay` -> `socra-essay`

若本地被错误重绑，先修正 `.vercel/project.json`，再执行部署。

### 方式 1: Vercel CLI 部署 (推荐)

从各个应用目录分别部署：

```bash
# 部署 Landing 页面
cd socra-platform/apps/landing
npx vercel --prod

# 部署 Socrates 主应用
cd socra-platform/apps/socrates
npx vercel --prod

# 部署 Essay 作文批改
cd socra-platform/apps/essay
npx vercel --prod
```

### 方式 2: Vercel Dashboard 手动触发

1. 登录 [Vercel Dashboard](https://vercel.com/login)
2. 选择对应项目
3. 点击 **Deployments** 标签
4. 点击 **Redeploy** 按钮

### 方式 3: Git Push 自动触发

Vercel 会自动监听 GitHub 仓库的 main 分支：
- 推送到 `socra-platform` 仓库后
- Vercel 会自动检测并部署所有三个项目

---

## Monorepo 架构

```
socra-platform/                    # GitHub 仓库
├── apps/
│   ├── landing/                   # 落地页 → socra.cn
│   │   ├── .vercel/               # Vercel 配置
│   │   ├── app/                   # Next.js App Router
│   │   └── package.json
│   ├── socrates/                  # 苏格拉底 → socrates.socra.cn
│   │   ├── .vercel/               # Vercel 配置
│   │   ├── app/                   # Next.js App Router
│   │   │   ├── (student)/         # 学生端路由
│   │   │   ├── (parent)/          # 家长端路由
│   │   │   └── api/               # API 路由
│   │   └── package.json
│   └── essay/                     # 作文批改 → essay.socra.cn
│       ├── .vercel/               # Vercel 配置
│       ├── app/                   # Next.js App Router
│       └── package.json
├── packages/
│   ├── ui/                        # 共享 UI 组件
│   ├── auth/                      # 认证逻辑
│   ├── database/                  # 数据库配置
│   └── config/                    # 共享配置
├── supabase/
│   └── migrations/                # 数据库迁移文件
├── package.json                   # 根 package.json
├── pnpm-workspace.yaml           # pnpm workspace 配置
└── turbo.json                     # Turborepo 配置
```

---

## 环境变量配置

### Socrates 应用 (apps/socrates)

在 Vercel Dashboard 中配置以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DASHSCOPE_API_KEY=
NEXT_PUBLIC_SITE_URL=https://socrates.socra.cn
```

### Landing 应用 (apps/landing)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Essay 应用 (apps/essay)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DASHSCOPE_API_KEY=
```

---

## 本地开发

```bash
# 克隆仓库
git clone https://github.com/ghz98315/socra-platform.git
cd socra-platform

# 安装依赖
pnpm install

# 启动所有应用
pnpm dev

# 或单独启动
cd apps/landing && pnpm dev    # http://localhost:3001
cd apps/socrates && pnpm dev   # http://localhost:3000
cd apps/essay && pnpm dev      # http://localhost:3002
```

---

## 开发进度 (v1.7.19)

| Phase | 功能 | 状态 |
|-------|------|------|
| Phase 0 | 合规基础 (隐私政策、用户协议) | ✅ |
| Phase 1 | 基础设施 (积分、邀请系统) | ✅ |
| Phase 1.5 | 学习诊断 (知识图谱、学习风格) | ✅ |
| Phase 2 | 用户增长 (分享海报、微信分享) | ✅ |
| Phase 2.5 | 家长增强 (多子女Dashboard、周报) | ✅ |
| Phase 3 | 商业化 (订阅、支付、Pro权限) | ✅ |
| Phase 4 | 合规功能 (青少年模式、时长限制) | ✅ |

---

## 常见问题

### Q1: 部署失败？

检查 Vercel 项目配置：
- Root Directory 是否正确 (如 `apps/socrates`)
- Build Command: `pnpm build`
- Install Command: `pnpm install`
- 确保从正确的应用目录部署
- 确保没有误触发根目录项目 `socra-platform`

### Q2: 环境变量未生效？

1. 在 Vercel Dashboard 添加环境变量
2. 确保环境变量添加到正确的项目
3. 重新部署项目

### Q3: 域名无法访问？

1. 检查 Cloudflare DNS 是否正确
2. 确认代理状态为橙色云朵
3. 等待 DNS 生效（最多 24 小时）

### Q4: Monorepo 部署问题？

- 不要从根目录部署
- 每个应用需要单独部署
- 确保每个应用的 `.vercel/project.json` 配置正确

### Q5: 为什么会出现卡 20 分钟以上的 Preview 部署？

- 常见原因是 `git push` 已触发自动部署后，又手动执行了 `vercel`
- 如果同批次 `Production` 已成功，而 `Preview` 仍显示 `Building`，一般可直接忽略或取消
- 这种情况优先检查是否重复触发，而不是先怀疑代码编译失败

---

## 相关链接

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Cloudflare Dashboard](https://dash.cloudflare.com)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [GitHub 仓库](https://github.com/ghz98315/socra-platform)

## 相关文档 (本仓库)

- `./md_DEPLOYMENT_CHECKLIST.md` (部署清单)
- `./md_RELEASE_RUNBOOK.md` (发布 Runbook)

---

**文档版本**: v2.3
**最后更新**: 2026-03-14
