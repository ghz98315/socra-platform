# Landing 与 Socrates 闭环人工验收清单

日期：2026-04-09
范围：`P0` + `P1`
目标：验证 `landing -> socrates` 的统一入口参数与登录承接链路已经可人工走通

## 1. 验收前准备

- 本地代码基线至少包含提交：`2231a7e` `Implement landing to socrates entry handoff`
- 本地构建状态：
  - `pnpm --filter @socra/landing build` 已通过
  - `pnpm --filter @socra/socrates build` 已通过
- 准备一个可登录的测试账号
- 准备一个可注册的新手机号，或至少可在开发环境读取验证码
- 验收时建议同时打开浏览器地址栏，确认最终 URL 是否包含预期参数

## 2. P0 人工验收清单

### 2.1 首页 CTA

- [ ] 打开 `landing` 首页
- [ ] 点击底部 CTA `开始使用 Socrates`
- [ ] 预期新窗口或新标签打开 `socrates /login`
- [ ] 预期 URL 包含：
  - `source=landing-home`
  - `intent=start-tool`
  - `redirect=/select-profile`

### 2.2 导航栏 CTA

- [ ] 打开 `landing` 首页或任意内容页
- [ ] 点击导航栏 `登录`
- [ ] 预期跳到 `socrates /login`
- [ ] 预期 URL 包含：
  - `source=landing-nav`
  - `intent=start-tool`
  - `redirect=/select-profile`
- [ ] 点击导航栏 `开始使用`
- [ ] 预期 URL 参数与上面保持一致

### 2.3 文章列表页 CTA

- [ ] 打开 `landing /essays`
- [ ] 点击底部 CTA `开始使用 Socrates`
- [ ] 预期跳到 `socrates /login`
- [ ] 预期 URL 包含：
  - `source=landing-essay-list`
  - `intent=start-tool`
  - `redirect=/error-book`

### 2.4 文章详情页 CTA

- [ ] 打开任一 `landing /essays/[slug]`
- [ ] 点击正文后 CTA `开始使用 Socrates`
- [ ] 预期跳到 `socrates /login`
- [ ] 预期 URL 包含：
  - `source=landing-article`
  - `intent=start-tool`
  - `redirect=/error-book`

### 2.5 书页 CTA

- [ ] 打开 `landing /book`
- [ ] 点击 `进入 Socrates 开始执行`
- [ ] 预期跳到 `socrates /login`
- [ ] 预期 URL 包含：
  - `source=landing-book`
  - `intent=start-tool`
  - `redirect=/select-profile`
- [ ] 点击底部 CTA `直接进入 Socrates`
- [ ] 预期 URL 参数与上面保持一致
- [ ] 点击 `购买「书 + 工具」套装（¥39.9）`
- [ ] 预期仍然进入 `landing /book-purchase`
- [ ] 预期没有被误并到 `subscription`

## 3. P1 人工验收清单

### 3.1 登录页保留来源参数

- [ ] 用任一带参数的 `login` 地址进入
- [ ] 点击 `立即注册`
- [ ] 预期跳到 `register`
- [ ] 预期 `source / intent / redirect` 原样保留

### 3.2 注册页保留来源参数

- [ ] 用任一带参数的 `register` 地址进入
- [ ] 点击 `立即登录`
- [ ] 预期跳到 `login`
- [ ] 预期 `source / intent / redirect` 原样保留

### 3.3 `redirect` 优先级

- [ ] 访问：
  - `/login?source=landing-home&intent=start-tool&redirect=/subscription`
- [ ] 成功登录
- [ ] 预期优先跳到 `/subscription`
- [ ] 预期不是 `/select-profile`

- [ ] 访问：
  - `/login?source=landing-article&intent=start-tool&redirect=/error-book`
- [ ] 成功登录
- [ ] 预期跳到 `/error-book`

### 3.4 `intent` 兜底逻辑

- [ ] 访问：
  - `/login?source=landing-home&intent=start-tool`
- [ ] 成功登录
- [ ] 预期跳到 `/select-profile`

- [ ] 访问：
  - `/login?source=landing-home&intent=subscribe`
- [ ] 成功登录
- [ ] 预期跳到 `/subscription`

- [ ] 访问：
  - `/login?source=landing-article&intent=continue-reading`
- [ ] 成功登录
- [ ] 预期跳到 `/error-book`

- [ ] 访问：
  - `/login?source=landing-book&intent=bundle`
- [ ] 成功登录
- [ ] 当前预期先兜底到 `/select-profile`
- [ ] 备注：`bundle-start` 还未进入本轮实现

### 3.5 站内既有登录回跳不回归

- [ ] 在未登录状态下直接访问 `socrates /subscription`
- [ ] 预期被带到 `/login?redirect=/subscription`
- [ ] 登录成功后预期回到 `/subscription`

- [ ] 在未登录状态下直接访问 `socrates /payment`
- [ ] 预期被带到 `/login?redirect=/payment`
- [ ] 登录成功后预期回到 `/payment`

### 3.6 注册链路承接

- [ ] 用带参数的 `register` 地址完成注册
- [ ] 预期注册成功后落到与登录一致的目标页
- [ ] 至少验证一次：
  - `redirect=/subscription`
  - 无 `redirect` 但 `intent=start-tool`

## 4. 回归观察项

- [ ] 登录页能正常渲染，没有白屏或 Suspense 报错
- [ ] 注册页能正常渲染，没有白屏或 Suspense 报错
- [ ] `landing` 各 CTA 没有因为新增参数而打不开
- [ ] `book-purchase` 仍保持独立路径，没有被误改成订阅入口

## 5. 当前阶段明确不验收的内容

- [ ] 不验收 `P2` CTA 文案系统收口
- [ ] 不验收 `P3` `/bundle-start`
- [ ] 不验收 `P4` 工具内回内容入口
- [ ] 不验收自动发书、自动赠送权益、订单履约后台

## 6. 验收记录模板

建议每次人工验收后至少记录以下内容：

- 验收日期：
- 验收环境：
- 验收人：
- 通过项：
- 未通过项：
- 复现步骤：
- 截图或 URL 证据：
- 是否允许进入下一阶段：
