# Socrates Parent Action Priority Alignment
Date: 2026-03-28

## Shipped In This Slice

- Tightened parent-insights prioritization so intervention guidance now distinguishes three materially different states:
  - review intervention exists but is still pending
  - review intervention completed but risk is still repeating
  - review intervention completed and risk has lowered
- Added new review-intervention aggregates in parent insights:
  - pending review interventions without parent feedback
  - completed review interventions whose risk is still persisting
  - completed review interventions whose risk has lowered
- Updated `summary_chain` so the “当前干预重点” card no longer always shows the pending-review metric:
  - it now exposes a dynamic focus value
  - it now exposes a matching metric label
  - this keeps the numeric headline aligned with the current focus summary
- Reordered parent actions so “补救后风险仍持续” is treated ahead of generic pending-task pressure.
- Refined action copy for pending review interventions so the page calls out missing parent feedback when tasks exist but no closure note has been written yet.
- Added a medium-priority retention action for intervention patterns that already lowered risk, so useful陪练动作 can be reused instead of rediscovered.

## Current Judgment

- Stage B is now stronger on prioritization, not just visibility.
- The parent page can better separate:
  - tasks that still need execution
  - tasks that were executed but failed to lower risk
  - tasks that appear to be working
- This keeps the parent action list closer to the real intervention loop instead of mixing all review pressure into one generic bucket.
- The next remaining Stage B opportunity is to decide whether these outcome-aware priorities should also influence:
  - recent-risk ordering
  - intervention-outcome ordering
  - parent task defaults outside the insights page

## Validation

- `pnpm --filter @socra/socrates exec tsc --noEmit`
  - result: passed

## Affected Files

- `apps/socrates/app/api/parent/insights/route.ts`
- `apps/socrates/components/error-loop/ParentInsightControlPage.tsx`
- `docs/md_progress_socrates_20260328_parent_action_priority_alignment.md`

## Next Step

- Continue Stage B by deciding whether outcome-aware ordering should propagate beyond action summaries:
  - reorder recent risks by intervention persistence pressure, not only raw recency/risk
  - surface stronger follow-up copy when a risk has no visible intervention closure yet
  - check whether parent tasks page should reuse the same priority semantics
