# Release Runbook

## 1. Preflight

Run:

```bash
pnpm check:node
pnpm check:env
pnpm --filter @socra/socrates build
pnpm build
```

Do not continue unless all four commands pass.

## 2. Database Rollout

Apply these SQL files in order to the target Supabase project:

```text
supabase/migrations/20260228_prompt_v2_upgrade.sql
supabase/migrations/20260310_learning_style.sql
supabase/migrations/20260310_points_and_invite.sql
supabase/migrations/20260312_add_phone_to_profiles.sql
supabase/migrations/20260312_create_link_requests_table.sql
supabase/migrations/20260312_add_notifications_table.sql
supabase/migrations/20260312_core_business_runtime.sql
supabase/migrations/20260316_add_study_assets_tables.sql
supabase/migrations/20260317_expand_error_session_subjects.sql
```

Notes:

- `supabase/migrations/20260312_core_business_runtime.sql` is designed to be re-runnable. It includes compatibility `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` and will `DROP FUNCTION ...` before recreating certain RPC functions whose return shapes changed between migrations.

After rollout, confirm these runtime objects exist:

- `family_groups`
- `family_members`
- `parent_tasks`
- `task_completions`
- `parent_reviews`
- `subscription_plans`
- `user_subscriptions`
- `payment_orders`
- `coupons`
- `notifications`
- `weekly_reports`
- `study_assets`
- `study_asset_messages`
- `socra_points`
- `point_transactions`
- `get_user_points`
- `add_points`
- `check_feature_limit`
- `is_pro_user`
- `generate_weekly_report`

## 3. App Deploy

Deploy the current monorepo build to the target runtime.

Current local release baseline:

- Node `22.19.0`
- repo engine expectation: `22.x`

Required runtime configuration:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_API_KEY_LOGIC` or `DASHSCOPE_API_KEY`
- `AI_API_KEY_VISION` or `DASHSCOPE_API_KEY`

Recommended before payment verification:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SITE_URL`
- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`

Known Vercel deployment requirement:

- The Vercel project Root Directory must point to `apps/socrates`, otherwise the remote builder will fail with `No Next.js version detected` because it only sees the monorepo root `package.json`.
- If `vercel inspect` or `vercel build` crashes locally with `ProxyAgent is not a constructor`, treat that as a Vercel CLI issue on the machine, not an app regression. Use the Vercel dashboard build logs or another machine/CLI version for deployment diagnostics.

## 4. Smoke Test

Set these variables against the deployed environment:

```bash
SMOKE_BASE_URL=https://your-app-domain
SMOKE_USER_ID=<existing test user>
SMOKE_PARENT_ID=<existing parent user>
SMOKE_CHILD_ID=<existing child user>
SMOKE_COUPON_CODE=WELCOME10
SMOKE_PLAN_CODE=pro_monthly
SMOKE_PAYMENT_METHOD=alipay
```

Run non-destructive smoke checks:

```bash
node scripts/smoke-socrates.mjs
node scripts/smoke-study-flow.mjs
```

Run order creation smoke only on a disposable test user:

```bash
SMOKE_CREATE_ORDER=true node scripts/smoke-socrates.mjs
```

## 5. Manual Business Closure

Verify these flows in the deployed app:

1. Student login -> profile selection -> workspace opens correctly.
2. Parent login -> profile selection -> `/tasks` opens, not student dashboard.
3. Parent creates a family, searches a child, adds the child, then removes the child.
4. Parent creates a task; child completes it; reward points increase once only.
5. Invite page loads code and stats; invite registration accepts a valid code.
6. Coupon validation matches the order flow for the same coupon.
7. Payment order creation returns redirect data; payment callback activates subscription.
8. Notifications load, mark-as-read works, and mastery notifications can be created.
9. Weekly report list loads and the current week can be generated successfully.

## 6. Release Gate

Do not release if any item below is still open:

- database migration not applied
- smoke script failing
- payment callback not activating subscription
- parent task reward duplicated
- family add/remove not syncing `profiles.parent_id`
- notifications API still reading or writing legacy fields

## 2026-03-17 Automation Note

- Before release or internal beta handoff, run `pnpm recommend:regression` or `pnpm autopilot` to confirm the expected validation scope.
- If the environment cannot run `git status` from Node, pass a captured status file via `--status-file <path>` instead of relying on automatic inspection.
- Use `pnpm regression:run -- --target <...> --profile <...>` as the standardized wrapper for env check, app build, and optional smoke.
- If Windows reports `.next` build output is locked, stop local dev/build processes for that app, clear the build cache, then rerun the regression command.
- The repo baseline is now Node `22.x`; `pnpm check:node` should pass before any release validation continues.

## 2026-03-19 Build Baseline Note

- The current single-machine release baseline is Node `22.19.0`.
- The root `pnpm build` path now uses `scripts/run-turbo-build.mjs` to run package-local CLIs directly instead of relying on `pnpm --filter ... build` for every package.
- The stable build order on the current machine is:
  - shared TypeScript packages
  - `landing`
  - `socrates`
  - `essay`
- This ordering matters on the current Windows machine because it avoids the memory instability observed in the previous workspace build sequence.

## 2026-03-17 Study Flow Smoke Addendum

- Add `SMOKE_STUDY_USER_ID=<disposable study smoke user>` when validating the multisubject study/report/review chain in a deployed environment.
- Run `node scripts/smoke-study-flow.mjs` after the standard Socrates smoke when write-side verification is allowed.
- Optional: run `SMOKE_STUDY_ADVANCE_REVIEW=true node scripts/smoke-study-flow.mjs` to verify the review completion RPC path on a disposable account.
- `pnpm check:env` now prints smoke readiness for both the standard Socrates smoke and the study-flow smoke; use it as the first preflight check before running deployment validation.
- A repo-local smoke template now exists at `apps/socrates/.env.smoke.example`; copy it to `.env.smoke.local` in deployment-like environments before running smoke validation.
- If `/api/study/assets` returns `missing_study_assets_migration`, the target Supabase project is missing `supabase/migrations/20260316_add_study_assets_tables.sql`; apply it before treating the failure as an app regression.
- If `study-assets-review-bridge` fails with `error_sessions_subject_check`, the target Supabase project is missing `supabase/migrations/20260317_expand_error_session_subjects.sql`; apply it before treating the failure as an app regression.
- If the deployed smoke hits `404` on `/api/study/assets`, the active Socrates deployment is stale or mapped to the wrong app root; redeploy the current `apps/socrates` build before continuing internal beta.
