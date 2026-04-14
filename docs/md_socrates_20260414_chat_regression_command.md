# Socrates Chat Regression Command

- Date: 2026-04-14
- Status: implemented
- Scope: provide one repeatable local command for repeated-confusion and clear-history baseline checks

## What Shipped

- new helper modules:
  - `apps/socrates/lib/chat/mock-response.ts`
  - `apps/socrates/lib/chat/session-initializer.ts`
- route alignment:
  - `apps/socrates/app/api/chat/route.ts` now reuses the extracted mock fallback helper
  - `apps/socrates/app/api/chat/clear-history/route.ts` now reuses the extracted session initializer
- new script:
  - `scripts/check-socrates-chat-regression.mjs`
- new root command:
  - `pnpm socrates:check:chat-regression`

## What The Command Checks

The command compiles the required Socrates `lib` subtree into temporary JS output and asserts:

1. repeated-confusion fallback still steps back one layer for:
   - `math`
   - `chinese`
   - `english reading`
2. broader mock fallback branches still keep the current live-tutoring contract for:
   - asking for the answer directly
   - giving a half-finished solution direction
   - generic first-turn entry
   - geometry first-turn entry
3. the validated fallback outputs still ask exactly one question
4. `clear-history` rebuild still deletes the old session from the shared in-memory store
5. `clear-history` rebuild still initializes the new session in the same shared store
6. rebuilt first turn still uses the current prompt baseline:
   - includes `first_turn_focus`
   - excludes `knowledge_base`
   - excludes `few_shot_examples`

## Current Passing Result

Command:

- `pnpm.cmd socrates:check:chat-regression`

Observed result on 2026-04-14:

- `PASS repeated_confusion_math`
- `PASS repeated_confusion_chinese`
- `PASS repeated_confusion_english`
- `PASS fallback_asking_for_answer`
- `PASS fallback_giving_solution`
- `PASS fallback_generic_first_turn`
- `PASS fallback_geometry_first_turn`
- `PASS clear_history_rebuild`
- `PASS chat_regression total=8`

## Why This Matters

The current phase is no longer just prompt-structure consolidation.

This command turns the already-accepted runtime-side behaviors into a repeatable local gate:

- repeated-confusion should step back instead of looping
- clear-history should rebuild with the current main prompt rules
- mock fallback should not drift back to older generic tutoring output
- asking for the answer or giving a partial idea should still return one-step guidance instead of a direct solution

## Current Boundary

This command validates helper-level behavior and shared in-memory session rebuilding, not the full persisted online `/api/chat` route under a long-lived local server.

The remaining online gap is still:

- rerun one real `/api/chat` pass after local runtime conditions allow a stable local service
