# Landing 删除执行清单

日期：2026-04-04

用途：

- 本清单只用于删除阶段执行
- 删除已执行完成
- 删除前必须先以 `md_landing_replacement_confirmation_20260404.md` 为准完成确认

## 1. 删除目标

### 立即删除目标

- `apps/landingpage/`（已于 2026-04-04 删除）

### 已完成归档，无需恢复的旧文档

以下文件保持删除状态即可，不需要从 archive 再移回根目录：

- `docs/md_landing_cn_geo_engine_matrix_20260401.md`
- `docs/md_landing_cn_localization_20260401.md`
- `docs/md_landing_copy_framework_20260401_v1.md`
- `docs/md_landing_dev_execution_plan_20260401.md`
- `docs/md_landing_essay_ia_20260401_v1.md`
- `docs/md_landing_final_page_spec_20260401.md`
- `docs/md_landing_growth_spec_20260401.md`
- `docs/md_landing_homepage_book_style_refresh_20260401.md`
- `docs/md_landing_organic_growth_engine_20260401.md`
- `docs/md_landing_prd_20260401.md`
- `docs/md_landing_priority_materials_20260401.md`
- `docs/md_landing_simplification_direction_20260401.md`
- `docs/md_landing_structure_draft_20260401_v2.md`
- `docs/md_landing_wireframes_ascii_20260401.md`
- `docs/md_progress_landing.md`

## 2. 保留目标

以下内容删除阶段不得触碰：

- `apps/landing/`
- `docs/archive/landing_legacy_20260404/`
- 与 landing 无关的其他用户改动

## 3. 删除顺序

建议按以下顺序执行：

1. 先再次确认 `apps/landing` 构建通过
2. 再确认 `docs/archive/landing_legacy_20260404/` 完整存在
3. 删除 `apps/landingpage/`
4. 检查仓库内是否还存在对 `apps/landingpage` 的引用
5. 最后复跑一次 `pnpm --filter @socra/landing build`

## 4. 删除后检查项

删除后至少检查以下内容：

- 首页仍可构建
- `/book`、`/book-purchase`、`/read/[chapterId]` 正常生成
- `/essays` 与 `/essays/[slug]` 正常生成
- 仓库内不存在误指向 `apps/landingpage` 的引用
- archive 目录仍完整保留

## 5. 2026-04-04 扫描结论

删除前已完成一次引用扫描，结果如下：

- `apps/landing` 当前未发现继续依赖 `apps/landingpage` 源码路径
- 根级 `package.json` 未发现显式脚本依赖 `apps/landingpage`
- `pnpm-workspace.yaml` 仅通过 `apps/*` 通配纳入该目录
- 当前仓库中与 `apps/landingpage` 相关的保留引用，主要只剩：
  - 本次确认/删除文档
  - archive 说明文档

因此删除 `apps/landingpage/` 的预期影响是：

- 从 monorepo 中移除一个参考型工作区包
- 不影响当前 `apps/landing` 的生产构建
- 不影响 archive 目录保留

## 6. 执行结果

已执行：

- 删除 `apps/landingpage/`
- 扫描确认目录已不存在
- 复跑 `pnpm --filter @socra/landing build` 成功

## 7. 执行前最后一句确认

只有当以下判断都为“是”时，才进入实际删除：

- 新 landing 方案已经确认
- 当前风格确认无误
- `apps/landingpage/` 不再作为继续迁移参考
- 旧资料只保留 archive 即可
