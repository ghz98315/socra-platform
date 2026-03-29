# Socrates Conversation Effect Helper Unification
Date: 2026-03-28

## Shipped In This Slice

- Continued Stage C by removing duplicated conversation-intervention effect logic.
- Added a shared conversation helper in:
  - `apps/socrates/lib/error-loop/conversation-risk.ts`
- Centralized the effect calculation for conversation interventions:
  - `pending`
  - `risk_lowered`
  - `risk_persisting`
- Updated parent insights to use the shared helper when building conversation intervention task snapshots.
- Updated notifications API to use the same helper when enriching conversation-risk notifications.
- This means review interventions and conversation interventions now both have explicit shared effect helpers instead of repeating follow-up logic inline.

## Current Judgment

- The project’s intervention loop is materially tighter now:
  - review-side effect logic is shared
  - conversation-side effect logic is shared
  - notification and parent surfaces are consuming the same effect semantics
- This reduces one of the main causes of loop breakage in evolving products:
  - same field names
  - different hidden meanings per API
- The remaining Stage C work is now more about model boundaries and state-machine semantics than scattered copy-paste logic.

## Validation

- `pnpm --filter @socra/socrates exec tsc --noEmit`
  - result: passed

## Affected Files

- `apps/socrates/lib/error-loop/conversation-risk.ts`
- `apps/socrates/app/api/parent/insights/route.ts`
- `apps/socrates/app/api/notifications/route.ts`
- `docs/md_progress_socrates_20260328_conversation_effect_helper_unification.md`

## Next Step

- Continue Stage C by checking whether the remaining duplicated logic is now mostly in:
  - status/badge metadata
  - parent action generation
  - state-machine transitions around review closure and reopen
