# Socrates Domain Probe Script
Date: 2026-03-30

## Shipped In This Slice

- Added `pnpm probe:socrates-domain` as a lightweight operational check.
- The script compares:
  - `https://socrates.socra.cn`
  - `https://socra-platform.vercel.app`
- For each path, it probes:
  - `GET /api/points`
  - `POST /api/error-session`

## Why This Matters

- The deployed app was already proven healthy on the Vercel alias.
- The unresolved risk is the machine-specific or edge-specific custom-domain path.
- A dedicated probe is cheaper and faster than rerunning the full smoke suite every time.

## Validation Plan

- Run `pnpm probe:socrates-domain` from the current machine.
- If alias requests fail, treat that as an application/runtime problem.
- If alias succeeds and custom-domain fails, keep the investigation on Cloudflare / edge / DNS / SSL.

## Affected Files

- `package.json`
- `scripts/probe-socrates-domain-path.mjs`
- `docs/md_RELEASE_RUNBOOK.md`
- `docs/md_socrates_cloudflare_followup_20260329.md`
- `docs/md_progress_socrates_20260330_domain_probe_script.md`

## Next Step

- Run the new probe once from this machine and capture the current baseline.
