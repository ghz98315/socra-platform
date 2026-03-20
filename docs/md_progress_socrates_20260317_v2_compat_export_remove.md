# Socrates V2 兼容导出收口进度
日期: 2026-03-17

## 本次完成

- 删除以下 V2 组件文件底部残留的旧名字兼容导出:
  - `apps/socrates/components/study/ChineseAnalysisStudioV2.tsx`
  - `apps/socrates/components/study/EnglishListeningStudioV2.tsx`
  - `apps/socrates/components/study/WritingStudioV2.tsx`
  - `apps/socrates/components/study/StudyResultSummaryV2.tsx`
- 移除的形式为:
  - `export const ChineseAnalysisStudio = ChineseAnalysisStudioV2`
  - `export const EnglishListeningStudio = EnglishListeningStudioV2`
  - `export const WritingStudio = WritingStudioV2`
  - `export const StudyResultSummary = StudyResultSummaryV2`
- 旧名字现在只由同路径 legacy wrapper 文件承接，V2 文件本身只暴露 V2 名称

## 当前效果

- V2 文件职责更单一，避免“新文件继续兼容旧名字”带来的认知噪音
- 旧路径兼容仍然保留，但兼容层被明确压缩在 wrapper 文件
- 这让后续继续退役 legacy wrapper 时边界更清晰

## 验证

- 通过:
  - `pnpm --dir 'D:\\github\\Socrates_ analysis\\socra-platform' exec tsc --noEmit -p 'apps\\socrates\\tsconfig.json'`
- 构建尝试:
  - `pnpm --dir 'D:\\github\\Socrates_ analysis\\socra-platform' --filter @socra/socrates build`
  - 失败原因不是类型或导出面错误，而是 Windows 本地 `.next` 产物清理时出现 `EPERM unlink app-path-routes-manifest.json`
- 补充探测:
  - 目标文件属性为普通 `Archive`
  - 当前更像是本地 `.next` 目录被占用，而不是本轮代码回归

## 备注

- 本机 Node 仍为 `v22.19.0`
- 仓库期望 Node 仍为 `20.x`
- 本轮未重跑 smoke，原因是上一阶段已经确认当前主机到 `https://socrates.socra.cn` 的 TLS 握手存在环境级阻塞，继续重跑无法提供新的代码信号
