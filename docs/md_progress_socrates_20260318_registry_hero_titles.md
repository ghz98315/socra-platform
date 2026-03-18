# Socrates Registry Hero Titles Progress
Date: 2026-03-18

## Shipped In This Slice

- Extended `apps/socrates/lib/study/module-registry-v2.tsx` with `heroTitle` so registry can now control module-page header titles in addition to descriptions and CTA behavior.
- Updated `apps/socrates/app/(student)/study/[subject]/[module]/page.tsx` to prefer registry-owned hero titles over the generic catalog module title.
- Applied module-page hero title overrides to the current V2 module experiences:
  - `chinese/reading`
  - `chinese/foundation`
  - `chinese/composition-idea`
  - `chinese/composition-review`
  - `english/listening`
  - `english/writing-idea`
  - `english/writing-review`

## Current Judgment

- `catalog.ts` can keep concise titles for subject overview cards while module detail pages now use more accurate workspace-facing titles.
- This further reduces the amount of module-page copy that is hard-coded in `catalog.ts`.
- Registry is becoming the real module experience contract rather than only a workspace renderer.

## Affected Files

- `apps/socrates/app/(student)/study/[subject]/[module]/page.tsx`
- `apps/socrates/lib/study/module-registry-v2.tsx`
- `docs/md_progress_socrates_20260318_registry_hero_titles.md`

## Commands Run

- `pnpm exec tsc --noEmit -p apps/socrates/tsconfig.json`
- `pnpm --filter @socra/socrates build`

## Smoke

- Study-flow smoke skipped because `SMOKE_STUDY_USER_ID` is still not configured.

## Notes

- Local Node remains `v22.19.0`; repo expectation is still `20.x`.
- One `build` attempt hit the local command timeout and was rerun with a longer timeout; the rerun passed cleanly.

## Next Step

- Continue moving module-page display contract out of `catalog.ts`, likely around badge/status display or section-level visibility strategy.
- After that, reassess whether any now-redundant catalog descriptions can be safely shortened back to overview-card copy only.
