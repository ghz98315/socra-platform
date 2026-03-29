# Socrates Notification UI Status Helper Unification
Date: 2026-03-28

## Shipped In This Slice

- Continued Stage C by removing duplicated intervention-status wording across notification UIs.
- Added a shared notification helper:
  - `apps/socrates/lib/notifications/intervention-status.ts`
- Centralized status text for:
  - conversation intervention status
  - mastery / transfer-evidence intervention status
- Updated the following UI surfaces to use the shared helper instead of local duplicated string branches:
  - `components/NotificationCenter.tsx`
  - `components/notifications/NotificationBell.tsx`
  - `app/(student)/notifications/page.tsx`
- As a side effect, notification surfaces now use the same shorter Chinese status phrasing instead of drifting between English, long-form Chinese, and slightly different variants.

## Current Judgment

- Stage C is now reducing both rule duplication and wording duplication.
- This matters because the product had already started to converge on a stable intervention loop, but notification surfaces were still prone to copy drift.
- Shared notification copy now lowers the chance that one surface says:
  - “已完成”
  while another says:
  - “等待后续验证”
- The next worthwhile Stage C target is likely shared priority/ordering semantics rather than more string cleanup.

## Validation

- `pnpm --filter @socra/socrates exec tsc --noEmit`
  - result: passed

## Affected Files

- `apps/socrates/lib/notifications/intervention-status.ts`
- `apps/socrates/components/NotificationCenter.tsx`
- `apps/socrates/components/notifications/NotificationBell.tsx`
- `apps/socrates/app/(student)/notifications/page.tsx`
- `docs/md_progress_socrates_20260328_notification_ui_status_helper_unification.md`

## Next Step

- Continue Stage C by checking whether shared ordering/priority semantics should also be extracted:
  - parent controls risk ordering
  - parent tasks ordering
  - any notification prioritization that should respect the same intervention outcomes
