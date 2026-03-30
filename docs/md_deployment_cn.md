# Project Socrates - 国内部署与运维指南

> 版本: v2.4
> 更新日期: 2026-03-30
> 适用仓库: `socra-platform`
> 当前结论: 生产应用可用，部署主路径已稳定，剩余风险集中在 Cloudflare 自定义域名链路和个别机器的 DNS / 网络路径异常

---

## 一、当前线上基线

### 域名与应用

| 域名 | 应用 | 当前角色 |
|------|------|----------|
| `socra.cn` | `apps/landing` | 营销落地页 |
| `socrates.socra.cn` | `apps/socrates` | Socrates 正式域名 |
| `essay.socra.cn` | `apps/essay` | Essay 正式域名 |
| `socra-platform.vercel.app` | `socra-socrates` | Socrates 生产 alias，用于隔离 Cloudflare 问题 |

### Vercel Canonical Projects

只把下面 3 个项目当作线上正式项目：

| 项目名 | Root Directory | 说明 |
|--------|----------------|------|
| `socra-landing` | `apps/landing` | Landing 正式项目 |
| `socra-socrates` | `apps/socrates` | Socrates 正式项目 |
| `socra-essay` | `apps/essay` | Essay 正式项目 |

注意：

- 不要新增或使用根目录项目 `socra-platform`
- 2026-03-29 曾出现一个误创建的重复项目 `socrates`，它不是正式项目
- 在任何手动 Vercel CLI 操作前，先运行 `pnpm check:vercel-links`

---

## 二、默认发布路径

默认只走这一条路径：

```bash
pnpm check:node
pnpm check:env
pnpm check:vercel-links
pnpm --filter @socra/socrates build
pnpm build

git add .
git commit -m "your message"
git push origin main
```

原则：

- 默认发布入口是 `git push origin main`
- 不要在根目录直接运行 `vercel`
- 不要在已经 push 之后再额外手动执行一次 `vercel`
- 不要把 Preview 部署当成正式发布结果

更完整的发布前检查、数据库迁移、烟测与放行门槛，统一看 `docs/md_RELEASE_RUNBOOK.md`。

---

## 三、何时允许手动 Vercel CLI

只在 Git 触发的自动部署失败时，才允许手动补发。

```bash
# Landing
cd apps/landing
npx vercel --prod

# Socrates
cd apps/socrates
npx vercel --prod

# Essay
cd apps/essay
npx vercel --prod
```

手动补发约束：

- 只能在对应 app 目录执行
- 必须使用 `--prod`
- 一次只补发一个项目
- 补发前先确认本项目没有正在进行中的 Production 部署
- 如果 CLI 显示的项目名不对，先修复对应目录下的 `.vercel/project.json`

---

## 四、Vercel 绑定与跳过构建规则

### 本地绑定校验

各应用目录的 `.vercel/project.json` 应保持如下绑定：

- `apps/landing` -> `socra-landing`
- `apps/socrates` -> `socra-socrates`
- `apps/essay` -> `socra-essay`

推荐命令：

```bash
pnpm check:vercel-links
```

### ignoreCommand

仓库已经为三个 app 配置了 app-local `ignoreCommand`：

- `apps/landing` -> `node ../../scripts/vercel-ignore-build.mjs --app landing`
- `apps/socrates` -> `node ../../scripts/vercel-ignore-build.mjs --app socrates`
- `apps/essay` -> `node ../../scripts/vercel-ignore-build.mjs --app essay`

用途：

- docs-only 改动默认应跳过应用构建
- 只有命中 app 自身目录、共享依赖或根构建文件时才触发构建

注意：

- `ignoreCommand` 只能减少无关改动触发的部署
- Vercel monorepo 的最终行为仍受各项目 Dashboard 配置影响
- 如果发现无关项目仍在部署，继续检查项目级 Root Directory、Ignored Build Step 和 Skip deployment 配置

---

## 五、自定义域名与网络排障基线

### 当前判断

截至 2026-03-30，已确认三件事：

1. `socra-socrates` 生产应用本身是健康的
2. `socrates.socra.cn` 的问题优先视为 Cloudflare / 自定义域名链路问题
3. 当前这台验证机器对 `*.vercel.app` 还出现过异常 DNS / 网络路径结果，不能把所有 alias 失败都直接当作应用回归

### 诊断顺序

如果 `socrates.socra.cn` 出现异常，按这个顺序判断：

1. 先用 `pnpm probe:socrates-domain` 对比自定义域名和 Vercel alias
2. 如果 alias 正常、自定义域名异常，先查 Cloudflare
3. 如果 alias 也异常，再检查当前机器的 DNS / 网络路径
4. 只有在多网络、多机器都能稳定复现时，才把问题升级为应用或部署回归

### Cloudflare 侧优先检查项

- DNS 记录是否仍指向正确目标
- `socrates` 记录在 proxied / DNS-only 下是否有行为差异
- SSL mode 是否为 `Full` 或 `Full (strict)`
- 是否有 Redirect Rules、Transform Rules、Cache Rules、WAF、Bot Fight、Workers 干扰 `POST /api/*`

专项排障清单见 `docs/md_socrates_cloudflare_followup_20260329.md`。

---

## 六、环境变量最小要求

### `apps/socrates`

必需：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_API_KEY_LOGIC` 或 `DASHSCOPE_API_KEY`
- `AI_API_KEY_VISION` 或 `DASHSCOPE_API_KEY`

建议：

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SITE_URL`
- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`

### `apps/landing`

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### `apps/essay`

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DASHSCOPE_API_KEY`

更完整的发布前环境校验看 `pnpm check:env` 和 `docs/md_RELEASE_RUNBOOK.md`。

---

## 七、常见误判

### 1. 看到 Preview 还在 Building，就以为正式部署失败

不成立。先看对应项目的 Production 部署是否成功，再决定是否需要介入。

### 2. `socrates.socra.cn` 失败，就直接判定 Socrates 应用挂了

不成立。先用 `socra-platform.vercel.app` 做同路径对比，区分应用问题和 Cloudflare 路径问题。

### 3. 当前机器解析到异常 IP 或 alias TLS 超时，就判定 Vercel 故障

不成立。2026-03-30 已出现过本机 DNS / 网络路径异常样本，必须换网络、换解析器或换机器复核。

### 4. docs 改动触发了多个应用部署，就说明 ignoreCommand 失效

不一定。先确认 Vercel Dashboard 是否真的读取了当前 repo 中的 `vercel.json` 与项目 Root Directory 设置。

---

## 八、配套文档

- `docs/md_RELEASE_RUNBOOK.md`
- `docs/md_TEST_GUIDE.md`
- `docs/md_socrates_cloudflare_followup_20260329.md`
- `docs/md_progress_socrates_20260330_deployment_validation_rollup.md`

---

**文档版本**: v2.4
**最后更新**: 2026-03-30
