# Socrates Deployment Validation Rollup
Date: 2026-03-30

## Scope

This rollup replaces the fragmented deployment/debugging progress notes from 2026-03-29 to 2026-03-30 for:

- Vercel project binding audit
- app-local `ignoreCommand` setup
- production smoke via Vercel alias
- custom-domain edge-path diagnosis
- Cloudflare follow-up handoff
- domain probe helper
- machine-local DNS / network-path instability findings

## Final Conclusions

1. The canonical production Vercel projects are:
- `socra-landing`
- `socra-socrates`
- `socra-essay`

2. The duplicate project `socrates` created on 2026-03-29 was an accidental relink and must not be used for production deployment or inspection.

3. The repo now carries app-local `ignoreCommand` rules in each app `vercel.json`, so docs-only or unrelated app changes can be skipped before build when Vercel project settings honor the checked-in config.

4. The deployed Socrates application itself was validated as healthy on 2026-03-29 through the Vercel production alias `https://socra-platform.vercel.app`.

5. Failures seen on `socrates.socra.cn` should first be treated as Cloudflare / custom-domain path issues rather than app regressions when the alias remains healthy.

6. On 2026-03-30, the current validation machine also showed abnormal DNS / network-path behavior for `*.vercel.app`, so alias failures from this machine alone are no longer sufficient evidence of an app/runtime regression.

## What Was Shipped

### Vercel binding guard

- Added `pnpm check:vercel-links`
- Documented the canonical `.vercel/project.json` bindings
- Captured the duplicate-project warning in deployment docs

### App-level deploy skipping

- Added `scripts/vercel-ignore-build.mjs`
- Wired `ignoreCommand` into:
  - `apps/landing/vercel.json`
  - `apps/socrates/vercel.json`
  - `apps/essay/vercel.json`

### Release validation hardening

- Confirmed smoke against the Vercel alias can separate app health from custom-domain transport issues
- Added `pnpm probe:socrates-domain` for a fast custom-domain vs alias comparison
- Updated the release and deployment docs to encode the correct diagnosis order

## Operational Baseline Going Forward

Use this decision order:

1. Run `pnpm check:vercel-links` before manual Vercel CLI work.
2. Treat `git push origin main` as the default production release path.
3. If `socrates.socra.cn` fails, run `pnpm probe:socrates-domain`.
4. If alias passes and custom domain fails, investigate Cloudflare.
5. If alias also fails from the current machine, verify DNS / network path on another machine or resolver before escalating to an app regression.

## Canonical Docs After Consolidation

- `docs/md_RELEASE_RUNBOOK.md`
- `docs/md_deployment_cn.md`
- `docs/md_TEST_GUIDE.md`
- `docs/md_socrates_cloudflare_followup_20260329.md`

## Superseded Slice Docs

The following files were fully merged into this rollup and the canonical docs above:

- `docs/md_progress_socrates_20260329_vercel_binding_audit.md`
- `docs/md_progress_socrates_20260329_vercel_ignore_command_setup.md`
- `docs/md_progress_socrates_20260329_production_smoke_via_vercel_alias.md`
- `docs/md_progress_socrates_20260329_custom_domain_edge_path_diagnosis.md`
- `docs/md_progress_socrates_20260329_cloudflare_followup_handoff.md`
- `docs/md_progress_socrates_20260330_domain_probe_script.md`
- `docs/md_progress_socrates_20260330_machine_dns_path_instability.md`

## Related Open Follow-Up

- `docs/md_socrates_cloudflare_followup_20260329.md` remains the live Cloudflare checklist
- `docs/md_progress_socrates_20260329_transfer_evidence_parent_followup_smoke.md` remains separate because it tracks functional smoke coverage, not deployment-path diagnosis
