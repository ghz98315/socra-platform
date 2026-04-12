# Project Socrates - 错题本平台开发进度

> 本文档记录 Socrates 错题本平台的开发进度

---

## 最新运维节点: 2026-04-12

### 当前判断

- `Phase 2` 最小人工验收已完成，当前未发现 `error-book -> error detail -> review -> workbench` 主链阻塞问题
- 已补当前主链未登录保护，避免 `error-book / error-book/[id] / review / review/session / workbench` 在未登录态卡在页面 loading
- 当前机器重新核对本地链路后，基础环境判断为：
  - `pnpm check:node` 已通过，Node 仍与仓库基线 `22.x` 对齐
  - `pnpm socrates:status:local` 当前返回 `HTTP=307`，说明本地已有可用 Socrates 服务在响应
  - 当前更像“本地 helper 跟踪 PID 丢失”，而不是应用本身不可用
- 剩余本地阻塞已明确收口到 Windows `next build --webpack` 的 worker/fork 路径 `spawn EPERM`，不再把它误判成当前产品主链回归
- 为避免本地验收继续被 full build 卡住，已补一个明确的降级入口：
  - `pnpm socrates:start:dev-local`
  - 该入口走 `next dev`，不依赖预先生成 `.next/BUILD_ID`
  - `pnpm socrates:start:local` 仍保留原来的“基于 build 输出的本地 start”语义，不做静默行为变更
- 本轮收尾文档已补齐到可交接状态：
  - `Phase 2` 验收执行稿已从模板回填为当前实际结果
  - runbook 已补本地 `-C ...\\socra-platform` 执行口径，避免再在错误目录运行 `pnpm`
  - 当前这轮可以视为已完成保存的 checkpoint-ready 节点
- 本轮 checkpoint 已实际提交并推送：
  - commit: `ffb9d77`
  - branch: `main`
  - 当前状态已从“可提交”进入“等待 preview 部署与验收”

### 当前主文档入口

- 内部闭环计划: `docs/md_socrates_internal_closure_plan_20260409.md`
- 本轮 checkpoint: `docs/md_progress_socrates_20260412_phase2_closure_checkpoint.md`
- Phase 2 人工验收清单: `docs/md_socrates_phase2_error_loop_acceptance_checklist_20260411.md`
- Phase 2 验收执行稿: `docs/md_socrates_phase2_error_loop_acceptance_execution_20260411.md`
- 发布与本地运行手册: `docs/md_RELEASE_RUNBOOK.md`

### 当前下一步建议

- 当前这轮已完成提交与推送，下一步直接等待 preview 链接并执行 5 点主链验收
- 本地复验如再遇到 `.next/BUILD_ID` 缺失或 Windows `spawn EPERM`，优先使用 `pnpm socrates:start:dev-local`
- 如后续继续追 Windows build 阻塞，口径只聚焦本地构建辅助链路，不回头扩大产品功能范围

---

## 最新运维节点: 2026-04-11

### 当前判断

- 当前已在 `Phase 2` 基线下补做一轮 `workbench` 稳定性收口，目标不是扩功能，而是把“录题后进入对话”和“恢复旧会话继续学习”这两条高频路径补稳
- `study/[subject]/problem -> /workbench` 已改为服务端直跳，减少中间桥页停留
- `workbench` 已补齐两类稳定性修正：
  - 恢复旧错题会话时，如果历史 `chat_messages` 为空，会自动补一条开场 assistant 引导消息，避免聊天区空白
  - 删除重复的几何自动解析触发，避免 OCR 后重复请求几何识别
- `error-book` 与 `error-book/[id]` 已补一轮动作语义统一：
  - 列表页 `Next Step` 会优先落到 `继续复习 / 继续学习 / 看原题`
  - 详情页头部重复主动作已降级，改由页内 `Next Step` 卡承接单一下一步
  - 已完成态主出口改为 `看复盘 / 复习中心`，不再回到泛化错题列表
- `review` 首页已继续收口完成态出口：
  - 有待复习任务时，主动作保持 `继续复习`，辅助动作改为 `看原题`
  - 无待复习但有最近完成记录时，主动作改为 `看复盘`
  - 顶部返回工作台动作已统一改成 `继续学习`
- `review/session` 完成态也已降到双出口：
  - 未关单时保留 `继续学习 + 复习中心`
  - 已关单时保留 `复习中心 + 看原题`
  - 不再在结果页同时并列三条出口
- `Phase 2` 最小人工验收已完成，当前未发现主链阻塞问题
- 已补当前主链的未登录保护，避免页面在本地或未登录态下停在 loading：
  - `error-book`
  - `error-book/[id]`
  - `review`
  - `review/session`
  - `workbench`
- 本轮本地构建已重新通过，当前可以继续回到 `error-book -> error detail -> review` 的主动作收口

### 当前主文档入口

- 内部闭环计划: `docs/md_socrates_internal_closure_plan_20260409.md`
- 账号模型下一阶段备忘: `docs/md_socrates_account_model_next_stage_20260410.md`
- 闭环节点进度: `docs/md_progress_closure_node_20260408.md`
- Phase 2 人工验收清单: `docs/md_socrates_phase2_error_loop_acceptance_checklist_20260411.md`
- Phase 2 验收执行稿: `docs/md_socrates_phase2_error_loop_acceptance_execution_20260411.md`

### 当前下一步建议

- 继续推进 `Phase 2`，优先收口 `error-book` 列表页、详情页、复习页之间的单一下一步语义
- 当前主链动作收口与最小人工验收已经完成，下一步可转入收尾归档或提交 checkpoint
- 如继续收尾，优先补验收执行稿回填，并整理一次 commit-ready 状态
- 保持 `workbench` 当前“少说明、先进入对话”的方向，不回退到中间说明页
- 如果后续继续改 `workbench`，优先只做闭环稳定性补丁，不并行扩张新信息架构

---

## 最新运维节点: 2026-04-10

### 当前判断

- `socrates` 内部闭环 Phase 1 已完成首轮收口，`select-profile -> /study#quick-start` 已打通，学习首页首屏已改为更短、更直接的动作入口
- 当前已正式进入 Phase 2：错题闭环收口，重点不再是“功能是否存在”，而是“错题列表、错题详情、复习入口谁是下一步”
- 本轮已明确新增一个后续架构议题：账号体系准备从“双角色登录心智”收口为“单账号登录 + 家长二级密码 + 多学生隔离视图”，但这属于下一阶段模型调整，不并入当前 Phase 2 直接改库

### 当前主文档入口

- 内部闭环计划: `docs/md_socrates_internal_closure_plan_20260409.md`
- 账号模型下一阶段备忘: `docs/md_socrates_account_model_next_stage_20260410.md`
- 闭环节点进度: `docs/md_progress_closure_node_20260408.md`

### 当前下一步建议

- 继续推进 Phase 2，收口 `error-book -> error detail -> review` 的主动作语义
- 保持入口文案极简，不回到“大段说明 + 多信息块”的目录式首页
- 账号模型调整先按专项方案设计，等本轮闭环收口后再进入实现拆分

---

## 最新运维节点: 2026-04-09

### 当前判断

- 已完成一轮 `landing -> socrates` 就绪性复核，当前主入口、登录承接、订阅/支付回跳链路在代码层已经基本打通
- 当前可以进入下一阶段 `socrates` 功能闭环工作，但不能把现状定义为“首批用户完整业务闭环完成”
- 最大缺口不在入口参数与登录跳转，而在购书后的自动履约、自动开通权益，以及阅读内容到工具的回流闭环

### 当前主文档入口

- 闭环节点进度: `docs/md_progress_closure_node_20260408.md`
- 闭环执行方案: `docs/md_landing_socrates_closure_execution_plan_20260408.md`
- 内部闭环计划: `docs/md_socrates_internal_closure_plan_20260409.md`
- 人工验收清单: `docs/md_closure_manual_acceptance_checklist_20260409.md`

### 当前下一步建议

- 下一阶段直接转入 `socrates` 内部功能闭环：`select-profile -> 首次使用 -> 错题进入/回看 -> 订阅/支付 -> 支付后继续使用`
- 以 `docs/md_socrates_internal_closure_plan_20260409.md` 作为本轮执行基线，按 Phase 1 / 2 / 3 推进
- 如果首批用户包含购书用户，并行补上“购书后自动开通权益 / 自动履约”缺口
- 上线可用性仍建议补真实人工验收，不仅依赖本机网络探测

---

## 最新运维节点: 2026-04-02

### 当前判断

- 生产 Socrates 应用已经完成 2026-03-29/30 这一轮部署验证
- 当前进入全功能重测准备阶段，测试执行以 2026-04-02 新整理的执行版文档为准
- 正式 Vercel 项目以 `socra-socrates` 为准，不再使用误创建的 `socrates`
- 自定义域名 `socrates.socra.cn` 的异常优先按 Cloudflare / 域名链路问题处理
- 当前验证机器对 `*.vercel.app` 出现过异常 DNS / 网络路径结果，alias 失败不能单机直接判定为应用回归

### 当前主文档入口

- 发布与烟测: `docs/md_RELEASE_RUNBOOK.md`
- 国内部署与域名诊断: `docs/md_deployment_cn.md`
- 人工验收主清单: `docs/md_TEST_GUIDE.md`
- 全功能重测执行版: `docs/md_socrates_full_test_execution_20260402.md`
- 认证升级方案: `docs/md_socrates_auth_upgrade_prd_20260402.md`
- 2026-03-29/30 部署汇总: `docs/md_progress_socrates_20260330_deployment_validation_rollup.md`
- 经验总结: `docs/md_lessonlearn.md`

### 当前下一步建议

- 先按 `docs/md_socrates_full_test_execution_20260402.md` 完成全功能重测
- 并行推进 `docs/md_socrates_auth_upgrade_prd_20260402.md` 的 Phase 1：
  - 手机号验证码登录 / 注册
  - 保留旧密码登录作为兼容入口
  - 当前已落地第一批代码骨架：
    - `send-code` / `verify-code` API
    - 登录页 / 注册页双入口
    - `auth_verification_codes` / `user_auth_identities` migration

---

## 最近产品完成节点: 2026-03-10 v1.7.19

### 当前状态
- **版本**: v1.7.19
- **分支**: main (socra-platform)
- **部署地址**: https://socrates.socra.cn
- **最后更新**: 所有 Phase 开发完成

---

## 项目整体状态

| Phase | 名称 | 状态 | 完成日期 |
|-------|------|------|----------|
| Phase 0 | 合规基础 | ✅ 完成 | 2026-03-10 |
| Phase 1 | 基础设施 | ✅ 完成 | 2026-03-10 |
| Phase 1.5 | 学习诊断 | ✅ 完成 | 2026-03-10 |
| Phase 2 | 用户增长 | ✅ 完成 | 2026-03-10 |
| Phase 2.5 | 家长增强 | ✅ 完成 | 2026-03-10 |
| Phase 3 | 商业化 | ✅ 完成 | 2026-03-09 |
| Phase 4 | 合规功能 | ✅ 完成 | 2026-03-09 |

**所有 Phase 均已完成！**

---

## Phase 完成详情

### Phase 0: 合规基础 ✅

| 模块 | 状态 | 文件 |
|------|------|------|
| 隐私政策页面 | ✅ | `/privacy` |
| 用户协议页面 | ✅ | `/terms` |

### Phase 1: 基础设施 ✅

| 模块 | 状态 | 文件 |
|------|------|------|
| 积分系统表 | ✅ | `socra_points`, `point_transactions` |
| 邀请系统表 | ✅ | `invite_codes`, `invite_records` |
| 积分 API | ✅ | `/api/points` |
| 邀请 API | ✅ | `/api/invite` |
| 积分组件 | ✅ | `PointsBadge.tsx`, `BottomStatusBar.tsx` |
| 邀请页面 | ✅ | `/(student)/invite` |

### Phase 1.5: 学习诊断 ✅

| 模块 | 状态 | 文件 |
|------|------|------|
| 知识图谱表 | ✅ | `knowledge_nodes`, `user_knowledge_mastery` |
| 学习风格表 | ✅ | `learning_style_questions`, `learning_style_assessments` |
| 知识图谱 API | ✅ | `/api/knowledge` |
| 学习风格 API | ✅ | `/api/learning-style` |
| 知识图谱页面 | ✅ | `/(student)/knowledge` |
| 学习风格测试页面 | ✅ | `/(student)/style-test` |

### Phase 2: 用户增长 ✅

| 模块 | 状态 | 文件 |
|------|------|------|
| 分享海报 API | ✅ | `/api/share/poster` |
| 微信签名 API | ✅ | `/api/wechat/signature` |
| 分享海报组件 | ✅ | `SharePoster.tsx` |
| 微信分享工具 | ✅ | `wechat-share.ts` |

### Phase 2.5: 家长增强 ✅

| 模块 | 状态 | 文件 |
|------|------|------|
| 奖励发放表 | ✅ | `reward_distributions` |
| 周报表 | ✅ | `weekly_report_configs`, `weekly_reports` |
| 多子女 Dashboard API | ✅ | `/api/family/dashboard` |
| 周报 API | ✅ | `/api/weekly-reports` |
| 家庭管理页面 | ✅ | `/(parent)/family` |
| 任务管理页面 | ✅ | `/(parent)/tasks` |

### Phase 3: 商业化 ✅

| 模块 | 状态 | 文件 |
|------|------|------|
| 订阅计划表 | ✅ | `subscription_plans` |
| 用户订阅表 | ✅ | `user_subscriptions` |
| 优惠码表 | ✅ | `coupons`, `coupon_usages` |
| 支付订单表 | ✅ | `payment_orders` |
| 订阅 API | ✅ | `/api/subscription` |
| 优惠码 API | ✅ | `/api/coupon/validate` |
| 支付 API | ✅ | `/api/payment/create-order`, `/api/payment/callback` |
| 订阅页面 | ✅ | `/(student)/subscription` |
| 支付页面 | ✅ | `/(student)/payment` |
| 支付成功页面 | ✅ | `/(student)/payment/success` |
| Pro 标识组件 | ✅ | `ProBadge.tsx` |
| 功能锁定组件 | ✅ | `FeatureLock.tsx` |
| 权益对比组件 | ✅ | `SubscriptionFeatures.tsx` |

### Phase 4: 合规功能 ✅

| 模块 | 状态 | 文件 |
|------|------|------|
| 青少年模式表 | ✅ | `teen_mode_settings` |
| 使用时长表 | ✅ | `usage_logs` |
| 家长授权表 | ✅ | `parental_consents` |
| 内容审核表 | ✅ | `content_moderation_logs` |
| 青少年模式 API | ✅ | `/api/teen-mode` |
| 使用时长 API | ✅ | `/api/usage` |
| 时长追踪 Hook | ✅ | `useUsageTracker.ts` |
| 青少年模式指示器 | ✅ | `TeenModeIndicator.tsx` |
| 休息提醒组件 | ✅ | `RestReminder.tsx` |
| 模式检查中间件 | ✅ | `teen-mode-middleware.ts` |
| 家长管控页面 | ✅ | `/(parent)/controls` |
| 学生端布局集成 | ✅ | `/(student)/layout.tsx` |

---

## 核心功能

```
┌─────────────────────────────────────────────────────┐
│                  Socrates 错题本平台                  │
├─────────────────────────────────────────────────────┤
│  📷 错题上传    → OCR识别 + 几何图形渲染             │
│  💬 AI对话学习  → 苏格拉底式引导 + 变式训练          │
│  📚 复习计划    → 艾宾浩斯遗忘曲线 + 难度评估        │
│  📅 时间规划    → AI智能排期 + 专注计时              │
│  🏆 成就系统    → XP积分 + 徽章解锁                  │
│  👨‍👩‍👧 家长端    → 学习报告 + AI对话分析              │
│  🔒 青少年模式  → 时长限制 + 休息提醒                │
│  💎 Pro会员     → 订阅 + 支付 + 权益管理             │
└─────────────────────────────────────────────────────┘
```

---

## 已完成功能

| 模块 | 功能 | 状态 |
|------|------|------|
| **错题学习** | OCR智能识别 | ✅ |
| | 几何图形渲染 (JSXGraph) | ✅ |
| | 苏格拉底式AI对话 | ✅ |
| | 变式题生成 | ✅ |
| | 学科切换支持 | ✅ |
| **学科AI** | 数学 Prompt 配置 | ✅ |
| | 语文 Prompt 配置 | ✅ |
| | 英语 Prompt 配置 | ✅ |
| **复习系统** | 艾宾浩斯5阶段复习 | ✅ |
| | 双维度难度评估 | ✅ |
| **时间规划** | 任务管理 | ✅ |
| | AI智能排期 | ✅ |
| | 专注计时模式 | ✅ |
| | 周统计视图 | ✅ |
| **知识图谱** | 知识点管理 | ✅ |
| | 掌握度跟踪 | ✅ |
| | 科目筛选/搜索 | ✅ |
| **学习风格** | VARK 模型测试 | ✅ |
| | 个性化建议 | ✅ |
| **Dashboard** | 今日统计卡片 | ✅ |
| | 学科进度卡片 | ✅ |
| | 快捷操作入口 | ✅ |
| **家庭管理** | 家庭组创建/加入 | ✅ |
| | 多子女Dashboard | ✅ |
| | 子女选择组件 | ✅ |
| | 远程任务布置 | ✅ |
| | 学生任务查看 | ✅ |
| **商业化** | 订阅计划 | ✅ |
| | 支付流程 | ✅ |
| | 优惠码系统 | ✅ |
| | Pro 权限管理 | ✅ |
| **合规功能** | 青少年模式 | ✅ |
| | 使用时长限制 | ✅ |
| | 休息提醒 | ✅ |
| | 家长授权 | ✅ |
| | 内容审核 | ✅ |
| **用户系统** | 学生/家长双角色 | ✅ |
| | 角色自由切换 | ✅ |
| | 成就系统 (19成就/15级) | ✅ |
| **社区** | 帖子/评论/点赞 | ✅ |
| **积分系统** | 积分获取/消费 | ✅ |
| | 等级系统 | ✅ |
| **邀请系统** | 邀请码生成 | ✅ |
| | 邀请奖励 | ✅ |
| **分享系统** | 海报生成 | ✅ |
| | 微信分享 | ✅ |
| **家长端** | 学习报告 | ✅ |
| | AI对话分析 | ✅ |
| | 学习建议 | ✅ |
| | 任务管理 | ✅ |
| | 周报生成 | ✅ |

---

## 待开发功能 (下一轮迭代)

| 优先级 | 功能 | 状态 |
|--------|------|------|
| 🟡 中 | 微信通知系统 | ⏳ 待开始 |
| 🟡 中 | 积分消费功能 | ⏳ 待开始 |
| 🟡 中 | 积分过期机制 | ⏳ 待开始 |
| 🟡 中 | 积分排行榜 | ⏳ 待开始 |
| 🟢 低 | 英语口语练习 | ⏳ 规划中 |
| 🟢 低 | 更多科目支持 | ⏳ 规划中 |
| 🟢 低 | B端学校/班级管理 | ⏳ 规划中 |

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 15 App Router |
| 语言 | TypeScript |
| 数据库 | Supabase PostgreSQL |
| 认证 | Supabase Auth |
| UI | shadcn/ui + Tailwind CSS |
| 动画 | framer-motion |
| AI | 阿里云通义千问 |
| 几何 | JSXGraph |
| 状态 | Zustand |

---

## 快速启动

```bash
cd "D:\github\Socrates_ analysis\socra-platform\apps\socrates"
pnpm install
pnpm dev
```

---

## 环境变量

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DASHSCOPE_API_KEY=
NEXT_PUBLIC_SITE_URL=https://socrates.socra.cn
```

---

## 数据库迁移文件

| 文件 | 用途 | 状态 |
|------|------|------|
| `20260309_teen_mode.sql` | 青少年模式 + 使用时长 | ✅ |
| `20260309_notifications.sql` | 通知系统 | ✅ |
| `20260309_knowledge_graph.sql` | 知识图谱 | ✅ |
| `20260309_parent_tasks.sql` | 家长任务 | ✅ |
| `20260309_subscriptions_system.sql` | 订阅系统 | ✅ |
| `20260310_learning_style.sql` | 学习风格测试 | ✅ |
| `20260310_invite_system_only.sql` | 邀请系统 | ✅ |
| `20260310_parent_enhancements.sql` | 家长增强 | ✅ |

---

*文档最后更新: 2026-03-10 v1.7.19*
*所有 Phase 开发完成*

## 2026-04-02 Auth Phase 1 Latest

- Phone auth Phase 1 core path is now structurally unblocked.
- Supabase-side legacy auth bootstrap drift was fixed with new migrations for `profiles.email` compatibility and qualified writes to `public.invite_codes` / `public.socra_points`.
- The new phone code flow now accepts 6-8 digit OTPs end-to-end, matching the current Supabase `generateLink` behavior.
- Local validation status:
  - `pnpm check:node` passed on Node `22.19.0`
  - `pnpm check:env` passed
  - `pnpm.cmd --filter @socra/socrates build` passed
  - `pnpm.cmd smoke:auth-phone` passed against `http://127.0.0.1:3000`
- Deployment status:
  - Vercel production project remains `socra-socrates`
  - Latest confirmed deployment: `socra-socrates-4h0wgnqnc-ghz98315s-projects.vercel.app`
  - `https://socra-platform.vercel.app/api/auth/send-code` returned success after deploy, confirming the previous stale-route problem is cleared on the production alias
- Current remaining risk is not app code but custom-domain transport on some machines:
  - `pnpm probe:socrates-domain` showed the alias healthy
  - `socrates.socra.cn` still hit TLS setup failure from this machine, so Cloudflare / custom-domain diagnosis remains the correct next track when custom-domain validation is required

## 2026-04-10 Socrates Internal Closure Phase 2 Update

- `review` 首页继续做减法：
  - 首屏主动作统一为 `继续复习 / 继续学习`
  - 首屏辅助入口保留 `错题本`
  - 删除底部两张说明卡，避免学生进入后先看大量解释文字
- `review` 列表动作词统一：
  - 未完成题使用 `继续复习`
  - 已完成题使用 `看复盘`
  - 原题入口统一为 `看原题`
- `review session` 继续收口：
  - intro / recall / judge 三步文案进一步压短
  - 完成态主动作改成更明确的单一出口
  - 未关单时主动作是 `继续学习`
  - 已关单时主动作是 `复习中心`
- 本轮不改账户架构，不改家长/孩子登录模型；该建议已单独沉淀到下一阶段文档
- 本轮验证：
  - `pnpm.cmd --filter @socra/socrates build` passed

## 2026-04-10 Socrates Internal Closure Phase 3 Update

- `subscription -> payment -> payment/success` 已改成保留学习上下文的回流链：
  - 订阅页会保留 `source / intent / redirect`
  - 支付页会继续透传同一组参数
  - 支付成功页优先回到原学习动作，不再固定掉回泛化页
- `entry-intent` 已放开安全站内回跳到：
  - `/study`
  - `/review`
  - `/dashboard`
  - `/workbench`
  - 同时保留已有 `/subscription / payment / error-book / select-profile`
- 高频付费入口已接入上下文回流：
  - `dashboard` 里的 Pro 学科入口
  - 通用 `FeatureLock`
- 支付成功页新规则：
  - 有 `redirect` 时：主动作 `回到原任务`
  - 无 `redirect` 时：主动作默认落到 `/study#quick-start`
- 本轮验证：
  - `pnpm.cmd --filter @socra/socrates build` passed
- 验收文档：
  - `docs/md_socrates_phase3_payment_return_acceptance_checklist_20260410.md`
