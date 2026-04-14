# Socrates 阶段切换与新阶段启动点

- 日期：2026-04-14
- 状态：current resume baseline
- 目的：把 2026-04-12 之后的几何收口、prompt 收口、polish 分支整理成一个可继续执行的当前入口

## 已确认的最新节点

当前不应再把项目停留点定义为“几何识别收口中”。

基于当前仓库与文档，最新节点应定义为：

- `Geometry Wave 1` 已基本通过，可视为当前稳定基线
- 后续几何问题改为“带样例再修”，不再继续做无样例微调
- 开发重心转入：
  - 待确认的提示词优化收尾项
  - 已完成链路的统一回归
  - 产品收尾与部署后细节调整

## Git 基线判断

当前 `main` 分支可见的最近相关提交链：

- `ab40387` `feat(socrates): harden geometry recovery and gate`
- `4c4bb67` `fix(socrates): complete missing geometry lines for rendering`
- `613f243` `fix(socrates): recover missing C point in coordinate geometry`
- `55f5f9f` `docs(socrates): add coordinate geometry regression baseline`
- `57e1614` `docs(socrates): outline next-wave geometry priorities`
- `19535d5` `docs(socrates): add wave1 geometry regression pack`

同时，当前 worktree 中还有比 `HEAD` 更新但尚未提交的文档判断：

- staged modified: `docs/md_socrates_20260413_geometry_next_wave_plan.md`
- staged new: `docs/md_socrates_20260414_geometry_wave1_pass_checkpoint.md`

因此，当前继续推进时应以“4 月 14 日 Wave 1 基本通过记录”作为最新产品判断，而不是只看 `HEAD` 的 4 月 13 日文档状态。

## 当前阶段结论

### 1. 几何链路

几何链路当前应视为“已收口到稳定基线”，而不是“继续扩 Wave 2”。

已经被明确记为通过或固化的能力：

- 非几何题误触发拦截
- 几何识别失败时保留上一版图形
- 低置信度 / `unknown` / `error` 状态可操作化
- 坐标系中的反比例函数 + 几何组合题 `C` 点恢复
- 缺线场景下的自动补线

当前建议：

- 冻结 `Geometry Wave 1`
- 若再出现几何问题，必须附题图 / OCR / 失败截图后再修
- 不再做无样例规则猜测式优化

### 2. Prompt 主链

Prompt 主链不是“待启动”，而是已经完成过一轮主链收口。

当前可确认的已完成事项：

- main chat prompt chain 已做过两轮收紧
- repeated-confusion 分支已补齐
- mock fallback 已对齐当前主链规则
- chat session boundary 已补强

当前判断：

- 不应再把下一阶段定义成“从零开始改 prompt”
- 更准确的说法是：在已完成的主链 prompt checkpoint 之上，只处理剩余待确认项与统一回归

### 3. Model whitelist / 默认模型收口

文档记录显示该部分已经完成 first-pass checkpoint：

- `chat -> qwen-turbo`
- `vision -> qwen-vl`
- `reasoning -> qwen-plus`

这部分应视为当前 polish 基线的一部分，不必重新开题。

## 新阶段定义

建议把当前新阶段命名为：

`Prompt Pending Items + Unified Regression + Product Polish`

对应目标：

1. 保持几何 `Wave 1` 冻结，不再扩散
2. 只在现有 prompt 主链 checkpoint 之上推进剩余待确认项
3. 把已完成链路沉淀成回归基线
4. 收口本轮分叉文档与部署后细节

## 新阶段边界

### 纳入

- 主对话 prompt 的剩余确认项
- 已完成 prompt 链路的统一回归
- 几何稳定基线文档沉淀
- 产品收尾与部署后细节修整

### 不纳入

- `apps/socrates/app/api/geometry/route.ts` 的新一轮无样例扩写
- `apps/socrates/app/api/ocr/route.ts` 的 prompt 扩改
- 并行开启新的功能面
- 重新打开已经通过的 `Geometry Wave 1` 题型做泛化微调

## 建议执行顺序

### P1. 冻结几何基线

- 以 `docs/md_socrates_20260414_geometry_wave1_pass_checkpoint.md` 作为当前几何稳定版本判断
- 将后续几何修复规则改成“有样例再修”
- 保留现有几何专项回归包作为门槛，不再继续空跑优化

### P2. 收束 prompt 待确认项

- 以已完成的主链 prompt checkpoint 为基线继续
- 不重新打开 OCR / geometry parse prompt
- 若继续 prompt 调整，只做用户已确认范围内的主对话细化

### P3. 做统一回归

- 对已通过链路做一次统一回归口径收束
- 避免继续把几何、prompt、model whitelist、chat session 等分散成多个独立小分叉
- 把“当前稳定的是什么”明确下来，方便后续继续实现或 checkpoint

### P4. 做产品收尾

- 整理仍停留在 worktree 的文档更新
- 压缩 remaining polish
- 只处理真正影响当前体验一致性的细节

## 当前恢复入口

如果现在直接继续做下一阶段，建议从以下入口开始：

1. `docs/md_socrates_20260414_geometry_wave1_pass_checkpoint.md`
2. `docs/md_socrates_20260413_geometry_next_wave_plan.md`
3. `docs/md_socrates_20260413_prompt_alignment_checkpoint.md`
4. `docs/md_socrates_20260413_model_whitelist_checkpoint.md`
5. `docs/md_socrates_post_preview_polish_plan_20260412.md`

## 文档注意事项

- `docs/md_progress_socrates.md` 目前存在历史编码损坏，不能再单独作为“当前最新节点”的可靠入口
- 当前最新判断应优先以 2026-04-13 / 2026-04-14 的专项文档和当前 `git` 状态为准

## 当前一句话结论

Socrates 当前应从“几何 Wave 1 已冻结为稳定基线，转入 prompt 剩余确认项 + 统一回归 + 产品收尾阶段”继续推进。
