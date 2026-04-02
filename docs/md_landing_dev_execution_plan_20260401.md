# Landing Dev Execution Plan

日期: 2026-04-01  
项目: `apps/landing`  
状态: Execution plan  
目的: 定义 landing 改版的开发阶段、交付边界、文件范围与验收标准

关联主文档:

- `docs/md_landing_prd_20260401.md`
- `docs/md_landing_growth_spec_20260401.md`
- `docs/md_landing_final_page_spec_20260401.md`

---

## 一、开发总原则

这次开发不做“大而全重写”，只按既定主线逐阶段落地。

执行原则:

1. 先搭最小闭环，再扩页面
2. 先结构，再视觉细化
3. 先文章入口，再产品承接
4. 所有开发必须服从极简原则

一句话:

`先做对，再做满。`

---

## 二、开发阶段总览

```text
Phase 1
  首页重构

Phase 2
  Essays 列表页
  首篇文章详情页

Phase 3
  About 页
  Start 页

Phase 4
  SEO / GEO 技术完善
  内容持续发布机制
```

---

## 三、Phase 1: 首页重构

### 目标

把当前复杂 landing 首页改成 PRD 里的极简 6 模块结构。

### 范围

仅改首页，不同时做文章系统。

### 目标模块

1. Hero
2. Thesis
3. Featured Essay
4. Series Map
5. Product Bridge
6. Final CTA

### 必删内容

1. 角色分流
2. 社区轮播
3. 热门场景入口
4. 复杂功能卡阵列
5. 完整价格矩阵
6. FAQ 大段区块

### 预期修改文件

- `apps/landing/app/page.tsx`
- `apps/landing/app/layout.tsx`
- `apps/landing/app/globals.css`

### 可选新增文件

- `apps/landing/lib/content.ts`
- `apps/landing/lib/site.ts`

### 验收标准

1. 首页只剩 6 个主模块
2. 首屏只有两个 CTA
3. 页面主线清楚:
   - 母题
   - 主文
   - 结构
   - 产品承接
4. 构建通过

### Phase 1 完成标志

- 首页已经能作为独立极简 landing 使用
- 即使文章系统尚未上线，页面逻辑也成立

---

## 四、Phase 2: Essays 系统最小闭环

### 目标

建立内容增长系统的最小闭环。

### 范围

1. `/essays`
2. `/essays/[slug]`
3. 第一篇文章内容
4. 本地静态数据层

### 页面

#### 1. `/essays`

职责:

- 作为“书的目录页”
- 展示 `道 / 法 / 术 / 器`

#### 2. `/essays/[slug]`

职责:

- 承接首篇长文
- 建立阅读路径
- 提供下一步

### 数据结构

建议在本阶段引入本地静态内容结构。

建议字段:

```text
title
slug
summary
series
series_order
published_at
reading_time
featured
hero_quote
key_takeaways[]
body
related_slugs[]
```

### 预期新增文件

- `apps/landing/app/essays/page.tsx`
- `apps/landing/app/essays/[slug]/page.tsx`
- `apps/landing/lib/essays.ts`
- `apps/landing/content/essays/*.md` 或 `*.ts`

如果当前项目不适合引入 md 文件，先用 `.ts` 静态内容也可以。

### 验收标准

1. 首页 Featured Essay 可跳到真实文章页
2. `/essays` 结构清楚
3. 首篇文章可完整阅读
4. 文章页有:
   - Key Takeaways
   - Next in Series
   - Product Bridge
5. 构建通过

### Phase 2 完成标志

- 内容系统最小闭环成立
- 自然流量引擎开始有真实落点

---

## 五、Phase 3: About 与 Start

### 目标

补足品牌可信度页与内容到产品的承接页。

### 页面

#### 1. `/about`

职责:

- 解释为什么会有这套内容
- 明确作者与方法来源
- 增强可信度

#### 2. `/start`

职责:

- 解释如何开始使用 Socrates
- 作为文章页和首页的产品承接页

### 预期新增文件

- `apps/landing/app/about/page.tsx`
- `apps/landing/app/start/page.tsx`

### 验收标准

1. About 不冗长
2. Start 不变成第二个复杂 landing
3. 两页均服务主线，不偏离内容战略

---

## 六、Phase 4: SEO / GEO 技术完善

### 目标

把增长规格真正埋进页面模板与站点技术层。

### 范围

1. 页面 metadata 完善
2. structured data
3. sitemap
4. robots
5. canonical
6. 内链系统

### 重点页面

- 首页
- `/essays`
- `/essays/[slug]`
- `/about`
- `/start`

### 预期文件

- `apps/landing/app/sitemap.ts`
- `apps/landing/app/robots.ts`
- `apps/landing/app/layout.tsx`
- 各页面 metadata 导出

### 验收标准

1. 页面 title / description 完整
2. Article schema 生效
3. Breadcrumb schema 生效
4. sitemap 可覆盖内容页
5. 页面内链完整

---

## 七、建议的实际开发顺序

推荐按下面顺序，不交叉乱做。

### Step 1

清理首页旧模块

### Step 2

把首页重构成 6 模块

### Step 3

建立 essays 数据结构

### Step 4

落地 `/essays`

### Step 5

落地第一篇文章详情页

### Step 6

补 About / Start

### Step 7

补 SEO / GEO 技术项

---

## 八、开发边界

为了防止范围膨胀，本轮明确不做:

1. CMS 后台
2. 评论系统
3. 社区联动
4. 复杂搜索
5. 复杂分类过滤
6. 模板下载中心
7. Newsletter 体系
8. 多语言

---

## 九、文件所有权建议

为了后续维护清晰，建议按下面方式组织。

### 页面层

- `app/page.tsx`
- `app/essays/page.tsx`
- `app/essays/[slug]/page.tsx`
- `app/about/page.tsx`
- `app/start/page.tsx`

### 内容层

- `lib/essays.ts`
- `content/essays/*`

### 全局层

- `app/layout.tsx`
- `app/globals.css`
- `app/sitemap.ts`
- `app/robots.ts`

---

## 十、每阶段验收问答

### Phase 1 验收问题

1. 首页是否一眼能看懂
2. 是否还有冗余模块
3. 是否仍像产品说明书

### Phase 2 验收问题

1. 是否已经形成“首页 -> 主文 -> 系列 -> 下一篇”的闭环
2. `/essays` 是否像目录页而不是博客列表
3. 文章页是否像长文页而不是销售页

### Phase 3 验收问题

1. About 是否提升可信度
2. Start 是否清楚承接产品

### Phase 4 验收问题

1. 搜索系统是否更容易理解页面
2. 页面是否仍保持极简，不被 SEO 破坏

---

## 十一、推荐当前立刻进入的开发阶段

现在可以正式开始的是:

`Phase 1: 首页重构`

原因:

- PRD 已定
- 增长规格已定
- 页面结构已定
- Wireframe 已定

也就是说，前置规划已经足够，不需要再继续抽象讨论。

---

## 十二、最终结论

开发阶段已经可以明确收敛为:

1. 先重构首页
2. 再搭 essays 最小闭环
3. 再补 about / start
4. 最后埋 SEO / GEO 技术细节

这就是后续实施的标准顺序。
