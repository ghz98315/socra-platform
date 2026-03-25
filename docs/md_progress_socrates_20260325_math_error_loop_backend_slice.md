# Socrates Math Error Loop Backend Slice
Date: 2026-03-25

## Shipped In This Slice

- Added a new migration for the first backend slice of the math error-loop design:
  - `supabase/migrations/20260325_add_math_error_loop_v1_tables.sql`
- Added structured diagnosis API:
  - `GET /api/error-session/diagnose`
  - `POST /api/error-session/diagnose`
- Added review-attempt API:
  - `GET /api/review/attempt`
  - `POST /api/review/attempt`
- Added validation that blocks surface-only root causes:
  - if the diagnosis stops at labels such as `粗心` / `carelessness`
  - or `root_cause_depth <= 1`
  - the backend rejects the write

## Current Judgment

- The first implementation slice now has a real backend contract for:
  - structured root-cause storage
  - review evidence storage
  - provisional mastery vs true mastery judgement
  - close / reopen state updates
- This is still a backend-first slice:
  - no student diagnosis page yet
  - no review-attempt UI yet
  - no parent insight page yet
- The key product rule is now enforced server-side:
  - `粗心` may be stored as a surface label
  - but it cannot be accepted as the final root cause

## Schema Added

### `error_diagnoses`

Stores one structured diagnosis per error session, including:

- `surface_labels`
- `surface_error`
- `root_cause_category`
- `root_cause_statement`
- `root_cause_depth`
- `why_chain`
- `evidence`
- `fix_actions`
- `knowledge_tags`
- `habit_tags`
- `risk_flags`

### `review_attempts`

Stores review evidence for each attempt, including:

- `independent_first`
- `asked_ai`
- `ai_hint_count`
- `solved_correctly`
- `explained_correctly`
- `confidence_score`
- `duration_seconds`
- `variant_passed`
- `mastery_judgement`

### Existing tables extended

- `review_schedule`
  - `mastery_state`
  - `last_attempt_id`
  - `last_judgement`
  - `close_reason`
  - `reopened_count`
  - `next_interval_days`
  - `updated_at`
- `error_sessions`
  - `primary_root_cause_category`
  - `primary_root_cause_statement`
  - `closure_state`

## API Contract

### `POST /api/error-session/diagnose`

Writes or updates the structured diagnosis for one error session.

Required fields:

- `session_id`
- `student_id`
- `subject`
- `surface_error`
- `root_cause_category`
- `root_cause_statement`
- `why_chain`

Important validation:

- `root_cause_depth` must be greater than `1`
- if `surface_labels` includes `粗心` / `carelessness`
  - the `root_cause_statement` must continue down to a behavior / strategy / knowledge / attention pattern

### `GET /api/error-session/diagnose`

Reads one diagnosis by:

- `session_id`
- `student_id`

### `POST /api/review/attempt`

Writes one review attempt and updates the linked review schedule and error session state.

Input evidence includes:

- `independent_first`
- `asked_ai`
- `ai_hint_count`
- `solved_correctly`
- `explained_correctly`
- `confidence_score`
- `duration_seconds`
- `variant_passed`

Current judgement outputs:

- `not_mastered`
- `assisted_correct`
- `explanation_gap`
- `pseudo_mastery`
- `provisional_mastered`
- `mastered`

Current state transition behavior:

- `mastered`
  - closes the review item
  - marks the error session as `mastered`
- `provisional_mastered`
  - advances to the next review stage
- all other results
  - reset to stage `1`
  - reopen the loop
  - schedule a short next interval

### `GET /api/review/attempt`

Reads all review attempts by:

- `review_id`
- `student_id`

## Commands Run

- `node --check apps/socrates/app/api/error-session/diagnose/route.ts`
- `node --check apps/socrates/app/api/review/attempt/route.ts`

## UI Follow-Up Added On The Same Day

- Added shared taxonomy definitions:
  - `apps/socrates/lib/error-loop/taxonomy.ts`
- Added shared review judgement metadata:
  - `apps/socrates/lib/error-loop/review.ts`
- Added the first student diagnosis panel:
  - `apps/socrates/components/error-loop/DiagnosisPanel.tsx`
- Added the first student review-attempt page:
  - `apps/socrates/components/error-loop/ReviewAttemptSessionPage.tsx`
- Added the first student guided reflection API + panel:
  - `apps/socrates/app/api/error-session/guided-reflection/route.ts`
  - `apps/socrates/components/error-loop/GuidedReflectionPanel.tsx`
- Wired the diagnosis panel into:
  - `apps/socrates/app/(student)/error-book/[id]/page.tsx`
- Wired the review-attempt page into:
  - `apps/socrates/app/(student)/review/session/[id]/page.tsx`
- Wired the guided reflection panel into:
  - `apps/socrates/app/(student)/error-book/[id]/page.tsx`
- Current UI behavior:
  - math sessions now show the 8 fixed top-level root-cause categories
  - students must finish at least 2 why-tracing layers before saving
  - the save flow writes both `error_diagnoses` and `error_sessions` root-cause fields
  - diagnosis can now flow into a persisted guided-reflection sequence
  - guided reflection advances step by step and writes to `error_diagnoses.guided_reflection`
  - finishing reflection generates a student-facing summary of root pattern and next actions
  - review sessions now collect attempt evidence before judgement
  - the page submits independent-first / asked-ai / hint-count / solved-correctly / explained-correctly / variant-passed / confidence-score / duration-seconds
  - the completion screen now reflects the mastery judgement and next close / reopen outcome

## Next Step

- Next should move to Socrates-style guided reflection and parent insight synthesis, because the student-side diagnosis + review judgement loop is now connected.
