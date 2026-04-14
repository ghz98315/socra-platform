# Socrates 统一回归基线

- 日期：2026-04-14
- 状态：active regression baseline
- 目的：把当前已稳定的几何、prompt、model whitelist、chat session 行为收成一份统一回归口径，避免后续继续分叉

## 当前统一基线结论

截至当前节点，Socrates 的主线基线应定义为：

1. 几何 `Wave 1` 视为已冻结的稳定基线
2. 主对话 prompt 主链已完成收口，并新增首轮轻量 scaffold
3. model whitelist first pass 已完成
4. `chat / clear-history / mock fallback / session boundary` 已进入统一行为口径

当前不再把这些项视为四条并行探索线，而是视为一套共同回归基线。

## 组成这条基线的主要节点

### 几何基线

- `ab40387` `feat(socrates): harden geometry recovery and gate`
- `4c4bb67` `fix(socrates): complete missing geometry lines for rendering`
- `613f243` `fix(socrates): recover missing C point in coordinate geometry`
- `docs/md_socrates_20260414_geometry_wave1_pass_checkpoint.md`

### Prompt 主链基线

- `d768680` `feat(socrates): align prompt chain and repeated-confusion fallback`
- `7f68056` `feat(socrates): tighten first-turn prompt scaffold`
- `docs/md_socrates_20260413_prompt_alignment_checkpoint.md`
- `docs/md_socrates_20260414_first_turn_prompt_scaffold.md`

### Model whitelist 基线

- `1c222dd` `fix(socrates): include model whitelist config for deploy`
- `23bd12e` `fix(socrates): include prompt builder option types`
- `docs/md_socrates_20260413_model_whitelist_checkpoint.md`

## 当前必须保持稳定的行为

### A. Geometry Wave 1

- 非几何题不应误进几何链
- 几何识别失败时应保留上一版图形
- 低置信度 / `unknown` / `error` 状态仍可继续答题
- 坐标几何复合题中的 `C` 点与缺线补全不应回退

### B. Chat Prompt Main Chain

- 首轮回复应优先轻诊断，而不是长讲解
- 每次回复结尾只保留一个具体问题
- 第一次“看不懂”应缩小当前问题
- 同一步重复“看不懂”应回退一层，而不是重复原问法
- 几何数学题首轮应先看点、线、角、已知关系
- 语文题首轮应先回题干任务与原文定位
- 英语题首轮应先看局部语境和句子结构

### C. Clear-History / Session

- `clear-history` 后应使用当前 active prompt builder，而不是旧 prompt
- 新会话应能重建 system prompt
- `GET / DELETE /api/chat` 兼容 `sessionId` 与 `session_id`
- 缺失 session id 时应自动生成并返回

### D. Model Selection

- `chat -> qwen-turbo`
- `vision -> qwen-vl`
- `reasoning -> qwen-plus`
- 非法或漂移的模型选择应归一化回默认值
- planner optimize 不应漂回 `chat`

## 当前统一回归清单

### 1. 首轮 prompt 结构回归

首轮样例应满足：

- 存在 `first_turn_focus`
- 不注入 `knowledge_base`
- 不注入 `few_shot_examples`

后续轮次样例应满足：

- 不再注入 `first_turn_focus`
- 恢复 `knowledge_base`
- 恢复 `few_shot_examples`

### 2. 主对话行为回归

重点观察：

- math：首问是否先落在已知 / 目标 / 关系
- geometry math：首问是否先落在点线角或关键关系
- chinese：首问是否先回题干关键词 / 原文定位
- english：首问是否先看局部语境 / 题型

### 3. repeated-confusion 回归

重点观察：

- 第一次“看不懂”是否只缩小一步
- 第二次同一步“看不懂”是否回退一层
- 不应退化成长篇讲解

### 4. clear-history / session 回归

重点观察：

- 清空后是否重建为当前 prompt 规则
- 新 session id 是否正常返回
- `sessionId` / `session_id` 双参数是否仍兼容

### 5. Geometry Gate 回归

重点观察：

- 普通非几何题不出现 noisy geometry UI
- 几何题仍可进入当前稳定链路
- 识别失败时不应把整个学习流卡死

### 6. Model whitelist 回归

重点观察：

- settings 只显示白名单模型
- API 不应静默选择已淘汰或未批准模型
- 默认 fallback 应明确且可预测

## 当前不纳入统一回归的内容

- 新一轮 `geometry parse prompt` 扩写
- 新一轮 `OCR_PROMPT / SUBJECT_DETECTION_PROMPT` 扩写
- landing / subscription / account-model 等无关功能面
- 无样例的几何泛化优化

## 当前验证现状

### 已完成

- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`
- 结果：passed

- prompt 离线生成验证
- 结果：
  - 首轮 `math / geometry math / english reading` 已确认走 `first_turn_focus`
  - 非首轮样例已确认恢复 `knowledge_base + few_shot_examples`

### 当前阻塞

本机真实 runtime 回归当前被 Windows 本地启动问题阻塞：

- `pnpm.cmd socrates:start:dev-local` 未进入健康态
- 本地日志显示 `next dev` 触发 `spawn EPERM`

因此，当前统一回归应分成两层理解：

1. 结构回归：已可做
2. 本地在线回归：待本机 local-start 阻塞清除后再补

## 下一步建议

建议继续按这个顺序推进：

1. 以本文件作为当前统一回归基线
2. 后续每次只允许在这条基线之上追加一个小 slice
3. 若需在线回归，优先先清掉本机 `spawn EPERM`
4. 若再修几何，只接受带样例问题，不回到空跑优化

## 当前一句话口径

Socrates 当前已经从“几何收口阶段”转为“统一回归基线阶段”：几何冻结、prompt 主链收紧、模型白名单固定，后续改动必须对这条共同基线负责。
