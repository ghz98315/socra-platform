# Socrates Windows Build Probe Automation
Date: 2026-03-21

## Shipped In This Slice

- Added `scripts/probe-socrates-build.mjs` as a repo-native diagnostic entrypoint for the current Windows-only Socrates build blocker.
- Added root script `pnpm probe:socrates-build` so the probe can be reused without reconstructing the Node 22 direct-invocation chain by hand.
- Codified the currently stable probe workflow:
  - locate a usable local `Node 22` executable directly instead of relying on `nvm use`
  - locate `pnpm.cjs` in the active Windows profile
  - optionally clean `apps/socrates/.next`
  - run Socrates `tsc`
  - run `next build --webpack` in either `compile` or `full` probe mode
- Added `--skip-clean` support because the current machine may require a one-off privileged `.next` cleanup before the probe can continue.

## Current Judgment

- The build blocker is now easier to reproduce and communicate locally.
- The probe does not resolve the Windows blocker yet, but it removes the ad-hoc shell quoting and `nvm use` instability from future investigations.
- On the current machine, the probe confirms:
  - `Node 22` direct invocation works
  - Socrates `tsc` can pass after `.next` is cleaned
  - a clean-start `webpack` compile probe still hits `spawn EPERM`

## Affected Files

- `package.json`
- `scripts/probe-socrates-build.mjs`
- `docs/md_progress_socrates_20260321_build_probe_automation.md`

## Commands Run

- `git status --short --branch`
- `git log --oneline --decorate -n 6`
- `node scripts/probe-socrates-build.mjs`
- `cmd /c rd /s /q "\\?\D:\github\Socrates_ analysis\socra-platform\apps\socrates\.next"`
- `node scripts/probe-socrates-build.mjs --skip-clean`

## Smoke

- No smoke command ran in this slice.
- Reason: this slice is limited to local build-probe automation for the already-known Windows build blocker.

## Notes

- The probe intentionally uses a direct `Node 22` executable path because `nvm use 22.19.0` has hung in this environment before the actual build commands even started.
- The probe currently fails fast and explicitly if `.next` cleanup is blocked by the stale SWC plugin cache path under `.next/cache/swc/plugins`.
- After a privileged manual `.next` cleanup, the probe can continue with `--skip-clean` and reproduces the current machine's `spawn EPERM` during the webpack compile probe.
- The pre-existing untracked `.editorconfig` file was left untouched and intentionally excluded from this slice.

## Next Step

- Extend the probe only if it helps isolate the remaining system blocker further; do not mix speculative product changes into this thread.
- Continue the Windows build investigation from the now-stable probe entrypoint, focusing on why the clean-start webpack compile still triggers `spawn EPERM`.
- Re-run `pnpm smoke:socrates` and `pnpm smoke:study-flow` only after the local build path is trustworthy again.
