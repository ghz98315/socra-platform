# Socrates Release Readiness
Date: 2026-03-19

## Current Status

- Study domain Phase 1 contract recovery: complete
- Catalog contraction Phase 2: complete
- Study/report/review runtime smoke Phase 3: complete
- Phase 4 doc and readiness cleanup: complete

## Verified In This Round

- `pnpm check:env`
  Result: passed
- `pnpm smoke:socrates`
  Result: passed
- `pnpm smoke:study-flow`
  Result: passed
- `pnpm --filter @socra/socrates build`
  Result: passed in previous phase checkpoints
- `pnpm --filter @socra/landing build`
  Result: passed

Study-flow smoke produced:

- `asset_id=266a715c-2735-417c-b0c6-b8e4f3e8b223`
- `review_id=a94b91df-ecb7-4f1f-96a8-c4457da4b5fd`

## Release Judgment

The Socrates app path that matters for the multisubject internal beta is now runtime-validated:

- study asset creation
- study asset detail
- review bridge creation
- study report generation
- review schedule visibility

The current release picture is therefore:

- Socrates runtime readiness: verified
- Socrates smoke readiness: verified
- Landing app build readiness: verified
- Workspace-wide monorepo release readiness: not fully closed

## Remaining Blocker

`pnpm build` is still not consistently green at workspace level in the current machine/runtime combination.

Most recent confirmed blocker:

- `@socra/socrates#build` failed under `turbo build` with Node heap out-of-memory
- local Node is still `v22.19.0`
- repo expectation remains `20.x`

This means the internal beta validation thread is complete, but the final monorepo release gate should still require one more clean workspace build on the intended Node 20 environment.

## Recommended Release Gate

Do not call the whole monorepo release-ready until all items below are true:

- `pnpm check:env` passes
- `pnpm --filter @socra/socrates build` passes
- `pnpm --filter @socra/landing build` passes
- `pnpm smoke:socrates` passes
- `pnpm smoke:study-flow` passes
- `pnpm build` passes on Node 20

## Operator Notes

- Use a disposable student smoke account for `SMOKE_STUDY_USER_ID`.
- The smoke user id must exist in both `auth.users` and `profiles`; otherwise `study_assets.student_id` will fail its foreign-key constraint.
- If workspace build still fails only under local Turbo concurrency, treat that as a separate release-engineering issue from Socrates runtime correctness.
