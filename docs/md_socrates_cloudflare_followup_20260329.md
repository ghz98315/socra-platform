# Socrates Cloudflare Follow-Up
Date: 2026-03-29

## Goal

Recover healthy custom-domain access on `socrates.socra.cn` after the deployed app was already validated through the Vercel production alias.

## Confirmed Baseline

- The production app is healthy on `https://socra-platform.vercel.app`.
- `socrates.socra.cn` is on Cloudflare-managed nameservers, not Vercel-managed DNS.
- From the current validation machine:
  - some `http://socrates.socra.cn` requests returned empty replies or socket closes
  - direct `https://socrates.socra.cn` TLS handshakes failed

## Check Order

1. Verify Cloudflare DNS record for `socrates`
- Expected target should point cleanly to the active Vercel project setup for `socra-socrates`.
- Confirm there is no stale origin or mixed record set left from an older deployment path.

2. Check Cloudflare proxy mode
- Temporarily compare orange-cloud proxied vs DNS-only behavior for `socrates`.
- If DNS-only immediately fixes the domain path, the fault is in Cloudflare proxy / edge behavior rather than Vercel or app code.

3. Check Cloudflare SSL mode
- Prefer `Full` or `Full (strict)` when fronting Vercel.
- Avoid `Flexible`, which can create protocol/path confusion and break expected HTTPS behavior.

4. Check Cloudflare edge rules / redirects / WAF
- Review Redirect Rules, Transform Rules, Cache Rules, WAF custom rules, Bot Fight settings, and any Worker bound to `socrates.socra.cn`.
- Specifically look for rules that treat `POST /api/*` differently from `GET`.

5. Check HTTP-to-HTTPS behavior
- Vercel documents that HTTP requests should redirect to HTTPS with `308`.
- If Cloudflare is returning empty replies on plain HTTP instead of forwarding or redirecting, treat Cloudflare as the failing layer.

6. Re-test from two targets
- `https://socrates.socra.cn/api/points?...`
- `https://socrates.socra.cn/api/error-session` with a disposable POST body
- Compare the result with the same calls against `https://socra-platform.vercel.app`.

## Fastest Isolation Path

If you want the shortest operational test:

1. Set `socrates` to DNS-only in Cloudflare.
2. Wait for propagation.
3. Re-run `pnpm smoke:study-flow` and `pnpm smoke:transfer-evidence` against `https://socrates.socra.cn`.
4. If that clears the failures, reintroduce Cloudflare features one layer at a time.

## Reference

- Vercel custom-domain setup: https://vercel.com/docs/domains/set-up-custom-domain
- Vercel guidance on Cloudflare in front of Vercel: https://vercel.com/guides/using-cloudflare-with-vercel
- Vercel TLS behavior: https://vercel.com/docs/encryption
