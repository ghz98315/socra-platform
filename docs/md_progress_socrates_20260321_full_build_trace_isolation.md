# Socrates Full Build Trace Isolation
Date: 2026-03-21

## Shipped In This Slice

- Added reusable child-process tracing via `scripts/trace-child-process.cjs`.
- Extended `scripts/probe-socrates-build.mjs` with:
  - `--trace-children` support for child-process trace capture
  - `--trace-file <path>` override support
  - `--disable-telemetry` support so Next telemetry noise can be removed from full-build isolation
- Re-ran the Socrates build probe outside the sandbox to separate sandbox-only `EPERM` noise from the actual Windows blocker.

## Current Judgment

- The previously observed `.next` unlink / delete failures are not the primary blocker signal when the probe is run outside the sandbox.
- Outside the sandbox:
  - `Node 22` direct invocation still works
  - Socrates `tsc` still passes
  - `next build --webpack --experimental-build-mode compile` completes successfully from the probe
- The remaining real blocker is now isolated more precisely:
  - `next build --webpack` in `full` mode still fails with `spawn EPERM`
  - with telemetry enabled, Next first hits `spawn EPERM` while trying to run `git config --local --get remote.origin.url`
  - with telemetry disabled, the failure remains and narrows to `fork` of `next/dist/compiled/jest-worker/processChild.js`
- This means the durable blocker is no longer "generic build cleanup on Windows", but specifically child-process creation for Next's worker path during the full webpack build.

## Affected Files

- `scripts/probe-socrates-build.mjs`
- `scripts/trace-child-process.cjs`
- `docs/md_progress_socrates_20260321_full_build_trace_isolation.md`

## Commands Run

- `git status --short --branch`
- `Get-Content docs/md_progress_socrates_20260321_build_probe_automation.md`
- `Get-Content scripts/probe-socrates-build.mjs`
- `node scripts/probe-socrates-build.mjs --skip-clean --trace-children`
- `node scripts/probe-socrates-build.mjs --trace-children`
- `node scripts/probe-socrates-build.mjs --mode full --trace-children`
- `Remove-Item -LiteralPath '\\?\D:\github\Socrates_ analysis\socra-platform\apps\socrates\.next\cache\swc\plugins\windows_x86_64_23.0.0' -Recurse -Force`
- `Remove-Item -LiteralPath '\\?\D:\github\Socrates_ analysis\socra-platform\apps\socrates\.next' -Recurse -Force`
- `node scripts/probe-socrates-build.mjs --mode full --skip-clean --trace-children`
- `node scripts/probe-socrates-build.mjs --mode full --skip-clean --trace-children --disable-telemetry`
- temporary local config experiment:
  - set `experimental.webpackBuildWorker = false`
  - `Remove-Item -LiteralPath '\\?\D:\github\Socrates_ analysis\socra-platform\apps\socrates\.next' -Recurse -Force`
  - `node scripts/probe-socrates-build.mjs --mode full --skip-clean --trace-children --disable-telemetry`
  - restore `apps/socrates/next.config.ts`
- temporary local config experiment:
  - set `experimental.webpackBuildWorker = false`
  - set `experimental.workerThreads = true`
  - `Remove-Item -LiteralPath '\\?\D:\github\Socrates_ analysis\socra-platform\apps\socrates\.next' -Recurse -Force`
  - `node scripts/probe-socrates-build.mjs --mode full --skip-clean --trace-children --disable-telemetry`
  - `node scripts/probe-socrates-build.mjs --mode full --skip-clean --trace-children --disable-telemetry --sanitize-export-config`
  - restore `apps/socrates/next.config.ts`

## Smoke

- No smoke command ran in this slice.
- Reason: this slice stayed focused on local build-worker isolation only.

## Notes

- The latest successful compile-mode probe ran outside the sandbox and completed in roughly 111 seconds for webpack compile before finalization and trace collection completed.
- The cleanest failing trace in this slice is:
  - trace file: `C:\Users\BYD\AppData\Local\Temp\socrates-build-child-trace-1774067863715.log`
  - failure command: `fork` of `next/dist/compiled/jest-worker/processChild.js`
- The telemetry-specific `git config` spawn failure can be suppressed with `--disable-telemetry`, but doing so does not unblock the build worker.
- The stale `.next/cache/swc/plugins/windows_x86_64_23.0.0` residue still occasionally requires elevated cleanup before another clean-start full probe.
- A temporary `experimental.webpackBuildWorker = false` experiment was able to move the full build much farther:
  - webpack full build compiled successfully in about 4 minutes
  - the build then reached `Running TypeScript ...`
  - the later failure still narrowed back to `fork` of `next/dist/compiled/jest-worker/processChild.js`
- Extending that temporary experiment with `experimental.workerThreads = true` moved the build farther again:
  - webpack compilation succeeded
  - TypeScript completed
  - page-data collection and static-page generation started
  - the first worker-thread blocker was `DataCloneError: ()=>null could not be cloned`
- Tracing inside the export path then proved the function-valued `nextConfig` keys at that stage were:
  - `nextConfig.generateBuildId`
  - `nextConfig.exportPathMap`
- The probe-only sanitize path now strips function-valued `nextConfig` keys before the export worker-thread handoff.
- With that sanitize path enabled, the local full build now gets past the previous `DataCloneError` and reaches:
  - `Finalizing page optimization`
  - `Collecting build traces`
  - then fails later on `EPERM unlink` of `.next/export-detail.json`
- That temporary config was reverted immediately after the experiment and is not part of the committed app config.
- The pre-existing untracked `.editorconfig` file was left untouched and excluded from this slice.

## Next Step

- Inspect whether the failing full-build worker spawn can be bypassed or re-routed without source-level product changes:
  - confirm whether the remaining `.next/export-detail.json` unlink failure is transient file locking or a deterministic Next cleanup/write ordering issue on this Windows machine
  - if needed, add one more probe-only retry or post-export lock diagnostic around `export-detail.json`
- Only after the full build path is either working or conclusively environment-blocked should the Socrates smoke commands be retried.
