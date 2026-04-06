# Landing Organic Growth Engine

日期: 2026-04-01  
适用项目: `apps/landing`  
目的: 为 landing 与 essays 内容系统规划 SEO + GEO 一体化的自然流量增长引擎

关联文档:

- `docs/md_landing_prd_20260401.md`
- `docs/md_landing_final_page_spec_20260401.md`
- `docs/md_landing_essay_ia_20260401_v1.md`
- 根目录 `article-outline.pdf`

---

## 一、先定总原则

自然流量引擎不是在首页多塞几个 SEO 模块。

真正有效的做法是:

`让网站结构、文章结构、实体信息、内部链接和更新节奏，天然适合被搜索引擎和 AI 搜索系统理解。`

也就是说:

- 首页继续极简
- SEO 元素藏进页面模板
- GEO 元素藏进内容组织方式
- 不为了搜索而破坏页面高级感

---

## 二、SEO 与 GEO 的统一判断

基于 Google 当前对 Search、AI Overviews、AI Mode 的官方说明，可以把这件事理解成一句话:

`没有一套额外的“AI 搜索魔法优化”，真正有效的仍然是高质量、可抓取、结构清楚、可信、可引用的内容。`

因此:

### SEO 负责

- 被发现
- 被索引
- 被点击

### GEO 负责

- 被 AI 搜索系统理解
- 被作为支持链接引用
- 被用于复杂问题的子主题回答

两者底层建设基本是同一套。

---

## 三、自然流量引擎的三层结构

建议把 Socra 的自然流量系统拆成三层。

```text
Layer 1: Brand / Thesis Layer
  Home
  About

Layer 2: Topic / Intent Layer
  Essays Index
  Series Pages (future)

Layer 3: Query Capture Layer
  Individual Essays
  Future method pages / templates
```

### Layer 1: Brand / Thesis Layer

目标:

- 建立实体
- 建立主题聚焦
- 让搜索系统知道这个站在讲什么

代表页面:

- `/`
- `/about`

### Layer 2: Topic / Intent Layer

目标:

- 把内容按体系组织
- 形成主题聚合页

代表页面:

- `/essays`
- 后续可选: `/method`

### Layer 3: Query Capture Layer

目标:

- 承接具体问题搜索
- 承接 AI 搜索里的细分问题 fan-out

代表页面:

- `/essays/[slug]`

---

## 四、极简首页里的 SEO / GEO 布局原则

首页仍然保持极简，但必须承担 4 个搜索任务。

### 1. 首页必须明确站点主命题

首页标题、H1、主文案必须清楚表达:

- 错误
- 闭环学习
- 学习方法
- Socrates

这样首页既服务品牌词，也服务主题理解。

### 2. 首页必须有明确的结构入口

首页不能只是一个漂亮 Hero。

它必须明显指向:

- 主文章
- 文章列表
- 方法结构

这样搜索系统和用户都能理解站点内部结构。

### 3. 首页必须保留实体信息

首页或 About 中必须明确:

- 谁在写
- 为什么写
- 背景是什么

这直接关系到信任与 E-E-A-T 表达。

### 4. 首页必须能把流量导向深页

首页本身不是流量终点。

它的任务之一是把品牌流量导向:

- Essays
- 文章详情
- Start page

---

## 五、内容引擎设计

自然流量的核心，不是首页，而是内容引擎。

这里建议采用:

`书籍母题 -> 系列 -> 单篇长文 -> 相关延展页`

### 第一层: 母题

主命题:

- 从错误开始
- 闭环学习

这是品牌级主题，不是关键词堆砌。

### 第二层: 系列

- 道
- 法
- 术
- 器

这四层是天然的主题聚类结构。

### 第三层: 单篇长文

每篇文章对应一个明确搜索意图。

例如:

- 粗心，是关闭追问的借口
- 做对一次，不等于学会了
- 为什么大多数错题本都是死书
- 5 Why 如何用在学习上
- PDCA 学习闭环

### 第四层: 后续扩展页

未来可扩展:

- 方法页
- 模板页
- 工具页

但第一阶段不要先做太多。

---

## 六、搜索意图布局

你的内容体系最强的一点，是它天然覆盖了三类搜索意图。

### 1. Problem Intent

用户在问:

- 孩子总是粗心怎么办
- 为什么孩子会了又忘
- 错题本为什么没用
- 家长怎么辅导孩子才有效

这些适合文章页承接。

### 2. Framework Intent

用户在找:

- 5 Why 是什么
- PDCA 学习法
- 根因分析 学习
- 闭环学习法

这些适合系列文章和未来方法页承接。

### 3. Product / Solution Intent

用户在找:

- AI 错题辅导
- 错题复习工具
- 学习闭环工具
- 家长陪学工具

这些由 `/start` 和 Product Bridge 承接。

---

## 七、内容发布节奏建议

真正的自然流量增长，不是一次性上线很多页，而是稳定连载。

建议节奏:

### Phase 1

- 首页上线
- `/essays`
- 首篇主文上线

### Phase 2

- 每周 1 篇核心长文
- 每篇长文必须进入系列结构

### Phase 3

- 每篇核心长文再拆:
  - 1 个简版摘要
  - 1 个方法图
  - 1 个模板入口

### Phase 4

- 逐步形成内部链接网络

这才是“量变引擎”。

不是靠首页堆模块，而是靠持续高质量结构化连载。

---

## 八、单篇文章模板的 SEO / GEO 要求

每篇文章页都必须满足下面要求。

### 1. 一个明确 H1

不要标题党，不要过长。

### 2. 开头 2 到 3 段直接回答问题

这对:

- 搜索点击后停留
- 摘要提取
- AI 搜索理解

都很重要。

### 3. 明确的小标题层级

建议:

- H1: 主标题
- H2: 关键段落
- H3: 细节展开

不要视觉上很花，但语义结构混乱。

### 4. 文末必须有总结

例如:

- 关键结论
- 三个要点
- 下一篇

这会显著提高页面可提取性与内部链路强度。

### 5. 文末必须有自然承接

只保留一种主承接:

- 继续读下一篇
- 或开始体验 Socrates

不要多个 CTA 互相竞争。

---

## 九、结构化数据策略

为了不污染视觉，但增强搜索理解，建议把 SEO/GEO 的很多工作放在结构化数据里。

### 首页

建议保留:

- `Organization`
- `WebSite`

### 文章详情页

建议增加:

- `Article` / `BlogPosting`
- `BreadcrumbList`

### 作者 / About

后续可补:

- `Person`
- `sameAs`

原则:

- 结构化数据必须和页面可见内容一致
- 不做隐藏信息堆砌

---

## 十、必须落实的技术项

### 1. Sitemap

必须有:

- 首页
- essays index
- 每篇文章

并在新增文章后及时更新。

### 2. Search Console

必须验证，并持续看:

- 覆盖
- 索引
- 性能

### 3. IndexNow

建议接入。

理由:

- 文章更新后更快通知搜索引擎
- 尤其适合连载型网站

### 4. 清晰的 title / meta description

每页单独写。

不要模板化复制。

### 5. 内部链接

内部链接是自然流量引擎的骨架。

必须确保:

- 首页 -> 主文
- 首页 -> Essays
- Essays -> 每篇文章
- 文章 -> 下一篇
- 文章 -> 相关系列
- 文章 -> Start

---

## 十一、GEO 视角下的内容写法

虽然 Google 官方明确说 AI features 不需要额外特殊优化，但从 AI 搜索的工作方式看，页面更容易被引用的写法通常有这些特征。

这里是基于官方说明做出的结构性推断:

### 1. 先定义，再展开

例如:

- 什么是“粗心”
- 什么是“假会”
- 什么是“闭环”

### 2. 明确回答复杂问题中的子问题

因为 AI 搜索会做 query fan-out。

也就是说，一篇文章如果能覆盖:

- 现象
- 原因
- 判断标准
- 方法

更容易被用于复杂问答。

### 3. 给出可引用的短结论

例如:

- 粗心是结论，不是根因
- 做对一次，不等于学会
- 错题本如果没有复习机制，就是死书

这些短句很重要。

### 4. 强作者身份与背景

因为 AI 搜索和传统搜索都会更重视可信信息。

### 5. 用清楚的系列关系帮助理解上下文

例如在文章页明确:

- 这是“道”系列第 1 篇
- 下一篇是什么

这会帮助搜索系统更好地理解上下文。

---

## 十二、不要做的 SEO / GEO 动作

为了保持极简和品牌感，下面这些动作不建议做。

1. 首页硬塞大量关键词段落
2. 首页做 FAQ 关键词农场
3. 每篇文章堆太多相似关键词
4. 做大量薄内容页抢词
5. 为了 GEO 人工加很多“问答废话”
6. 用模板批量拼接文章
7. 让搜索优化破坏页面审美和阅读体验

这些做法短期看像“在做 SEO”，长期只会毁掉品牌和质量。

---

## 十三、自然流量引擎的最小闭环

第一阶段最小闭环建议如下:

```text
Home
  -> Featured Essay
  -> Essays Index
  -> Start

Essays Index
  -> 4 series
  -> Article detail

Article detail
  -> Next article
  -> Start
```

只要这个闭环跑通，流量引擎就能开始工作。

---

## 十四、增长指标建议

第一阶段不要追太多指标，先看这 6 个。

### 搜索基础

1. 已索引页面数
2. 搜索曝光量
3. 搜索点击量

### 内容效率

4. 首页 -> 主文点击率
5. 主文 -> Essays / Start 转化率
6. 文章页平均停留与滚动深度

如果这些数据在涨，说明引擎开始转起来了。

---

## 十五、最终结论

你要的“自然流量量变引擎”本质上不是一个 SEO 装置，而是一套持续复利的结构。

最优做法可以压缩成一句话:

`用清晰的母题、持续连载的结构化长文、可信的作者与方法体系，再加最小但完整的技术 SEO，把自然流量积累成复利。`

对 landing 来说，最重要的不是多，而是:

- 主题要准
- 结构要清
- 页面要静
- 连载要稳
- 内链要强

这才是符合 Dan Koe / Justin Welsh 式极简 landing 的自然增长方案。

---

## 十六、参考来源

以下结论优先基于官方文档:

- Google Search Central: SEO Starter Guide  
  https://developers.google.com/search/docs/fundamentals/seo-starter-guide

- Google Search Central: Creating helpful, reliable, people-first content  
  https://developers.google.com/search/docs/fundamentals/creating-helpful-content

- Google Search Central: AI features and your website  
  https://developers.google.com/search/docs/appearance/ai-features

- Google Search Central: Title links  
  https://developers.google.com/search/docs/appearance/title-link

- Google Search Central: Introduction to structured data  
  https://developers.google.com/search/docs/guides/intro-structured-data

- Google Search Central: Article structured data  
  https://developers.google.com/search/docs/appearance/structured-data/article

- Google Search Central: Breadcrumb structured data  
  https://developers.google.com/search/docs/appearance/structured-data/breadcrumb

- Bing Webmaster Tools: Why IndexNow  
  https://www.bing.com/indexnow

- Bing Webmaster Tools: How to add IndexNow  
  https://www.bing.com/indexnow/IndexNowView/IndexNowGetStartedView
