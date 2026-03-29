# Socrates Transfer-Evidence Parent Follow-Up Smoke
Date: 2026-03-29

## Shipped In This Slice

- Extended `scripts/smoke-transfer-evidence-gap.mjs` beyond the student closure path.
- The smoke can now optionally verify parent-side artifacts when `SMOKE_PARENT_ID` is available:
  - pending `review_intervention` task creation in `/api/parent-tasks`
  - `mastery_update` notification enrichment in `/api/notifications`
- Updated env readiness output so `SMOKE_PARENT_ID` shows up as an optional transfer-evidence smoke input.
- Synced the release runbook so this smoke is listed alongside the other non-destructive validation commands.

## Why This Matters

- The recent Stage B/C work centralized wording and semantics for transfer-evidence follow-up across student, parent task, and notification surfaces.
- Before this slice, regression coverage proved the student closure logic but did not automatically assert that the parent follow-up loop still materialized with the expected metadata.
- This closes a real validation gap: the same review outcome now has an automated check on both sides of the loop.

## Validation

- `pnpm check:env`
  - result: passed
  - note: current local smoke env still does not include `SMOKE_PARENT_ID`
- `SMOKE_BASE_URL=http://127.0.0.1:3001 pnpm smoke:transfer-evidence`
  - result: passed
  - note: student-side transfer-evidence closure path passed on the isolated `3001` instance
  - note: parent-side follow-up assertions were skipped because `SMOKE_PARENT_ID` is not configured in the current local smoke env

## Affected Files

- `scripts/smoke-transfer-evidence-gap.mjs`
- `scripts/check-env.mjs`
- `docs/md_RELEASE_RUNBOOK.md`
- `docs/md_progress_socrates_20260329_transfer_evidence_parent_followup_smoke.md`

## Next Step

- Treat this file as the latest checkpoint for transfer-evidence smoke coverage.
- If a parent-linked smoke account is later available, rerun `pnpm smoke:transfer-evidence` with `SMOKE_PARENT_ID` populated to exercise the new parent-side assertions end to end.
