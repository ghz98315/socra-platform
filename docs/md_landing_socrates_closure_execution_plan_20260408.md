# Landing 与 Socrates 闭环收尾开发方案

日期：2026-04-08
状态：规划文档
用途：作为后续开发、验收、追查和阶段回顾的统一依据

## 1. 文档目标

这份文档用于明确以下内容：

1. 当前要解决的问题是什么
2. 哪些边界不能动
3. 整体方案是什么
4. 开发分几个阶段推进
5. 每个阶段改哪些文件、解决什么问题、如何验收
6. 哪些内容明确不在当前阶段处理
7. 如果后续回看，可以据此追查当时的设计选择

## 2. 当前背景

当前仓库中已经形成两个清晰站点：

### 2.1 `landing`

路径：

- `apps/landing`

角色：

- 内容承接
- 方法论解释
- 书籍展示
- 连载文章阅读
- 章节阅读器
- 购书页

### 2.2 `socrates`

路径：

- `apps/socrates`

角色：

- 登录 / 注册
- 工具使用
- 错题本
- 复习链路
- 订阅
- 支付

### 2.3 当前问题

虽然两边已经都存在，但当前主要是“分开的”而不是“闭环的”：

1. `landing` 跳 `socrates` 的入口很多，但参数不统一
2. `socrates` 无法明确识别用户来自哪里、想做什么
3. 登录成功后的落点不够精细
4. 书籍购买入口与工具订阅入口之间关系没有清楚定义
5. 工具内缺少返回内容体系的反向连接

## 3. 核心约束

这是整个开发阶段最重要的约束条件。

### 3.1 不打散当前框架

不能把当前双站结构打散。

必须保持：

- `landing` 负责内容、方法、书籍与认知承接
- `socrates` 负责登录、工具、订阅与支付承接

### 3.2 不做站点合并

当前阶段不做：

- `landing` 和 `socrates` 合并
- 路由体系重做
- 信息架构重写
- 导航体系全面改版

### 3.3 不把购书入口硬并入订阅系统

必须区分两类商品：

1. 书籍套装
   - 电子书永久权益
   - 1 个月工具使用权益
2. 工具订阅
   - 纯 SaaS 工具能力

结论：

- `landing /book-purchase` 暂时保留
- `socrates /subscription` 暂时保留
- 先做桥接，不做合并

### 3.4 优先做小而确定的桥接

当前阶段优先做：

- 统一链接规范
- 登录承接参数
- 轻量 bridge 页面
- 反向回内容入口

不优先做：

- 自动发书
- 自动赠送权益
- 订单履约后台
- 复杂归因系统

## 4. 总体目标

把目前的链路从：

`landing 内容 -> 外链跳过去 -> 工具独立运行`

升级为：

`landing 内容/书 -> 带意图的进入 Socrates -> 登录/注册 -> 正确落点 -> 工具使用 -> 可回到内容体系`

也就是形成一个初步但清晰的产品闭环。

## 5. 设计原则

### 5.1 一切跨站跳转都必须带语义

至少要表达三件事：

- 我从哪里来
- 我来干什么
- 登录后我想去哪里

### 5.2 书籍购买与工具订阅是两条线

书籍购买线：

- 适合内容型用户
- 带有人工履约

工具订阅线：

- 适合直接使用产品的用户
- 走系统支付闭环

### 5.3 先闭环，再优化数据

第一步先把路径接通。
第二步再考虑统计、埋点、归因。

## 6. 统一闭环模型

### 6.1 用户路径模型

建议用以下模型理解整个系统：

1. 认知入口
   - 首页
   - 书页
   - 文章页
   - 章节阅读
2. 决策入口
   - 开始使用工具
   - 查看订阅
   - 购买书籍套装
3. 账户承接
   - 登录
   - 注册
4. 工具承接
   - 选择身份 / 选择档案
   - 错题本
   - 订阅页
   - 支付页
5. 闭环返回
   - 工具内回内容页
   - 购书后进入工具

### 6.2 三类标准入口

建议未来只保留三种主 CTA 语义：

1. `开始使用工具`
2. `查看订阅/升级`
3. `购买书 + 工具套装`

## 7. 参数规范

### 7.1 参数字段

所有从 `landing` 进入 `socrates` 的链接建议统一包含：

- `source`
- `intent`
- `redirect`

### 7.2 `source` 枚举建议

- `landing-home`
- `landing-nav`
- `landing-book`
- `landing-book-purchase`
- `landing-essay-list`
- `landing-article`
- `landing-reader`

### 7.3 `intent` 枚举建议

- `start-tool`
- `subscribe`
- `bundle`
- `continue-reading`

### 7.4 `redirect` 建议目标

- `/select-profile`
- `/subscription`
- `/error-book`
- `/bundle-start`

### 7.5 示例

```text
https://socrates.socra.cn/login?source=landing-home&intent=start-tool&redirect=/select-profile
https://socrates.socra.cn/login?source=landing-book&intent=subscribe&redirect=/subscription
https://socrates.socra.cn/login?source=landing-book-purchase&intent=bundle&redirect=/bundle-start
```

## 8. 书籍购买入口的单独策略

### 8.1 当前现实

当前购书页：

- `apps/landing/components/BookPurchasePageClient.tsx`

是人工收款 + 人工核验 + 人工发书 + 人工开权限。

这说明它还不是一个自动化交易流程。

### 8.2 当前阶段的正确做法

当前阶段不改购书支付方式。

只做三件事：

1. 明确购书后怎么进入工具
2. 给购书用户一个清晰的激活 / 开始页
3. 让购书用户和纯订阅用户在路径上被区分

### 8.3 建议新增 bridge 页

建议在 `socrates` 增加：

- `/bundle-start`

作用：

1. 说明“你来自《从错误开始》套装”
2. 告知你已经获得什么
3. 引导你进入工具的第一步

### 8.4 购书入口与工具订阅入口的关系

应定义为：

- 购书页卖“内容 + 首月工具使用权”
- 订阅页卖“工具持续使用权”

所以购书页不替代订阅页，订阅页也不替代购书页。

## 9. 开发阶段规划

以下阶段按推荐顺序排列。

---

## 阶段 P0：统一跨站链接生成器

### 目标

解决 `landing` 各处硬编码外链、参数不一致的问题。

### 要做的事

1. 在 `apps/landing/lib/` 新增统一链接生成工具
2. 所有跳转到 `socrates` 的 CTA 统一从这里取链接
3. 所有 CTA 都带 `source / intent / redirect`

### 可能涉及文件

- `apps/landing/lib/socratesLinks.ts`
- `apps/landing/components/SiteLayout.tsx`
- `apps/landing/components/LandingPageClient.tsx`
- `apps/landing/components/BookPageClient.tsx`
- `apps/landing/components/EssaysPageClient.tsx`
- `apps/landing/components/ArticlePageClient.tsx`

### 交付结果

- 所有跨站 CTA 都从统一工具函数生成

### 验收标准

1. 页面上不再直接散落大量硬编码 `https://socrates.socra.cn`
2. 首页、书页、文章页、导航栏进入 `socrates` 时参数一致

### 风险

- 如果不同页面 CTA 语义不清，参数会乱

### 应对

- 同步收一轮 CTA 文案

---

## 阶段 P1：登录页承接来源与跳转目标

### 目标

解决“进入 `socrates` 以后不知道该去哪里”的问题。

### 要做的事

1. `login` 页读取 `source / intent / redirect`
2. 登录成功后优先跳 `redirect`
3. 没有 `redirect` 时按 `intent` 兜底
4. 注册页复用同样逻辑

### 可能涉及文件

- `apps/socrates/app/(auth)/login/page.tsx`
- `apps/socrates/app/(auth)/register/...`
- 可能补一个公共跳转解析函数，例如：
  - `apps/socrates/lib/navigation/entry-intent.ts`

### 交付结果

- 从 `landing` 进入的用户，登录后能落到正确页面

### 验收标准

1. `redirect=/subscription` 登录后进订阅页
2. `redirect=/error-book` 登录后进错题本
3. `intent=start-tool` 无 redirect 时能进正确工具起点

### 风险

- 现有登录页逻辑较重，直接改容易影响原本登录行为

### 应对

- 只在成功后的落点逻辑增加一层封装
- 不改认证接口本身

---

## 阶段 P2：统一 CTA 语义和页面角色

### 目标

减少用户在内容、购书、工具之间的认知混乱。

### 要做的事

1. 首页 CTA 文案统一
2. 书页 CTA 文案统一
3. 文章页 CTA 文案统一
4. 明确哪些按钮去购书、哪些按钮去工具、哪些按钮去订阅

### 文案方向建议

首页：

- `先了解方法`
- `进入系统实践`

书页：

- `购买书 + 工具套装`
- `进入 Socrates 开始执行`

文章页：

- `继续读内容`
- `把方法放进系统`

### 可能涉及文件

- `apps/landing/components/LandingPageClient.tsx`
- `apps/landing/components/BookPageClient.tsx`
- `apps/landing/components/ArticlePageClient.tsx`
- `apps/landing/components/EssaysPageClient.tsx`

### 验收标准

1. 用户看到按钮就知道自己下一步在做什么
2. 不再出现“明明是购书语义却跳订阅页”的混乱

---

## 阶段 P3：书籍购买 bridge 页

### 目标

解决购书用户付款后路径断裂的问题。

### 要做的事

1. 在 `socrates` 新增 `bundle-start`
2. 在购书页补明确说明：
   - 买完后如何进入工具
3. 把人工履约的话术标准化

### 可能涉及文件

- `apps/socrates/app/(student)/bundle-start/page.tsx`
- `apps/landing/components/BookPurchasePageClient.tsx`

### 交付结果

- 购书用户有明确的工具入口

### 验收标准

1. 购书页不再只有“微信联系我”
2. 购书用户可以通过专属入口进入 Socrates
3. 这条线不和纯订阅线混淆

### 风险

- 如果 bridge 页做得太重，会像重新设计一套 onboarding

### 应对

- 第一版只做轻量说明 + 单按钮引导

---

## 阶段 P4：工具内反向回内容入口

### 目标

让闭环不是单向导流，而是内容与工具互相强化。

### 要做的事

1. 在 `dashboard` 或 `error-book` 加轻量入口：
   - 回书页
   - 回文章页
2. 如果用户来自 `landing-book`，优先展示配套内容入口

### 可能涉及文件

- `apps/socrates/app/(student)/dashboard/page.tsx`
- `apps/socrates/app/(student)/error-book/page.tsx`
- 或全局顶部提示组件

### 验收标准

1. 工具用户可以方便回到内容站
2. 书籍/文章和工具形成双向联系

---

## 阶段 P5：后续扩展，不在当前轮次做

### 暂不执行的内容

1. 购书自动发书
2. 购书自动赠送 1 个月权益
3. 套装订单后台
4. 完整埋点系统
5. 统一支付系统重构
6. 站点合并

## 10. 推荐实施顺序

### 第一轮

- P0
- P1

原因：

- 最小改动
- 最大收益
- 不碰支付
- 不碰人工履约
- 不打散当前结构

### 第二轮

- P2
- P3

原因：

- 在路径打通之后，再统一文案和购书桥接更稳

### 第三轮

- P4

原因：

- 属于体验增强，不是主链路卡点

## 11. 文件级追查建议

后续开发时建议每个阶段提交都遵循：

### 提交命名建议

- `Add landing to socrates entry link builder`
- `Support login redirect intent handoff`
- `Refine landing CTA semantics`
- `Add book bundle bridge entry`
- `Add content return links in socrates`

### 每阶段文档补记建议

完成后补到进度文档：

- `docs/md_progress_book_20260408.md`

补记内容至少包括：

1. 做了哪个阶段
2. 改了哪些文件
3. 哪些点已验证
4. 哪些点延后

## 12. 验收总标准

达到以下状态，就可以认为“初步收尾闭环”完成：

1. `landing` 所有主 CTA 跳 `socrates` 时参数统一
2. `socrates` 登录成功后能按意图跳转
3. 书籍购买入口与工具订阅入口关系清楚
4. 购书用户有专属 bridge 路径
5. 工具内至少有一个回内容入口
6. 整个过程中没有打散双站结构

## 13. 当前推荐执行结论

下一步最推荐直接开始：

1. 阶段 P0
2. 阶段 P1

这是当前“最小、最稳、最不破坏框架”的做法。
