# Socrates Custom Domain Edge Path Diagnosis
Date: 2026-03-29

## Shipped In This Slice

- Investigated why production smoke passed on the Vercel alias but failed on `socrates.socra.cn`.
- Confirmed `socra-platform.vercel.app` can serve both read and write API traffic from the current validation machine.
- Confirmed `socrates.socra.cn` resolves through Cloudflare-managed DNS instead of Vercel-managed nameservers.

## Findings

- `Resolve-DnsName socrates.socra.cn`
  - result: `28.0.0.4`
- `Resolve-DnsName socra-platform.vercel.app`
  - result: `28.0.0.5`
- `vercel domains inspect socrates.socra.cn`
  - result: the domain is under third-party registrar control with Cloudflare nameservers
- Direct production validation outcome from this machine:
  - custom domain path could serve some traffic but showed empty replies / socket closes for other requests
  - Vercel production alias accepted both GET and POST API traffic

## Current Judgment

- The deployed Socrates app is healthy.
- The remaining issue is the custom-domain edge path from this machine/network, not the underlying Vercel deployment.
- The most likely follow-up surface is Cloudflare proxy / SSL / edge behavior for `socrates.socra.cn`.

## Affected Files

- `docs/md_deployment_cn.md`
- `docs/md_progress_socrates_20260329_custom_domain_edge_path_diagnosis.md`

## Next Step

- Keep release validation pointed at the Vercel alias when app/runtime confidence is the goal.
- Check Cloudflare proxy mode, SSL mode, and edge rules for `socrates.socra.cn` if custom-domain validation must also be green from this machine.
