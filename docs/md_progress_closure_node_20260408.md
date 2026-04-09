# 当前节点备忘

保存时间：2026-04-08 23:20:38 +08:00

## 当前节点定义

当前节点分为两条并行主线：

1. 书页面与书稿主线
   - `/book` 页面和首页书籍区块已经按 `bookface3` 的方向收口
   - 第 11 章已经由两份源稿整合导入
   - `book:import` 和 `@socra/landing build` 已验证通过
2. `landing -> socrates` 闭环收尾主线
   - 规划文档已完成
   - `P0 + P1` 已进入落地状态
   - 当前正在做的是统一入口参数和登录承接，不碰支付与履约重构

## 当前可作为基线的提交

- 书页面标题层级调整：`6806ac5`
- 第 11 章导入：`1d0e422`

## 当前关键文档

- 书页面/书稿进度：
  - `docs/md_progress_book_20260408.md`
- 闭环方向规划：
  - `docs/md_landing_socrates_closure_plan_20260408.md`
- 闭环执行方案：
  - `docs/md_landing_socrates_closure_execution_plan_20260408.md`

## 闭环阶段进度表

| 阶段 | 状态 | 当前结论 | 已动文件 | 已验证 | 未完成点 |
| --- | --- | --- | --- | --- | --- |
| `P0` 统一跨站链接生成器 | 已完成，待人工验收 | 统一链接生成器已新增，首页、导航、文章页、文章列表页、书页主 CTA 已接入 | `apps/landing/lib/socratesLinks.ts` `apps/landing/components/SiteLayout.tsx` `apps/landing/components/LandingPageClient.tsx` `apps/landing/components/ArticlePageClient.tsx` `apps/landing/components/EssaysPageClient.tsx` `apps/landing/components/BookPageClient.tsx` | 已确认这些组件使用 `buildSocratesEntryUrl`，`pnpm --filter @socra/landing build` 已通过 | 仍需做一轮人工点击验收，确认 CTA 语义和跳转参数符合预期 |
| `P1` 登录页承接来源与跳转目标 | 已完成，待人工验收 | 登录页、注册页已接入 `source / intent / redirect` 解析，成功后按目标跳转，并保留站内 `/subscription`、`/payment` 回跳 | `apps/socrates/lib/navigation/entry-intent.ts` `apps/socrates/app/(auth)/login/page.tsx` `apps/socrates/app/(auth)/register/RegisterPageV3.tsx` | 已确认登录与注册页都在用统一解析函数，`pnpm --filter @socra/socrates build` 已通过 | 仍需做一轮人工登录验收，确认 `redirect` 优先级和 `intent` 兜底都符合预期 |
| `P2` CTA 语义统一 | 未开始 | 仅有零散 CTA 调整，还没有按阶段系统收口 | 无 | 无 | 暂不进入本轮 |
| `P3` 书籍购买 bridge 页 | 未开始 | `/bundle-start` 尚未创建 | 无 | 无 | 暂不进入本轮 |
| `P4` 工具内回内容入口 | 未开始 | `dashboard` / `error-book` 还没有闭环回内容入口 | 无 | 无 | 暂不进入本轮 |
| `P5` 后续扩展 | 未开始 | 仍明确排除在本轮之外 | 无 | 无 | 不处理 |

## 当前这一轮实际收口目标

本轮只收口下面两项：

1. `P0`
   - 统一 `landing -> socrates` 链接生成器
   - 覆盖首页、导航、文章页、文章列表页、书页主 CTA
2. `P1`
   - `socrates` 登录页承接 `source / intent / redirect`
   - 注册页复用同样逻辑
   - 保证站内既有登录回跳不被新白名单破坏

## 约束提醒

- 不打散 `landing` 与 `socrates` 双站结构
- 不合并站点
- 不重做整体信息架构
- 不把 `book-purchase` 直接并入 `subscription`
- 当前阶段优先做桥接，不做支付和履约重构

## 重启提示词

```text
继续 socra-platform 的 landing 与 socrates 闭环收尾工作，当前只推进 P0 + P1，不要打散当前双站框架。

请先基于以下状态继续：

1. 当前书页面与书稿主线已经完成：
   - `/book` 页面和首页书籍区块已经按 `bookface3` 方向收口
   - 第 11 章已经导入完成
   - 相关提交：
     - 6806ac5 `Refine book title hierarchy`
     - 1d0e422 `Import chapter 11 content`

2. 当前闭环规划文档已经写好：
   - docs/md_landing_socrates_closure_plan_20260408.md
   - docs/md_landing_socrates_closure_execution_plan_20260408.md

3. 当前闭环阶段状态：
   - P0：已新增 `apps/landing/lib/socratesLinks.ts`，首页、导航、文章页、文章列表页已接入，书页已补入主 CTA
   - P1：`login/register` 已承接 `source / intent / redirect`，并保留站内 `/subscription`、`/payment` 等既有回跳
   - P2/P3/P4/P5：均未开始

4. 关键约束：
   - 不能打散 `landing` 和 `socrates` 双站框架
   - 不做站点合并
   - 不重做信息架构
   - 不把 `landing /book-purchase` 直接并入 `socrates /subscription`
   - 当前阶段先做桥接，不碰支付重构和履约系统

5. 当前可参考文档：
   - docs/md_progress_book_20260408.md
   - docs/md_progress_closure_node_20260408.md

6. 继续前先检查 git 状态，只在用户明确要求的范围内推进，不要动无关脏文件。
```
