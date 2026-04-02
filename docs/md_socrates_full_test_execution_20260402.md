# Socrates 全功能测试执行版

> 适用日期: 2026-04-02
> 适用仓库: `socra-platform`
> 适用应用: `apps/socrates`
> 正式域名: `https://socrates.socra.cn`
> 生产 alias: `https://socra-platform.vercel.app`

---

## 1. 使用说明

- 这份文档是本轮 Socrates 全功能重测的执行版，按顺序直接照着测即可。
- 人工验收主入口仍以 `docs/md_TEST_GUIDE.md` 为准。
- 发布前检查、构建、迁移、烟测规则仍以 `docs/md_RELEASE_RUNBOOK.md` 为准。
- 如果当前机器访问 `socrates.socra.cn` 异常，必须立刻用 `https://socra-platform.vercel.app` 复测同一路径。
- 如果 alias 正常、自定义域名异常，优先记录为 Cloudflare / DNS / 网络路径问题，不直接判定为应用回归。

---

## 2. 关联主文档

- `docs/md_TEST_GUIDE.md`
- `docs/md_TEST_CHECKLIST_20260330.md`
- `docs/md_RELEASE_RUNBOOK.md`
- `docs/md_progress_socrates_20260330_deployment_validation_rollup.md`
- `docs/md_progress_socrates.md`
- `docs/md_progress_socrates_20260329_transfer_evidence_parent_followup_smoke.md`

---

## 3. 测试前准备

### 账号准备

- [ ] 普通学生账号
- [ ] 已绑定家长关系的学生账号
- [ ] 家长账号
- [ ] 可安全写入订单的测试账号

### 测试数据准备

- [ ] 可用优惠码，例如 `WELCOME10`
- [ ] 可用套餐编码，例如 `pro_monthly`
- [ ] 测试数据可重复使用或可清理
- [ ] 支付测试不会影响真实用户

### 结论记录约定

- [ ] 每发现一个问题都记录完整信息
- [ ] 若只在自定义域名复现，单独标记域名链路问题
- [ ] 若 alias 也复现，再判定为应用问题

---

## 4. 执行顺序总览

1. 先做环境与部署基线检查。
2. 再做主域名与 alias 对比。
3. 再跑自动 smoke。
4. 再测登录与身份流。
5. 再测学生完整主链路。
6. 再测家长完整主链路。
7. 再测订阅、支付、优惠码。
8. 最后补测通知、积分、报告、周报、社区与扩展。

---

## 5. 环境与部署基线

### 必跑命令

```bash
pnpm check:node
pnpm check:env
pnpm check:vercel-links
pnpm --filter @socra/socrates build
pnpm build
```

### 勾选项

- [ ] `pnpm check:node` 通过
- [ ] `pnpm check:env` 通过
- [ ] `pnpm check:vercel-links` 通过
- [ ] `pnpm --filter @socra/socrates build` 通过
- [ ] `pnpm build` 通过
- [ ] 当前 Node 为 `22.x`
- [ ] `apps/socrates` 绑定到 `socra-socrates`
- [ ] 未误绑到重复项目 `socrates`
- [ ] 若构建失败，已先排除本地运行进程占用 `.next`

### 结果判定

- 以上 5 条命令未全部通过，不进入后续业务测试。

---

## 6. 域名与链路判定

### 必跑命令

```bash
pnpm probe:socrates-domain
```

### 勾选项

- [ ] `pnpm probe:socrates-domain` 已执行
- [ ] 自定义域名 GET 正常
- [ ] 自定义域名 POST 正常
- [ ] alias GET 正常
- [ ] alias POST 正常
- [ ] 如主域名异常，已用 alias 做同路径复测

### 判定规则

- 如果 `socrates.socra.cn` 失败但 alias 正常，先记 Cloudflare / DNS / 网络路径问题。
- 如果 alias 也失败，再继续判定为应用或部署问题。

---

## 7. 自动 Smoke

### 标准命令

```bash
pnpm smoke:socrates
pnpm smoke:study-flow
pnpm smoke:transfer-evidence
```

### 勾选项

- [ ] `pnpm smoke:socrates` 通过
- [ ] `pnpm smoke:study-flow` 通过
- [ ] `pnpm smoke:transfer-evidence` 通过
- [ ] 若主域名异常，已切换 alias 重跑 smoke
- [ ] 若 `study/assets` 失败，已先核对 migration 状态
- [ ] 若 `transfer-evidence` 失败，已区分学生闭环失败还是家长跟进失败

### 重点说明

- `transfer-evidence` 已支持家长侧跟进验证，但需要配置可用的 `SMOKE_PARENT_ID`。
- 如果 smoke 只在主域名失败，不直接算应用回归。

---

## 8. 登录与身份流

### 页面与动作

- [ ] `/login` 可正常打开
- [ ] 登录成功，无白屏、无限跳转或明显接口错误
- [ ] `/register` 可正常打开
- [ ] 注册页表单校验正常
- [ ] 注册提交反馈正常
- [ ] `/select-profile` 可正常打开
- [ ] 学生角色选择正常
- [ ] 家长角色选择正常
- [ ] 多角色切换正常
- [ ] 登出后返回正确入口页

---

## 9. 学生侧完整流程

### 9.1 学生入口与工作台

- [ ] `/workspace` 可打开
- [ ] `/dashboard` 可打开
- [ ] `/workbench` 可打开
- [ ] 学生默认入口正确

### 9.2 学习链路

- [ ] `/workbench` 上传题目后可进入学习流程
- [ ] 学科切换正常
- [ ] AI 对话可继续
- [ ] 几何题无明显渲染异常
- [ ] `/study` 可打开
- [ ] `/study/[subject]` 可打开
- [ ] `/study/[subject]/problem` 可打开
- [ ] `/study/[subject]/[module]` 可打开

### 9.3 学习历史与资产

- [ ] `/study/history` 可打开
- [ ] `/study/history/[assetId]` 可打开
- [ ] 学习资产详情可正确展示
- [ ] 学习消息或步骤链路未断裂

### 9.4 错题与诊断

- [ ] `/error-book` 可打开
- [ ] 错题列表可加载
- [ ] `/error-book/[id]` 可打开
- [ ] 错题详情信息完整
- [ ] 诊断相关操作无明显报错

### 9.5 复习与报告

- [ ] `/review` 可看到待复习内容
- [ ] 可开始一次复习
- [ ] `/review/session/[id]` 可完成一次复习
- [ ] 复习完成后状态推进正确
- [ ] `/reports` 可打开
- [ ] 学习报告页无明显接口错误

### 9.6 学习辅助功能

- [ ] `/knowledge` 可打开
- [ ] 知识图谱或知识点列表正常
- [ ] `/style-test` 可打开
- [ ] 学习风格测试可提交
- [ ] `/planner` 可打开
- [ ] 智能规划相关功能可返回结果

### 9.7 学生任务与通知

- [ ] `/my-tasks` 可打开
- [ ] 学生侧可看到家长创建的任务
- [ ] 学生完成任务后状态更新正常
- [ ] `/notifications` 可打开
- [ ] 通知列表可加载
- [ ] 未读数量正确
- [ ] 标记已读生效
- [ ] 通知跳转可达目标页面

### 9.8 学生增长与展示功能

- [ ] `/invite` 可打开
- [ ] 邀请码和统计信息正常
- [ ] 邀请注册链路可用
- [ ] `/achievements` 可打开
- [ ] 成就或等级展示正常
- [ ] `/community` 可打开
- [ ] 帖子列表可加载
- [ ] `/settings` 可打开

---

## 10. 家长侧完整流程

### 10.1 家长入口

- [ ] 家长登录后进入 `/tasks`
- [ ] 不会误落到学生 Dashboard

### 10.2 家庭管理

- [ ] `/family` 可打开
- [ ] 可创建家庭
- [ ] 可搜索孩子
- [ ] 可绑定孩子
- [ ] 可移除孩子
- [ ] 关系变化后页面状态同步正确
- [ ] 相关数据与 `profiles.parent_id` 行为一致

### 10.3 任务链路

- [ ] `/tasks` 可打开
- [ ] 家长可创建任务
- [ ] 学生端可看到任务
- [ ] 学生完成任务后奖励只发一次
- [ ] 重复提交不会重复加奖

### 10.4 家长管控与跟进

- [ ] `/controls` 可打开
- [ ] 家长侧可看到需要跟进的任务或提醒
- [ ] 家长侧通知或文案与实际状态一致

---

## 11. 订阅、支付与优惠码

### 11.1 订阅页

- [ ] `/subscription` 可打开
- [ ] 三档套餐可正常加载
- [ ] 套餐切换联动正常
- [ ] 当前订阅状态展示正确

### 11.2 优惠码

- [ ] 有效优惠码反馈正确
- [ ] 无效优惠码反馈正确
- [ ] 优惠金额与订单金额一致

### 11.3 支付页与订单

- [ ] `/payment` 可打开
- [ ] 套餐切换正常
- [ ] 支付方式切换正常
- [ ] 订单汇总金额正确
- [ ] 可正常创建订单
- [ ] 订单返回数据结构正常

### 11.4 支付完成

- [ ] `/payment/success` 可打开
- [ ] 成功状态展示正确
- [ ] 套餐信息正确
- [ ] 金额信息正确
- [ ] 跳转逻辑正确
- [ ] 支付回调后订阅状态回写到账户

---

## 12. 通知、积分、报告与周报

### 通知

- [ ] 通知 API 无明显 500
- [ ] 通知列表与页面状态一致
- [ ] 已读状态刷新后仍正确

### 积分

- [ ] 积分展示正常
- [ ] 完成任务后积分变化正确
- [ ] 不存在重复加分

### 报告与周报

- [ ] 学习报告页面内容与学习记录一致
- [ ] 家长侧周报列表可加载
- [ ] 当前周可生成周报

---

## 13. 社区与扩展功能

### 社区

- [ ] 社区帖子列表可加载
- [ ] 发帖功能可用
- [ ] 评论功能可用
- [ ] 点赞功能可用
- [ ] 刷新后互动状态一致

### 其他扩展

- [ ] 成就页数据与账户行为基本一致
- [ ] 知识图谱筛选或搜索可用
- [ ] AI 规划结果可稳定返回

---

## 14. API 重点抽检

以下接口不要求逐条手工直接调，但至少要通过页面操作确认没有明显 `500`、没有返回结构错乱、写入后刷新状态一致：

- [ ] `/api/account/profile`
- [ ] `/api/profile/ensure`
- [ ] `/api/error-book`
- [ ] `/api/error-session`
- [ ] `/api/chat`
- [ ] `/api/review/generate`
- [ ] `/api/review/attempt`
- [ ] `/api/notifications`
- [ ] `/api/family`
- [ ] `/api/parent-tasks`
- [ ] `/api/points`
- [ ] `/api/invite`
- [ ] `/api/subscription`
- [ ] `/api/coupon/validate`
- [ ] `/api/payment/create-order`
- [ ] `/api/payment/callback`
- [ ] `/api/weekly-reports`
- [ ] `/api/study/assets`
- [ ] `/api/study/assets/review`

---

## 15. 本轮放行前最低必过集

- [ ] 学生登录并进入 `/workbench`
- [ ] 家长登录并落到 `/tasks`
- [ ] 家长创建家庭并绑定/移除孩子
- [ ] 家长创建任务，学生完成后奖励只发一次
- [ ] `/subscription`、`/payment`、`/payment/success` 主链路可用
- [ ] 优惠码校验与订单金额一致
- [ ] 通知列表与已读更新正常
- [ ] `/review` 或 `/reports` 至少一条学习闭环跑通
- [ ] 三个 smoke 至少在一个可用域名上通过
- [ ] 如果只在 `socrates.socra.cn` 失败而 alias 正常，已单独记为 Cloudflare 问题

---

## 16. 异常记录模板

每发现一个问题，按下面格式记录：

```text
问题标题：

页面路径：
账号角色：
测试环境：
发生域名：

复现步骤：
1.
2.
3.

预期结果：

实际结果：

是否 alias 也复现：

当前机器 / 网络信息：

补充截图 / 日志：
```

---

## 17. 建议你的实际执行方式

1. 先打开这份文档，按章节一路勾选。
2. 每完成一个大模块，就记录一次阶段结论。
3. 发现主域名异常时，立即切 alias 复测，不要在错误环境上反复浪费时间。
4. 如果你愿意，测完后可以把勾选结果和异常记录发我，我再帮你整理成一份测试结论报告。
