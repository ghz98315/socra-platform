# Socrates Review Interval Schedule Unification
Date: 2026-03-28

## Shipped In This Slice

- Continued Stage C by consolidating review cadence and state-transition rules into shared helpers.
- Added shared schedule helpers in `apps/socrates/lib/error-loop/review.ts`:
  - `REVIEW_INTERVAL_DAYS`
  - `getReviewIntervalDays`
  - `getScheduledReviewDate`
  - `deriveReviewScheduleUpdate`
- Replaced local review-transition logic in `app/api/review/attempt/route.ts` with the shared transition helper.
- Replaced duplicated “schedule first review for tomorrow” logic in these creation paths:
  - `app/api/error-session/complete/route.ts`
  - `app/api/review/add/route.ts`
  - `app/api/study/assets/review/route.ts`
- Rewired `apps/socrates/lib/review/utils.ts` to build `REVIEW_STAGES` from the shared interval source instead of keeping its own hardcoded day list.

## Current Judgment

- This slice closes a real mainline drift point:
  - stage labels, first-review scheduling, and post-attempt advancement no longer maintain separate interval tables
  - the old mismatch between UI stage timing and API transition timing is removed
  - future cadence changes now have one source of truth
- The shared state model is now covering both:
  - what closure states mean
  - when the loop advances, reopens, or closes

## Validation

- `pnpm --filter @socra/socrates exec tsc --noEmit`
  - result: passed

## Affected Files

- `apps/socrates/lib/error-loop/review.ts`
- `apps/socrates/app/api/review/attempt/route.ts`
- `apps/socrates/app/api/error-session/complete/route.ts`
- `apps/socrates/app/api/review/add/route.ts`
- `apps/socrates/app/api/study/assets/review/route.ts`
- `apps/socrates/lib/review/utils.ts`
- `docs/md_progress_socrates_20260328_review_interval_schedule_unification.md`

## Next Step

- Continue Stage C by tightening the remaining transition-language boundary:
  - inspect parent notification content emitted from `app/api/review/attempt/route.ts`
  - decide whether review-risk / transfer-gap notification copy should move behind shared helper metadata
  - keep the next slice bounded to message semantics, not new surface area
