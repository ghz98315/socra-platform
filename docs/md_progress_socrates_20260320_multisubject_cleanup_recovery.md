# Socrates 多学科清理线程恢复检查
Date: 2026-03-20

## Shipped In This Slice

- Recovered the still-dirty `study V2 / legacy wrapper cleanup` thread from the local worktree and aligned it against the current `main` head on `2026-03-20`.
- Confirmed that the active study/report/review links already point at `assets-v2`, `bridges-v2`, `StudyResultSummaryV2`, and the V2 study workbenches, while the legacy file paths now act as thin wrappers only.
- Recorded the current recovery findings in a clean UTF-8 progress doc because the older long-form multisubject stage docs are not valid UTF-8 and cannot be safely patched with the repo-standard workflow.

## Current Judgment

- The recovered cleanup slice is still code-complete enough to pass `apps/socrates` type-checking.
- The remaining blockers on `2026-03-20` are environment-shaped rather than obvious product regressions:
  - local `@socra/socrates build` is still blocked by persistent Windows `EPERM` operations inside `apps/socrates/.next`
  - `study-flow smoke` still fails with a network/socket-level error even outside the sandbox
- Because of those blockers, this slice is documented but not yet promoted to a fresh local checkpoint commit in this recovery pass.

## Affected Files

- `docs/md_progress_socrates_20260320_multisubject_cleanup_recovery.md`

## Commands Run

- `git status --short`
- `git log --oneline --decorate -n 12`
- `pnpm autopilot --status-file D:\github\Socrates_ analysis\socra-platform\tmp_autopilot_status_20260320.txt`
- `node scripts/run-regression.mjs --target socrates --profile smoke`
- `pnpm exec tsc --noEmit -p apps\socrates\tsconfig.json`
- `pnpm smoke:study-flow`
- `cmd /c rd /s /q "\\?\D:\github\Socrates_ analysis\socra-platform\apps\socrates\.next"`
- `pnpm --filter @socra/socrates build`
- `C:\Users\BYD\AppData\Local\nvm\v22.19.0\node.exe C:\Users\BYD\AppData\Roaming\npm\node_modules\pnpm\bin\pnpm.cjs --dir D:\github\Socrates_ analysis\socra-platform exec tsc --noEmit -p apps\socrates\tsconfig.json`
- `C:\Users\BYD\AppData\Local\nvm\v22.19.0\node.exe D:\github\Socrates_ analysis\socra-platform\apps\socrates\node_modules\next\dist\bin\next build`
- `C:\Users\BYD\AppData\Local\nvm\v22.19.0\node.exe D:\github\Socrates_ analysis\socra-platform\apps\socrates\node_modules\next\dist\bin\next build --webpack`
- `C:\Users\BYD\AppData\Local\nvm\v22.19.0\node.exe D:\github\Socrates_ analysis\socra-platform\apps\socrates\node_modules\next\dist\bin\next build --webpack --experimental-build-mode compile`

## Smoke

- `pnpm smoke:study-flow` did not pass in this recovery pass.
- The concrete failure on `2026-03-20` is `TypeError: fetch failed` with `UND_ERR_SOCKET` / `other side closed`.
- `pnpm smoke:socrates` was intentionally not rerun after that, because the first smoke already showed an environment/network-class blocker instead of a business assertion signal.

## Notes

- This recovery pass ran on `Node v20.19.0`.
- The repo release baseline was switched to `Node 22.x` on `2026-03-19`, so a baseline mismatch still remains for this local shell.
- Removing a single locked file under `.next` was not enough; even after deleting the full `apps/socrates/.next` directory, a fresh build still hit `EPERM` while writing `server-reference-manifest.json`.
- A direct `Node 22.19.0 + next build` run reproduced the same `EPERM rename` on `apps/socrates/.next/server/server-reference-manifest.json`, so the current blocker is not just `pnpm` or the older `Node 20` shell.
- A focused local experiment showed three distinct Windows-only blockers in sequence:
  - default `next build` failed in Turbopack output writes with `.next` `EPERM`
  - `next build --webpack` with build-worker disabled could compile, but Next's worker-based type-check phase still hit `spawn EPERM`
  - `next build --webpack --experimental-build-mode compile` progressed through compile, page-data collection, and build traces, which narrows the remaining failure surface to full static-generation/finalization rather than the entire compile pipeline
- Scanning the loaded Next config under `PHASE_PRODUCTION_BUILD` showed the only function-valued field was `generateBuildId`, which lines up with the later worker-thread `DataCloneError: ()=>null could not be cloned` seen during exploratory config toggles.
- Removing the stale `.next/cache/swc/plugins/windows_x86_64_23.0.0` residue finally allowed a full `.next` cleanup again, but it did not eliminate the later `spawn EPERM` or `DataCloneError` failures during fresh builds.
- Re-testing after that cleanup confirmed the split failure modes are stable:
  - `workerThreads: false` leads back to `spawn EPERM`
  - `workerThreads: true` gets farther, into `Collecting page data` / `Generating static pages`, then fails with `DataCloneError`
- The temporary config/script experiments used to isolate those failures were intentionally reverted after the findings were captured, because they did not yet produce a clean full `next build`.
- The long-form docs `docs/md_progress_socrates_multisubject_20260316_stage.md` and `docs/md_multisubject_internal_beta_20260316.md` contain invalid UTF-8 bytes, so they need an encoding-cleanup pass before they can be safely synchronized with `apply_patch`.
- Local checkpoint commit was intentionally skipped in this pass until build-output locking and smoke connectivity are understood well enough to avoid checkpointing an ambiguously validated state.

## Next Step

- Clean the encoding of the older multisubject stage docs so the `2026-03-20` recovery findings can be merged back into the canonical long-form docs.
- Identify what is holding or re-locking `apps/socrates/.next` during `next build`, then rerun `pnpm --filter @socra/socrates build`.
- Re-run `pnpm smoke:socrates` and `pnpm smoke:study-flow` on a machine/network path that can reach the target environment reliably.
- If those environment blockers are cleared without new code findings, save the recovered multisubject cleanup slice as an isolated local checkpoint.
