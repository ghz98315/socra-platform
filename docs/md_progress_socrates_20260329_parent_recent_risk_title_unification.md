# Socrates Parent Recent Risk Title Unification
Date: 2026-03-29

## Shipped In This Slice

- Continued Stage C by extracting parent recent-risk title generation into a shared helper.
- Added `getParentRecentRiskTitle(...)` in `apps/socrates/lib/error-loop/parent-insight-copy.ts`.
- Centralized the recent-risk title mapping for:
  - `假会风险`
  - `复习未过`
  - `复习已到期`
  - `重复复开`
  - `待关门验证`
  - `根因仍偏表面`
  - fallback `需要关注`
- Updated `app/api/parent/insights/route.ts` so recent-risk cards now derive their title from the shared helper instead of maintaining a private route-local decision tree.

## Current Judgment

- This slice removes another small but real route-level drift point:
  - recent-risk labels are no longer hidden inside parent insight route logic
  - future recent-risk wording changes now have one edit point
- Parent insight semantics are now more centralized across:
  - dashboard summary copy
  - parent action copy
  - recent-risk title generation

## Validation

- `pnpm --dir "D:\github\Socrates_ analysis\socra-platform" --filter @socra/socrates exec tsc --noEmit`
  - result: passed
- searched route/helper usage after extraction
  - result: recent-risk title mapping now resolves from `parent-insight-copy.ts`

## Affected Files

- `apps/socrates/lib/error-loop/parent-insight-copy.ts`
- `apps/socrates/app/api/parent/insights/route.ts`
- `docs/md_progress_socrates_20260329_parent_recent_risk_title_unification.md`

## Next Step

- Continue Stage C by checking the remaining parent UI presentation labels and conversation alert wording boundaries.
- Keep the next slice bounded to semantic alignment, not new data flow.
