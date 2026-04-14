# Socrates Prompt Baseline Command

- Date: 2026-04-14
- Status: implemented
- Scope: provide one repeatable local command for prompt-structure baseline checks

## What Shipped

- new script:
  - `scripts/check-socrates-prompt-baseline.mjs`
- new root command:
  - `pnpm socrates:check:prompt-baseline`

## What The Command Checks

The command compiles the Socrates prompt subtree into temporary JS output and then asserts:

1. first-turn scaffold is active for:
   - `math`
   - `geometry math`
   - `english reading`
   - `chinese`
   - `generic`
2. first-turn prompt does not inject:
   - `knowledge_base`
   - `few_shot_examples`
3. later-turn prompt restores:
   - `knowledge_base`
   - `few_shot_examples`
4. subject-specific anchor words still exist for the validated first-turn cases

## Current Passing Result

Command:

- `pnpm.cmd socrates:check:prompt-baseline`

Observed result on 2026-04-14:

- `PASS math_first_turn`
- `PASS geometry_math_first_turn`
- `PASS english_reading_first_turn`
- `PASS chinese_first_turn`
- `PASS generic_first_turn`
- `PASS math_later_turn`
- `PASS chinese_later_turn`
- `PASS generic_later_turn`
- `PASS prompt_baseline total=8`

## Why This Matters

The current phase is no longer about broad prompt rewriting.

This command turns the already-confirmed first-turn scaffold rules into a repeatable local gate, so future prompt edits can be checked before doing slower runtime or manual validation.

## Current Boundary

This command validates prompt structure, not the final online `/api/chat` response behavior.

The route-level prompt behavior checks now belong to:

- repeated-confusion regression
- `clear-history` rebuild regression
- mock fallback consistency
- `pnpm.cmd socrates:check:online-chat-regression`
