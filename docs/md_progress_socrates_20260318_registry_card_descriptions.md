# Socrates Registry Card Descriptions
Date: 2026-03-18

## Shipped In This Slice

- Extended `apps/socrates/lib/study/module-registry-v2.tsx` so module experience config can now own concise overview-card copy through `cardDescription`.
- Added registry-owned card descriptions for the active V2 modules in Chinese and English study flows.
- Updated the study home page, subject overview page, and subject navigation so they prefer registry-owned card descriptions and only fall back to `catalog.ts` descriptions when no override exists.

## Current Judgment

- Overview and navigation card copy for the migrated V2 modules is now controlled from the same registry that already owns detail-page titles, status badges, and section visibility.
- This reduces one more layer of duplicated presentation copy in `catalog.ts` without forcing a broad catalog rewrite.
- The current slice is intentionally narrow: only concise card descriptions moved, while legacy catalog descriptions remain as fallback for untouched modules.

## Affected Files

- `apps/socrates/app/(student)/study/page.tsx`
- `apps/socrates/app/(student)/study/[subject]/page.tsx`
- `apps/socrates/components/study/StudySubjectNav.tsx`
- `apps/socrates/lib/study/module-registry-v2.tsx`
- `docs/md_progress_socrates_20260318_registry_card_descriptions.md`

## Commands Run

- `pnpm exec tsc --noEmit -p apps/socrates/tsconfig.json`
- `pnpm --filter @socra/socrates build`

## Smoke

- Study-flow smoke skipped because `SMOKE_STUDY_USER_ID` is still not configured.

## Notes

- Local Node remains `v22.19.0`; repo expectation is still `20.x`.

## Next Step

- Continue the first-phase registry contraction by checking whether subject-level overview copy or remaining module card metadata can also move behind registry-owned experience fields.
- Keep `catalog.ts` as fallback-only data until the remaining list-page copy is safely covered.
