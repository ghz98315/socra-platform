# Socrates Notification Intervention Wording Alignment
Date: 2026-03-28

## Shipped In This Slice

- Tightened notification wording so intervention-completion messages no longer overstate closure.
- Updated parent/student notification surfaces to use “已完成，等待后续验证” wording when:
  - an intervention task is completed
  - but the system has not yet confirmed `risk_lowered` or `risk_persisting`
- Applied this wording alignment across:
  - `components/NotificationCenter.tsx`
  - `components/notifications/NotificationBell.tsx`
  - `app/(student)/notifications/page.tsx`
- Kept stronger outcome wording unchanged for the two real resolved states:
  - `risk_lowered`
  - `risk_persisting`

## Current Judgment

- Stage B is now materially consistent across the main parent-facing and notification-facing surfaces:
  - parent controls
  - parent tasks
  - notifications
- This removes one common source of semantic drift:
  - tasks/controls say “等待后续验证”
  - notifications previously said only “已完成”
- The remaining remaining consolidation work is narrower and more strategic than structural.

## Validation

- `pnpm --filter @socra/socrates exec tsc --noEmit`
  - result: passed

## Affected Files

- `apps/socrates/components/NotificationCenter.tsx`
- `apps/socrates/components/notifications/NotificationBell.tsx`
- `apps/socrates/app/(student)/notifications/page.tsx`
- `docs/md_progress_socrates_20260328_notification_intervention_wording_alignment.md`

## Next Step

- Stage B can now be treated as largely consolidated.
- Next move should shift into Stage C:
  - unify judgement / closure / intervention semantics as shared rules
  - reduce duplicate effect-calculation and wording drift across APIs and views
