# Release Runbook

## 1. Preflight

Run:

```bash
pnpm check:env
pnpm --filter @socra/socrates build
pnpm build
```

Do not continue unless all three commands pass.

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
- `socra_points`
- `point_transactions`
- `get_user_points`
- `add_points`
- `check_feature_limit`
- `is_pro_user`
- `generate_weekly_report`

## 3. App Deploy

Deploy the current monorepo build to the target runtime.

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
