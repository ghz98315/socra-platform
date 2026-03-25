# Socrates Probe Isolated Dist Export Detail Isolation
Date: 2026-03-24

## Shipped In This Slice

- Extended `scripts/probe-socrates-build.mjs` with probe-only flags for:
  - isolated `distDir` output under `apps/socrates/.next-probe/**`
  - temporary `experimental.webpackBuildWorker` override
  - temporary `experimental.workerThreads` override
  - targeted `unlink` retry configuration
- Extended `scripts/trace-child-process.cjs` so the probe preload can:
  - override Next config loading without editing `apps/socrates/next.config.ts`
  - keep the existing export-config sanitize path active for worker-thread export
  - retry and trace `EPERM unlink` failures on `export-detail.json` and `app-path-routes-manifest.json`
- Added probe cleanup protection so `apps/socrates/next-env.d.ts` and `apps/socrates/tsconfig.json` are restored after an isolated-dist probe run, even when the build still fails.

## Current Judgment

- The probe-only config injection is now working.
- The full webpack build can now be reproduced without touching the default `.next` directory and without editing committed app config:
  - isolated `distDir` override applied successfully
  - `webpackBuildWorker: false` and `workerThreads: true` applied successfully
  - `nextConfig.generateBuildId` and `nextConfig.exportPathMap` were confirmed and stripped before the export worker-thread handoff
- With those probe-only mitigations in place, the build still fails at a later deterministic Windows file operation:
  - `EPERM unlink` on `apps/socrates/.next-probe/<run>/export-detail.json`
  - the probe retried that `unlink` 6 times and it still failed
- This means the remaining blocker is no longer stale default `.next` cleanup, and no longer the earlier `DataCloneError`; it is now a durable late-stage file-lock / unlink failure around `export-detail.json`.

## Affected Files

- `scripts/probe-socrates-build.mjs`
- `scripts/trace-child-process.cjs`
- `docs/md_progress_socrates_20260324_probe_isolated_dist_exportdetail.md`

## Commands Run

- `node --check scripts/trace-child-process.cjs`
- `node --check scripts/probe-socrates-build.mjs`
- baseline confirmation:
  - `node scripts/probe-socrates-build.mjs --mode full --skip-clean --trace-children --disable-telemetry`
  - `node scripts/probe-socrates-build.mjs --mode full --trace-children --disable-telemetry`
- isolated-dist probe validation:
  - `node scripts/probe-socrates-build.mjs --mode full --isolated-dist --trace-children --disable-telemetry --webpack-build-worker false --worker-threads true --sanitize-export-config --retry-unlink`
  - re-ran the same isolated-dist probe after adding file-restore protection
- trace inspection:
  - `rg -n "patch-next-config|unlink-error|export-options-function-paths|sanitize-export-config" C:\Users\BYD\AppData\Local\Temp\socrates-build-child-trace-1774318322378.log`

## Smoke

- No smoke command ran in this slice.
- Reason: this slice stayed focused on late-stage local build isolation and probe hardening only.

## Notes

- The successful probe-only config injection event in the latest trace was:
  - `patch-next-config` with `distDir=.next-probe\full-1774318322377`, `webpackBuildWorker=false`, `workerThreads=true`
- The latest trace also confirmed the remaining function-valued export config keys were:
  - `options.nextConfig.generateBuildId`
  - `options.nextConfig.exportPathMap`
- The latest deterministic failing path was:
  - `D:\github\Socrates_ analysis\socra-platform\apps\socrates\.next-probe\full-1774318322377\export-detail.json`
- The `unlink` retry probe proved this is not a one-shot transient failure on this machine:
  - attempts `1` through `6` all failed with the same `EPERM unlink`
- The isolated-dist probe still leaves probe output directories under `apps/socrates/.next-probe/` for manual inspection.
- The probe now restores the two project files that Next auto-mutates during this validation path:
  - `apps/socrates/next-env.d.ts`
  - `apps/socrates/tsconfig.json`
- The local machine is still running the repo from Node `20.19.0` while the probe invokes a direct Node `22.19.0` executable for the actual Next build.

## Next Step

- Inspect whether `export-detail.json` is being held by the current build process itself or by a later webpack/trace/cache flush on this Windows machine:
  - instrument the exact file-creation / reopen / unlink sequence around `next/dist/build/index.js:2487`
  - compare whether the webpack cache `rename ... 0.pack_ -> 0.pack` `EPERM` warnings are part of the same lock chain
- If the lock source cannot be removed, decide whether the next probe step should:
  - patch a probe-only `export-detail.json` rename/delete fallback for confirmation, or
  - conclude the remaining failure is environment-specific and stop short of product-code changes.
