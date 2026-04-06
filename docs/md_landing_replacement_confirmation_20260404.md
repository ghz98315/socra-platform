# Landing 替换确认清单

日期：2026-04-04

## 1. 当前结论

- 生产站点继续保留在 `apps/landing`
- 不做 `apps/landingpage -> apps/landing` 的整包替换
- 采用“保留现有风格 + 选择性迁移内容与结构”的方案
- 旧 landing 资料已经先隔离，暂不删除

## 2. 风格约束

以下约束已按要求执行：

- 不改整站整体风格
- 不改书籍阅读页的排版风格
- 不把新导入的 `apps/landingpage` 视觉样式直接覆盖到生产站
- 只做内容迁移、链路收口、信息结构增强、公共壳复用

## 3. 已迁入生产的内容

当前已在 `apps/landing` 内完成并可构建：

### 核心页面

- `/`
- `/about`
- `/start`
- `/pricing`
- `/privacy`
- `/terms`
- `/essays`
- `/essays/[slug]`
- `/book`
- `/book-purchase`
- `/read/[chapterId]`

### 关键能力

- 书籍目录页
- 书籍购买页
- 章节阅读器
- 试读链路
- essays 连载链路
- 首页到文章、书籍、系统的 CTA 收口
- 公共站点头部/页脚复用

### 公共结构

- `apps/landing/components/SiteChrome.tsx`
- `apps/landing/lib/siteContent.ts`

## 4. 已完成的特殊处理

- 已把旧 landing 文档移动到：
  `docs/archive/landing_legacy_20260404/`
- 已把旧 `apps/landing` 代码快照导出到：
  `docs/archive/landing_legacy_20260404/code_snapshot/`
- 已保留归档说明：
  - `docs/archive/landing_legacy_20260404/README.md`
  - `docs/archive/landing_legacy_20260404/CODE_SNAPSHOT_MANIFEST.md`
- 已修正 `apps/landingpage` 参考数据中的章节错位问题：
  - 原 `ch7` 实际是尾声内容
  - 迁移时未盲拷
  - 已按正确语义放入 `epilogue`

## 5. 当前验证状态

已多次执行并通过：

- `pnpm --filter @socra/landing build`

当前状态说明：

- 构建通过
- 主要静态路由可生成
- 阅读页、文章页、书籍页、购买页均已纳入生产 app
- provider 测试仍按你的要求暂缓，不作为当前上线阻塞项

## 6. 已隔离但暂不删除的内容

以下内容目前仍保留，用作回溯与保险，不应立即删除：

- `docs/archive/landing_legacy_20260404/`

其中：

- `docs/archive/landing_legacy_20260404/` 建议长期保留

## 7. 确认后可删除的候选项

当你明确确认“新方案就是生产最终方案”后，可进入删除阶段。

当前状态更新：

- `apps/landingpage/` 已于 2026-04-04 执行删除
- 删除后已重新验证 `pnpm --filter @socra/landing build` 通过

### 第一批可删候选

- `apps/landingpage/`（已删除）

删除理由：

- 其职责已经被 `apps/landing` 接管
- 继续保留会造成双实现并存
- 容易引发后续误改到参考项目而不是生产项目

### 第二批可清理候选

以下根目录旧 landing 文档已实际转入 archive，可继续保持删除状态：

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

说明：

- 这些文档的归档副本已经存在于 `docs/archive/landing_legacy_20260404/`
- 删除根目录副本不会丢失历史资料

## 8. 不建议删除的内容

- `docs/archive/landing_legacy_20260404/`
- 当前生产使用中的 `apps/landing/`
- 与 landing 无关的其他用户改动文件

## 9. 进入删除阶段前的最后确认项

建议删除前只确认这 4 点：

1. `apps/landing` 已经是唯一生产 landing 实现
2. 当前页面风格、书籍阅读风格与你预期一致
3. `apps/landingpage` 已删除，不再作为继续迁移的参考源
4. 旧文档只保留 archive，不再回退到根目录

## 10. 下一步建议

下一步建议：

1. 继续保留 `docs/archive/landing_legacy_20260404/` 作为历史归档
2. 后续如果需要，可再整理一次 landing 相关未提交变更，准备提交或部署
