# Socrates Probe-Local Helper

- Date: 2026-04-14
- Status: implemented and locally validated with one environment caveat
- Scope: promote the previously manual probe-build workaround into reusable local helper commands

## What Shipped

- Added `scripts/start-socrates-probe-local.mjs`
  - runs the proven full probe build path
  - uses an isolated probe output directory under `apps/socrates/.next-probe/**`
  - temporarily mounts that probe output as `apps/socrates/.next`
  - starts `next start` against the mounted probe output
  - records probe-local state in `.codex-socrates-probe-start.json`
- Extended `scripts/socrates-local-utils.mjs`
  - added `getProbeStateFile(...)`
- Extended `scripts/stop-socrates-local.mjs`
  - probe-aware cleanup path
  - removes the temporary `.next` junction
  - restores the previous `.next` directory when a backup exists
  - removes probe output and probe state metadata
- Extended `scripts/status-socrates-local.mjs`
  - surfaces `MODE=probe-local`
  - shows probe state file presence and probe dist path
  - distinguishes standard down state from `probe_local_not_ready`
- Added root helper command:
  - `pnpm socrates:start:probe-local`
- Updated release/local runbook:
  - `docs/md_RELEASE_RUNBOOK.md`

## Validation

Static validation:

- `node --check scripts/start-socrates-probe-local.mjs`
- `node --check scripts/stop-socrates-local.mjs`
- `node --check scripts/status-socrates-local.mjs`
- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`

Functional validation:

1. `pnpm.cmd check:node`
2. `pnpm.cmd socrates:start:probe-local`
3. `pnpm.cmd socrates:status:local`
4. `pnpm.cmd socrates:stop:local`
5. `pnpm.cmd socrates:status:local`

Observed results:

- The probe-local helper now reproduces the previously successful full probe build path only after `--trace-children` is included.
- The build completed successfully on 2026-04-14 with:
  - webpack full build
  - TypeScript pass
  - page data collection
  - final build traces
- The helper created:
  - probe dist: `apps/socrates/.next-probe/probe-local-20260414030025`
  - state file: `.codex-socrates-probe-start.json`
  - `.next` junction pointing at the probe dist
- `stop-socrates-local` successfully cleaned the probe-local state and removed:
  - `.codex-socrates-probe-start.json`
  - `.codex-socrates-start.pid`
  - `apps/socrates/.next-probe/**`

## Environment Caveat

- Inside the Codex command host, the detached `next start` process reached `Ready in 3.8s`, then was no longer alive by the time a follow-up `status` check ran.
- There was no application runtime error in the probe start logs.
- Current judgment: this looks like host-level child-process cleanup after the command returns, not a regression in the probe-local build or restore flow.
- Because of that host behavior, this slice validates:
  - probe build success
  - probe state creation
  - `.next` junction handoff
  - probe-aware cleanup and restore
- It does not yet prove that the detached helper process will remain alive after command return in every shell host.

## Practical Use

Use this only when both of these are still blocked on the same Windows machine:

- `pnpm socrates:start:local`
- `pnpm socrates:start:dev-local`

Expected workflow:

1. `pnpm socrates:start:probe-local`
2. `pnpm socrates:status:local`
3. run the required local regression
4. `pnpm socrates:stop:local`

## Current Judgment

- This workaround is now reusable enough to preserve as the project baseline for this machine.
- The remaining gap is narrow:
  - confirm detached process persistence in a normal user PowerShell host outside the Codex command runner
  - if needed, switch the final launcher implementation to a host-native process creation path
