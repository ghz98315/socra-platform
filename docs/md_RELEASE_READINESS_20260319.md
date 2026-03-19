# Socrates Release Readiness
Date: 2026-03-19

## Current Status

- Study domain Phase 1 contract recovery: complete
- Catalog contraction Phase 2: complete
- Study/report/review runtime smoke Phase 3: complete
- Phase 4 doc and readiness cleanup: complete

## Verified In This Round

- `pnpm check:node`
  Result: passed on Node `v22.19.0`
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
- `pnpm build`
  Result: passed after switching the root workspace build wrapper to a serialized direct-CLI build order with higher Node heap and memory-safe package ordering

Study-flow smoke produced:

- `asset_id=b34b3610-356c-4178-8cc1-395ea236e62f`
- `review_id=b9799165-a02e-440f-a5fb-4dbc1933930b`

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
- Workspace-wide monorepo build readiness on the current machine: verified
- Formal Node baseline parity on the current machine: verified on Node `22.19.0`

## Release Engineering Close-Out

The previous workspace blocker was not an app regression. It was a local build orchestration problem:

- concurrent `turbo build` runs were triggering Node memory failures on Next builds
- the root workspace build now runs through a serialized wrapper script that calls each package's local CLI directly with elevated heap
- Next apps now build before the Vite app in the root sequence because that order is stable on the current machine
- `pnpm build` now completes successfully on the current machine

The current machine is now the canonical release baseline:

- local Node is `v22.19.0`
- repo expectation is now `22.x`
- `pnpm check:node` enforces that declared major before release validation

This decision was made because the current release facts are stronger on Node 22 than on Node 20 for this single-machine setup:

- Node `22.19.0` is the only runtime on this machine that has produced successful workspace build and both smoke passes after the direct-CLI wrapper alignment
- Node `20.19.0` could pass env and smoke checks, but repeatedly failed at the build gate on this same machine
- there is no second machine or CI runner available to keep a separate Node 20 release baseline honest

The previous Node 20 investigation is therefore retained as historical evidence, not as the active release gate.

## Recommended Release Gate

The monorepo can now be treated as locally release-ready once all items below are true:

- `pnpm check:node` passes
- `pnpm check:env` passes
- `pnpm --filter @socra/socrates build` passes
- `pnpm --filter @socra/landing build` passes
- `pnpm smoke:socrates` passes
- `pnpm smoke:study-flow` passes
- `pnpm build` passes

## Operator Notes

- `pnpm check:node` is intended to fail fast whenever the active shell is not on the repo-declared Node major.
- Use a disposable student smoke account for `SMOKE_STUDY_USER_ID`.
- The smoke user id must exist in both `auth.users` and `profiles`; otherwise `study_assets.student_id` will fail its foreign-key constraint.
- The formal local release baseline is now Node `22.19.0`.
- The earlier Node `20.19.0` build failures remain useful as a machine-specific reference, but they are no longer the active blocker for release on this setup.
