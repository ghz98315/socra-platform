# Socrates Unified Regression Baseline

- Date: 2026-04-14
- Status: active baseline
- Scope: hold geometry, prompt, model whitelist, chat session behavior, and route-level online regression as one shared baseline

## Current Judgment

The Socrates baseline is now defined as one shared regression line:

1. `Geometry Wave 1` is frozen as the current stable geometry baseline
2. the main prompt chain is already closed to the current first-turn scaffold checkpoint
3. model whitelist first pass is already fixed as the current deploy baseline
4. `chat / clear-history / mock fallback / session boundary` now have both helper-level and route-level regression coverage

This is no longer a set of parallel explorations. It is one baseline that future changes must preserve.

## Baseline Components

### A. Geometry baseline

- non-geometry questions should not trigger geometry handling
- geometry recognition failure should preserve the last usable figure state
- low-confidence / `unknown` / `error` geometry states should remain operable
- coordinate-geometry `C` point recovery and missing-line completion are part of the baseline

Reference:

- `docs/md_socrates_20260414_geometry_wave1_pass_checkpoint.md`

### B. Prompt baseline

- first-turn replies should be lighter and more diagnostic
- first-turn prompt generation should use `first_turn_focus`
- first-turn prompt should exclude `knowledge_base`
- first-turn prompt should exclude `few_shot_examples`
- later turns should restore `knowledge_base` and `few_shot_examples`

References:

- `docs/md_socrates_20260414_first_turn_prompt_scaffold.md`
- `docs/md_socrates_20260414_prompt_baseline_command.md`

### C. Chat/session baseline

- repeated confusion should step back one layer instead of looping
- `clear-history` should rebuild the new session with the current prompt rules
- mock fallback should preserve one-step guidance and one-question behavior
- `GET / DELETE /api/chat` should remain compatible with `sessionId` and `session_id`

References:

- `docs/md_socrates_20260414_chat_regression_command.md`
- `docs/md_socrates_20260414_online_chat_regression_command.md`

### D. Model baseline

- `chat -> qwen-turbo`
- `vision -> qwen-vl`
- `reasoning -> qwen-plus`
- invalid persisted or requested model choices should normalize back to the approved default
- planner optimize should not drift back to `chat`

Reference:

- `docs/md_socrates_20260413_model_whitelist_checkpoint.md`

## Regression Commands

### 1. Prompt structure baseline

Command:

```powershell
pnpm.cmd socrates:check:prompt-baseline
```

Checks:

- first-turn scaffold is active for the validated subjects
- first-turn excludes `knowledge_base`
- first-turn excludes `few_shot_examples`
- later turns restore both layers

### 2. Helper-level chat/session baseline

Command:

```powershell
pnpm.cmd socrates:check:chat-regression
```

Checks:

- repeated-confusion fallback
- asking-for-answer fallback
- giving-solution fallback
- generic first turn fallback
- geometry first turn fallback
- `clear-history` rebuild in the shared store

### 3. Route-level online chat/session baseline

Command:

```powershell
pnpm.cmd socrates:check:online-chat-regression
```

Checks:

- `math` first turn via real `POST /api/chat`
- `geometry math` first turn via real `POST /api/chat`
- `english reading` first turn via real `POST /api/chat`
- `chinese` repeated confusion via real `POST /api/chat`
- `clear-history` rebuild via real `POST /api/chat/clear-history`
- `session_id` GET/DELETE compatibility via real `/api/chat`

## Current Validation State

Validated on 2026-04-14:

- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`
- `pnpm.cmd socrates:check:prompt-baseline`
- `pnpm.cmd socrates:check:chat-regression`
- `pnpm.cmd socrates:check:online-chat-regression`

Current result:

- prompt baseline command passes
- helper-level chat/session regression command passes
- route-level online chat/session regression command passes
- the remaining gap is no longer missing regression coverage

## Remaining Risk

The remaining risk is now narrower and host-specific:

- this Windows machine can still hit `spawn EPERM` on normal local `next dev` or detached local-start workflows
- however, the current one-shot online regression command already works inside the active command host
- the baseline gap has moved from "missing online regression coverage" to "manual local workflow reliability"

## What Is Not In Scope

- reopening OCR or geometry-parse prompt exploration without a real failing sample
- starting a new geometry expansion wave without a concrete regression case
- mixing unrelated landing, subscription, or account-model work into the Socrates baseline

## Next-Step Rule

Future work should follow this rule:

1. treat this file as the current baseline contract
2. only add one small justified slice at a time
3. run the relevant regression command before calling the slice closed
4. do not reopen frozen geometry or prompt branches without a real regression trigger

## One-Line Baseline

Socrates is now in a shared stabilization stage where geometry, prompt behavior, session behavior, whitelist behavior, and route-level online regression are all part of the same baseline and must move together.
