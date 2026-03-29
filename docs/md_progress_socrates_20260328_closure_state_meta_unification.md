# Socrates Closure State Meta Unification
Date: 2026-03-28

## Shipped In This Slice

- Continued Stage C by consolidating closure-state display semantics into one shared source.
- Added shared closure-state metadata in `apps/socrates/lib/error-loop/review.ts`:
  - `ReviewClosureState`
  - `ReviewClosureStateMeta`
  - `REVIEW_CLOSURE_STATE_META`
  - `isReviewClosureState`
  - `getClosureStateMeta`
- Removed duplicated `getClosureStateMeta(...)` implementations from these student surfaces:
  - review hub
  - error book list
  - error detail
  - review session
- Standardized the four product-visible closure states:
  - `open`
  - `provisional_mastered`
  - `reopened`
  - `mastered_closed`
- Added `compactLabel` so dense list surfaces can stay concise without drifting away from the shared state model.

## Current Judgment

- This slice reduces one more class of semantic drift:
  - list pages no longer maintain their own shortened badge wording
  - detail and session pages no longer carry private copies of state descriptions
  - future closure-state wording changes now have one edit point
- Stage C now has shared helpers covering:
  - mastery judgement metadata
  - review intervention effect
  - conversation intervention effect
  - parent priority
  - closure-state labels and descriptions

## Validation

- `pnpm --filter @socra/socrates exec tsc --noEmit`
  - result: passed

## Affected Files

- `apps/socrates/lib/error-loop/review.ts`
- `apps/socrates/app/(student)/review/page.tsx`
- `apps/socrates/app/(student)/error-book/page.tsx`
- `apps/socrates/app/(student)/error-book/[id]/page.tsx`
- `apps/socrates/components/error-loop/ReviewAttemptSessionPage.tsx`
- `docs/md_progress_socrates_20260328_closure_state_meta_unification.md`

## Next Step

- Continue Stage C by checking the remaining state-transition boundary instead of UI copies:
  - inspect `apps/socrates/app/api/review/attempt/route.ts`
  - inspect adjacent schedule / completion update paths
  - verify that closure, reopen, and follow-up messaging all consume the same state semantics
