# Socra 平台 - 文档索引

> 最后更新: 2026-03-30
> 目标: 只保留当前可直接使用的主文档入口，减少重复和碎片化检索成本

---

## 一、建议优先阅读

### 开发入口

- `md_progress_recall.md`: 项目总览与快速上下文
- `md_progress_socrates.md`: Socrates 产品进度与最新运维节点
- `md_prd.md`: 产品与架构主设计文档

### 发布与运维

- `md_RELEASE_RUNBOOK.md`: 发布前检查、数据库迁移、烟测、放行门槛
- `md_deployment_cn.md`: 国内部署、Vercel 项目绑定、Cloudflare / DNS 诊断原则
- `md_TEST_GUIDE.md`: 人工业务验收清单
- `md_socrates_cloudflare_followup_20260329.md`: Cloudflare 专项排障清单

### 近期关键归档

- `md_progress_socrates_20260330_deployment_validation_rollup.md`: 2026-03-29/30 部署验证与域名诊断汇总
- `md_progress_socrates_20260329_transfer_evidence_parent_followup_smoke.md`: transfer-evidence 父侧跟进 smoke 覆盖补强

---

## 二、文档分类

### 产品与规划

- `md_progress_socrates.md`
- `md_progress_essay.md`
- `md_prd.md`
- `md_roadmap_v2.md`
- `md_execution_plan.md`

### 发布、部署与测试

- `md_RELEASE_RUNBOOK.md`
- `md_deployment_cn.md`
- `md_TEST_GUIDE.md`
- `md_socrates_cloudflare_followup_20260329.md`
- `md_progress_socrates_20260330_deployment_validation_rollup.md`

### 快速入口

- `md_progress_recall.md`
- `md_QUICKSTART.md`
- `md_QUICKSTART_20260315_latest.md`

### 其他专项文档

- `md_SUBSCRIPTION_ROUTES.md`
- `md_platform_architecture_ascii.md`
- `md_lessonlearn.md`
- `md_MARKETING_PLAN.md`
- `md_mathpromote.md`

---

## 三、历史进度文档说明

`docs/` 下大量 `md_progress_socrates_YYYYMMDD_*.md` 文件属于分阶段开发切片记录。

使用建议：

- 先看主文档和汇总文档
- 只有在追某个具体功能改动来源时，再回看对应日期切片
- 同一主题如果已经存在 rollup 文档，优先看 rollup，不再从多个叶子文档拼接上下文

---

## 四、本次整理后的规范

1. 发布流程只维护一份主文档: `md_RELEASE_RUNBOOK.md`
2. 国内部署与网络诊断只维护一份主文档: `md_deployment_cn.md`
3. 人工业务验收只维护一份主文档: `md_TEST_GUIDE.md`
4. 同一排障主题若连续产生多份切片文档，完成后应合并成一份 rollup 再清理叶子文档
