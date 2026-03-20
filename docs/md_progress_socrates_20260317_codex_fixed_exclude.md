# Socrates `.codex-fixed` 备份文件隔离进度
日期: 2026-03-17

## 本次完成

- 在 `apps/socrates/tsconfig.json` 中为备份恢复文件补充排除规则:
  - `**/*.codex-fixed.ts`
  - `**/*.codex-fixed.tsx`
- 目标是把 `apps/socrates/app/**` 与 `apps/socrates/components/**` 下残留的 `.codex-fixed` 恢复文件从 TypeScript 输入集合中隔离出去
- 没有删除任何 `.codex-fixed` 文件，也没有修改这些备份文件内容

## 当前效果

- 活跃源码继续由正常路径参与 `tsc`
- 备份恢复文件不再依赖 wrapper / alias 才能“顺带编过”
- 后续即使这些备份文件继续留在仓库里，也不会再干扰 `apps/socrates` 的类型检查信号

## 验证

- 通过:
  - `pnpm --dir 'D:\\github\\Socrates_ analysis\\socra-platform' exec tsc --noEmit -p 'apps\\socrates\\tsconfig.json'`
- 构建尝试:
  - `pnpm --dir 'D:\\github\\Socrates_ analysis\\socra-platform' --filter @socra/socrates build`
  - 失败原因与上一阶段一致，仍是本地 `.next\\app-path-routes-manifest.json` 的 `EPERM unlink`
  - 当前没有证据表明这与 `.codex-fixed` 排除规则相关，更像是本地构建目录被占用

## 备注

- 仓库根目录下的 `.codex-fix-study-*.tsx` 仍未处理
- 它们不在 `apps/socrates/tsconfig.json` 的当前扫描范围内，因此本轮未额外改动
- 本机 Node 仍为 `v22.19.0`
- 仓库期望 Node 仍为 `20.x`
