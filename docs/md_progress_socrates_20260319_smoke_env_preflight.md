# Socrates Smoke Env Preflight
Date: 2026-03-19

## Shipped In This Slice

- Added `scripts/smoke-env.mjs` as a shared smoke environment loader and validator for Socrates smoke entrypoints.
- Updated `scripts/smoke-socrates.mjs` to:
  - auto-load `apps/socrates/.env.local`
  - auto-load `apps/socrates/.env.smoke.local`
  - print exact missing keys, checked env files, and the recommended `.env.smoke.local` copy target before any network request
- Updated `scripts/smoke-study-flow.mjs` with the same auto-load and preflight diagnostics behavior.

## Current Judgment

- Phase 3 cannot yet complete true runtime smoke because the local environment still lacks `SMOKE_BASE_URL` or `NEXT_PUBLIC_APP_URL`, plus the disposable smoke user ids.
- The smoke path is now materially easier to execute: the scripts no longer depend on the caller manually exporting every key when the repo-local smoke file exists.
- This closes a real tooling gap between the runbook guidance and the actual behavior of the smoke scripts.

## Affected Files

- `scripts/smoke-env.mjs`
- `scripts/smoke-socrates.mjs`
- `scripts/smoke-study-flow.mjs`
- `docs/md_progress_socrates_20260319_smoke_env_preflight.md`

## Commands Run

- `node --check scripts/smoke-env.mjs`
- `node --check scripts/smoke-socrates.mjs`
- `node --check scripts/smoke-study-flow.mjs`
- `pnpm check:env`
- `pnpm smoke:socrates`
- `pnpm smoke:study-flow`
- `pnpm build`

## Smoke

- Runtime smoke still skipped at the network stage because the environment is incomplete.
- Current missing values from the local shell and loaded Socrates env files:
  - `SMOKE_BASE_URL` or `NEXT_PUBLIC_APP_URL`
  - `SMOKE_USER_ID`
  - `SMOKE_STUDY_USER_ID`

## Notes

- `pnpm smoke:socrates` and `pnpm smoke:study-flow` now fail fast with actionable preflight output instead of a single missing-var line.
- `pnpm build` did not complete workspace-wide because `@socra/landing` failed with `STATUS_STACK_OVERFLOW`; `@socra/socrates` and `@socra/essay` still built during that run.
- Local Node remains `v22.19.0`; repo expectation is still `20.x`.
- `docs/md_RELEASE_RUNBOOK.md` already had overlapping dirty changes in the worktree, so this checkpoint intentionally leaves runbook edits out of the local commit to avoid mixing unrelated work.

## Next Step

- Provide or populate `apps/socrates/.env.smoke.local` with:
  - `SMOKE_BASE_URL` or `NEXT_PUBLIC_APP_URL`
  - `SMOKE_USER_ID`
  - `SMOKE_STUDY_USER_ID`
- Then rerun `pnpm smoke:socrates` and `pnpm smoke:study-flow` to execute the real Phase 3 runtime validation.
