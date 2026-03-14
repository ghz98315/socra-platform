# Socrates Error Book Review Handoff

Date: 2026-03-15

## Scope

- connected `error-book` list to existing review sessions
- connected `error-book/[id]` detail page to review after mastery
- returned `review_id` consistently from mastery completion flow

## Changes

- `apps/socrates/app/api/error-book/route.ts`
  - now returns `review_session_map` from `session_id -> review_id`
- `apps/socrates/app/(student)/error-book/page.tsx`
  - if an error session already has a review schedule, the action now jumps to `/review/session/:id`
  - manual add-to-review still works for sessions not yet scheduled
- `apps/socrates/app/api/error-session/complete/route.ts`
  - existing-review branch now also returns `review_id`
- `apps/socrates/app/(student)/error-book/[id]/page.tsx`
  - loads existing review schedule id
  - after `mark mastered`, stores returned `review_id`
  - exposes direct `进入复习` CTA when a review exists

## Verification

- passed: `pnpm --filter @socra/socrates exec tsc --noEmit`
- this round focused on handoff continuity, not layout redesign
