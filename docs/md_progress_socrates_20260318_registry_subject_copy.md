# Socrates Registry Subject Copy
Date: 2026-03-18

## Shipped In This Slice

- Added subject-level registry experience fields in `apps/socrates/lib/study/module-registry-v2.tsx` for:
  - `description`
  - `overview`
- Moved the active core-subject copy for math, chinese, and english into registry-owned subject experience config.
- Updated the study home page, subject layout, and subject sidebar navigation to prefer registry-owned subject copy and only fall back to `catalog.ts` when a subject has no registry override.

## Current Judgment

- Core-subject marketing and guidance copy is now closer to the rest of the V2 registry contract instead of being locked inside `catalog.ts`.
- This keeps the current migration incremental: untouched future subjects still safely fall back to catalog data.
- The remaining Phase 1 gap on overview pages is no longer subject copy itself, but the last bits of module entry metadata still read directly from catalog in some list views.

## Affected Files

- `apps/socrates/app/(student)/study/page.tsx`
- `apps/socrates/app/(student)/study/[subject]/layout.tsx`
- `apps/socrates/components/study/StudySubjectNav.tsx`
- `apps/socrates/lib/study/module-registry-v2.tsx`
- `docs/md_progress_socrates_20260318_registry_subject_copy.md`

## Commands Run

- `pnpm exec tsc --noEmit -p apps/socrates/tsconfig.json`
- `pnpm --filter @socra/socrates build`

## Smoke

- Study-flow smoke skipped because `SMOKE_STUDY_USER_ID` is still not configured.

## Notes

- Local Node remains `v22.19.0`; repo expectation is still `20.x`.

## Next Step

- Continue the first-phase registry contraction by letting subject overview cards prefer registry-owned module entry metadata such as `entryHref`, `entryLabel`, `external`, and `hideEntry`.
- After that, reassess whether `catalog.ts` can be treated as navigation/fallback-only for the migrated study modules.
