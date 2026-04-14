# Socrates Prompt Subject Coverage Checkpoint

- Date: 2026-04-14
- Status: implemented and structurally validated
- Scope: close the remaining P1 first-turn subject coverage confirmation items

## Goal

The current prompt phase still had two uncovered subject-side confirmation items:

- `chinese`
- one non-geometry generic case

This slice closes those two items at the structural prompt-generation layer.

## Validation Method

Because local online runtime is still unstable on this Windows machine, this slice used the same offline prompt-generation approach as the earlier first-turn scaffold validation.

Validation flow:

1. compile the prompt subtree into a temporary JS output under `.codex_tmp/prompt-check`
2. execute `buildSystemPrompt(...)` against the compiled output
3. verify first-turn and later-turn markers for:
   - `chinese`
   - `generic`

## Commands Run

- `pnpm.cmd exec tsc --module commonjs --moduleResolution node --target es2022 --outDir .codex_tmp\\prompt-check --rootDir apps\\socrates\\lib\\prompts apps\\socrates\\lib\\prompts\\index.ts`
- `node -e "const { buildSystemPrompt } = require('./.codex_tmp/prompt-check/builder.js'); ..."`

## Results

### Chinese first turn

- `HAS_FIRST_TURN_FOCUS=true`
- `HAS_KNOWLEDGE=false`
- `HAS_FEWSHOT=false`
- chinese anchor signals present:
  - `题干`
  - `原文`

### Generic first turn

- `HAS_FIRST_TURN_FOCUS=true`
- `HAS_KNOWLEDGE=false`
- `HAS_FEWSHOT=false`
- generic anchor signals present:
  - `已知`
  - `目标`
  - `最小可执行动作`

### Chinese later turn

- `HAS_FIRST_TURN_FOCUS=false`
- `HAS_KNOWLEDGE=true`
- `HAS_FEWSHOT=true`

### Generic later turn

- `HAS_FIRST_TURN_FOCUS=false`
- `HAS_KNOWLEDGE=true`
- `HAS_FEWSHOT=true`

## Judgment

The missing P1 subject coverage items are now structurally confirmed.

That means the current first-turn scaffold baseline is no longer only confirmed on:

- `math`
- `geometry math`
- `english reading`

It is now also confirmed on:

- `chinese`
- `generic`

## Remaining Boundary

This slice confirms prompt-generation structure, not final runtime behavior in a persistent local chat session.

The remaining gap is still:

- run one later online `/api/chat` pass after the local runtime path is stable enough on this machine

## Phase Impact

After this slice:

- prompt `P1` is no longer the main open item
- the next prompt-side focus should move to:
  - repeated-confusion regression
  - `clear-history` rebuild regression
  - mock fallback consistency
