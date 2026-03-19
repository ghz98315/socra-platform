# Socrates Node 20 Parity Validation
Date: 2026-03-19

## Shipped In This Slice

- Validated the repo under an actual Node `20.19.0` shell after installing and switching with `nvm`.
- Confirmed the new Node parity guard works as intended in the correct runtime.
- Confirmed both production smoke paths still pass on Node 20.
- Narrowed the remaining Node 20 gap to machine-local build stability, not env wiring or runtime correctness.

## Current Judgment

- Node 20 runtime parity is partially verified:
  - env check passed
  - standard Socrates smoke passed
  - study/report/review smoke passed
- Node 20 build parity on the current Windows machine is still blocked.
- The blocker is not just the root `pnpm build` wrapper:
  - `pnpm build` failed in `@socra/auth`
  - direct `next build` also failed for app builds
  - direct `vite build` also failed for essay

## Affected Files

- `docs/md_RELEASE_READINESS_20260319.md`
- `docs/md_progress_socrates_20260319_node20_parity_validation.md`

## Commands Run

- `node scripts/check-node-version.mjs`
- `node scripts/check-env.mjs`
- `node scripts/run-turbo-build.mjs`
- `node scripts/smoke-socrates.mjs`
- `node scripts/smoke-study-flow.mjs`
- `pnpm build`
- direct `next build`
- direct `next build --webpack`
- direct `vite build`

## Smoke

- `node scripts/smoke-socrates.mjs`
  - passed
- `node scripts/smoke-study-flow.mjs`
  - passed
  - `asset_id=73c9d5c6-4c25-455b-a92e-b14e62c0a06d`
  - `review_id=f550630d-894d-4934-a3e2-ca70138180f3`

## Notes

- `pnpm run <script>` remained unreliable after the Node switch, so the stable validation path used direct `node scripts/...` entry points.
- On this machine, Node `20.19.0` consistently hit memory failures during build workloads:
  - V8 zone out-of-memory during package `tsc`
  - Next build worker memory failure for app builds
  - native allocation failure during Vite build
- These failures did not prevent smoke validation, which means the release gap is now clearly build-environment-specific.

## Next Step

- Treat Node 20 build parity on this machine as an open release-engineering issue.
- Either:
  - test a different Node 20 patch level or installation source on this machine
  - or run the formal Node 20 build gate in CI / another Windows environment
  - or deliberately revise the repo's declared release Node version if the team chooses to standardize on the now-proven Node 22 path
