# Socrates Probe Build Recovery And Smoke Gate
Date: 2026-03-24

## Shipped In This Slice

- Extended `scripts/probe-socrates-build.mjs` with a probe-only `--trace-target-files` flag so isolated build runs can enable narrower file-lifecycle diagnostics without affecting the default path.
- Extended `scripts/trace-child-process.cjs` so the preload can:
  - trace `writeFile` activity for `export-detail.json` and `app-path-routes-manifest.json`
  - snapshot the target file state around writes and unlink failures
  - run a probe-only rename diagnostic when a retryable `unlink` failure occurs
- Re-ran the isolated full webpack probe with the target-file trace enabled.
- Re-ran the standard Socrates production build through `pnpm --filter @socra/socrates build` to confirm whether the deployment blocker still reproduces on the normal path.

## Current Judgment

- The previously tracked late-stage `EPERM unlink` on `export-detail.json` did not reproduce in the latest isolated webpack probe.
- The isolated full probe now completes end-to-end with:
  - isolated `distDir`
  - `webpackBuildWorker=false`
  - `workerThreads=true`
  - export-config sanitize enabled
  - unlink retry enabled
- The target-file trace showed `export-detail.json` being written from `next/dist/export/index.js:231` and no later retryable unlink failure for that file in the successful run.
- The file was absent at the end of the run, so `export-detail.json` was cleaned up successfully in this passing execution path.
- The normal local deployment build path also currently passes:
  - `pnpm --filter @socra/socrates build`
  - this used the default `next build` path with Turbopack and completed successfully
- The immediate local deployment blocker is therefore not currently reproducible on the standard build path.

## Affected Files

- `scripts/probe-socrates-build.mjs`
- `scripts/trace-child-process.cjs`
- `docs/md_progress_socrates_20260324_probe_build_recovery_and_smoke_gate.md`

## Commands Run

- `node --check scripts/trace-child-process.cjs`
- `node --check scripts/probe-socrates-build.mjs`
- `node scripts/probe-socrates-build.mjs --mode full --isolated-dist --trace-children --trace-target-files --disable-telemetry --webpack-build-worker false --worker-threads true --sanitize-export-config --retry-unlink`
- `rg -n "target-write-|unlink-|target-rename-|sanitize-export-config|patch-next-config|export-options-function-paths" C:\Users\BYD\AppData\Local\Temp\socrates-build-child-trace-1774320595843.log`
- `pnpm --filter @socra/socrates build`
- `Get-ChildItem Env:SMOKE*`

## Smoke

- No smoke command ran in this slice.
- Reason: the environment did not expose the required smoke variables:
  - `SMOKE_STUDY_USER_ID`
  - `SMOKE_BASE_URL` or `NEXT_PUBLIC_APP_URL`

## Notes

- The successful isolated probe trace file was:
  - `C:\Users\BYD\AppData\Local\Temp\socrates-build-child-trace-1774320595843.log`
- The key target-file events in that trace were:
  - `target-write-start` / `target-write-success` for `app-path-routes-manifest.json`
  - `target-write-start` / `target-write-success` for `export-detail.json`
- The successful `export-detail.json` write came from:
  - `next/dist/export/index.js:231`
- The latest trace still confirmed the worker-thread export sanitize path was active for:
  - `nextConfig.generateBuildId`
  - `nextConfig.exportPathMap`
- After the passing probe:
  - `apps/socrates/.next-probe/full-1774320595843/export-detail.json` did not remain on disk
  - the isolated probe output directory remained available for inspection
- The direct `pnpm` build was executed on local Node `20.19.0` and emitted an engine warning because the repo currently declares `22.x`.

## Next Step

- When smoke env is available, run `pnpm smoke:study-flow` to resume the original study/report/review smoke thread.
- If the local deployment failure returns, compare the failing run against the successful target-file trace from this slice before deciding whether to promote the probe mitigations into a dedicated local-build wrapper.
- Until the failure reproduces again on the standard path, avoid product-code changes for this thread and treat the current state as recovered-but-needing-smoke confirmation.
