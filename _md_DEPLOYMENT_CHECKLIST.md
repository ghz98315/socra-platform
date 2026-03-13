# Deployment Checklist

## 1. Environment

Run:

```bash
pnpm check:env
```

Required for `apps/socrates`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_API_KEY_LOGIC` or `DASHSCOPE_API_KEY`
- `AI_API_KEY_VISION` or `DASHSCOPE_API_KEY`

Recommended for `apps/socrates`:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SITE_URL`
- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- `AI_MODEL_LOGIC`

Required for `apps/essay`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 2. Build

Run:

```bash
pnpm --filter @socra/socrates build
pnpm build
```

Both commands must pass before deployment.
The smoke script should be run against a deployed environment after the build is published.

## 3. Supabase

Confirm these tables and permissions exist in the target environment:

- `profiles`
- `family_groups`
- `family_members`
- `parent_tasks`
- `task_completions`
- `parent_reviews`
- `notifications`
- `coupons`
- `payment_orders`
- `subscription_plans`
- `user_subscriptions`
- `usage_logs`
- `error_sessions`

Apply SQL from:

- `supabase/migrations/20260228_prompt_v2_upgrade.sql`
- `supabase/migrations/20260310_learning_style.sql`
- `supabase/migrations/20260310_points_and_invite.sql`
- `supabase/migrations/20260312_add_phone_to_profiles.sql`
- `supabase/migrations/20260312_create_link_requests_table.sql`
- `supabase/migrations/20260312_add_notifications_table.sql`
- `supabase/migrations/20260312_core_business_runtime.sql`

## 4. Runtime Smoke Tests

Socrates:

- `pnpm smoke:socrates`
- Login and profile selection
- Student dashboard loads
- Workbench starts a session
- Payment page creates an order
- Payment success page renders correct plan
- Subscription page shows current plan
- Notifications can load and mark as read
- Family page can create a family and add/remove a member

Essay:

- Login session is valid
- Main review page loads
- Build output serves correctly after refresh

## 5. External Integrations

Validate before production cutover:

- WeChat credentials and callback URL
- Alipay or fallback payment redirect behavior
- AI provider keys for chat, OCR, and variant generation
- Public site URL used by share, invite, and callback links

## 6. Release Gate

Do not release unless:

- `pnpm check:env` passes
- `pnpm build` passes
- Payment/subscription smoke tests pass
- Family management smoke tests pass
- Notifications smoke tests pass
