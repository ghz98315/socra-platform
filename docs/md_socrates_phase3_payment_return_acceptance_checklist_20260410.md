# Socrates Phase 3 订阅支付回流验收清单

日期：2026-04-10
范围：`Phase 3`
目标：验证 `subscription -> payment -> payment/success -> 回到学习动作` 已经可在预发或线上走通

## 0. 本轮验收目标

- 支付链路不再把用户丢回泛化页面
- 从学习链路进入订阅后，支付完成能回到原任务
- 登录中断后，仍能回到当前支付链路
- 无来源直接订阅时，支付成功默认回到学习入口

## 1. 上线前确认

- [ ] 当前代码已包含以下文件改动：
  - `apps/socrates/lib/navigation/entry-intent.ts`
  - `apps/socrates/app/(student)/subscription/page.tsx`
  - `apps/socrates/app/(student)/payment/page.tsx`
  - `apps/socrates/app/(student)/payment/success/page.tsx`
  - `apps/socrates/app/api/payment/create-order/route.ts`
  - `apps/socrates/app/(student)/dashboard/page.tsx`
  - `apps/socrates/components/subscription/FeatureLock.tsx`
- [ ] 本地构建通过：
  - `pnpm.cmd --filter @socra/socrates build`
- [ ] 支付环境变量与原支付配置未被误改
- [ ] 准备一个可登录测试账号
- [ ] 如果要做真实支付回调验证，准备微信/支付宝测试路径或人工小额支付账号

## 2. 最短验收顺序

如果这轮只想先确认主链路可用，按下面顺序走即可。

### Step 1：从学习入口进入订阅

- [ ] 打开 `dashboard`
- [ ] 点击任一 Pro 学科入口
- [ ] 预期跳到 `/subscription`
- [ ] 预期 URL 包含：
  - `source=dashboard`
  - `intent=subscribe`
  - `redirect=...`
- [ ] `redirect` 预期指向原学习动作，例如：
  - `/study/math/problem`

### Step 2：从订阅进入支付

- [ ] 在订阅页选择任意套餐
- [ ] 点击 `立即订阅`
- [ ] 预期跳到 `/payment`
- [ ] 预期 URL 仍保留：
  - `source`
  - `intent`
  - `redirect`
- [ ] 页面应出现“支付完成后自动回到原学习动作”提示

### Step 3：支付成功回到原任务

- [ ] 完成一笔测试支付，或走到支付成功页
- [ ] 预期成功页主动作是：
  - `回到原任务`
- [ ] 点击主动作
- [ ] 预期直接回到最初学习页
- [ ] 预期不是以下泛化落点：
  - `/dashboard`
  - `/subscription`
  - `/payment`

### Step 4：无来源直接订阅兜底

- [ ] 直接打开 `/subscription`
- [ ] 完成支付
- [ ] 预期支付成功页主动作是：
  - `继续学习`
- [ ] 点击后预期跳到：
  - `/study#quick-start`

### Step 5：登录中断回流

- [ ] 在未登录状态下直接打开一个带参数的订阅链接，例如：
  - `/subscription?source=dashboard&intent=subscribe&redirect=/study/math/problem`
- [ ] 预期先跳到登录页
- [ ] 登录成功后预期回到：
  - `/subscription?...`
- [ ] 再继续进入 `/payment`
- [ ] 预期 `plan / source / intent / redirect` 仍然保留

## 3. 详细人工验收清单

### 3.1 `entry-intent` 回流范围

- [ ] 以下站内回跳目标可被保留：
  - `/study`
  - `/review`
  - `/dashboard`
  - `/workbench`
  - `/error-book`
  - `/subscription`
  - `/payment`
  - `/select-profile`
- [ ] 非法外链不会被接受为 `redirect`

### 3.2 订阅页承接

- [ ] 订阅页能识别并保留 `source / intent / redirect`
- [ ] 订阅页存在“返回原任务”辅助入口
- [ ] 未登录进入订阅时，登录后仍回到当前订阅页

### 3.3 支付页承接

- [ ] 支付页能识别并保留 `source / intent / redirect`
- [ ] 切换套餐后，URL 中的回流参数不会丢失
- [ ] 未登录进入支付时，登录后仍回到当前支付页
- [ ] 创建订单后返回的 `redirectUrl` 包含：
  - `source`
  - `intent`
  - `redirect`
  - `order_id`
  - `plan`
  - `amount`

### 3.4 支付成功页承接

- [ ] 有 `redirect` 时：
  - 主动作显示 `回到原任务`
- [ ] 无 `redirect` 时：
  - 主动作显示 `继续学习`
- [ ] 有 `redirect` 时，自动倒计时跳转目标也是原任务
- [ ] 无 `redirect` 时，自动倒计时默认跳到 `/study#quick-start`
- [ ] 次级动作仍可回到学习主线，不停留在商业页

### 3.5 高频入口回归

- [ ] `dashboard` Pro 学科入口已接入订阅回流
- [ ] 通用 `FeatureLock` 已接入订阅回流
- [ ] 不影响原有非 Pro 学科直接进入学习

## 4. 建议验证用例

### 用例 A：数学题学习被会员拦截

- [ ] 从 `dashboard` 点击数学之外的 Pro 学科入口
- [ ] 进入订阅
- [ ] 完成支付
- [ ] 成功回到对应学科学习页

### 用例 B：从当前页面锁功能弹窗进入订阅

- [ ] 打开任一带 `FeatureLock` 的页面
- [ ] 点击 `解锁功能`
- [ ] 完成支付
- [ ] 成功回到刚才页面

### 用例 C：直接订阅

- [ ] 直接访问 `/subscription`
- [ ] 完成支付
- [ ] 成功页点击 `继续学习`
- [ ] 跳到 `/study#quick-start`

## 5. 重点风险观察项

- [ ] 第三方支付渠道是否会截断回跳参数
- [ ] 生产环境是否仍命中旧缓存页面
- [ ] 登录回流时是否丢失 `plan`
- [ ] 支付成功页是否误跳回 `/dashboard`
- [ ] 支付页切套餐后是否把 `redirect` 丢掉

## 6. 本轮不要求验收的内容

- [ ] 不要求验收完整支付风控流程
- [ ] 不要求验收退款流程
- [ ] 不要求验收积分赠送是否精确到账
- [ ] 不要求验收所有入口的商业文案
- [ ] 不要求验收家长端或账户模型改造

## 7. 验收记录模板

- 验收日期：
- 验收环境：
- 验收人：
- 测试账号：
- 通过项：
- 未通过项：
- 复现步骤：
- URL 证据：
- 截图证据：
- 是否允许继续上线：
