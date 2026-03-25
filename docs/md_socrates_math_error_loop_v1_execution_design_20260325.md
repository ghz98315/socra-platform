# Socrates 数学错题深度闭环 V1 执行设计
日期: 2026-03-25

## 1. 执行原则

本轮只做一件事:

- 单点打深 `数学错题深度闭环`

执行原则:

1. 先挖深，再拓宽
2. `粗心` 只能当表象，不能当最终根因
3. 每个状态变化都要有证据
4. 不做“完成了就算会了”的假闭环
5. 家长看到的必须是可行动信息，不是数据堆砌

---

## 2. 本轮范围

### 2.1 包含

- 数学错题根因结构化
- 5 Why 追问链
- 苏格拉底式追问流程
- 学生自我总结
- 复习尝试记录
- 真会 / 假会判定
- 关闭 / 重开
- 家长问题画像基础版

### 2.2 不包含

- 语文、英语推广
- 大一统 StudySession 改造
- 复杂 BI 报表
- 炫技式热力图视觉
- 大规模 UI 美化

---

## 3. 根因归类设计

## 3.1 三层结构

### A. 表象层

只记录学生最直观的感受:

- 粗心
- 看错题
- 漏条件
- 算错
- 忘公式
- 太急了
- 不会下手

注意:

- 这一层不能直接作为最终结论

### B. 近因层

描述本次错误更接近操作层的原因:

- 审题时没有圈关键信息
- 草稿没有分栏，符号抄错
- 解题时跳步
- 没做单位/符号检查
- 公式知道，但套用条件错
- 会一种套路，遇到变式就不会
- 时间分配失衡，后半段仓促

### C. 根因层

描述稳定存在、会反复制造错误的模式:

- 知识点表征不牢
- 概念边界混淆
- 解题策略单一
- 缺少固定检查习惯
- 草稿管理习惯差
- 注意力容易漂移
- 一遇到复杂题就焦虑抢进度
- 依赖提示，未形成独立提取条件的能力

## 3.2 根因分类建议

建议最终根因分类限定为以下主类:

- `knowledge_gap`
  - 知识点缺失
- `concept_confusion`
  - 概念混淆
- `problem_reading`
  - 审题偏差
- `calculation_execution`
  - 计算执行问题
- `strategy_gap`
  - 解题策略问题
- `habit_issue`
  - 行为习惯问题
- `attention_emotion`
  - 注意力 / 情绪问题
- `pseudo_mastery`
  - 假会，依赖记忆或提示

## 3.3 “粗心”处理规则

系统规则:

1. 如果学生说“我就是粗心”
2. 系统不能结束
3. 必须继续追问至少 2 层
4. 最终要落到上述主类之一

例子:

- 表象: 粗心
- 近因: 审题时漏看“求最简整数比”
- 根因: 没有形成“圈条件-划问题-复核单位”的固定习惯
- 分类: `habit_issue`

再例如:

- 表象: 粗心算错
- 近因: 括号展开时漏乘负号
- 根因: 符号运算规则并未真正内化，只是凭感觉做
- 分类: `concept_confusion`

所以:

- 粗心是结果
- 不是结论

---

## 4. 5 Why 追问协议

## 4.1 输出结构

建议结构:

```json
{
  "surface_labels": ["粗心", "漏条件"],
  "surface_error": "列方程时漏掉了题目中的限制条件",
  "why_chain": [
    {
      "level": 1,
      "question": "你当时为什么会漏掉这个条件？",
      "answer": "我急着列式，没有回头检查题目。"
    },
    {
      "level": 2,
      "question": "为什么会急着列式？",
      "answer": "我觉得这题很简单，想直接做。"
    },
    {
      "level": 3,
      "question": "为什么简单题也容易直接上手？",
      "answer": "我平时没有先圈条件的习惯。"
    }
  ],
  "root_cause_category": "habit_issue",
  "root_cause_statement": "缺少固定的审题检查习惯，导致简单题更容易跳过条件核对。",
  "root_cause_depth": 3,
  "evidence": [
    "题目条件未进入列式",
    "学生自述直接上手不检查",
    "错误模式与审题习惯相关"
  ],
  "fix_actions": [
    "先圈条件",
    "列式前口头复述要求",
    "做完后核对题目问的是什么"
  ]
}
```

## 4.2 对话规则

一轮追问最多 4 步:

1. 还原当时怎么想
2. 找哪一步没有证据
3. 找造成这一步的习惯或策略问题
4. 形成下次可执行的自检动作

AI 禁止:

- 直接替学生总结全部答案
- 还没弄清根因就进入安慰模式
- 用“以后认真点”这类空话收尾

---

## 5. 状态机设计

建议状态:

- `new`
- `diagnosed`
- `guided`
- `scheduled`
- `review_due`
- `provisional_mastered`
- `mastered_closed`
- `reopened`

状态说明:

- `new`
  - 新进入系统
- `diagnosed`
  - 已完成结构化根因诊断
- `guided`
  - 已完成苏格拉底式引导与学生总结
- `scheduled`
  - 已进入复习计划
- `review_due`
  - 到达复习时间
- `provisional_mastered`
  - 本轮独立做对，但还不足以关闭
- `mastered_closed`
  - 达到稳定掌握标准
- `reopened`
  - 关闭后再次暴露问题

---

## 6. 真会 / 假会判定逻辑

## 6.1 判定输入

每次复习至少记录:

- 是否先独立作答
- 是否向 AI 求助
- AI 提示次数
- 是否最终做对
- 是否能复述思路
- 是否通过变式题
- 作答耗时
- 自信度

## 6.2 判定规则

### 真会候选

满足:

- 独立作答
- 未向 AI 求助
- 原题做对
- 能复述思路

### 真会

满足:

- 连续 2 次间隔复习达到“真会候选”
- 或 1 次原题 + 1 次变式题都独立通过

### 假会

任一满足即判定:

- 需要 AI 提示后才做对
- 做对但解释不清
- 原题会，变式不会
- 耗时明显异常
- 自信度和实际结果严重不一致

### 关闭

只有达到 `真会` 才能进入 `mastered_closed`

### 重开

任一满足:

- 同类题再次出错
- 家长复核认为并未掌握
- 系统发现变式题失败

---

## 7. 数据表设计

## 7.1 新表: `error_diagnoses`

字段建议:

- `id`
- `session_id`
- `student_id`
- `subject`
- `surface_labels` JSONB
- `surface_error`
- `root_cause_category`
- `root_cause_statement`
- `root_cause_depth`
- `why_chain` JSONB
- `evidence` JSONB
- `fix_actions` JSONB
- `knowledge_tags` JSONB
- `habit_tags` JSONB
- `risk_flags` JSONB
- `created_at`
- `updated_at`

## 7.2 新表: `review_attempts`

字段建议:

- `id`
- `review_id`
- `session_id`
- `student_id`
- `attempt_no`
- `attempt_mode`
- `independent_first`
- `asked_ai`
- `ai_hint_count`
- `solved_correctly`
- `explained_correctly`
- `confidence_score`
- `duration_seconds`
- `variant_passed`
- `mastery_judgement`
- `notes`
- `created_at`

## 7.3 现有表扩展

`review_schedule`

- `mastery_state`
- `last_attempt_id`
- `last_judgement`
- `close_reason`
- `reopened_count`
- `next_interval_days`

`error_sessions`

- `primary_root_cause_category`
- `primary_root_cause_statement`
- `closure_state`

---

## 8. API 设计

建议新增或调整以下 API:

### 8.1 `POST /api/error-session/diagnose`

作用:

- 生成结构化根因诊断

输入:

- `session_id`
- `student_id`
- `messages`
- `subject`

输出:

- `error_diagnosis`

### 8.2 `POST /api/error-session/guided-reflection`

作用:

- 驱动苏格拉底式追问流程

输入:

- `session_id`
- `student_id`
- `current_step`
- `student_answer`

输出:

- `assistant_question`
- `updated_why_chain`
- `is_ready_to_summarize`

### 8.3 `POST /api/review/attempt`

作用:

- 提交一次复习尝试

输入:

- `review_id`
- `student_id`
- `independent_first`
- `asked_ai`
- `ai_hint_count`
- `solved_correctly`
- `explained_correctly`
- `confidence_score`
- `duration_seconds`
- `variant_passed`

输出:

- `mastery_judgement`
- `mastery_state`
- `next_review_at`
- `closed`
- `reopened`

### 8.4 `GET /api/parent/insights`

作用:

- 返回家长问题画像

输出建议:

- top root causes
- repeated weak points
- pseudo-mastery count
- conversation risks
- parent action suggestions

---

## 9. 页面设计

## 9.1 学生端

### 页面 A: 数学错题诊断页

必须包含:

- 表象问题
- 根因分类
- 5 Why 链路
- 本题对应知识点
- 下次防错 checklist

### 页面 B: 苏格拉底式反思页

必须包含:

- 当前只问一个问题
- 学生回答区
- 过程可回看
- 最后形成“我的总结”

### 页面 C: 复习判定页

流程建议:

1. 先独立作答
2. 记录结果
3. 如需要再开放 AI
4. 最后要求复述思路
5. 系统判定真会 / 假会

## 9.2 家长端

### 页面 D: 孩子问题画像卡

至少显示:

- 当前最主要的 3 个根因
- 最近反复出现的知识点
- 真会 / 假会占比
- 是否存在沟通风险
- 家长建议怎么协助

---

## 10. 热力图逻辑

第一版不先做复杂视觉，先做清楚逻辑。

建议第一版选:

- `知识点 x 根因类别`

热度分数建议:

```text
heat_score =
  复发次数 * 3
  + 最近7天出现次数 * 2
  + 假会次数 * 3
  + 逾期复习次数 * 2
  + reopened 次数 * 4
```

用途:

- 给学生看哪里总出问题
- 给家长看问题不是偶发，而是有模式
- 给系统决定后续优先复习项

---

## 11. 家长提醒设计

## 11.1 先做的提醒类型

- `conversation_risk`
  - 摆烂
  - 强烈挫败
  - 自我否定
  - 明显逃避
- `mastery_risk`
  - 多次假会
  - 反复 reopen
- `learning_risk`
  - 同一根因高频复发

## 11.2 推送内容格式

不要只推原话。

建议格式:

- 风险类型
- 触发原因
- 影响说明
- 家长建议说法

示例:

- 风险: 自我否定
- 信号: 学生连续表达“我就是学不会”
- 建议: 先肯定努力，再帮孩子回顾这次其实已经掌握了哪一步，不要直接批评结果

---

## 12. 开发顺序

严格按以下顺序推进:

1. 数据模型
2. 状态机
3. 根因诊断 API
4. 苏格拉底追问 API
5. 学生端诊断页
6. 复习尝试与判定 API
7. 学生端复习判定页
8. 家长问题画像 API
9. 家长端问题画像页

---

## 13. 第一批验收用例

V1 至少验证以下场景:

1. 学生说“我就是粗心”
   - 系统不能停止
   - 必须继续追到行为层或策略层

2. 学生独立做对原题，但解释不清
   - 不能关闭
   - 应判定为假会或未稳固

3. 学生原题会，变式不会
   - 不能关闭

4. 学生连续两次独立做对且能解释
   - 可以关闭

5. 关闭后同类题再次出错
   - 自动重开

6. 家长看到的数据不是“粗心”
   - 而是“缺少固定审题习惯”或“概念边界混淆”等可干预结论

---

## 14. 下一步

本轮如果继续推进实现，建议直接从下面开始:

1. 先落数据库 migration
2. 再落 `error_diagnoses` 与 `review_attempts` API
3. 再做学生端数学错题诊断页

