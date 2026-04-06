# landing legacy archive

归档日期：2026-04-04

这里封存的是旧 landing 方案的两类资料：

- 文档资料：2026-04-01 这一轮 landing 方案相关 PRD、结构稿、线框稿、执行记录。
- 实现资料：迁移改写前 `apps/landing` 的 Git 基线代码快照。

归档目的：

- 将旧 landing 方案与当前 `apps/landingpage -> apps/landing` 迁移工作彻底隔离，避免继续混用。
- 保留历史决策、信息架构、页面规格和旧实现基线，便于后续核对、回滚和最终删除前复查。

当前状态：

- 已封存，不删除。
- 当前有效实现以 `apps/landing` 的现行迁移结果为准。
- 旧 landing 文档已移出主 `docs/` 目录。
- 旧 landing 实现快照位于 `docs/archive/landing_legacy_20260404/code_snapshot/`。

删除门槛：

- 只有在新 landing 方案完成迁移、通过构建和线上人工确认后，才允许删除旧 landing 资料。
- 在此之前，本目录作为唯一旧方案归档保留。

补充说明：

- 代码快照来源提交见 `CODE_SNAPSHOT_MANIFEST.md`。
- 本次快照保留文本类源文件；`apps/landing/public/logo.png` 这类未变更静态资源不重复归档。
