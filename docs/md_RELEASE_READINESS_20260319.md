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
- `pnpm build`
  Result: passed after switching the root workspace build wrapper to a serialized package-by-package build with higher Node heap

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
- Workspace-wide monorepo build readiness on the current machine: verified
- Formal Node 20 parity on the current machine: blocked at build stage

## Release Engineering Close-Out

The previous workspace blocker was not an app regression. It was a local build orchestration problem:

- concurrent `turbo build` runs were triggering Node memory failures on Next builds
- the root workspace build now runs through a serialized wrapper script with elevated heap
- `pnpm build` now completes successfully on the current machine

The remaining residual note is environmental, not blocking:

- local Node is still `v22.19.0`
- repo expectation remains `20.x`
- `pnpm check:node` now reports that mismatch explicitly so final release validation does not silently run on the wrong major

After switching the shell to Node `v20.19.0`, the environment picture became more precise:

- `node scripts/check-node-version.mjs` passed
- `node scripts/check-env.mjs` passed
- `node scripts/smoke-socrates.mjs` passed
- `node scripts/smoke-study-flow.mjs` passed
- build paths still failed on the current machine under Node 20

The Node 20 build failures were repeatable across multiple entry points:

- `pnpm build` failed immediately at `@socra/auth` with a V8 zone out-of-memory crash during `tsc`
- direct Next builds for `landing` and `socrates` also failed with the same class of memory crash
- direct Vite build for `essay` failed with native memory allocation failure

This means runtime parity was verified on Node 20, but formal build parity on this machine is still blocked.

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
- The repo still prefers Node 20 for formal release environments, even though the current local release pass completed on Node 22.
- On the current Windows machine, Node `20.19.0` is enough for env and smoke validation, but not enough to complete the build gate without hitting repeatable memory failures.
