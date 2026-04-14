# Socrates Prompt Pending Items Board

- Date: 2026-04-14
- Status: active
- Scope: define the remaining prompt-side confirmation items for the current phase

## Current Judgment

The prompt main chain is no longer in an open-ended redesign stage.

What remains is a small set of confirmation items on top of the existing checkpoint:

1. verify first-turn behavior across the intended subject set
2. verify repeated-confusion behavior still matches the current contract
3. verify `clear-history` rebuild still uses the same current prompt rules
4. avoid reopening OCR or geometry-parse prompt work

## Already Locked In

### Main-chain checkpoint

- light diagnosis first
- one-step guidance
- one concrete question at a time
- student self-summary after the key breakthrough
- 5 Whys only when needed

### Repeated-confusion checkpoint

- first confusion: narrow the current step
- repeated same-step confusion: step back one layer and re-anchor

### First-turn scaffold checkpoint

- first turn should use `first_turn_focus`
- first turn should not inject `knowledge_base`
- first turn should not inject `few_shot_examples`
- later turns should restore the normal strategy layers

## Pending Items

### P1. Subject coverage confirmation

Status: structurally confirmed

Already confirmed:

- `math`
- `geometry math`
- `english reading`
- `chinese`
- one non-geometry generic case

Still recommended:

- one later online `/api/chat` regression pass after local runtime conditions allow it

Acceptance target:

- first reply feels shorter and diagnostic
- the tutor does not open with a lecture
- the tutor asks one concrete next-step question
- subject-specific anchoring matches the intended behavior

Latest structural verification on 2026-04-14:

- `chinese` first turn:
  - `HAS_FIRST_TURN_FOCUS=true`
  - `HAS_KNOWLEDGE=false`
  - `HAS_FEWSHOT=false`
  - chinese anchor signals present
- `generic` first turn:
  - `HAS_FIRST_TURN_FOCUS=true`
  - `HAS_KNOWLEDGE=false`
  - `HAS_FEWSHOT=false`
  - generic anchor signals present
- `chinese` later turn:
  - `HAS_FIRST_TURN_FOCUS=false`
  - `HAS_KNOWLEDGE=true`
  - `HAS_FEWSHOT=true`
- `generic` later turn:
  - `HAS_FIRST_TURN_FOCUS=false`
  - `HAS_KNOWLEDGE=true`
  - `HAS_FEWSHOT=true`

### P2. Repeated-confusion regression

Status: checkpoint exists, current phase should keep it stable

Still recommended:

- repeat the same "看不懂" flow twice on:
  - math
  - chinese
  - english

Acceptance target:

- first confusion shrinks the step
- second same-step confusion steps back one layer
- the tutor still asks only one question
- the tutor does not become a long explainer

### P3. Clear-history rebuild regression

Status: implemented, still needs to be treated as part of the shared prompt baseline

Still recommended:

- start one session
- trigger `clear-history`
- verify the rebuilt first turn still follows the current main-chain rules

Acceptance target:

- rebuilt session does not fall back to an older prompt style
- rebuilt session still uses the current light first-turn behavior
- session handling remains compatible with `sessionId` and `session_id`

### P4. Mock fallback consistency

Status: aligned in the earlier prompt checkpoint

Still recommended:

- confirm degraded mode still follows:
  - one-step guidance
  - one-question output
  - repeated-confusion step-back behavior

Acceptance target:

- fallback output should not revert to generic old tutoring text

## Explicit Non-Goals

- do not reopen `apps/socrates/app/api/ocr/route.ts`
- do not reopen `apps/socrates/app/api/geometry/route.ts`
- do not restart prompt optimization from scratch
- do not mix prompt pending items with unrelated landing / subscription / account-model work

## Recommended Execution Order

1. confirm the missing subject coverage items
2. confirm repeated-confusion behavior against the current prompt chain
3. confirm `clear-history` rebuild under the same current rules
4. only after those pass, decide whether any prompt copy still needs a small final polish

## Current Blocking Reality

- structural validation is available now
- true local online validation is still constrained by Windows `spawn EPERM`
- the new probe-local fallback improves this situation, but detached-process persistence still needs host-level confirmation outside the current Codex command runner

## One-Line Judgment

The next prompt step is not "write more prompt"; it is "close the remaining confirmation items on the already-finished prompt chain."
