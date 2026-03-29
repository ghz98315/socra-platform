# Socrates Completion Flow Alignment
Date: 2026-03-28

## Shipped In This Slice

- Tightened the student post-submit completion flow so it now uses the same closure language as the in-session gate preview.
- Added a dedicated completion-state explanation card:
  - if the review item is closable, it explains why the loop can close now
  - if the review item is still provisional, it explains exactly what is still missing
- Added derived completion-state helpers in the review session page:
  - pending closure-gate items
  - pending short labels
  - next-step guidance based on transfer evidence and interval stability
- Reused `MIN_CLOSURE_REVIEW_STAGE` in the client so the completion message stays aligned with the actual closure rule.

## Current Judgment

- Stage A is now materially tighter:
  - before submit, the student can see what blocks closure
  - after submit, the student can see why the result is still provisional or why it can close
- This reduces the mismatch between:
  - the active review flow
  - the final result card
  - the underlying closure-gate rules
- The remaining stage-A work is mostly wording polish and optional UX refinement, not missing core explanation logic.

## Validation

- `pnpm --filter @socra/socrates exec tsc --noEmit`
  - result: passed

## Affected Files

- `apps/socrates/components/error-loop/ReviewAttemptSessionPage.tsx`
- `docs/md_progress_socrates_20260328_completion_flow_alignment.md`

## Next Step

- Stage A can now be treated as functionally covered for student-side gate explanation.
- Next move should shift to stage B:
  - parent-visible summary chain
  - parent intervention task loop
  - parent-facing visibility for transfer-evidence gaps and pseudo-mastery ratios
