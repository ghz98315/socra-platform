# Socrates Next 16 PageProps Alignment
Date: 2026-03-21

## Shipped In This Slice

- Updated the study problem bridge page to use the Next 16 `Promise`-shaped `params` contract in a client component via `use(params)`.
- Updated the study history asset detail page to use an async server-page signature and `await params`.
- Verified that these fixes remove the previously blocking `PageProps` type mismatch during the full Socrates webpack build.

## Current Judgment

- These route-signature fixes are real product-code corrections, not probe-only instrumentation.
- Before this slice, the best local full-build workaround surfaced a hard type error in:
  - `app/(student)/study/[subject]/problem/page.tsx`
- After this slice, the same temporary validation path gets much farther:
  - webpack compilation succeeds
  - TypeScript completes
  - page-data collection starts
  - static-page generation starts
- The remaining blocker after these fixes is still environment/build-system shaped:
  - with the temporary local experiment `webpackBuildWorker: false` and `workerThreads: true`, the build now fails later with `DataCloneError: ()=>null could not be cloned`

## Affected Files

- `apps/socrates/app/(student)/study/[subject]/problem/page.tsx`
- `apps/socrates/app/(student)/study/history/[assetId]/page.tsx`
- `docs/md_progress_socrates_20260321_next16_pageprops_alignment.md`

## Commands Run

- `rg -n "params:\\s*\\{[^\\n]*\\}" apps/socrates/app`
- `Get-Content -LiteralPath apps/socrates/app/(student)/study/[subject]/problem/page.tsx`
- `Get-Content -LiteralPath apps/socrates/app/(student)/study/history/[assetId]/page.tsx`
- temporary local config experiment:
  - set `experimental.webpackBuildWorker = false`
  - set `experimental.workerThreads = true`
  - `Remove-Item -LiteralPath '\\?\D:\github\Socrates_ analysis\socra-platform\apps\socrates\.next' -Recurse -Force`
  - `node scripts/probe-socrates-build.mjs --mode full --skip-clean --trace-children --disable-telemetry`
  - restore `apps/socrates/next.config.ts`

## Smoke

- No smoke command ran in this slice.
- Reason: the local full build is still not fully clean, so runtime smoke would still be premature.

## Notes

- The repaired client page now matches the Next 16 contract by resolving `params` with React `use(...)`.
- The repaired server page now matches the Next 16 contract by awaiting `params`.
- The temporary validation path that exposed the original type error is intentionally not committed in app config; it remains a local isolation technique only.
- The pre-existing untracked `.editorconfig` file was left untouched and excluded from this slice.

## Next Step

- Continue isolating the remaining `DataCloneError` in the worker-thread path now that the route-signature type error is gone.
- Confirm whether the cloned function still comes from `generateBuildId` or from another function-valued build config/input during static-page generation.
