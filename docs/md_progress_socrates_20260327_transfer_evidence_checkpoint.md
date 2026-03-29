# Socrates Transfer Evidence Checkpoint
Date: 2026-03-27
Saved At: 2026-03-27 21:55:26 +08:00

## Shipped In This Slice

- Closed the phase-2 backend regression path for the math error-loop:
  - transfer-evidence smoke now passes
  - study-flow smoke now passes
- Added a missing-migration guard for the math error-loop schema:
  - `apps/socrates/lib/error-loop/migration-guard.ts`
  - wired into:
    - `apps/socrates/app/api/error-session/complete/route.ts`
    - `apps/socrates/app/api/review/attempt/route.ts`
- Fixed variant generation and evaluation regressions:
  - `apps/socrates/app/api/variants/route.ts`
  - `apps/socrates/app/api/variants/submit/route.ts`
  - `apps/socrates/lib/variant-questions/evaluate-answer.ts`
- Fixed the current DB compatibility issue for review closure:
  - `review_schedule.next_review_at` remains non-null on mastered closure
  - file: `apps/socrates/app/api/review/attempt/route.ts`
- Extended the review schedule API with transfer-evidence summary fields:
  - `transfer_evidence_ready`
  - `transfer_evidence_status_label`
  - `transfer_evidence_next_step`
  - `transfer_evidence_summary`
  - file: `apps/socrates/app/api/review/schedule/route.ts`
- Surfaced true-mastery vs pseudo-mastery signals in the student review hub:
  - review cards now show transfer-evidence state
  - top stats now include `迁移证据缺口`
  - file: `apps/socrates/app/(student)/review/page.tsx`
- Distinguish transfer-evidence notifications from generic mastery risk in the student notification center:
  - file: `apps/socrates/app/(student)/notifications/page.tsx`
- Hardened the local startup workflow against fake hangs:
  - `pnpm socrates:start:local` now runs behind `scripts/run-with-guard.mjs`
  - if the local app is already healthy, start reuses it and exits quickly
  - `pnpm socrates:status:local` now treats `HTTP=307` as healthy and prints:
    - `HEALTH=yes`
    - `STATE=healthy_port_stale_pid`
  - files:
    - `scripts/run-with-guard.mjs`
    - `scripts/socrates-local-utils.mjs`
    - `scripts/start-socrates-local.mjs`
    - `scripts/status-socrates-local.mjs`
    - `package.json`
    - `docs/md_RELEASE_RUNBOOK.md`

## Current Judgment

- The main blocker was not a slow local Socrates boot.
- The real issue was Windows process tracking:
  - local port `3000` was already healthy
  - `netstat.exe` lookup from Node was unstable on this machine and could throw `EPERM`
  - the tracked PID could therefore go stale even while the app stayed healthy
- The operational rule is now explicit:
  - if `pnpm socrates:status:local` shows `HTTP=307` and `HEALTH=yes`
  - treat the local app as healthy and continue
- The phase-2 backend path is usable.
- The student-facing review hub now exposes enough state to tell:
  - this题已经稳定掌握
  - 只是暂时会了
  - 还缺迁移证据

## Validation

- `pnpm socrates:status:local`
  - result: `HTTP=307`, `HEALTH=yes`, `STATE=healthy_port_stale_pid`
- `pnpm socrates:start:local`
  - result: `EXISTING=yes`, quick return instead of long wait
- `pnpm --filter @socra/socrates exec tsc --noEmit`
  - result: passed
- previously in this slice:
  - `pnpm smoke:transfer-evidence`
  - `pnpm smoke:study-flow`
  - both passed against local `http://127.0.0.1:3000`

## Open Blocker

- Git checkpoint commit is still blocked by local Windows permissions:
  - `git add` fails with `Unable to create ... .git/index.lock: Permission denied`
- This is not a code blocker.
- Development can continue, but a clean commit cannot be created until the local `.git` lock/permission issue is cleared.

## Next Step

- Continue into the review session page and completion flow so the student can see, inside the active复习链路:
  - why this题 is still provisional
  - what evidence is still missing
  - what next action closes the loop
- After that, move to the parent-visible summary chain for:
  - root-cause distribution
  - pseudo-mastery vs true mastery ratio
  - transfer-evidence gap visibility
