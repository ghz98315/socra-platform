# Socrates Vercel Binding Audit
Date: 2026-03-29

## Shipped In This Slice

- Audited the current Vercel project bindings and deployment records for the monorepo.
- Confirmed the real production Socrates project remains `socra-socrates` and is actively serving `https://socrates.socra.cn`.
- Identified a stray local relink that created a duplicate Vercel project named `socrates`.
- Added a repo-local `pnpm check:vercel-links` audit command so local `.vercel/project.json` bindings can be checked before manual CLI deploys.
- Updated deployment docs with the current canonical Socrates project ID and the duplicate-project warning.

## Key Findings

- `socra-socrates` is the production Socrates project.
- `socra-socrates` currently has a recent production deployment and aliases:
  - `https://socrates.socra.cn`
  - `https://socra-platform.vercel.app`
- `socrates` is a newly created duplicate project from 2026-03-29:
  - root directory: `.`
  - no production deployment history
  - should not be used for release work
- `socra-essay` and `socra-landing` also produced new deployments on the recent push window, so the latest push did not affect Socrates alone.

## Current Judgment

- Local Vercel project binding drift was the source of the misleading `vercel ls` result in `apps/socrates`.
- The deployment fan-out across multiple apps is not explained by Socrates-only code changes alone; Vercel monorepo deploy behavior and project settings still matter.
- Repo code can help with verification, but app-only deployment gating still requires Vercel Dashboard settings such as `Skip deployment` or `Ignored Build Step`.

## Affected Files

- `package.json`
- `scripts/check-vercel-links.mjs`
- `docs/md_deployment_cn.md`
- `docs/md_progress_socrates_20260329_vercel_binding_audit.md`

## Next Step

- Keep local CLI work pinned to `socra-socrates`.
- If app-only deploy fan-out must stop, audit each Vercel project's Root Directory settings and monorepo skip configuration in the dashboard.
