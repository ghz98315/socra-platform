# Socrates Parent Priority Helper Unification
Date: 2026-03-28

## Shipped In This Slice

- Continued Stage C by extracting parent-side priority semantics into a shared helper.
- Added:
  - `apps/socrates/lib/error-loop/parent-priority.ts`
- Centralized two previously duplicated priority rules:
  - intervention-task ordering priority
  - recent-risk ordering priority
- Updated parent insights to use the shared helper when ordering:
  - `intervention_outcomes`
  - `recent_risks`
- Updated parent tasks page to use the same shared intervention-task priority helper for task ordering.
- This removes a drift risk where parent controls and parent tasks could gradually evolve different urgency semantics for the same review-intervention states.

## Current Judgment

- Stage C is now consolidating not only wording and effect rules, but also action ordering.
- This matters for the project closure loop because the user should see the same urgency judgment regardless of whether they enter from:
  - parent controls
  - parent tasks
- The product is now closer to one coherent parent operating model instead of several adjacent views.

## Validation

- `pnpm --filter @socra/socrates exec tsc --noEmit`
  - result: passed

## Affected Files

- `apps/socrates/lib/error-loop/parent-priority.ts`
- `apps/socrates/app/api/parent/insights/route.ts`
- `apps/socrates/app/(parent)/tasks/page.tsx`
- `docs/md_progress_socrates_20260328_parent_priority_helper_unification.md`

## Next Step

- Continue Stage C by checking for the next remaining cross-surface drift source:
  - parent action generation vs shared priority helpers
  - conversation-intervention effect semantics
  - any status/badge helpers still duplicated between controls and tasks
