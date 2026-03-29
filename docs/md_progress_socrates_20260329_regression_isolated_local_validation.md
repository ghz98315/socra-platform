# Socrates Regression Isolated Local Validation
Date: 2026-03-29

## Shipped In This Slice

- Shifted from Stage C wording consolidation into regression and local workflow hardening.
- Ran regression recommendation against the current dirty worktree:
  - recommended target: `workspace`
  - recommended profile: `smoke`
- Confirmed the first regression failure was not a missing route in source code:
  - `study-flow smoke` passed
  - `transfer-evidence smoke` failed on `/api/review/attempt` with `404`
  - local build output already contained `/api/review/attempt`
- Diagnosed the root cause as a stale healthy listener on `127.0.0.1:3000` serving an older Socrates instance:
  - `socrates:status:local` reported `STATE=healthy_listener_pid`
  - the listener on `3000` could not be cleanly terminated due Windows access restrictions
- Validated the current workspace build through an isolated local instance:
  - built `@socra/socrates` with `SOCRA_ALLOW_ACTIVE_PORT_3000_BUILD=1`
  - started the current build on `127.0.0.1:3001`
  - reran smoke flows against `3001`
- Hardened local helper scripts so non-default ports no longer pollute the default local PID tracking:
  - per-port pid files via `getPidFile(port)`
  - `status-socrates-local.mjs` now distinguishes “tracked pid is alive but belongs to another listener”
  - `stop-socrates-local.mjs` now prefers the actual listener for the requested port
  - `build-socrates-safe.mjs` no longer blocks only because an unrelated tracked pid is alive
  - `start-socrates-local.mjs` writes the port-specific pid file when reusing an already-healthy instance

## Validation

- `node scripts/recommend-regression.mjs`
  - result: `workspace + smoke`
- `pnpm smoke:study-flow`
  - result: passed
- `SMOKE_BASE_URL=http://127.0.0.1:3001 pnpm smoke:transfer-evidence`
  - result: passed
- `SMOKE_BASE_URL=http://127.0.0.1:3001 pnpm smoke:study-flow`
  - result: passed
- `SMOKE_BASE_URL=http://127.0.0.1:3001 pnpm smoke:socrates`
  - result: passed
- `node scripts/status-socrates-local.mjs`
  - result: default port no longer misreports the `3001` tracked pid as a healthy tracked `3000` instance
- `node scripts/status-socrates-local.mjs --port 3001`
  - result: `STATE=healthy_tracked_pid`

## Current Judgment

- The 404 seen during transfer-evidence smoke was an environment/runtime consistency problem, not a missing route in the working tree.
- The current workspace build is now validated through an isolated local Socrates instance on `3001`.
- Local helper behavior is materially safer for future smoke/debug loops when a stale or protected listener is still occupying `3000`.

## Affected Files

- `scripts/socrates-local-utils.mjs`
- `scripts/start-socrates-local.mjs`
- `scripts/status-socrates-local.mjs`
- `scripts/stop-socrates-local.mjs`
- `scripts/build-socrates-safe.mjs`
- `docs/md_progress_socrates_20260329_regression_isolated_local_validation.md`

## Next Step

- Treat the current branch as regression-validated for this round.
- If continuing immediately, prefer:
  - targeted smoke additions around the newly centralized review/parent semantics
  - or commit/PR preparation
  - instead of more local workflow surgery
