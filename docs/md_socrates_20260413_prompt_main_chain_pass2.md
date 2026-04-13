# Socrates Prompt Main Chain Pass 2
Date: 2026-04-13
Status: implemented after user confirmation

## Scope

- Main chat prompt chain only
- Included:
  - `apps/socrates/lib/prompts/base.ts`
  - `apps/socrates/lib/prompts/builder.ts`
  - `apps/socrates/lib/prompts/subjects/math.ts`
  - `apps/socrates/lib/prompts/subjects/chinese.ts`
  - `apps/socrates/lib/prompts/subjects/english.ts`
- Not included:
  - `apps/socrates/app/api/chat/clear-history/route.ts`
  - `apps/socrates/app/api/ocr/route.ts`
  - `apps/socrates/app/api/geometry/route.ts`

## Implemented Direction

- Compressed the shared base prompt into a smaller live-tutoring contract.
- Added explicit “light diagnosis first” behavior before solving guidance.
- Changed the main tutoring flow to:
  - light diagnosis
  - one-step guidance
  - student summary
  - post-solve 5 Whys only when needed
  - one actionable prevention step
- Strengthened the live response contract so the tutor:
  - stays short on the first turn
  - asks exactly one concrete question
  - does not open with multiple methods
  - requires student summary after the key breakthrough
- Reduced first-turn prompt weight by keeping knowledge base and few-shot examples out of the first turn.
- Rewrote math / chinese / english strategies around:
  - what to notice first
  - what to ask first
  - what not to jump over

## Key Product Alignment

- 5 Whys is no longer treated as a heavy mandatory pre-step for every question.
- The prompt now prefers:
  - light diagnosis before solving
  - deeper root-cause analysis only for wrong / repeated wrong / exposed bad habits
- Student self-summary is now part of the intended main flow, not a loose optional extra.

## Validation

- Command:
  - `pnpm.cmd -C "D:\github\Socrates_ analysis\socra-platform" --filter @socra/socrates exec tsc --noEmit`
- Result:
  - passed

## Manual Acceptance Focus

- First reply should feel shorter and more diagnostic.
- The tutor should ask for one concrete next step instead of giving a lecture.
- After the key breakthrough, the tutor should ask the student to summarize the idea in their own words.
- 5 Whys should not appear as a long preamble on every question.
- Math / Chinese / English should now feel different mainly in question style, not in long explanatory blocks.

## Next Step

- Run manual acceptance on the live chat chain.
- Then decide whether to:
  - tune subject-specific phrasing further
  - align `clear-history` with the main builder
