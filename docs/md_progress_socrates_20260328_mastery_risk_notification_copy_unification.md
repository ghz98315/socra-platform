# Socrates Mastery Risk Notification Copy Unification
Date: 2026-03-28

## Shipped In This Slice

- Continued Stage C by moving parent mastery-risk notification wording behind a shared helper.
- Added `buildMasteryRiskNotificationCopy(...)` to `apps/socrates/lib/notifications/intervention-status.ts`.
- Centralized notification copy decisions for:
  - mastery-risk alerts
  - transfer-evidence-gap alerts
  - action text
  - priority
- Updated `app/api/review/attempt/route.ts` so parent `mastery_update` notifications now consume the shared helper instead of building ad hoc strings inline.

## Current Judgment

- This slice removes one more message-semantic drift point from the review loop:
  - route logic now decides *when* to notify
  - shared helper now decides *how* that state should be described
- The mainline is cleaner because closure-state, interval cadence, and risk-notification wording are no longer split across many private maps.

## Validation

- `pnpm --filter @socra/socrates exec tsc --noEmit`
  - result: passed

## Affected Files

- `apps/socrates/lib/notifications/intervention-status.ts`
- `apps/socrates/app/api/review/attempt/route.ts`
- `docs/md_progress_socrates_20260328_mastery_risk_notification_copy_unification.md`

## Next Step

- Continue Stage C by checking whether review judgement guidance and parent-risk copy should share the same judgement-to-language metadata:
  - inspect `buildJudgementGuidance(...)`
  - compare it with the new notification-copy helper
  - only extract shared judgement language if it reduces drift without flattening audience-specific wording
