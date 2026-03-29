# Socrates Judgement Language Meta Unification
Date: 2026-03-29

## Shipped In This Slice

- Continued Stage C by extracting shared judgement-to-language metadata into `apps/socrates/lib/error-loop/review.ts`.
- Extended `MASTERY_JUDGEMENT_META` so each judgement now carries shared messaging semantics for:
  - student-facing summary wording
  - parent-facing risk notification wording
- Updated `app/api/review/attempt/route.ts` so `buildJudgementGuidance(...)` now builds its per-judgement summary from shared metadata instead of maintaining a fully private wording map.
- Updated `apps/socrates/lib/notifications/intervention-status.ts` so mastery-risk parent notifications now consume the same shared judgement language baseline.
- Reused `REVIEW_INTERVENTION_RISK_JUDGEMENTS` inside notification copy generation, removing one more duplicated risk-judgement boundary.

## Current Judgment

- This slice reduces a narrow but important drift point:
  - student review guidance and parent mastery-risk notifications no longer describe the same judgement through separate ad hoc phrase sets
  - audience-specific wording still exists, but it now sits on top of one shared semantic baseline
- Stage C is now more consistent across:
  - judgement metadata
  - closure-state metadata
  - interval scheduling
  - notification wording

## Validation

- `pnpm --dir "D:\github\Socrates_ analysis\socra-platform" --filter @socra/socrates exec tsc --noEmit`
  - result: passed

## Affected Files

- `apps/socrates/lib/error-loop/review.ts`
- `apps/socrates/lib/notifications/intervention-status.ts`
- `apps/socrates/app/api/review/attempt/route.ts`
- `docs/md_progress_socrates_20260329_judgement_language_meta_unification.md`

## Next Step

- Continue Stage C by checking whether the remaining drift is now concentrated in review result presentation rather than judgement semantics:
  - inspect student review hub / review session surfaces for remaining private “provisional mastered / reopened” explanatory copy
  - compare those explanations against shared closure-state metadata and closure-gate summaries
  - only extract another helper if it removes real drift without making the UI copy rigid
