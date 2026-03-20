# Socrates 2026-03-17 清理阶段汇总
日期: 2026-03-17

## 阶段结论

- `study / history / detail / reports / review` 的活跃链路已经稳定落到 V2 / clean 实现
- 遗留兼容层已按从外到内的顺序完成收口:
  - 旧入口文件压缩为 wrapper
  - `tsconfig` legacy alias 移除
  - V2 文件中的旧名字兼容导出移除
  - `.codex-fixed` 备份文件从 `apps/socrates` 的 `tsc` 输入集合中排除
- Codex 恢复临时文件已纳入 `.gitignore`，避免继续污染 `git status`

## 当日分阶段产出

- `md_progress_socrates_20260317_chinese_result_summary_clean.md`
- `md_progress_socrates_20260317_english_study_workbench_clean.md`
- `md_progress_socrates_20260317_study_bridge_clean.md`
- `md_progress_socrates_20260317_legacy_wrapper_cleanup.md`
- `md_progress_socrates_20260317_legacy_alias_remove.md`
- `md_progress_socrates_20260317_v2_compat_export_remove.md`
- `md_progress_socrates_20260317_codex_fixed_exclude.md`

## 当前风险与阻塞

- 本机 Node 仍为 `v22.19.0`，仓库期望 `20.x`
- 本地 `@socra/socrates build` 仍被 `.next\\app-path-routes-manifest.json` 的 `EPERM unlink` 阻塞
- 当前主机访问 `https://socrates.socra.cn` 时出现 TLS 握手失败，因此本轮无法稳定补齐线上 smoke 快照

## 对当前代码状态的判断

- 代码层面的 legacy 收口已基本完成，剩余主要是环境治理，而不是 study 业务链路继续返工
- 如果后续需要继续收尾，优先级应为:
  - 切换到 Node 20.x
  - 停掉占用 `apps/socrates/.next` 的本地进程后重跑 build
  - 在网络恢复后重跑 `smoke:socrates` 与 `smoke:study-flow`

## 备注

- 本轮没有删除任何用户恢复文件，只做了忽略、隔离和文档同步
- 仓库根目录的 `.codex-fix-study-*.tsx` 仍然保留为本地恢复材料，但现在不会继续干扰版本控制视图
