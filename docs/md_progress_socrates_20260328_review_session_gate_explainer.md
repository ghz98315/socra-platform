# Socrates Review Session Gate Explainer
Date: 2026-03-28

## Shipped In This Slice

- Extended the student review session so active review flow now explains why a review item is not yet closable.
- Added a closure-gate preview card to the review intro step:
  - shows current gate summary
  - shows which closure conditions are already satisfied
  - shows what is still missing before the loop can close
- Added the same closure-gate preview to the review judgement step so the student sees the closure standard again immediately before submitting evidence.
- Reused the latest review-attempt evidence plus current variant evidence to compute the current closure preview on the client:
  - independent completion
  - no AI hints
  - explanation quality
  - variant transfer
  - interval stability
- Extended local attempt-history state after submit so the page can continue to evaluate closure gates without losing the latest evidence details.

## Current Judgment

- The student-side active review flow now answers the main checkpoint questions inside the page instead of only after submit:
  - why this题 is still provisional
  - what evidence is still missing
  - what next action closes the loop
- This closes the biggest stage-A explanation gap without changing the underlying review-closure rules.
- The page still relies on the existing review-attempt API as the source of truth for final judgement and closure.

## Validation

- `pnpm --filter @socra/socrates exec tsc --noEmit`
  - result: passed

## Affected Files

- `apps/socrates/components/error-loop/ReviewAttemptSessionPage.tsx`
- `docs/md_progress_socrates_20260328_review_session_gate_explainer.md`

## Next Step

- Continue stage A by tightening the completion flow wording so the post-submit view and the in-session gate preview use fully aligned language for:
  - provisional mastery
  - transfer-evidence gap
  - interval-stability gap
- After that, move into stage B:
  - parent-visible summary chain
  - parent intervention task loop
