# Socrates Model Whitelist Checkpoint
Date: 2026-04-13
Status: completed first-pass polish checkpoint

## Scope

- Save the current post-preview polish progress for model whitelist and default model cleanup.
- Keep prompt optimization out of this checkpoint.

## Completed

- Restricted the approved model mapping to:
  - `chat -> qwen-turbo`
  - `vision -> qwen-vl`
  - `reasoning -> qwen-plus`
- Normalized invalid or drifting user preferences back to the approved default model per purpose.
- Removed broad fallback behavior from the active Socrates model-selection path.
- Updated planner optimization to use the `reasoning` default instead of drifting to `chat`.
- Kept settings UI aligned with the approved model list only.

## Touched Code Paths

- `apps/socrates/lib/ai-models/config.ts`
- `apps/socrates/lib/ai-models/service.ts`
- `apps/socrates/app/api/ai-settings/route.ts`
- `apps/socrates/app/api/chat/route.ts`
- `apps/socrates/app/api/planner/optimize/route.ts`
- `apps/socrates/app/(student)/settings/page.tsx`

## Validation

- Command:
  - `pnpm.cmd -C "D:\github\Socrates_ analysis\socra-platform" --filter @socra/socrates exec tsc --noEmit`
- Result:
  - passed

## Prompt Boundary

- Prompt files were reviewed only.
- No prompt text was changed in this checkpoint.
- User confirmation is required before any prompt modification.
- Dialogue prompt changes must preserve:
  - Socratic questioning
  - guided discovery
  - no direct answers
  - one small step at a time

## Recommended Next Step

- Start the first prompt-only polish pass after user confirmation.
- Preferred scope:
  - main chat prompt
  - optionally `apps/socrates/app/api/chat/clear-history/route.ts` alignment
- Do not mix in:
  - `apps/socrates/app/api/ocr/route.ts`
  - `apps/socrates/app/api/geometry/route.ts`
