# Socrates Parent Action Copy Unification
Date: 2026-03-29

## Shipped In This Slice

- Continued Stage C by extracting the remaining major parent dashboard action copy into shared helpers in `apps/socrates/lib/error-loop/parent-insight-copy.ts`.
- Added shared helpers for:
  - mastery-balance summary copy
  - overdue-review action copy
  - pseudo-mastery action copy
  - surface-reflection action copy
- Updated `app/api/parent/insights/route.ts` so these dashboard/action outputs now consume shared copy helpers instead of maintaining inline wording:
  - `mastery_balance_label`
  - `mastery_balance_summary`
  - overdue-review parent action
  - pseudo-mastery parent action
  - surface-reflection parent action

## Current Judgment

- Parent insight route copy is now much more centralized than it was at the start of Stage C:
  - transfer-gap summary/action copy
  - review-intervention focus/action copy
  - pseudo-mastery / overdue-review / surface-reflection action copy
  are now resolved from shared helper modules instead of long inline wording trees
- This reduces the chance that dashboard summaries and action cards drift apart as the parent operating model evolves.

## Validation

- `pnpm --dir "D:\github\Socrates_ analysis\socra-platform" --filter @socra/socrates exec tsc --noEmit`
  - result: passed
- searched `parent/insights` route/helper usage after extraction
  - result: the newly extracted parent action copy now resolves from `parent-insight-copy.ts`

## Affected Files

- `apps/socrates/lib/error-loop/parent-insight-copy.ts`
- `apps/socrates/app/api/parent/insights/route.ts`
- `docs/md_progress_socrates_20260329_parent_action_copy_unification.md`

## Next Step

- Continue Stage C by checking whether the remaining semantic drift is now mostly outside parent insight route copy:
  - parent UI presentation labels
  - review-risk title generation
  - any remaining route-local wording around recent risks or conversation alerts
- Keep the next slice bounded to source-of-truth alignment, not product-surface expansion
