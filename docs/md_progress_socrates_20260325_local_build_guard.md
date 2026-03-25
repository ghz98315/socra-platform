# Socrates Local Build Guard
Date: 2026-03-25

## Shipped In This Slice

- Added `scripts/build-socrates-safe.mjs` as the canonical Socrates build entrypoint for local work.
- Added `scripts/socrates-local-utils.mjs` so the local helper scripts resolve repo paths consistently even when invoked from different working directories.
- Replaced the local start helper's nested PowerShell launch path with a detached Node child-process launch so the helper can return more reliably and keep the PID file aligned with the actual server process.
- Updated both Socrates build entry paths to use the same guard:
  - root workspace build via `scripts/run-turbo-build.mjs`
  - direct app build via `apps/socrates/package.json`
- Updated the release runbook to document the new fail-fast behavior.

## Current Judgment

- The local helper flow is now backed by a build-time guard, not just a manual convention.
- If the helper-managed local Socrates service is still alive, or port `3000` is still actively serving without a tracked PID, Socrates builds now stop immediately with explicit recovery instructions.
- This should prevent the most common local Windows mistake in this thread:
  - leaving `next start` attached to `apps/socrates/.next`
  - then rerunning `next build`
  - and interpreting a later file-lock failure as a fresh product regression

## Affected Files

- `scripts/build-socrates-safe.mjs`
- `scripts/socrates-local-utils.mjs`
- `scripts/start-socrates-local.mjs`
- `scripts/status-socrates-local.mjs`
- `scripts/stop-socrates-local.mjs`
- `scripts/run-turbo-build.mjs`
- `apps/socrates/package.json`
- `docs/md_RELEASE_RUNBOOK.md`
- `docs/md_progress_socrates_20260325_local_build_guard.md`

## Commands To Validate

- `node --check scripts/socrates-local-utils.mjs`
- `node --check scripts/build-socrates-safe.mjs`
- `node --check scripts/start-socrates-local.mjs`
- `node --check scripts/status-socrates-local.mjs`
- `node --check scripts/stop-socrates-local.mjs`
- `node scripts/build-socrates-safe.mjs --check-only`
- `node ../../scripts/build-socrates-safe.mjs --check-only` from `apps/socrates`

## Next Step

- Revalidate the helper-managed running-service case on the local machine:
  - `pnpm socrates:start:local`
  - `node scripts/build-socrates-safe.mjs --check-only`
  - confirm the guard blocks
  - `pnpm socrates:stop:local`
- If that behaves correctly, the local deployment workflow can be treated as closed and feature work can resume on top of it.
