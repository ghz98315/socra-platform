# Socrates Current Phase Card

- Date: 2026-04-14
- Status: active
- Phase name: `Prompt Pending Items + Unified Regression + Product Polish`

## Phase Summary

Socrates is no longer in the "geometry recognition closure" phase.

The current project phase is:

1. freeze `Geometry Wave 1` as the stable baseline
2. finish the remaining confirmed prompt items on top of the existing main chain
3. consolidate geometry, prompt, model whitelist, and session behavior into one shared regression baseline
4. close the remaining product polish and deployment-validation gaps

## Why The Phase Changed

The latest baseline changed for three reasons:

1. `Geometry Wave 1` already reached a pass checkpoint and should now be treated as stable unless a new real sample breaks it.
2. The prompt main chain is no longer at the "start designing" stage. It already has a working checkpoint, including the first-turn scaffold tightening.
3. The next meaningful risk is no longer isolated feature work. It is regression drift across the already-finished slices.

## What Is Already Considered Stable

### A. Geometry baseline

- non-geometry questions should not trigger geometry handling
- geometry recognition failure should preserve the previous usable figure state
- low-confidence / `unknown` / `error` geometry states should remain operable
- the coordinate-geometry `C` point recovery and missing-line completion path is part of the stable baseline

### B. Prompt baseline

- the prompt main chain already has a working alignment checkpoint
- first-turn replies should be lighter and more diagnostic
- first-turn prompt generation should use `first_turn_focus`
- later turns should restore `knowledge_base` and `few_shot_examples`

### C. Model baseline

- `chat -> qwen-turbo`
- `vision -> qwen-vl`
- `reasoning -> qwen-plus`

### D. Session baseline

- `chat / clear-history / mock fallback / session boundary` should be treated as one shared runtime behavior baseline

## What This Phase Includes

- remaining confirmed prompt refinements inside the current main chain
- unified regression checks for geometry, first-turn prompt behavior, session handling, and model selection
- documentation consolidation for the stable baseline
- product polish that affects current user-facing consistency
- local validation workflow hardening, including the probe-local fallback

## What This Phase Does Not Include

- opening a new geometry expansion wave without real failing samples
- reopening `OCR_PROMPT` or geometry-parse prompt exploration from scratch
- parallel expansion into unrelated new product surfaces
- speculative rule tweaks that are not backed by a concrete regression case

## Current Priority Order

### P1. Freeze the geometry baseline

- use `Geometry Wave 1` as the current stable version
- if geometry breaks again, require a real sample before changing the logic

### P2. Close confirmed prompt pending items

- continue only on top of the current prompt checkpoint
- do not reopen OCR or geometry parsing prompt work
- keep changes limited to the main chat chain behavior already under discussion

### P3. Maintain one unified regression baseline

- treat geometry, prompt, whitelist, and session behavior as one shared baseline
- every new slice should verify it is not breaking one of these already-stable paths

### P4. Finish product polish

- clean up remaining docs and validation notes
- only fix polish items that materially affect current product consistency or deployment confidence

## Current Blockers

### Blocker 1. Local runtime remains unstable on this Windows machine

- `next dev` can still hit `spawn EPERM`
- the standard local build/start path can still be unreliable

### Blocker 2. Probe-local is now available but has a host caveat

- the new probe-local helper is implemented and documented
- it successfully validates the probe build, `.next` handoff, and cleanup flow
- inside the current Codex command host, the detached `next start` process does not stay alive after command return
- this means the fallback is now part of the baseline, but detached-process persistence still needs confirmation in a normal PowerShell host

## Current Entry Docs

- `docs/md_socrates_20260414_geometry_wave1_pass_checkpoint.md`
- `docs/md_socrates_20260414_first_turn_prompt_scaffold.md`
- `docs/md_socrates_20260414_unified_regression_baseline.md`
- `docs/md_socrates_20260414_probe_local_helper.md`
- `docs/md_socrates_post_preview_polish_plan_20260412.md`

## One-Line Judgment

Socrates has moved out of the geometry-closure stage and is now in a shared stabilization phase: freeze the geometry baseline, finish the confirmed prompt items, hold one unified regression line, and close the remaining polish.
