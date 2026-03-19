# Socrates Runbook Node 22 Sync
Date: 2026-03-19

## Shipped In This Slice

- Synchronized the canonical release runbook to the new Node `22.19.0` local release baseline.
- Added `pnpm check:node` to the runbook preflight sequence.
- Updated the runbook smoke section so the standard Socrates smoke and study-flow smoke are both part of the documented release path.
- Added a build-baseline note describing the stable root workspace build shape on the current machine.

## Current Judgment

- The canonical runbook is now aligned with the validated local release process.
- The main release thread is fully documented end to end.
- No product code changed in this slice; this was documentation closure only.

## Affected Files

- `docs/md_RELEASE_RUNBOOK.md`
- `docs/md_progress_socrates_20260319_runbook_node22_sync.md`

## Commands Run

- `git diff -- docs/md_RELEASE_RUNBOOK.md`
- `rg -n "Node|check:node|check:env|smoke|pnpm build" docs/md_RELEASE_RUNBOOK.md`

## Smoke

- No new smoke command ran in this slice.
- Reason: the runbook sync only documents the already verified Node 22 release path.

## Notes

- The pre-existing migration note for `supabase/migrations/20260317_expand_error_session_subjects.sql` was preserved.
- This slice intentionally touched only the canonical runbook and its matching progress note.

## Next Step

- The Node 22 release baseline thread is fully closed on this machine.
- Any next work should be a new feature or cleanup thread.
