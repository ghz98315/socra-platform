# Socrates Local Helper And Node22 Alignment
Date: 2026-03-24

## Shipped In This Slice

- Added repo-local service helpers:
  - `scripts/start-socrates-local.mjs`
  - `scripts/status-socrates-local.mjs`
  - `scripts/stop-socrates-local.mjs`
- Added package scripts:
  - `pnpm socrates:start:local`
  - `pnpm socrates:status:local`
  - `pnpm socrates:stop:local`
- Updated the active release runbook with the local helper flow and the Windows `.next` lock warning.

## Current Judgment

- The repo Node baseline is already unified to `22.x`:
  - `package.json engines.node`
  - `.nvmrc`
  - `.node-version`
- There is no repo-metadata conflict left to fix.
- The remaining Node issue is only shell alignment:
  - some local commands were still being launched from Node `20.19.0`
  - that causes noisy engine warnings and can blur diagnostics
- The local deployment and smoke path on this machine should use Node `22.19.0`.
- A separate issue also exists on Windows:
  - running `next start` against `apps/socrates/.next`
  - and then rerunning `next build`
  - can trigger `EPERM unlink` on `.next/app-path-routes-manifest.json`
- That file-lock behavior is a running-service / build-output conflict, not proof that the Node baseline is wrong.

## Affected Files

- `scripts/start-socrates-local.mjs`
- `scripts/status-socrates-local.mjs`
- `scripts/stop-socrates-local.mjs`
- `package.json`
- `docs/md_RELEASE_RUNBOOK.md`
- `docs/md_progress_socrates_20260324_local_helper_and_node22_alignment.md`

## Commands Run

- repo baseline inspection:
  - `Get-Content .nvmrc`
  - `Get-Content .node-version`
  - `Get-Content scripts/check-node-version.mjs`
  - `node scripts/check-node-version.mjs` under Node `22.19.0`
- machine validation:
  - `pnpm smoke:study-flow`
  - local HTTP probes to `http://127.0.0.1:3000`
  - listener inspection on port `3000`
- helper validation:
  - syntax-check new helper scripts
  - confirmed the helper-launched local server reached `Ready` quickly and wrote a real listener PID file

## Smoke

- Study-flow smoke remains passing on the local service.
- Latest successful smoke in this thread created:
  - `asset_id=ef359775-37b4-47f3-bbce-1129e071ea80`
  - `review_id=c4d90c87-bfb9-4073-a7f2-3859b8d0f813`

## Notes

- A healthy local helper-launched server was confirmed at:
  - `http://127.0.0.1:3000`
  - PID file value matched the actual Node listener PID
- A later local helper launch also produced:
  - `.codex-socrates-start-20260324090848.out.log`
  - `Ready in 7.5s`
- Some launcher commands in the Codex execution environment still appeared long-running even after the local server was healthy.
- The reliable truth source for this thread is therefore:
  - `pnpm socrates:status:local`
  - or an HTTP probe to the local URL
  - not whether the outer launcher command has returned yet inside Codex.

## Next Step

- Prefer the new local helper scripts for future smoke and local deployment checks.
- If a fresh Node `22` build is needed, stop the local service first, then rerun:
  - `pnpm socrates:stop:local`
  - `pnpm --filter @socra/socrates build`
- Treat Node `20.19.0` only as a historical local-runtime observation on this machine, not as the current repo target.
