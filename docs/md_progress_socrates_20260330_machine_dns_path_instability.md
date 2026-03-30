# Socrates Machine DNS Path Instability
Date: 2026-03-30

## Shipped In This Slice

- Added `pnpm probe:socrates-domain` and ran it from the current validation machine.
- Confirmed the machine can no longer be treated as a neutral observer for Vercel alias health.

## Findings

- `pnpm probe:socrates-domain`
  - `custom-get-points`: passed
  - `custom-post-error-session`: passed
  - `alias-get-points`: failed with connect timeout
  - `alias-post-error-session`: failed with connect timeout
- `Resolve-DnsName socra-platform.vercel.app`
  - resolved to:
    - `74.86.12.173`
    - `2a03:2880:f129:83:face:b00c:0:25de`
- `Resolve-DnsName socra-socrates-ghz98315s-projects.vercel.app`
  - resolved to:
    - `157.240.7.8`
    - `2a03:2880:f127:83:face:b00c:0:25de`

## Current Judgment

- Those alias resolutions are not consistent with a normal Vercel validation path.
- The current machine or upstream resolver is introducing DNS / network-path instability for `*.vercel.app`.
- From this point on, alias failures from this machine should not be treated as direct evidence of production app regression.

## Affected Files

- `package.json`
- `scripts/probe-socrates-domain-path.mjs`
- `docs/md_RELEASE_RUNBOOK.md`
- `docs/md_socrates_cloudflare_followup_20260329.md`
- `docs/md_progress_socrates_20260330_domain_probe_script.md`
- `docs/md_progress_socrates_20260330_machine_dns_path_instability.md`

## Next Step

- Use another network, resolver, or machine for any further Vercel-alias validation.
- Keep separating:
  - app/runtime regressions
  - Cloudflare custom-domain issues
  - machine-local DNS / network path issues
