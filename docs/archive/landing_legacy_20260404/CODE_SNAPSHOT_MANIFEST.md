# landing legacy code snapshot manifest

归档日期：2026-04-04

基线提交：

- `173ca3bdb498f30acf6a12f4aa2bd20e7f5280f2`

归档目标：

- 将迁移改写前的旧 `apps/landing` 实现完整隔离到归档目录。
- 为当前新 landing 迁移提供稳定对照基线。

快照根目录：

- `docs/archive/landing_legacy_20260404/code_snapshot/`

快照来源规则：

- 使用 `git show HEAD:<path>` 从归档时仓库 `HEAD` 导出旧 landing 已跟踪文本文件。
- 保留原始目录结构，便于后续逐文件比对。
- 未重复归档二进制静态资源：`apps/landing/public/logo.png`。

已归档文件：

- `apps/landing/.gitignore`
- `apps/landing/next-env.d.ts`
- `apps/landing/next.config.ts`
- `apps/landing/package.json`
- `apps/landing/postcss.config.mjs`
- `apps/landing/tailwind.config.ts`
- `apps/landing/tsconfig.json`
- `apps/landing/vercel.json`
- `apps/landing/app/globals.css`
- `apps/landing/app/layout.tsx`
- `apps/landing/app/page.tsx`
- `apps/landing/app/robots.ts`
- `apps/landing/app/sitemap.ts`
- `apps/landing/app/about/page.tsx`
- `apps/landing/app/essays/page.tsx`
- `apps/landing/app/essays/[slug]/page.tsx`
- `apps/landing/app/pricing/page.tsx`
- `apps/landing/app/privacy/page.tsx`
- `apps/landing/app/start/page.tsx`
- `apps/landing/app/terms/page.tsx`
- `apps/landing/components/FeaturedPostsCarousel.tsx`
- `apps/landing/lib/essays.ts`

当前删除策略：

- 不删除归档内容。
- 等新方案在 `apps/landing` 内完成迁移并经过用户确认后，再统一删除旧 landing 资料。
