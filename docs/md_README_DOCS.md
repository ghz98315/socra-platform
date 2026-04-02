# Socra Platform - 文档索引

> 最后更新: 2026-04-02
> 目标: 只保留当前可直接使用的主文档入口，降低碎片化检索和误读旧方案的成本

---

## 一、建议优先阅读

### 平台主入口

- `md_progress_recall.md`: 项目总览、产品矩阵、当前开发焦点
- `md_progress_socrates.md`: Socrates 当前产品状态、运维节点、测试入口
- `md_progress_landing.md`: Landing 当前状态与后续承接方式
- `md_lessonlearn.md`: 已验证的开发、调试、部署、测试经验
- `md_prd.md`: 产品与架构主设计文档

### 发布、部署与测试

- `md_RELEASE_RUNBOOK.md`: 发布前检查、数据库迁移、smoke、放行门槛
- `md_deployment_cn.md`: 国内部署、Vercel 绑定、Cloudflare / DNS 诊断原则
- `md_TEST_GUIDE.md`: 人工业务验收主清单
- `md_socrates_full_test_execution_20260402.md`: 本轮全功能重测执行版
- `md_socrates_auth_joint_debug_20260402.md`: 2026-04-02 认证联调结论、结构证据与修复后复测顺序
- `md_TEST_CHECKLIST_20260330.md`: 2026-03-30 完整度测试清单
- `md_socrates_cloudflare_followup_20260329.md`: Cloudflare 专项排障清单

### 近期关键汇总

- `md_progress_socrates_20260330_deployment_validation_rollup.md`: 2026-03-29/30 部署、域名、链路问题汇总
- `md_progress_socrates_20260329_transfer_evidence_parent_followup_smoke.md`: transfer-evidence 家长侧跟进 smoke 覆盖补强

---

## 二、按主题查文档

### 产品与进度

- `md_progress_recall.md`
- `md_progress_socrates.md`
- `md_progress_landing.md`
- `md_progress_essay.md`
- `md_prd.md`
- `md_roadmap_v2.md`

### Socrates 发布、部署与验证

- `md_RELEASE_RUNBOOK.md`
- `md_deployment_cn.md`
- `md_TEST_GUIDE.md`
- `md_socrates_full_test_execution_20260402.md`
- `md_socrates_auth_upgrade_prd_20260402.md`
- `md_TEST_CHECKLIST_20260330.md`
- `md_socrates_cloudflare_followup_20260329.md`
- `md_progress_socrates_20260330_deployment_validation_rollup.md`

### Landing 当前主文档

- `md_landing_homepage_book_style_refresh_20260401.md`: 当前首页视觉与结构主文档
- `md_landing_prd_20260401.md`: Landing PRD
- `md_landing_final_page_spec_20260401.md`: 页面规格稿
- `md_landing_dev_execution_plan_20260401.md`: 开发阶段与执行边界

说明:

- 2026-04-01 期间产生的其他 landing 叶子稿，默认视为辅材或历史草稿
- 继续推进 landing 时，优先从以上 4 份主文档开始，不要再从更早的碎片草稿拼接上下文

### 快速恢复入口

- `md_QUICKSTART_20260330_restart_resume.md`

---

## 三、当前文档治理规则

1. 发布流程只维护一份主文档: `md_RELEASE_RUNBOOK.md`
2. 国内部署与网络诊断只维护一份主文档: `md_deployment_cn.md`
3. 人工业务验收只维护一份主文档: `md_TEST_GUIDE.md`
4. 完整重测执行只维护一份执行版: `md_socrates_full_test_execution_20260402.md`
5. 同一排障主题若连续产生多份切片文档，完成后应合并成 rollup，再清理叶子文档
6. 对已编码污染或明显过时的旧稿，优先新建干净主文档，不在旧稿上继续叠加

---

## 四、历史进度文档怎么用

`docs/` 下大量 `md_progress_socrates_YYYYMMDD_*.md` 文件属于阶段切片记录。

使用建议:

- 先看主文档和 rollup
- 只有在追某个具体改动来源时，再回看日期切片
- 如果该主题已经有 rollup，就不要再从多个叶子文档倒推全貌

---

## 五、本轮整理结果

### 已新增主入口

- `md_socrates_full_test_execution_20260402.md`

### 已更新

- `md_lessonlearn.md`
- `md_progress_recall.md`
- `md_progress_socrates.md`
- `md_progress_landing.md`
- `md_TEST_GUIDE.md`

### 已清理原则

- 仅删除已经被主文档替代、且继续保留会增加误读风险的旧叶子稿
- 未明确被替代的历史专题文档，暂留作归档
