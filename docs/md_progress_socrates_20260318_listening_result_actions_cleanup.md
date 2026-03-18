# Socrates English Listening Result Actions Cleanup
Date: 2026-03-18

## Shipped In This Slice

- Removed the last duplicated review-bridge state and hidden result-action block from `apps/socrates/components/study/EnglishListeningStudioV2.tsx`.
- Kept `StudyAssetResultActionsV2` as the single result-action entry for:
  - detail page
  - report jump
  - add-to-review
  - review bridge feedback
- Simplified reset behavior in the listening workspace so it only resets local session/chat state and no longer carries duplicate result-action state.

## Current Judgment

- `EnglishListeningStudioV2` is now aligned with the shared V2 result-action contract.
- The result area no longer carries hidden legacy JSX or local review-bridge state that competes with the shared component.
- This reduces duplication and makes later result-contract cleanup in other workspaces more predictable.

## Affected Files

- `apps/socrates/components/study/EnglishListeningStudioV2.tsx`
- `docs/md_progress_socrates_20260318_listening_result_actions_cleanup.md`

## Commands Run

- `pnpm exec tsc --noEmit -p apps/socrates/tsconfig.json`
- `pnpm --filter @socra/socrates build`

## Smoke

- Study-flow smoke skipped because `SMOKE_STUDY_USER_ID` is still not configured.

## Notes

- Local Node remains `v22.19.0`; repo expectation is still `20.x`.
- Cleanup was done with a narrow, recovery-safe approach because the V2 workspace files still have encoding-sensitive regions.

## Next Step

- Retry the same result-contract cleanup on `apps/socrates/components/study/WritingStudioV2.tsx` with an equally narrow approach.
- After that, evaluate whether `ChineseAnalysisStudioV2.tsx` can safely shed its remaining hidden legacy result-action block without destabilizing the file.
