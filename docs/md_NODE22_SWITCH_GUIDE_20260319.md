# Node 22 Switch Guide
Date: 2026-03-19

## Current Baseline

- The repo now declares `node: 22.x`.
- The local single-machine release baseline is `Node v22.19.0`.
- `.nvmrc` and `.node-version` now both declare `22`.

## Why The Baseline Changed

- This machine has already completed the practical release path on Node `22.19.0`:
  - workspace build
  - standard Socrates smoke
  - study/report/review smoke
- Node `20.19.0` could pass env and smoke validation, but it repeatedly failed at the build gate on this same machine.
- There is currently no second machine or CI runner available to keep a separate Node 20 release standard validated.

## Recommended Windows Flow

Use `nvm-windows` to keep Node versions explicit.

### 1. Check Available Versions

```powershell
nvm list available
```

### 2. Install And Use The Baseline

```powershell
nvm install 22.19.0
nvm use 22.19.0
node -v
```

Expected output:

```powershell
v22.19.0
```

### 3. Verify The Repo

```powershell
cd "D:\github\Socrates_ analysis\socra-platform"
pnpm check:node
pnpm check:env
pnpm build
pnpm smoke:socrates
pnpm smoke:study-flow
```

## If `pnpm run <script>` Is Unstable

The direct script entry points remain valid fallbacks:

```powershell
node scripts/check-node-version.mjs
node scripts/check-env.mjs
node scripts/run-turbo-build.mjs
node scripts/smoke-socrates.mjs
node scripts/smoke-study-flow.mjs
```

## Historical Note

Node `20.19.0` was investigated on this machine and was able to pass env and smoke validation, but not the full build gate. That history should be treated as a machine-specific release-engineering note, not the current repo baseline.
