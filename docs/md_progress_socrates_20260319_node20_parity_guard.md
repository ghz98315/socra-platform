# Socrates Node 20 Parity Guard
Date: 2026-03-19

## Shipped In This Slice

- Added `scripts/check-node-version.mjs` to enforce the repo-declared Node major before formal release validation.
- Added root script `pnpm check:node`.
- Updated release readiness notes so Node 20 parity is tracked as an explicit release gate instead of a soft reminder.

## Current Judgment

- The main product and smoke roadmap is still complete.
- The next remaining release item is no longer vague: the repo can now fail fast when validation runs under the wrong Node major.
- Current machine parity is still pending because the active shell remains on Node `v22.19.0`.

## Affected Files

- `package.json`
- `scripts/check-node-version.mjs`
- `docs/md_RELEASE_READINESS_20260319.md`
- `docs/md_progress_socrates_20260319_node20_parity_guard.md`

## Commands Run

- `node scripts/check-node-version.mjs`

## Smoke

- No smoke command ran in this slice.
- Reason: this slice only adds release-environment parity enforcement and does not change runtime behavior.

## Notes

- The repo metadata already agreed on Node `20` across `package.json`, `.nvmrc`, and `.node-version`.
- The new check makes that expectation executable, which reduces the chance of accidentally blessing a release run from Node `22`.
- The machine still lacks `nvm`, `fnm`, `volta`, or a second local Node installation, so actual parity switching remains an environment task.

## Next Step

- Switch the shell to Node `20.x`.
- Then rerun:
  - `pnpm check:node`
  - `pnpm check:env`
  - `pnpm build`
  - `pnpm smoke:socrates`
  - `pnpm smoke:study-flow`
