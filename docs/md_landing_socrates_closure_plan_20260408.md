# Landing 与 Socrates 初步收尾闭环方案

日期：2026-04-08
范围：`apps/landing` + `apps/socrates`
目标：把内容站、书籍页、购书入口、Socrates 工具入口接成一条用户能走通的闭环路径。

## 1. 背景

当前产品已经具备三类资产：

1. `landing`
   - 首页、书页、文章页、章节阅读器
   - 负责内容认知、方法论解释、书籍承接
2. `socrates`
   - 登录、注册、订阅、支付、错题本、复习链路
   - 负责工具使用与会员能力承接
3. 书籍购买入口
   - 当前在 `landing /book-purchase`
   - 仍是人工二维码 + 微信核实 + 手动开通权益的方式

问题不在于“有没有入口”，而在于“入口之间没有形成明确的产品闭环”。

## 2. 当前现状

### 2.1 `landing` 现状

`landing` 已经有多处跳向 `socrates` 的 CTA，但逻辑分散：

- 首页 CTA
- 书页 CTA
- 文章页 CTA
- 文章列表 CTA
- 导航栏登录按钮

这些按钮大多直接跳：

- `https://socrates.socra.cn`

问题：

- 没有统一参数规范
- 无法区分用户来自哪里
- 无法表达“我是来注册体验”还是“我是来订阅”还是“我是买书后要开始使用”
- 登录后默认落点不够清晰

### 2.2 `socrates` 现状

`socrates` 已经具备以下能力：

- `/login`
- `/register`
- `/subscription`
- `/payment`
- `/error-book`
- 其他学习链路

但应用入口页现在只是：

- `/` -> 重定向到 `/login`

说明它能接住人，但还不能很好接住“带着明确意图来的人”。

### 2.3 书籍购买入口现状

当前购书页在：

- `apps/landing/components/BookPurchasePageClient.tsx`

现状特征：

- 人工二维码收款
- 购书后通过微信发支付截图
- 作者人工发送电子书和模板
- 手工为用户开通 1 个月 Socrates 权益

这意味着：

- 购书并不是一个自动化支付闭环
- 它本质上是“内容产品 + 手工履约 + 工具开通”的混合流程

因此，购书入口不能简单并入 `socrates /subscription`，否则会混淆两种不同交易：

1. 买书套装
2. 纯工具订阅

## 3. 目标闭环

这一阶段不追求复杂 CRM，不做大改，只实现“可跑通、可解释、可扩展”的初步闭环。

目标链路定义为：

1. 用户在 `landing` 理解方法
2. 用户选择进入工具、订阅工具、或购买书籍套装
3. 用户进入 `socrates` 后，系统知道他从哪里来、想做什么
4. 登录/注册后跳到正确落点，而不是无差别落地
5. 购书用户在人工履约阶段，也有明确的工具激活落点
6. 工具内保留“回内容”的反向入口，形成闭环

## 4. 核心原则

### 4.1 先做路径闭环，不先做后台系统闭环

先把人流和页面承接做顺，再谈订单、埋点、自动化履约。

### 4.2 书籍购买与工具订阅必须区分

不要把“书+1 个月权益”和“纯 SaaS 订阅”混为一个商品。

建议保持两条线：

- 书籍套装线：`landing /book-purchase`
- 工具订阅线：`socrates /subscription` -> `/payment`

### 4.3 所有跨站 CTA 统一由一个链接规范生成

不要再在多个组件里直接硬写 `https://socrates.socra.cn`。

### 4.4 先做意图承接，再做数据分析

第一阶段参数至少包含：

- `source`
- `intent`
- `redirect`

## 5. 建议闭环模型

### 5.1 三类主入口

建议统一成以下三类跨站动作：

1. `开始使用工具`
   - 适合首页、文章页、文章列表页
   - 含义：我已经理解方法，现在要试工具
2. `查看订阅/升级`
   - 适合已有工具心智、明显想用产品的人
   - 含义：我准备直接进入付费工具路径
3. `购买书+工具套装`
   - 只在书页、购书页使用
   - 含义：我购买内容产品，并获取 1 个月工具权益

### 5.2 统一参数规范

建议所有从 `landing` 跳向 `socrates` 的入口统一拼参数：

- `source`
  - `landing-home`
  - `landing-book`
  - `landing-book-purchase`
  - `landing-essay-list`
  - `landing-article`
  - `landing-nav`
- `intent`
  - `start-tool`
  - `subscribe`
  - `bundle`
  - `continue-reading`
- `redirect`
  - `/select-profile`
  - `/subscription`
  - `/error-book`
  - 后续可以扩展到专门的 bundle 激活页

示例：

```text
https://socrates.socra.cn/login?source=landing-home&intent=start-tool&redirect=/select-profile
https://socrates.socra.cn/login?source=landing-book&intent=subscribe&redirect=/subscription
https://socrates.socra.cn/login?source=landing-article&intent=start-tool&redirect=/error-book
```

## 6. 书籍购买入口的专门方案

这是本次规划必须单列考虑的部分。

### 6.1 为什么不能直接并入 `subscription`

原因有三点：

1. 商品定义不同
   - 订阅页卖的是持续会员能力
   - 购书页卖的是电子书永久权益 + 1 个月工具使用权
2. 履约方式不同
   - 订阅是系统支付 -> 自动开通
   - 购书是人工核验 -> 手工发书/开权限
3. 用户心智不同
   - 买书用户先买“方法论内容”
   - 订阅用户先买“工具能力”

结论：

- 短期不建议把 `book-purchase` 合并到 `socrates /payment`
- 应该做“桥接”，不是“合并”

### 6.2 书籍购买入口的阶段性设计

#### 阶段 A：先把路径讲清楚

在 `landing /book-purchase` 明确分成三段：

1. 购买书籍套装
2. 支付后怎么提交凭证
3. 开通后如何进入 Socrates

新增一条明确说明：

- “购书核实后，你会收到电子书与一个专属 Socrates 进入链接”

#### 阶段 B：增加专属激活入口

建议在 `socrates` 增加一个轻量承接页，二选一即可：

1. `/bundle-start`
2. `/gift-activation`

这个页面作用不是支付，而是承接“已经买书、已开权限”的用户。

页面职责：

- 告诉用户“你来自《从错误开始》套装”
- 说明你现在获得了什么权益
- 给出进入产品的第一步
  - 去选择学生档案
  - 去错题本开始录入第一题

#### 阶段 C：人工履约话术标准化

作者或运营在确认支付后，不再只发“电子书 + 账号已开通”，而是统一发：

1. 电子书下载/阅读说明
2. Socrates 激活说明
3. 专属入口链接

建议统一链接格式：

```text
https://socrates.socra.cn/login?source=landing-book-purchase&intent=bundle&redirect=/bundle-start
```

即使现在还是人工开通，这个链路也已经闭环。

### 6.3 第二阶段再考虑自动化

后续如要升级，可再做：

- 套装订单表
- 支付凭证后台
- 自动发书
- 自动赠送 1 个月订阅

但这些都不应该放在这次“初步收尾”里。

## 7. 详细实施方案

### P0：统一跨站链接生成

目标：

- 让 `landing` 所有 Socrates 按钮统一出口规范

实施：

1. 在 `apps/landing` 增加一个小型链接工具模块
2. 由它负责拼：
   - base url
   - source
   - intent
   - redirect
3. 替换以下页面/组件中的硬编码链接：
   - 首页 CTA
   - 书页 CTA
   - 文章页 CTA
   - 文章列表 CTA
   - 导航栏登录入口

收益：

- 后面要改跳转逻辑时只改一处
- 埋点和路径分析开始有基础

### P1：Socrates 登录页承接来源和意图

目标：

- 登录成功后不再“一刀切”

实施：

1. `socrates /login` 读取：
   - `source`
   - `intent`
   - `redirect`
2. 登录成功后优先跳 `redirect`
3. 如果没有 `redirect`，按 `intent` 兜底：
   - `start-tool` -> `/select-profile`
   - `subscribe` -> `/subscription`
   - `bundle` -> `/bundle-start` 或暂时 `/select-profile`
4. 注册页也保持同样逻辑

收益：

- 从内容站来的用户终于被“接住”

### P2：统一 `landing` CTA 语义

目标：

- 消除页面间叙事不一致

建议文案统一：

首页：

- `先了解方法`
- `进入系统实践`

书页：

- `购买书+工具套装`
- `进入 Socrates 开始执行`

文章页：

- `继续读内容`
- `把方法放进系统`

收益：

- 用户知道自己下一步在做什么，不会在“买书 / 用工具 / 订阅”之间混淆

### P3：补书籍购买的桥接页

目标：

- 让购书套装用户不是买完就断掉

实施：

1. 新增 `socrates /bundle-start`
2. 页面内容只做三件事：
   - 说明这是《从错误开始》套装权益入口
   - 告知已获得 1 个月工具权益
   - 引导进入第一步使用
3. `landing /book-purchase` 明确写：
   - 购书后将收到专属工具入口

收益：

- 购书入口也被纳入闭环，而不是独立人工流程

### P4：在工具里加“回内容”入口

目标：

- 闭环不是单向导流

实施：

1. 在 `dashboard`、`error-book`、或首个 onboarding 落点页增加轻量入口：
   - 返回书页
   - 返回连载文章
   - 阅读第 1 章 / 第 11 章等代表章节
2. 如果带 `source=landing-book`，优先展示：
   - “配套阅读入口”

收益：

- 工具使用与方法论内容互相强化

## 8. 推荐的文件改动范围

### 第一轮建议会动的文件

`landing`

- `apps/landing/components/SiteLayout.tsx`
- `apps/landing/components/LandingPageClient.tsx`
- `apps/landing/components/BookPageClient.tsx`
- `apps/landing/components/EssaysPageClient.tsx`
- `apps/landing/components/ArticlePageClient.tsx`
- 新增一个链接生成工具文件，例如：
  - `apps/landing/lib/socratesLinks.ts`

`socrates`

- `apps/socrates/app/(auth)/login/page.tsx`
- 如果注册页有单独逻辑，也一起改
- 新增：
  - `apps/socrates/app/(student)/bundle-start/page.tsx`
  - 或更合适的 bundle bridge 页

### 暂不建议在第一轮动的文件

- `landing /book-purchase` 的支付方式本身
- `socrates /payment` 和支付后端逻辑
- 任何自动发书、自动开通、订单核验系统

## 9. 上线顺序建议

### 第一阶段：本周可完成

1. 统一跨站链接规范
2. 登录页承接参数
3. 首页 / 书页 / 文章页 CTA 语义收口

这是最小闭环，可立即上线。

### 第二阶段：下一个小迭代

1. 新增购书用户 bridge 页
2. 购书页文案收口
3. 工具内反向回内容入口

### 第三阶段：后续扩展

1. 参数埋点
2. 购书履约后台
3. 套装自动发书 + 自动赠送权益

## 10. 验收标准

只要满足以下条件，就可以认为“初步闭环”成立：

1. `landing` 上所有进入 `socrates` 的主 CTA 都带统一参数
2. `socrates` 登录成功后能落到正确页面
3. 书籍购买入口不会和纯订阅混淆
4. 购书用户在人工履约后有明确的工具进入链接
5. 工具页至少有一个能回到内容页的入口

## 11. 最终建议

如果下一轮开始做，我建议只先落地以下两项：

1. `landing` 统一 Socrates 链接生成器
2. `socrates` 登录页承接 `source / intent / redirect`

原因：

- 这是最小但最关键的闭环
- 改动集中
- 不碰支付和履约
- 一旦做好，后续书籍购买桥接页就能自然接进去

随后再做：

3. 书籍购买 bridge 页
4. 工具内反向回内容入口

这样推进，既稳，也不会把“收尾”做成一次大重构。
