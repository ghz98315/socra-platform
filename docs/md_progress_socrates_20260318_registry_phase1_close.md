# Socrates Registry Phase 1 Close
Date: 2026-03-18

## Shipped In This Slice

- Extended `apps/socrates/lib/study/module-registry-v2.tsx` so list and navigation cards can now prefer registry-owned module badge fields through:
  - `cardStatus`
  - `cardStatusLabel`
- Added registry helpers to resolve card badge status and label with fallback order:
  - `cardStatus` / `cardStatusLabel`
  - `heroStatus` / `heroStatusLabel`
  - `catalog.ts` fallback
- Updated the study home page, subject overview page, and subject sidebar navigation to render module badge state through registry helpers instead of reading `module.status` directly for migrated experiences.

## Current Judgment

- Phase 1 of the registry-contraction thread is now complete.
- The visible study experience contract for migrated V2 modules is now substantially registry-owned across:
  - subject copy
  - module card copy
  - module entry CTA metadata
  - list-page badge state
  - detail-page hero and section contract
- `catalog.ts` still exists as fallback and navigation data, but it is no longer the primary presentation source for the migrated V2 module surfaces.

## Affected Files

- `apps/socrates/app/(student)/study/page.tsx`
- `apps/socrates/app/(student)/study/[subject]/page.tsx`
- `apps/socrates/components/study/StudySubjectNav.tsx`
- `apps/socrates/lib/study/module-registry-v2.tsx`
- `docs/md_progress_socrates_20260318_registry_phase1_close.md`

## Commands Run

- `pnpm exec tsc --noEmit -p apps/socrates/tsconfig.json`
- `pnpm --filter @socra/socrates build`

## Smoke

- Study-flow smoke skipped because `SMOKE_STUDY_USER_ID` is still not configured.

## Notes

- Local Node remains `v22.19.0`; repo expectation is still `20.x`.

## Next Step

- Move to Phase 2: reduce `catalog.ts` toward navigation and fallback responsibility only, without risking broad regressions in untouched modules.
- After Phase 2, return to smoke-oriented readiness validation once the study smoke environment is configured.
