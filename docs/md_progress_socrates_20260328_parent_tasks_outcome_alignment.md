# Socrates Parent Tasks Outcome Alignment
Date: 2026-03-28

## Shipped In This Slice

- Aligned the parent tasks page with the same review-intervention effect semantics already used in the parent control loop.
- Added a shared review-intervention effect helper in `review.ts` so review follow-up state can be evaluated from one place:
  - pending
  - risk lowered
  - risk persisting
- Updated parent insights to use that shared helper for review-intervention effects, reducing rule drift between pages.
- Extended the parent tasks API to enrich review intervention tasks with:
  - `intervention_effect`
  - `post_intervention_repeat_count`
- Updated the parent tasks page so review intervention cards now distinguish:
  - pending with no feedback yet
  - completed but still waiting for follow-up verification
  - completed and risk lowered
  - completed and risk persisting
- Added outcome-aware ordering on the parent tasks page so the list now surfaces:
  - persisting review risks first
  - pending review interventions without feedback next
  - lower-value completed items later
- Updated the intervention summary banner on the parent tasks page so it reports:
  - still-persisting review interventions
  - feedback-missing review interventions
  - lowered-risk review interventions

## Current Judgment

- Stage B now spans both main parent surfaces:
  - `controls` can explain and navigate the intervention loop
  - `tasks` can show the same intervention loop with matching outcome semantics
- This reduces a previous mismatch where the tasks page treated review interventions mostly like generic tasks even after the controls page had richer outcome logic.
- The remaining risk is cross-surface wording drift:
  - notifications
  - parent tasks
  - parent controls
  should keep using the same effect language for “仍在重复 / 风险下降 / 待后续验证”.

## Validation

- `pnpm --filter @socra/socrates exec tsc --noEmit`
  - result: passed

## Affected Files

- `apps/socrates/lib/error-loop/review.ts`
- `apps/socrates/app/api/parent/insights/route.ts`
- `apps/socrates/app/api/parent-tasks/route.ts`
- `apps/socrates/app/(parent)/tasks/page.tsx`
- `docs/md_progress_socrates_20260328_parent_tasks_outcome_alignment.md`

## Next Step

- Do one Stage B consolidation slice across notifications and remaining parent wording:
  - align intervention effect labels across notifications, controls, and tasks
  - check whether transfer-evidence-gap follow-up messaging stays consistent after the shared helper change
  - then decide whether to close Stage B and move into Stage C
