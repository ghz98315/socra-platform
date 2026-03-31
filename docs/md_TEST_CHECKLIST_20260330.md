# Socrates 完整测试清单

> 适用仓库: `socra-platform`
> 适用应用: `apps/socrates`
> 基线日期: 2026-03-30
> 当前正式域名: `https://socrates.socra.cn`
> 生产 alias: `https://socra-platform.vercel.app`

---

## 1. 使用说明

- 本文档用于本轮完整度测试，不替代主文档
- 发布前检查、数据库迁移、烟测与放行门槛仍以 `docs/md_RELEASE_RUNBOOK.md` 为准
- 最小人工业务验收仍以 `docs/md_TEST_GUIDE.md` 为主入口
- 如果当前机器访问 `socrates.socra.cn` 出现明显异常，请立即用 `https://socra-platform.vercel.app` 复测同一路径
- 如果 alias 正常、自定义域名异常，优先记录为 Cloudflare / DNS / 网络路径问题，不直接判定为应用回归

---

## 2. 测试前准备

### 账号准备

- [ ] 普通学生账号
- [ ] 已绑定家长关系的学生账号
- [ ] 家长账号
- [ ] 可安全写入订单的支付测试账号

### 测试数据准备

- [ ] 有可用优惠码，例如 `WELCOME10`
- [ ] 有可用套餐编码，例如 `pro_monthly`
- [ ] 有可重复使用或可清理的测试数据
- [ ] 支付测试不会影响真实用户数据

### 异常记录字段

每发现一个问题，至少记录：

- [ ] 页面路径
- [ ] 账号角色
- [ ] 复现步骤
- [ ] 预期结果
- [ ] 实际结果
- [ ] 是否只在自定义域名出现
- [ ] 当前网络或机器信息

---

## 3. 环境与部署基线

### 本地校验

- [ ] `pnpm check:node` 通过
- [ ] `pnpm check:env` 通过
- [ ] `pnpm check:vercel-links` 通过
- [ ] `pnpm --filter @socra/socrates build` 通过
- [ ] `pnpm build` 通过

### 结果判定

- [ ] 当前 Node 满足 `22.x`
- [ ] `apps/socrates` 绑定到 `socra-socrates`
- [ ] 未误绑到重复项目 `socrates`
- [ ] 若构建失败，已先排除本地运行进程占用 `.next`

### 域名对比

- [ ] `pnpm probe:socrates-domain` 已执行
- [ ] 自定义域名 GET 正常
- [ ] 自定义域名 POST 正常
- [ ] alias GET 正常
- [ ] alias POST 正常
- [ ] 如主域名异常，已用 alias 做同路径复测

---

## 4. 自动烟测

### 标准 smoke

- [ ] `pnpm smoke:socrates` 通过
- [ ] `pnpm smoke:study-flow` 通过
- [ ] `pnpm smoke:transfer-evidence` 通过

### 扩展确认

- [ ] 如果主域名异常，已切换 alias 重跑 smoke
- [ ] 如果 `study/assets` 失败，已先核对数据库 migration 状态
- [ ] 如果 transfer-evidence 失败，已区分学生闭环失败还是家长跟进失败

---

## 5. 登录与身份流

### 登录注册

- [ ] `/login` 可正常打开
- [ ] 登录成功，无白屏、无限跳转或明显接口错误
- [ ] `/register` 可正常打开
- [ ] 注册页表单校验正常
- [ ] 注册提交反馈正常

### 角色选择与退出

- [ ] `/select-profile` 可正常打开
- [ ] 学生角色选择正常
- [ ] 家长角色选择正常
- [ ] 多角色切换正常
- [ ] 登出后返回正确入口页

---

## 6. 学生侧完整流程

### 学生入口与工作台

- [ ] `/workspace` 可打开
- [ ] `/dashboard` 可打开
- [ ] `/workbench` 可打开
- [ ] 学生默认入口正确

### 学习链路

- [ ] `/workbench` 上传题目后可进入学习流程
- [ ] 学科切换正常
- [ ] AI 对话可继续
- [ ] 几何题无明显渲染异常
- [ ] `/study` 可打开
- [ ] `/study/[subject]` 可打开
- [ ] `/study/[subject]/problem` 可打开
- [ ] `/study/[subject]/[module]` 可打开

### 学习历史与资产

- [ ] `/study/history` 可打开
- [ ] `/study/history/[assetId]` 可打开
- [ ] 学习资产详情可正确展示
- [ ] 学习消息或步骤链路未断裂

### 错题与诊断

- [ ] `/error-book` 可打开
- [ ] 错题列表可加载
- [ ] `/error-book/[id]` 可打开
- [ ] 错题详情信息完整
- [ ] 诊断相关操作无明显报错

### 复习与报告

- [ ] `/review` 可看到待复习内容
- [ ] 可开始一次复习
- [ ] `/review/session/[id]` 可完成一次复习
- [ ] 复习完成后状态推进正确
- [ ] `/reports` 可打开
- [ ] 学习报告页无明显接口错误

### 学习辅助功能

- [ ] `/knowledge` 可打开
- [ ] 知识图谱或知识点列表正常
- [ ] `/style-test` 可打开
- [ ] 学习风格测试可提交
- [ ] `/planner` 可打开
- [ ] 智能规划相关功能可返回结果

### 学生任务与通知

- [ ] `/my-tasks` 可打开
- [ ] 学生侧可看到家长创建的任务
- [ ] 学生完成任务后状态更新正常
- [ ] `/notifications` 可打开
- [ ] 通知列表可加载
- [ ] 未读数量正确
- [ ] 标记已读生效
- [ ] 通知跳转可达目标页面

### 学生增长与展示功能

- [ ] `/invite` 可打开
- [ ] 邀请码和统计信息正常
- [ ] 邀请注册链路可用
- [ ] `/achievements` 可打开
- [ ] 成就或等级展示正常
- [ ] `/community` 可打开
- [ ] 帖子列表可加载
- [ ] `/settings` 可打开

---

## 7. 家长侧完整流程

### 家长入口

- [ ] 家长登录后进入 `/tasks`
- [ ] 不会误落到学生 Dashboard

### 家庭管理

- [ ] `/family` 可打开
- [ ] 可创建家庭
- [ ] 可搜索孩子
- [ ] 可绑定孩子
- [ ] 可移除孩子
- [ ] 关系变化后页面状态同步正确
- [ ] 相关数据与 `profiles.parent_id` 行为一致

### 任务链路

- [ ] `/tasks` 可打开
- [ ] 家长可创建任务
- [ ] 学生端可看到任务
- [ ] 学生完成任务后奖励只发一次
- [ ] 重复提交不会重复加奖

### 家长管控与跟进

- [ ] `/controls` 可打开
- [ ] 家长侧可看到需要跟进的任务或提醒
- [ ] 家长侧通知或文案与实际状态一致

---

## 8. 订阅、支付与优惠码

### 订阅页

- [ ] `/subscription` 可打开
- [ ] 三档套餐可正常加载
- [ ] 套餐切换联动正常
- [ ] 当前订阅状态展示正确

### 优惠码

- [ ] 有效优惠码反馈正确
- [ ] 无效优惠码反馈正确
- [ ] 优惠金额与订单金额一致

### 支付页与订单

- [ ] `/payment` 可打开
- [ ] 套餐切换正常
- [ ] 支付方式切换正常
- [ ] 订单汇总金额正确
- [ ] 可正常创建订单
- [ ] 订单返回数据结构正常

### 支付完成

- [ ] `/payment/success` 可打开
- [ ] 成功状态展示正确
- [ ] 套餐信息正确
- [ ] 金额信息正确
- [ ] 跳转逻辑正确
- [ ] 支付回调后订阅状态回写到账户

---

## 9. 通知、积分、报告与周报

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

## 10. 社区与扩展功能

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

## 11. API 重点抽检

以下接口不要求逐条手工直接调，但至少要通过页面操作确认没有明显 500、没有返回结构错乱、写入后刷新状态一致：

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

## 12. 本轮放行前最小必过集

以下项目建议视为本轮完整度结论的最低门槛：

- [ ] 学生登录并进入 `/workbench`
- [ ] 家长登录并落到 `/tasks`
- [ ] 家长创建家庭并绑定/移除孩子
- [ ] 家长创建任务，学生完成后奖励只发一次
- [ ] `/subscription`、`/payment`、`/payment/success` 主链路可用
- [ ] 优惠码校验与订单金额一致
- [ ] 通知列表与已读更新正常
- [ ] `/review` 或 `/reports` 至少一条学习闭环跑通
- [ ] 三个 smoke 脚本至少在一个可用域名上通过
- [ ] 如果只在 `socrates.socra.cn` 失败而 alias 正常，已单独记录为 Cloudflare 问题

---

## 13. 建议执行顺序

1. 先测环境与部署基线，避免在错误环境上继续浪费时间。
2. 再跑自动 smoke，先判断主链路是不是已经有系统性故障。
3. 然后测登录、学生侧、家长侧主业务流程。
4. 最后补测支付、通知、报告、社区和扩展功能。

---

## 14. 关联主文档

- `docs/md_TEST_GUIDE.md`
- `docs/md_RELEASE_RUNBOOK.md`
- `docs/md_deployment_cn.md`
- `docs/md_socrates_cloudflare_followup_20260329.md`
- `docs/md_progress_socrates_20260330_deployment_validation_rollup.md`
