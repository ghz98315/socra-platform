# Socrates Registry Entry Fallback
Date: 2026-03-18

## Shipped In This Slice

- Updated `apps/socrates/app/(student)/study/[subject]/page.tsx` so module overview cards now prefer registry-owned entry metadata for:
  - `entryHref`
  - `entryLabel`
  - `external`
  - `hideEntry`
- Kept `catalog.ts` as a fallback source only when the registry has no override for a given module.
- Aligned the subject overview page CTA behavior with the detail page contract that had already moved entry control into `module-registry-v2.tsx`.

## Current Judgment

- Module entry buttons on the subject overview page are no longer hard-coupled to `catalog.ts` for the migrated V2 modules.
- This closes another visible contract gap between registry-owned detail pages and registry-owned list/overview experiences.
- Remaining Phase 1 work is now mostly reassessment and tail cleanup rather than another broad contract addition.

## Affected Files

- `apps/socrates/app/(student)/study/[subject]/page.tsx`
- `docs/md_progress_socrates_20260318_registry_entry_fallback.md`

## Commands Run

- `pnpm exec tsc --noEmit -p apps/socrates/tsconfig.json`
- `pnpm --filter @socra/socrates build`

## Smoke

- Study-flow smoke skipped because `SMOKE_STUDY_USER_ID` is still not configured.

## Notes

- Local Node remains `v22.19.0`; repo expectation is still `20.x`.

## Next Step

- Reassess the remaining Phase 1 surface and confirm whether any list-page status or generic overview labels still need registry ownership.
- If no further safe contract gaps remain, move to the next phase: treating `catalog.ts` as a shorter navigation/fallback map and preparing for smoke-oriented readiness validation.
