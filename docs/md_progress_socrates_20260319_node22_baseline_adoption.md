# Socrates Node 22 Baseline Adoption
Date: 2026-03-19

## Shipped In This Slice

- Changed the repo-declared Node baseline from `20.x` to `22.x`.
- Updated `.nvmrc` and `.node-version` to `22`.
- Updated the autopilot close-out template so it reports the new Node expectation correctly.
- Updated release readiness so the active local release gate now matches the only machine that can actually complete the build-and-smoke path.
- Updated `scripts/run-turbo-build.mjs` so the workspace build uses direct local CLIs instead of `pnpm --filter ... build`, which avoids the unstable wrapper layer seen during Node 22 validation.
- Added a clean Node 22 switch guide for future operator use.

## Current Judgment

- The repo baseline is now aligned with reality on the current single-machine setup.
- This is a release-engineering alignment change, not a product behavior change.
- The main release path is now judged against Node `22.19.0`, because that is the only environment that has completed the full local validation path on this machine.
- The workspace build is now stable again on this machine after replacing `pnpm --filter ... build` with direct local CLI execution and ordering Next builds ahead of the Vite app.

## Affected Files

- `package.json`
- `.nvmrc`
- `.node-version`
- `scripts/autopilot.mjs`
- `scripts/run-turbo-build.mjs`
- `docs/md_RELEASE_READINESS_20260319.md`
- `docs/md_NODE22_SWITCH_GUIDE_20260319.md`
- `docs/md_progress_socrates_20260319_node22_baseline_adoption.md`

## Commands Run

- `pnpm check:node`
- `pnpm check:env`
- `pnpm build`
- `pnpm --filter @socra/socrates build`
- direct `next build` for `landing`
- direct `tsc` + `vite build` for `essay`
- `pnpm smoke:socrates`
- `pnpm smoke:study-flow`

## Smoke

- `pnpm smoke:socrates` is part of the validation for this checkpoint.
- `pnpm smoke:study-flow` is part of the validation for this checkpoint.
- Latest study-flow smoke artifact values:
  - `asset_id=b34b3610-356c-4178-8cc1-395ea236e62f`
  - `review_id=b9799165-a02e-440f-a5fb-4dbc1933930b`

## Notes

- `docs/md_RELEASE_RUNBOOK.md` was intentionally left untouched because it still contains overlapping unrelated dirty changes.
- Historical progress docs that mention Node 20 were not rewritten, because they describe what was true at the time.
- The earlier Node 20 investigation remains documented, but it is no longer the active release policy for this repo.
- During validation, the unstable layer turned out to be `pnpm --filter ... build` for some packages on this machine, not the underlying app build CLIs themselves.
- The stable root build shape on this machine is:
  - shared TypeScript packages first
  - `landing` and `socrates` next
  - `essay` last

## Next Step

- Save this slice as the new local checkpoint.
- Keep the canonical runbook update deferred until `docs/md_RELEASE_RUNBOOK.md` is no longer in a conflicting dirty state.
