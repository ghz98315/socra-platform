# Socrates Cloudflare Follow-Up Handoff
Date: 2026-03-29

## Shipped In This Slice

- Converted the custom-domain diagnosis into a concrete Cloudflare follow-up checklist.
- Captured the shortest isolation path for `socrates.socra.cn`:
  - verify DNS target
  - compare proxied vs DNS-only behavior
  - check SSL mode
  - inspect edge rules / WAF / Workers
  - retest both GET and POST against the custom domain

## Why This Matters

- The app itself is already validated on the Vercel production alias.
- The remaining uncertainty is operational, not application-level.
- Without a checklist, future debugging would likely repeat the same domain-vs-app confusion.

## Affected Files

- `docs/md_deployment_cn.md`
- `docs/md_socrates_cloudflare_followup_20260329.md`
- `docs/md_progress_socrates_20260329_cloudflare_followup_handoff.md`

## Next Step

- Use the Cloudflare checklist when you are ready to debug `socrates.socra.cn`.
- Keep release smoke pointed at `https://socra-platform.vercel.app` until the custom-domain path is confirmed healthy again.
