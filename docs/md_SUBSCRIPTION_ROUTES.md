# Socra 平台 - 订阅功能入口路径

## 域名架构（重要！）

| 域名 | 用途 | 首页行为 |
|------|------|----------|
| **socra.cn** | Landing Page 营销站 | 显示产品介绍、定价、订阅入口 |
| **socrates.socra.cn** | 应用 | 重定向到 /login 登录页 |

> ⚠️ 这是两个独立的部署，socra.cn 需要单独部署 Landing Page 组件

---

## 订阅入口汇总

### 1. Landing Page (socra.cn) - 营销站

**定价区域包含：**

| 套餐 | 价格 | 按钮 | 跳转 |
|------|------|------|------|
| Standard | 免费 | 免费注册 | socrates.socra.cn/register |
| Pro (热门) | ¥79.9/季 | **立即订阅** | socrates.socra.cn/subscription |
| 年度会员 | ¥239.9/年 | 选择年度 | socrates.socra.cn/subscription |

### 2. 应用内 (socrates.socra.cn) - 登录后

**Dashboard Pro 学科：**
- 物理/化学显示 Pro 标签
- 点击后显示「开通 Pro」按钮
- 跳转到 /subscription

### 3. 直接访问订阅页面

| 页面 | URL |
|------|-----|
| 订阅套餐 | https://socrates.socra.cn/subscription |
| 支付页面 | https://socrates.socra.cn/payment |
| 支付成功 | https://socrates.socra.cn/payment/success |

---

## 订阅流程图

```
socra.cn (营销站)
    │
    ├─→ 点击「立即订阅」→ socrates.socra.cn/subscription
    │
    └─→ 点击「免费注册」→ socrates.socra.cn/register


socrates.socra.cn (应用)
    │
    ├─→ /login (登录)
    │       ↓
    ├─→ /dashboard
    │       ↓
    ├─→ 点击 Pro 学科
    │       ↓
    └─→ /subscription → /payment → /payment/success
```

---

## 部署说明

### socra.cn (Landing Page)
需要单独部署 `LandingPage` 组件，可以使用：
- Vercel 单独项目
- 静态站点托管
- CDN 部署

### socrates.socra.cn (应用)
当前 Vercel 部署的 Next.js 应用

---

*最后更新: 2026-03-10*
