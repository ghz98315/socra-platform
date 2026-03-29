# Socrates Vercel Ignore Command Setup
Date: 2026-03-29

## Shipped In This Slice

- Added `scripts/vercel-ignore-build.mjs` to make app-level deploy skipping reproducible from repo code.
- Wired `ignoreCommand` into all three app-local `vercel.json` files:
  - `apps/landing`
  - `apps/socrates`
  - `apps/essay`
- The ignore script now decides per app whether the latest commit touched:
  - the app directory itself
  - the app's declared internal workspace dependencies
  - shared root build files such as `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and `turbo.json`

## Why This Matters

- Recent pushes triggered fresh deployments for `socra-landing`, `socra-socrates`, and `socra-essay` together.
- Vercel's project-level monorepo skipping is not guaranteed just because the repo is a monorepo.
- Shipping the ignore logic in repo code makes the deployment boundary explicit and auditable instead of relying only on dashboard memory.

## Current Matching Rules

- `landing`
  - builds on `apps/landing/`, `packages/config/`, `packages/ui/`, and shared root build files
- `socrates`
  - builds on `apps/socrates/`, `packages/config/`, `packages/database/`, `packages/ui/`, `scripts/`, `supabase/`, and shared root build files
- `essay`
  - builds on `apps/essay/`, `packages/shared/`, and shared root build files

## Validation

- Local explicit-file dry runs completed:
  - `node scripts/vercel-ignore-build.mjs --app landing --files docs/md_RELEASE_RUNBOOK.md`
    - result: skip (`exit 0`)
  - `node scripts/vercel-ignore-build.mjs --app landing --files apps/landing/app/page.tsx`
    - result: build (`exit 1`)
  - `node scripts/vercel-ignore-build.mjs --app socrates --files scripts/build-socrates-safe.mjs`
    - result: build (`exit 1`)
  - `node scripts/vercel-ignore-build.mjs --app essay --files apps/socrates/app/api/review/attempt/route.ts`
    - result: skip (`exit 0`)
- Dashboard behavior still depends on each Vercel project honoring the checked-in `vercel.json`.

## Affected Files

- `scripts/vercel-ignore-build.mjs`
- `apps/landing/vercel.json`
- `apps/socrates/vercel.json`
- `apps/essay/vercel.json`
- `docs/md_deployment_cn.md`
- `docs/md_progress_socrates_20260329_vercel_ignore_command_setup.md`

## Next Step

- Run local dry-run checks against the ignore script.
- After the next Git-triggered deploy, verify whether unaffected projects are now skipped instead of rebuilding.
