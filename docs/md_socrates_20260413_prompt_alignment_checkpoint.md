# Socrates Prompt Alignment Checkpoint
Date: 2026-04-13
Status: checkpoint-ready

## Scope

- Save the current prompt-alignment round into a single checkpoint.
- Keep scope limited to:
  - main chat prompt chain
  - repeated-confusion branch
  - clear-history alignment
  - mock fallback alignment
  - chat session guard
- Keep the following out of this checkpoint:
  - `apps/socrates/app/api/ocr/route.ts`
  - `apps/socrates/app/api/geometry/route.ts`
  - geometry rendering UI changes
  - unrelated landing / subscription / account-model work

## Completed In This Slice

- Reworked the main chat prompt chain so it now prefers:
  - light diagnosis first
  - one-step guidance
  - student self-summary after key breakthrough
  - post-solve 5 Whys only when needed
- Rewrote subject strategies for:
  - math
  - chinese
  - english
  so they differ mainly by what to notice first and what to ask first.
- Added an explicit repeated-confusion branch:
  - first “看不懂”: narrow the current step
  - second same-step “看不懂”: step back one layer and re-anchor
- Aligned `clear-history` with the active prompt builder instead of maintaining an older parallel prompt.
- Moved `chat` and `clear-history` onto a shared in-memory conversation-history store.
- Aligned fallback / mock responses with the current tutoring rules so degraded mode no longer falls back to generic old guidance.
- Hardened the chat session boundary:
  - auto-generate a session id if missing
  - return the actual session id in the response
  - support both `sessionId` and `session_id` in `GET / DELETE /api/chat`

## Product Behavior After This Round

- The tutor no longer needs to restart the whole problem just because the student says “看不懂” once.
- The tutor also no longer keeps drilling the same abstract question after repeated confusion.
- The current intended behavior is now:
  - first confusion -> make the question smaller
  - repeated same-step confusion -> step back one layer
  - keep asking only one question
  - do not turn into a long lecture
- This behavior now stays more consistent across:
  - main chat
  - clear-history restart
  - mock fallback mode

## Touched Code Paths

- `apps/socrates/lib/prompts/base.ts`
- `apps/socrates/lib/prompts/builder.ts`
- `apps/socrates/lib/prompts/subjects/math.ts`
- `apps/socrates/lib/prompts/subjects/chinese.ts`
- `apps/socrates/lib/prompts/subjects/english.ts`
- `apps/socrates/app/api/chat/route.ts`
- `apps/socrates/app/api/chat/clear-history/route.ts`
- `apps/socrates/lib/chat/conversation-history.ts`

## Saved Docs In This Round

- `docs/md_socrates_20260413_prompt_main_chain_pass2.md`
- `docs/md_socrates_20260413_persistent_confusion_branch.md`
- `docs/md_socrates_20260413_clear_history_alignment.md`
- `docs/md_socrates_20260413_mock_fallback_alignment.md`
- `docs/md_socrates_20260413_chat_session_guard.md`
- `docs/md_socrates_20260413_chat_alignment_regression.md`
- `docs/md_socrates_20260413_prompt_alignment_checkpoint.md`

## Validation

### Static Validation

- Command:
  - `pnpm.cmd -C "D:\github\Socrates_ analysis\socra-platform" --filter @socra/socrates exec tsc --noEmit`
- Result:
  - passed

### Manual / Local Validation

- Main repeated-confusion path was manually verified earlier and judged basically passed.
- Additional local regression was executed against the running local app:
  - local health:
    - `HTTP=307`
    - `HEALTH=yes`
  - verified:
    - auto `sessionId` return
    - `clear-history` new-session rebuild
    - `GET / DELETE` dual query-param compatibility
    - mock fallback repeated-confusion behavior

## Recommended Commit Boundary

- Include:
  - prompt files listed above
  - chat / clear-history alignment
  - shared conversation-history store
  - this round’s checkpoint docs
- Exclude:
  - unrelated modified files already present in the worktree
  - geometry / OCR chain changes not part of this round

## Suggested Commit Title

- `feat(socrates): align prompt chain and repeated-confusion fallback`

## Suggested Commit Body

- `refine main chat prompt flow and subject strategies`
- `add repeated-confusion step-back behavior`
- `align clear-history with buildSystemPrompt`
- `align mock fallback and harden chat session handling`

## Current Recommendation

- Stop expanding this round here.
- Save this as the checkpoint boundary for commit / preview validation.
- After commit, run one focused preview acceptance on:
  - math repeated confusion
  - chinese repeated confusion
  - english repeated confusion
  - clear-history restart
