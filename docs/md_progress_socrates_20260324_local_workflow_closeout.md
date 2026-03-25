# Socrates Local Workflow Closeout
Date: 2026-03-24

## Shipped In This Slice

- Cleaned obsolete probe outputs and stale local-start logs from the workspace.
- Finished the local helper trio for Socrates:
  - `scripts/start-socrates-local.mjs`
  - `scripts/status-socrates-local.mjs`
  - `scripts/stop-socrates-local.mjs`
- Fixed the Windows start helper so it:
  - launches the local server through a detached PowerShell wrapper under Node `22`
  - waits for HTTP readiness instead of treating a long-running foreground process as the success signal
  - records the real listener PID after the server is healthy, not the wrapper PID
- Revalidated the study-flow smoke on the local server under Node `22`.

## Current Judgment

- The local development / smoke workflow is now operational and repeatable on this machine.
- The repo baseline should stay on Node `22.x`.
- The previous long-running "hang" pattern was a launcher / process-tracking problem, not a slow or blocked Next.js startup.
- The Windows `.next` unlink failures and the local service lifecycle are separate concerns:
  - a running local service can still hold `.next` files and interfere with a fresh build
  - use `stop` before rebuilds

## Affected Files

- `scripts/start-socrates-local.mjs`
- `scripts/status-socrates-local.mjs`
- `scripts/stop-socrates-local.mjs`
- `package.json`
- `docs/md_RELEASE_RUNBOOK.md`
- `docs/md_progress_socrates_20260324_local_workflow_closeout.md`

## Commands Run

- cleanup:
  - removed stale `.next-probe` outputs
  - removed stale `.codex-socrates-start*` logs except the latest useful pair
- local validation:
  - `node scripts/status-socrates-local.mjs`
  - `node scripts/stop-socrates-local.mjs`
  - `node scripts/start-socrates-local.mjs` outside sandbox for detached launcher validation
- smoke:
  - `SMOKE_STUDY_USER_ID=f59d5551-5f75-474c-9a7e-aa3d545965a5`
  - `SMOKE_BASE_URL=http://127.0.0.1:3000`
  - `pnpm smoke:study-flow`

## Smoke

- Executed on the local helper-launched server under Node `22`.
- Result: passed
- Latest created records:
  - `asset_id=930a4c0f-d8aa-4221-affe-363867a2d225`
  - `review_id=44ae345e-0d9e-4c4d-93e6-eb8bd6b028cd`

## Notes

- The latest healthy local-start log was:
  - `.codex-socrates-start-20260324112703.out.log`
- That run reported:
  - `Local: http://127.0.0.1:3000`
  - `Ready in 7.7s`
- The local helper `status` command was validated against the real listener PID:
  - `PID=34000`
  - `ALIVE=yes`
  - `HTTP=307`
- The local helper `stop` command then cleanly stopped that same listener PID.
- `HTTP=307` at the root URL is acceptable for this readiness check; it still proves the server is live and handling requests.

## Next Step

- Use this local flow for future work:
  - `pnpm socrates:start:local`
  - `pnpm socrates:status:local`
  - `pnpm socrates:stop:local`
- Before any fresh Socrates build on Windows, stop the local server first.
- If a future launcher command appears long-running again, trust:
  - the latest local-start log,
  - `pnpm socrates:status:local`,
  - and HTTP health,
  rather than the outer command still being attached.
