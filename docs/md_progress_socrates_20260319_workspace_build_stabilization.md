# Socrates Workspace Build Stabilization
Date: 2026-03-19

## Shipped In This Slice

- Replaced the root workspace build path with `scripts/run-turbo-build.mjs`.
- Updated root `package.json` so:
  - `pnpm build`
  - `pnpm release`
  now use the wrapper instead of raw `turbo build`.
- Changed the wrapper from Turbo-driven concurrent builds to an explicit serialized package build order:
  - `@socra/auth`
  - `@socra/config`
  - `@socra/database`
  - `@socra/ui`
  - `@socra/essay`
  - `@socra/landing`
  - `@socra/socrates`
- Kept elevated Node heap in the wrapper so the app builds remain stable on the current machine.

## Current Judgment

- The release-engineering blocker after Phase 4 is now resolved.
- `pnpm build` is green again on the current machine without depending on Turbo concurrency behavior.
- This is a pragmatic stability fix, not a product/runtime change: app code paths remain the same, only workspace build orchestration changed.

## Affected Files

- `package.json`
- `scripts/run-turbo-build.mjs`
- `docs/md_RELEASE_READINESS_20260319.md`
- `docs/md_progress_socrates_20260319_workspace_build_stabilization.md`

## Commands Run

- `node --check scripts/run-turbo-build.mjs`
- `pnpm build`

## Smoke

- No new smoke command ran in this exact slice.
- This slice depends on the already successful smoke baseline from the previous checkpoint:
  - `pnpm smoke:socrates`
  - `pnpm smoke:study-flow`

## Notes

- Earlier attempts using Turbo concurrency still hit Next build memory failures on this machine, even with raised heap.
- The serialized workspace wrapper is intentionally conservative because stability matters more than local build speed at this stage.
- Local Node remains `v22.19.0`; repo expectation is still `20.x`.

## Next Step

- The current roadmap thread is complete.
- Any next work should be a new thread, such as:
  - merging clean readiness conclusions back into the canonical runbook after dirty doc state is resolved
  - switching the machine or CI to Node 20 for final environment parity
