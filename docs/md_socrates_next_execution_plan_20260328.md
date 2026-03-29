# Socrates 后续可执行计划
日期: 2026-03-28

## 1. 基线

当前计划以 `2026-03-27 transfer evidence checkpoint` 为基线继续推进，而不是沿用旧的全平台总表。

当前已确认:

- `study-flow smoke` 已通过
- `transfer-evidence smoke` 已通过
- 数学错题闭环后端主链可用
- review hub / notifications 已开始暴露 `真掌握 / 暂时会了 / 缺迁移证据`
- 本地长流程已接入 guard，避免假卡死

当前主线只有一条:

- 先打穿 `数学错题深度闭环 V1`
- 再向其他学科和其他 study 模块扩展

---

## 2. 总目标

把这条链路做成稳定产品能力:

`错题诊断 -> 苏格拉底式追问 -> guided reflection -> review attempt -> 真会/假会判定 -> 关闭/重开 -> 家长协同`

本轮不追求大而全，只追求:

1. 学生看得懂为什么还不能关闭
2. 系统判得清是真会还是假会
3. 家长看得到问题画像和可执行干预动作
4. 这条链路可被 smoke / regression 稳定验证

---

## 3. 优先级

### P0 - 必须先完成

1. 学生 active review flow 补全
2. 家长 summary chain 和 intervention tasks 闭环
3. 状态机、关闭/重开、真假掌握判定统一

### P1 - 在 P0 收口后推进

1. 报告层与热力图层落地
2. 回归体系与工程化收紧

### P2 - 只有数学闭环稳定后才开始

1. 复制到语文、英语
2. 再考虑其他 study 模块

### 暂缓

- 全学科同时铺开
- 大一统 StudySession 重构
- 复杂 BI 报表
- 炫技型热力图视觉
- 大规模 UI 美化

---

## 4. 阶段计划

## 阶段 A - 学生复习链路补全

### 目标

让学生在 active review flow 内直接理解:

- 为什么当前只是 `provisional_mastered`
- 缺的是 `迁移证据` 还是 `间隔稳定性`
- 下一步要做什么才能关闭

### 任务

1. 补 review session 页的状态说明
   - 展示 closure gate
   - 展示 transfer evidence 当前状态
   - 展示 next step
2. 补 completion flow
   - 完成一次 review 后，明确返回当前判定
   - 如果未关闭，明确告诉学生缺什么证据
3. 统一学生侧文案
   - review hub
   - review session
   - error detail
   - notifications
4. 增加回归校验
   - 保证 `provisional_mastered -> mastered_closed` 的页面解释不丢失

### 完成标准

- 学生从复习卡片进入 session 后，不需要猜系统为什么没有关单
- 系统能明确区分:
  - 已稳定掌握
  - 暂时会了
  - 缺迁移证据
  - 缺间隔稳定性
- smoke 通过后，页面状态与接口状态一致

### 验证

- `pnpm socrates:status:local`
- `pnpm smoke:study-flow`
- `pnpm smoke:transfer-evidence`

---

## 阶段 B - 家长问题画像与干预闭环

### 目标

让家长看到的不是汇总数字，而是:

- 最近反复出现的根因
- 真会 / 假会比例
- 哪些题卡在迁移证据
- 当前应该如何介入

### 任务

1. parent insights 增加问题画像
   - root-cause distribution
   - pseudo-mastery vs true mastery ratio
   - transfer-evidence gap visibility
2. parent tasks 与 review risk 绑定
   - 每个干预任务要有来源
   - 每个任务要有建议动作
   - 每个任务要有闭环状态
3. 干预反馈回流
   - 家长完成干预后，系统能记录
   - 干预状态可进入 review 风险视图
4. 统一 parent controls / tasks / insights 三处口径

### 完成标准

- 家长页可以回答三个问题:
  - 孩子卡在哪
  - 为什么卡
  - 家长应该做什么
- parent task 不再只是提醒，而是与具体 mastery risk 绑定
- 干预完成后，状态能回流到学生 mastery 链路

### 验证

- `pnpm --filter @socra/socrates exec tsc --noEmit`
- 必要时补对应 smoke 或 regression case

---

## 阶段 C - 判定规则与状态机统一

### 目标

把当前已有字段真正收拢成一套稳定规则，避免页面和接口各说各话。

### 任务

1. 固化状态机
   - `new`
   - `diagnosed`
   - `guided`
   - `scheduled`
   - `review_due`
   - `provisional_mastered`
   - `mastered_closed`
   - `reopened`
2. 统一判定输入
   - `independent_first`
   - `asked_ai`
   - `ai_hint_count`
   - `solved_correctly`
   - `explained_correctly`
   - `variant_passed`
   - `duration_seconds`
   - `confidence_score`
3. 统一判定输出
   - `not_mastered`
   - `assisted_correct`
   - `explanation_gap`
   - `pseudo_mastery`
   - `provisional_mastered`
   - `mastered`
4. 统一关闭 / 重开规则
   - 同类题再次出错
   - 家长复核失败
   - 变式题失败
   - 证据不足
5. 对齐使用方
   - review schedule API
   - review hub
   - error book
   - notifications
   - parent insights

### 完成标准

- 任一状态变化都有证据字段支撑
- 不再出现“做对一次就误判为真掌握”
- 通知、列表页、详情页、家长页状态一致

### 验证

- `pnpm --filter @socra/socrates exec tsc --noEmit`
- `pnpm smoke:transfer-evidence`

---

## 阶段 D - 报告层与热力图层

### 目标

让闭环结果沉淀到报告层，但只做有决策意义的版本。

### 任务

1. study / weekly report 接入以下指标
   - root cause trend
   - pseudo-mastery ratio
   - transfer-evidence gap trend
2. 定义热力图指标
   - 横轴是什么
   - 纵轴是什么
   - 热度分怎么算
   - 红点对应什么行动
3. 输出面向家长的解释文案
   - 不只告诉家长哪里热
   - 要告诉家长为什么热、怎么处理

### 完成标准

- 报告层能支持家长行动，不是装饰性图表
- 每个风险点都能落到具体问题类型和建议动作

---

## 阶段 E - 工程化与回归体系

### 目标

让这条主线可持续迭代，不再被本地流程和隐性回归反复打断。

### 任务

1. 解决本机 git checkpoint 问题
   - 清理 `.git/index.lock` 权限阻塞
   - 恢复正常提交能力
2. 收紧回归入口
   - `study-flow smoke`
   - `transfer-evidence smoke`
   - 相关 regression profile
3. 固化异常保护
   - migration 缺失时明确失败
   - 本地启动以 HTTP health 为准
   - 长流程统一 guard
4. 补必要验证
   - API 级别
   - TS 类型级别
   - smoke 级别

### 完成标准

- 主链改动可以通过固定命令验证
- 本地假卡死不再反复干扰开发
- 缺 migration / 变式判题 / review closure 等关键点有固定回归

---

## 阶段 F - 横向扩展

### 前提

- 数学闭环稳定
- 状态机不再频繁改动
- 学生侧和家长侧都已有可靠解释链路

### 任务

1. 复制数据模型与判定框架到其他学科
2. 按学科定制 taxonomy / prompt / 追问方式
3. 先语文，再英语，再其他模块

### 完成标准

- 扩的是闭环能力，而不是简单复制 math 页面

---

## 5. 最近两周执行排期

## 第 1 周

### 必做

1. 完成阶段 A
2. 对齐 review session / completion flow / review hub 状态解释
3. 跑通以下验证:
   - `pnpm socrates:status:local`
   - `pnpm smoke:study-flow`
   - `pnpm smoke:transfer-evidence`

### 产出

- 学生侧 active review flow 可解释
- 当前 closure gate 全部可见
- 页面与接口状态一致

## 第 2 周

### 必做

1. 启动阶段 B
2. 打通 parent insights -> parent tasks -> intervention feedback
3. 收紧阶段 C 中最容易分叉的状态字段

### 产出

- 家长问题画像基础版
- 家长干预任务闭环基础版
- 真假掌握和迁移证据状态口径统一

---

## 6. 风险与依赖

### 关键风险

1. 本机 Windows 权限问题仍可能阻塞 checkpoint 提交
2. Supabase 目标环境如果缺 migration，会影响 review loop 和 smoke
3. 页面口径先改、接口口径没改，会导致状态不一致
4. 过早扩学科会打散当前主线

### 控制策略

1. 先做数学主链，不并行扩科
2. 每个阶段都配最小验证集
3. 状态字段改动必须同步检查:
   - API
   - 页面
   - smoke
   - notifications
   - parent views

---

## 7. 立即执行清单

下一个开发周期直接按下面顺序推进:

1. 完成学生 review session 内的 provisional 说明和 next-step 解释
2. 完成 completion flow 的 closure gate 展示
3. 跑 `study-flow smoke` 与 `transfer-evidence smoke`
4. 再进入 parent insights / parent tasks 闭环
5. 最后统一状态机和判定规则的使用方

---

## 8. 完成判定

本轮计划真正完成，不以“代码写了”为准，而以下列结果为准:

1. 学生知道为什么还没关闭
2. 家长知道为什么要介入、该怎么介入
3. 系统能稳定区分真会、假会、缺迁移证据
4. smoke / regression 可以重复验证这条链路

