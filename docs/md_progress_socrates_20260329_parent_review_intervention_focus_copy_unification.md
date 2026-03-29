# Socrates Parent Review Intervention Focus Copy Unification
Date: 2026-03-29

## Shipped In This Slice

- Continued Stage C by extracting parent review-intervention focus/action wording into shared helpers in `apps/socrates/lib/error-loop/parent-insight-copy.ts`.
- Added shared helpers for:
  - review-intervention focus summary copy
  - persisting-risk action copy
  - pending-task action copy
  - lowered-risk action copy
- Updated `app/api/parent/insights/route.ts` so these parent insight outputs now consume the shared review-intervention copy:
  - `intervention_focus_label`
  - `intervention_focus_summary`
  - `intervention_focus_value`
  - `intervention_focus_value_label`
  - related parent-action entries for persisting / pending / lowered review interventions

## Current Judgment

- Parent insight wording is now more centralized across the review-intervention branch:
  - dashboard focus card
  - parent action list
  - risk-persisting / pending / lowered follow-up guidance
- This closes another route-level drift point where the same review-intervention condition could be described once in the dashboard summary and again in the action list with different private wording trees.

## Validation

- `pnpm --dir "D:\github\Socrates_ analysis\socra-platform" --filter @socra/socrates exec tsc --noEmit`
  - result: passed
- searched route/helper usage after extraction
  - result: review-intervention focus/action wording now resolves from `parent-insight-copy.ts`

## Affected Files

- `apps/socrates/lib/error-loop/parent-insight-copy.ts`
- `apps/socrates/app/api/parent/insights/route.ts`
- `docs/md_progress_socrates_20260329_parent_review_intervention_focus_copy_unification.md`

## Next Step

- Continue Stage C by checking whether the remaining parent wording drift is now mostly in:
  - pseudo-mastery balance copy
  - overdue-review action copy
  - surface-reflection action copy
- Keep the next slice bounded to copy/source-of-truth alignment, not behavior changes
