# Socrates Smoke Runtime Success
Date: 2026-03-19

## Shipped In This Slice

- Fixed `scripts/check-env.mjs` load precedence so real local env files now override example files instead of being overwritten by empty template values.
- Extended `scripts/smoke-env.mjs` with UUID validation helpers for smoke user identifiers.
- Updated `scripts/smoke-socrates.mjs` and `scripts/smoke-study-flow.mjs` to fail fast on invalid UUID-shaped smoke ids before any network request.
- Executed both runtime smoke flows successfully after switching to a real student UUID that exists in both `auth.users` and `profiles`.

## Current Judgment

- Phase 3 is now complete.
- The study/report/review runtime bridge is no longer only build-validated; it has now been exercised end-to-end through the deployed/local runtime APIs.
- A real environment trap was found and resolved in this pass:
  - a previously supplied UUID was not present in `auth.users`, so `study_assets.student_id` failed its foreign-key constraint
  - smoke tooling now catches bad UUID format early, and the successful rerun confirms the remaining runtime path is healthy

## Affected Files

- `scripts/check-env.mjs`
- `scripts/smoke-env.mjs`
- `scripts/smoke-socrates.mjs`
- `scripts/smoke-study-flow.mjs`
- `docs/md_progress_socrates_20260319_smoke_runtime_success.md`

## Commands Run

- `pnpm check:env`
- `pnpm smoke:socrates`
- `pnpm smoke:study-flow`
- direct debug insert against `study_assets` via local Node script in `apps/socrates`

## Smoke

- `pnpm smoke:socrates` passed.
- `pnpm smoke:study-flow` passed.
- Successful study-flow smoke artifacts:
  - `asset_id=266a715c-2735-417c-b0c6-b8e4f3e8b223`
  - `review_id=a94b91df-ecb7-4f1f-96a8-c4457da4b5fd`

## Notes

- `pnpm build` had previously still failed at workspace level because `@socra/landing` hit `STATUS_STACK_OVERFLOW`; that remains separate from the Socrates runtime smoke result.
- Local Node remains `v22.19.0`; repo expectation is still `20.x`.
- `docs/md_RELEASE_RUNBOOK.md` still has overlapping dirty worktree changes, so this checkpoint intentionally leaves runbook edits unstaged.

## Next Step

- Move to Phase 4: sync release/readiness docs with the now-confirmed smoke status, while keeping unrelated dirty documentation edits isolated.
