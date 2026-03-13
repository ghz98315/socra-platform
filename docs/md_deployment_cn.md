# Project Socrates - 国内部署指南

> 版本: v2.2
> 更新日期: 2026-03-11
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

### .vercel/project.json 配置

**apps/landing/.vercel/project.json**
```json
{
  "projectId": "prj_c3so0fHNZadINqHHZadINqH",
  "orgId": "team_oGAI73uHlj5rSJavgqQ1mANw",
  "projectName": "socra-landing"
}
```

**apps/socrates/.vercel/project.json**
```json
{
  "projectId": "prj_01RxzRX1wioYrnyV2JAdjMmZSDzg",
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

---

## 部署方式

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

**文档版本**: v2.2
**最后更新**: 2026-03-11
