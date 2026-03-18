# Socrates Catalog Light Consumers
Date: 2026-03-18

## Shipped In This Slice

- Updated `apps/socrates/components/study/StudyDomainNav.tsx` to read top-level subject chips from `getSupportedSubjects()` instead of `getStudySubjects({ includePro: false })`.
- Updated `apps/socrates/app/(student)/study/[subject]/problem/page.tsx` to read subject shell data from `getSubjectConfig()` instead of the heavier `getStudySubject()`.
- Kept the runtime behavior unchanged while reducing two consumers that only needed subject navigation metadata, not full study subject overview payloads.

## Current Judgment

- This is the first Phase 2 contraction slice: reduce the number of places that depend on the full `studySubjectCatalog` shape when they only need subject shell data.
- The slice is intentionally narrow and safe. It shrinks `catalog.ts` consumer responsibility before any larger internal data reshaping.
- `apps/socrates/components/study/StudyAssetCenter.tsx` was evaluated for the same change, but it already contains overlapping unrelated dirty edits, so it was intentionally left out of this checkpoint to avoid mixing work.

## Affected Files

- `apps/socrates/components/study/StudyDomainNav.tsx`
- `apps/socrates/app/(student)/study/[subject]/problem/page.tsx`
- `docs/md_progress_socrates_20260318_catalog_light_consumers.md`

## Commands Run

- `pnpm exec tsc --noEmit -p apps/socrates/tsconfig.json`
- `pnpm --filter @socra/socrates build`

## Smoke

- Study-flow smoke skipped because `SMOKE_STUDY_USER_ID` is still not configured.

## Notes

- Local Node remains `v22.19.0`; repo expectation is still `20.x`.

## Next Step

- Continue Phase 2 by moving more shell-only study consumers off the full subject catalog where safe.
- After enough consumer contraction, reassess whether `catalog.ts` internals can be shortened into clearer navigation data plus fallback copy layers.
