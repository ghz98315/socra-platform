# Socrates 认证联调纪要

> 日期: 2026-04-02
> 适用项目: `apps/socrates`
> 主题: Phase 1 手机验证码登录/注册联调、结构漂移排查与恢复顺序

---

## 1. 本次联调目标

- 验证 `PHONE_AUTH_SMS_PROVIDER=console` 下的新验证码链路是否能跑通
- 对照旧的 `手机号 + 密码` 注册接口，确认问题是否只出现在新链路
- 判断当前是否已经进入真实短信 provider 接入阶段
- 找出 Supabase 侧真正的阻塞点

---

## 2. 已执行检查

### 2.1 本地与构建基线

- `pnpm check:node` 通过
- Node 版本: `22.19.0`
- `pnpm check:env` 通过
- 当前仅缺推荐项:
  - `WECHAT_APP_ID`
  - `WECHAT_APP_SECRET`
- `pnpm --filter @socra/socrates build` 通过

### 2.2 本地服务联调

- 已使用仓库内置脚本启动本地 production 服务
- 本地 `/login` 可访问
- 新增接口已进入构建产物:
  - `/api/auth/send-code`
  - `/api/auth/verify-code`

---

## 3. 实测结果

### 3.1 新验证码注册链路

调用:

```text
POST /api/auth/send-code
purpose=register
```

结果:

- 返回 `500`
- 本地服务日志显示:

```text
[auth/send-code] createUser failed for register flow:
Database error creating new user
```

### 3.2 旧密码注册链路对照

调用:

```text
POST /api/auth/register
```

结果:

- 同样返回 `500`
- 返回体:

```json
{"error":"Failed to create user account"}
```

### 3.3 直接 Supabase 匿名注册对照

实测 `anon signUp(...)` 结果:

```text
Database error saving new user
```

### 3.4 最小化 admin.createUser 对照

实测 `admin.createUser(...)` 时只保留最小参数:

```text
email
password
email_confirm=true
```

结果:

```text
Database error creating new user
```

这说明问题与 phone auth 的 metadata、pseudo-email 包装方式、`send-code` 请求体无关。

---

## 4. 结构核查结果

已用 `service_role` 对当前项目做只读核查。

### 4.1 当前表状态

- `profiles` 存在
- `user_levels` 存在
- `community_profiles` 存在
- `socra_points` 存在
- `invite_codes` 存在

### 4.2 当前数据状态

- `profiles` 行数: `5`
- `user_levels` 行数: `5`
- `socra_points` 行数: `0`
- `invite_codes` 行数: `0`

### 4.3 当前结构偏差

真实 `profiles` 表当前列集合包含:

- `id`
- `role`
- `display_name`
- `grade_level`
- `theme_preference`
- `avatar_url`
- `xp_points`
- `created_at`
- `parent_id`
- `phone`
- `subscription_tier`
- `student_avatar_url`
- `parent_avatar_url`

但不包含:

- `email`

而仓库当前仍有以下事实:

- `apps/socrates/lib/supabase/database.types.ts` 仍将 `profiles.email` 视为现有列
- 早期设计与旧注册流长期默认 profile 可承载 `email / pseudo-email`
- 当前项目的历史 auth/profile 触发链路并未完整纳入仓库 migration 目录

---

## 5. 结论

### 5.1 当前阻塞点不是短信 provider

- `console` provider 已足够用于开发联调
- 当前不是“短信没发出去”
- 当前是“Supabase 项目无法创建新 auth user”

### 5.2 当前阻塞点也不是新 phone auth API 独有问题

以下 4 条路径都失败:

1. 新的 `send-code(register)`
2. 旧的 `/api/auth/register`
3. 直接 `anon signUp`
4. 最小化 `admin.createUser`

所以问题不在单个页面或单个接口，而在项目侧的新用户创建基础链路。

### 5.3 当前最强工程推断

最可能存在以下两类问题之一，或同时存在:

1. 历史 `auth.users` 相关 trigger 仍在执行，但依赖旧结构
2. 当前 Supabase 项目存在仓库未纳管的历史迁移漂移

其中最明确、可直接修复的结构偏差是:

- 当前真实 `profiles` 表缺少 `email` 兼容列

---

## 6. 已落仓修复

### 6.1 兼容 migration

已新增:

- `supabase/migrations/20260402_add_profiles_email_compat.sql`

作用:

- 恢复 `profiles.email` 兼容列
- 按 `auth.users.email` 回填已有用户 email
- 添加 `profiles.email` 索引

这个补丁是低风险兼容修复，不会破坏现有业务字段。

### 6.2 Auth recovery smoke

已新增:

- `scripts/smoke-auth-phone.mjs`
- `package.json` 命令: `pnpm smoke:auth-phone`

脚本覆盖:

1. direct Supabase anon `signUp`
2. legacy `/api/auth/register`
3. `/api/auth/send-code` register
4. `/api/auth/verify-code` register
5. `/api/auth/send-code` login
6. `/api/auth/verify-code` login

---

## 7. 修复后的立即复测顺序

### 推荐顺序

1. 先在目标 Supabase 项目执行:

```text
supabase/migrations/20260402_add_profiles_email_compat.sql
```

2. 然后直接执行:

```bash
pnpm smoke:auth-phone
```

### 如只想先看底层恢复情况

```bash
AUTH_SMOKE_SKIP_APP=true pnpm smoke:auth-phone
```

这会只验证 direct Supabase anon `signUp`。

### 结果判读

- 如果 `anon signUp` 恢复，而应用注册仍失败:
  - 说明数据库底层已恢复，继续排应用层 API 即可
- 如果 `anon signUp` 仍失败:
  - 说明 `profiles.email` 不是唯一问题
  - 下一步必须继续排查当前项目里未纳管的历史 `auth.users` trigger

---

## 8. Provider 安排判断

### 当前结论

现在还不应该进入真实短信 provider 的最终接入阶段。

原因:

- 真实短信 provider 解决的是“验证码发送通道”
- 当前真正卡住的是“新用户创建”
- 如果先接腾讯云/阿里云，只会让问题更复杂，不会解除当前 blocker

### 正确顺序

1. 先修复 Supabase 新用户创建能力
2. 继续用 `console` provider 做联调
3. 新用户创建恢复后，再接真实短信 provider
4. 真实短信跑通后，再进入微信二维码登录阶段

### 上线 provider 规划

- 主 provider: 腾讯云短信
- 备 provider: 阿里云短信

---

## 9. 一句话结论

当前可以继续用 `console` provider 做联调，但真实上线 provider 还不是眼前的卡点；必须先修复当前 Supabase 项目“无法创建新用户”的基础问题。
---

## 2026-04-02 Evening Update

- Added `supabase/migrations/20260402_fix_auth_user_bootstrap_functions.sql` to qualify legacy bootstrap writes to `public.invite_codes` and `public.socra_points`.
- Added `supabase/migrations/20260402_fix_legacy_auth_points_trigger.sql` to replace the older points bootstrap function that still referenced an unqualified `socra_points`.
- Confirmed the remaining Phase 1 auth blocker was OTP length drift: Supabase `generateLink` returned 8-digit OTPs while `apps/socrates/app/api/auth/verify-code/route.ts` only accepted 6 digits.
- Updated the verify route, auth UI input length, and `scripts/smoke-auth-phone.mjs` so the local smoke now accepts 6-8 digit codes consistently.
- `pnpm.cmd --filter @socra/socrates build` passed after clearing the stale local `.next` lock caused by an older helper-managed local process.
- Full local auth smoke passed on `http://127.0.0.1:3000`:
  - `PASS anon signUp`
  - `PASS password register`
  - `PASS phone code register/login`
- Because local helper startup runs the app in production mode, `debugCode` is intentionally omitted from `/api/auth/send-code`. The smoke script now falls back to parsing the latest `.codex-socrates-start-*.out.log` console-SMS entry when the target base URL is localhost.
- Production deploy completed to `socra-socrates-4h0wgnqnc-ghz98315s-projects.vercel.app` and was aliased to `https://socrates.socra.cn`.
- Post-deploy validation from this machine:
  - `https://socra-platform.vercel.app/api/auth/send-code` returned `200` with `{ "success": true, ... }`, confirming the stale `404` on the auth route is gone on the Vercel production alias.
  - `pnpm probe:socrates-domain` showed the Vercel alias healthy for GET and POST, while `https://socrates.socra.cn` still failed during TLS setup from this machine. Treat that as a custom-domain / edge-path issue on this network path, not an app regression.
