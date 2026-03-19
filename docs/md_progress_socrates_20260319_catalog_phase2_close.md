# Socrates Catalog Phase 2 Close
Date: 2026-03-19

## Shipped In This Slice

- Added targeted catalog selectors in `apps/socrates/lib/study/catalog.ts`:
  - `getStudySubjectOverview()`
  - `getStudySubjectModules()`
- Updated `apps/socrates/components/study/StudySubjectNav.tsx` to compose from:
  - `getSubjectConfig()`
  - `getStudySubjectOverview()`
  - `getStudySubjectModules()`
  instead of reading the full `getStudySubject()` payload.
- Updated `apps/socrates/app/(student)/study/[subject]/page.tsx` to use the same targeted selector pattern instead of depending on the full subject aggregate object.

## Current Judgment

- Phase 2 is now complete.
- `catalog.ts` heavy subject aggregate access has been reduced to a compatibility/export layer instead of being the default read path for study shell pages.
- The active study routes are now split more cleanly:
  - shell pages use subject config plus targeted selectors,
  - registry owns migrated presentation contract,
  - the full subject aggregate is no longer the default runtime dependency for the subject pages and nav.
- `apps/socrates/components/study/StudyAssetCenter.tsx` still calls `getStudySubjects()`, but that file already contains overlapping unrelated dirty worktree changes, so it was intentionally left out of this checkpoint to keep the local commit isolated.

## Affected Files

- `apps/socrates/lib/study/catalog.ts`
- `apps/socrates/components/study/StudySubjectNav.tsx`
- `apps/socrates/app/(student)/study/[subject]/page.tsx`
- `docs/md_progress_socrates_20260319_catalog_phase2_close.md`

## Commands Run

- `pnpm exec tsc --noEmit -p apps/socrates/tsconfig.json`
- `pnpm --filter @socra/socrates build`

## Smoke

- Study-flow smoke skipped because `SMOKE_STUDY_USER_ID` is still not configured.

## Notes

- Local Node remains `v22.19.0`; repo expectation is still `20.x`.
- Search after the change shows `getStudySubject()` no longer has active app/component callers; it remains exported only as a compatibility layer inside `catalog.ts`.

## Next Step

- Move to Phase 3: runtime-oriented study/report/review smoke validation once the study smoke environment is available.
- If Phase 2 cleanup needs to resume later, the remaining low-priority target is the dirty `StudyAssetCenter` file after its unrelated edits are resolved.
