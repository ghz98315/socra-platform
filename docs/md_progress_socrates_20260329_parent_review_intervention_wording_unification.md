# Socrates Parent Review Intervention Wording Unification
Date: 2026-03-29

## Shipped In This Slice

- Continued Stage C by extracting parent-side review-intervention task wording into a shared helper.
- Added `getParentMasteryInterventionTaskMeta(...)` in `apps/socrates/lib/notifications/intervention-status.ts`.
- Centralized parent task wording for:
  - mastery-risk vs transfer-evidence-gap task labels
  - completed / pending / in-progress state titles
  - action labels
  - state badges
  - transfer-evidence-specific resolved wording such as:
    - `补做后已形成迁移证据`
    - `补做后仍缺迁移证据`
- Updated `app/(parent)/tasks/page.tsx` so `getReviewInterventionMeta(...)` now delegates its wording decisions to the shared helper instead of maintaining a private branch tree.

## Current Judgment

- This slice reduces another parent-side wording drift point:
  - parent tasks no longer keep a separate interpretation of review-intervention outcome language
  - transfer-evidence follow-up wording is now more aligned with notification semantics
- Stage C is now tighter across:
  - notifications
  - parent tasks
  - review intervention state descriptions

## Validation

- `pnpm --dir "D:\github\Socrates_ analysis\socra-platform" --filter @socra/socrates exec tsc --noEmit`
  - result: passed
- searched parent task wording after extraction
  - result: wording now resolves from shared helper in `intervention-status.ts`

## Affected Files

- `apps/socrates/lib/notifications/intervention-status.ts`
- `apps/socrates/app/(parent)/tasks/page.tsx`
- `docs/md_progress_socrates_20260329_parent_review_intervention_wording_unification.md`

## Next Step

- Continue Stage C by checking whether `ParentInsightControlPage.tsx` still has review-intervention wording or status labels that should consume the same shared helper.
- Keep the next slice bounded to parent-side semantic alignment, not data-shape changes.
