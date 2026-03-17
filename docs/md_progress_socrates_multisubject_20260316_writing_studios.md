# Socrates 多学科阶段补充记录
日期: 2026-03-16

## 本次新增

- `/study/chinese/composition-idea` 新增语文写作思路工作台
- `/study/chinese/composition-review` 在 Essay 桥接之外新增作文草稿预批改工作台
- `/study/english/writing-idea` 新增英语写作提纲工作台
- `/study/english/writing-review` 新增英语作文批改工作台
- `QuestionType` 补齐 `listening` 类型，避免英语听力模块后续接入时再补类型缺口

## 这次实现的边界

- 不改数学 `workbench` 主流程
- 不改数学几何识别和图形解析核心
- 不打断既有错题、复习、导出、Essay 桥接闭环
- 这次优先做“模块可用”，不一次性重构统一学习会话模型

## 当前可直接使用的模块

### 语文

- 录题分析：继续复用稳定的 `/study/chinese/problem -> workbench`
- 作文批改：保留 Essay 外部工作台，同时补上 Socrates 内部预批改
- 写作思路：已可在模块页直接输入题目和要求，获取立意、结构、素材和开头建议

### 英语

- 录题分析：继续复用稳定的 `/study/english/problem -> workbench`
- 写作思路：已可在模块页直接生成文体判断、时态建议、提纲和高分表达
- 作文批改：已可在模块页直接检查语法、表达、结构和改写建议

## 仍未完成

- 语文阅读理解专属结果页
- 语文基础知识专属结果页
- 英语听力专属工作流
- 统一 StudySession / 模块注册表
- Essay 深度资产与 Socrates 主平台的统一沉淀

## 风险控制

- 数学几何链路未被触碰，手工加点和辅助线能力继续保留
- 新增写作工作台只挂在 `/study` 多学科模块页，不改旧工作流
- 写作工作台先走轻量会话，不直接写入旧错题业务表，避免污染既有数据结构
