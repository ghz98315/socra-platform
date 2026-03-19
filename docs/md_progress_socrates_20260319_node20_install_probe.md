# Socrates Node 20 Install Probe
Date: 2026-03-19

## Shipped In This Slice

- Probed the local machine for an immediately usable Node 20 switch path after the new parity guard landed.
- Verified there is no `nvm`, `fnm`, or `volta` available in the active shell.
- Verified the machine currently exposes only `C:\Program Files\nodejs\node.exe` for `node`.
- Probed `winget` as the next practical install path and confirmed the package source state is currently broken.

## Current Judgment

- The repo-side work is complete for this thread.
- The remaining blocker is now confirmed to be machine-level, not application-level:
  - `winget list` fails because the source state cannot be loaded
  - `winget source reset --force` requires administrator privileges
- That means Node 20 parity cannot be completed autonomously from the current non-admin session.

## Affected Files

- `docs/md_progress_socrates_20260319_node20_install_probe.md`

## Commands Run

- `winget list --id OpenJS.NodeJS`
- `winget list --id OpenJS.NodeJS.LTS`
- `winget source reset --force`
- `where.exe node`

## Smoke

- No smoke command ran in this slice.
- Reason: this was a machine-environment probe only.

## Notes

- `winget list` failed with package source errors before any install attempt could begin.
- `winget source reset --force` did not complete because the current session lacks administrator privileges.
- The current machine still runs `Node v22.19.0`.
- The repo still declares `Node 20.x` via `package.json`, `.nvmrc`, and `.node-version`.

## Next Step

- Run an administrator shell and repair the local package source or install a Node version manager.
- Then switch to Node `20.x` and rerun:
  - `pnpm check:node`
  - `pnpm check:env`
  - `pnpm build`
  - `pnpm smoke:socrates`
  - `pnpm smoke:study-flow`
