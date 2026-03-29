# Socrates Notification Effect Helper Unification
Date: 2026-03-28

## Shipped In This Slice

- Started Stage C by reducing duplicated review-intervention effect logic.
- Added a shared helper in `review.ts` for review intervention follow-up evaluation:
  - `pending`
  - `risk_lowered`
  - `risk_persisting`
- Switched `app/api/parent/insights/route.ts` to use the shared helper for review intervention effects.
- Switched `app/api/parent-tasks/route.ts` to use the same helper when enriching review intervention tasks.
- Switched `app/api/notifications/route.ts` to use the same helper when enriching mastery-risk notifications.
- This removes a concrete duplication hotspot where the same follow-up semantics were previously reimplemented separately in:
  - parent insights
  - parent tasks
  - notifications

## Current Judgment

- Stage C is now underway in the correct direction:
  - fewer duplicated rule branches
  - fewer chances for transfer-evidence-gap and mastery-risk semantics to drift apart between APIs
- This slice did not change the overall product flow.
- It tightened the rule source-of-truth for one important part of the loop:
  - what it means for a review intervention to still be pending
  - what it means for a risk to persist after intervention
  - what counts as lowered risk

## Validation

- `pnpm --filter @socra/socrates exec tsc --noEmit`
  - result: passed

## Affected Files

- `apps/socrates/lib/error-loop/review.ts`
- `apps/socrates/app/api/parent/insights/route.ts`
- `apps/socrates/app/api/parent-tasks/route.ts`
- `apps/socrates/app/api/notifications/route.ts`
- `docs/md_progress_socrates_20260328_notification_effect_helper_unification.md`

## Next Step

- Continue Stage C by looking for the next duplicated rule surface:
  - shared wording/status helpers for notification UIs
  - shared ordering/priority semantics between parent controls and parent tasks
  - any remaining transfer-evidence special cases that still diverge by surface
