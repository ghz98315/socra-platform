# Socrates Catalog Subject Shells
Date: 2026-03-18

## Shipped In This Slice

- Updated `apps/socrates/app/(student)/study/[subject]/layout.tsx` to read subject shell data from `getSubjectConfig()` and the first-module link from `getDefaultStudyModule()`, instead of depending on the full `getStudySubject()` result.
- Updated `apps/socrates/app/(student)/study/[subject]/[module]/page.tsx` to read subject shell data from `getSubjectConfig()` while keeping module fallback lookup on `getStudyModule()`.
- Kept subject overview copy on the layout page sourced from registry-owned subject experience data, which is already the active presentation source after Phase 1.

## Current Judgment

- Phase 2 has now removed another pair of shell-only consumers from the full `studySubjectCatalog` path.
- `getStudySubject()` is increasingly reserved for places that genuinely need module arrays or fallback overview payloads.
- This makes the next internal shortening of `catalog.ts` safer, because fewer routes now depend on the full subject object shape.

## Affected Files

- `apps/socrates/app/(student)/study/[subject]/layout.tsx`
- `apps/socrates/app/(student)/study/[subject]/[module]/page.tsx`
- `docs/md_progress_socrates_20260318_catalog_subject_shells.md`

## Commands Run

- `pnpm exec tsc --noEmit -p apps/socrates/tsconfig.json`
- `pnpm --filter @socra/socrates build`

## Smoke

- Study-flow smoke skipped because `SMOKE_STUDY_USER_ID` is still not configured.

## Notes

- Local Node remains `v22.19.0`; repo expectation is still `20.x`.

## Next Step

- Continue Phase 2 by identifying whether `getStudySubject()` can now be confined to the study home page, subject overview page, and subject nav only.
- Once those remaining heavy consumers are isolated, reshape `catalog.ts` internals into clearer navigation data plus explicit fallback content layers.
