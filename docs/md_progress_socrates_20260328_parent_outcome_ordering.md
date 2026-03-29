# Socrates Parent Outcome Ordering
Date: 2026-03-28

## Shipped In This Slice

- Extended Stage B from signal visibility into outcome-aware ordering.
- Removed the early raw-risk slice so recent review risks can first be linked with intervention state and only then be ordered for display.
- Reordered parent `recent_risks` so the page now prioritizes:
  - review risks whose linked intervention still shows `risk_persisting`
  - review risks with an existing intervention task that is still pending
  - review risks that still have closure pressure but no visible intervention linkage
  - only then plain risk score / recency
- Reordered `intervention_outcomes` so parent feedback blocks now surface more actionable items first:
  - review interventions with persisting risk
  - pending interventions
  - lower-priority completed outcomes whose risk already lowered
- Kept the existing risk score and recency signals as secondary ordering inputs instead of removing them entirely.

## Current Judgment

- The parent page is now closer to an operational dashboard than a static summary.
- Ordering now reflects where the loop is failing, not only where activity happened most recently.
- This reduces the chance that:
  - “补救后仍重复”的题被压到下面
  - already-lowered interventions visually crowd out unresolved work
- Stage B is now functionally covered on:
  - signal visibility
  - risk/action linkage
  - outcome-aware prioritization
- Remaining work is likely cross-surface consolidation rather than missing core loop logic.

## Validation

- `pnpm --filter @socra/socrates exec tsc --noEmit`
  - result: passed

## Affected Files

- `apps/socrates/app/api/parent/insights/route.ts`
- `docs/md_progress_socrates_20260328_parent_outcome_ordering.md`

## Next Step

- Decide whether Stage B should stop here and move to Stage C, or do one consolidation slice first:
  - align parent tasks page ordering with the same outcome-aware semantics
  - verify review-intervention status language is consistent across controls, tasks, and notifications
