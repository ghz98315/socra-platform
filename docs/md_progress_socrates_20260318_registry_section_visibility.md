# Socrates Registry Section Visibility Contract
Date: 2026-03-18

## Shipped In This Slice

- Extended `apps/socrates/lib/study/module-registry-v2.tsx` so module experience config can now control detail-page section visibility with:
  - `showPhaseSection`
  - `showPrinciplesSection`
- Updated `apps/socrates/app/(student)/study/[subject]/[module]/page.tsx` to respect those registry booleans when rendering the phase and principles cards.
- Kept the default behavior unchanged for all existing modules by defaulting both flags to `true`.

## Current Judgment

- Module detail-page layout is now less hard-coded and ready for future module-specific section suppression without editing the page component again.
- This finishes another piece of the first-phase contract-recovery thread: page-level structure is increasingly owned by registry instead of by the page.
- The current slice is intentionally contract-first; no module-specific section suppression is turned on yet.

## Affected Files

- `apps/socrates/app/(student)/study/[subject]/[module]/page.tsx`
- `apps/socrates/lib/study/module-registry-v2.tsx`
- `docs/md_progress_socrates_20260318_registry_section_visibility.md`

## Commands Run

- `pnpm exec tsc --noEmit -p apps/socrates/tsconfig.json`
- `pnpm --filter @socra/socrates build`

## Smoke

- Study-flow smoke skipped because `SMOKE_STUDY_USER_ID` is still not configured.

## Notes

- Local Node remains `v22.19.0`; repo expectation is still `20.x`.
- The `socra-platform-autopilot` skill was also updated in this pass so “continue current phase” runs keep executing adjacent safe slices without mid-phase pauses, and the skill revalidation passed.

## Next Step

- Keep advancing the first phase by deciding whether any current module should actually suppress the phase or principles card.
- If not, move to the next contract-recovery slice: further shorten `catalog.ts` so it only carries overview-card copy and navigation metadata.
