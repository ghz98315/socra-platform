# Socrates Registry Status Badge Contract
Date: 2026-03-18

## Shipped In This Slice

- Extended `apps/socrates/lib/study/module-registry-v2.tsx` so module experience config can now override module-page status badge behavior with:
  - `heroStatus`
  - `heroStatusLabel`
- Updated `apps/socrates/app/(student)/study/[subject]/[module]/page.tsx` to prefer registry-owned status tone and label over the generic catalog badge.
- Applied module-page badge overrides to current V2 modules:
  - `chinese/reading`
  - `chinese/foundation`
  - `english/listening`
    - now show detail-page badge label `工作台可用`
  - `chinese/composition-idea`
  - `chinese/composition-review`
  - `english/writing-idea`
  - `english/writing-review`
    - now show detail-page badge label `工作台内测`

## Current Judgment

- Module overview cards in `catalog.ts` can continue expressing broad roadmap status while detail pages now express the more specific module workspace stage.
- This is another step toward making registry the single source of truth for module detail-page experience.
- `catalog.ts` is shrinking toward navigation and overview responsibility rather than page-level presentation logic.

## Affected Files

- `apps/socrates/app/(student)/study/[subject]/[module]/page.tsx`
- `apps/socrates/lib/study/module-registry-v2.tsx`
- `docs/md_progress_socrates_20260318_registry_status_badges.md`

## Commands Run

- `pnpm exec tsc --noEmit -p apps/socrates/tsconfig.json`
- `pnpm --filter @socra/socrates build`

## Smoke

- Study-flow smoke skipped because `SMOKE_STUDY_USER_ID` is still not configured.

## Notes

- Local Node remains `v22.19.0`; repo expectation is still `20.x`.
- This slice changes detail-page badge presentation only; it does not change subject overview card status in `catalog.ts`.

## Next Step

- Continue the same contract-recovery thread by deciding whether phase/principles sections also need registry-driven visibility toggles.
- After that, reassess whether some catalog descriptions can be shortened safely because detail-page copy has already moved into registry.
