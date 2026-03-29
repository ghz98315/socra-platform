# Socrates Production Smoke Via Vercel Alias
Date: 2026-03-29

## Shipped In This Slice

- Ran release-style smoke validation against the freshly deployed production Socrates build.
- Confirmed the app/runtime itself is healthy by running the smoke suite against the Vercel production alias `https://socra-platform.vercel.app`.
- Isolated a separate access-path issue on the custom domain `http://socrates.socra.cn` / `https://socrates.socra.cn` from the current validation machine:
  - some GET requests still succeeded over `http`
  - POST requests could be closed by the peer on `http`
  - direct TLS handshakes to `https://socrates.socra.cn` failed from this machine

## Validation

- `pnpm smoke:socrates`
  - result: passed against `http://socrates.socra.cn`
- `pnpm smoke:study-flow`
  - result: failed against `http://socrates.socra.cn`
  - failure shape: transport/socket close on `POST /api/reports/study`
- `pnpm smoke:transfer-evidence`
  - result: failed against `http://socrates.socra.cn`
  - failure shape: transport/socket close on `POST /api/error-session`
- `SMOKE_BASE_URL=https://socra-platform.vercel.app pnpm smoke:study-flow`
  - result: passed
- `SMOKE_BASE_URL=https://socra-platform.vercel.app pnpm smoke:transfer-evidence`
  - result: passed

## Current Judgment

- The deployed Socrates application is healthy on the Vercel production target.
- The remaining problem is not the deployed app logic itself; it is the custom-domain access path from this validation machine.
- Release confidence for the app is now materially higher, but custom-domain networking / TLS still deserves separate operational follow-up.

## Affected Files

- `docs/md_RELEASE_RUNBOOK.md`
- `docs/md_progress_socrates_20260329_production_smoke_via_vercel_alias.md`

## Next Step

- Treat production smoke as passed for the deployed app/runtime.
- Follow up separately on `socrates.socra.cn` edge/TLS behavior from the current machine or network path.
- If a valid `SMOKE_PARENT_ID` becomes available, rerun `pnpm smoke:transfer-evidence` against the Vercel alias to exercise the parent-side assertions end to end.
