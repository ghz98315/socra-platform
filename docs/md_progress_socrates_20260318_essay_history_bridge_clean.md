# Socrates Essay History Bridge Clean 进度
日期: 2026-03-18

## 本次完成

- 新增 `EssayHistoryBridgeV2.tsx`，替代旧的作文历史桥接展示逻辑。
- 模块页 `composition-review` 已切到新的作文历史桥接组件。
- 新桥接组件会先触发旧作文到 `study_assets` 的懒同步，再把每条作文卡片映射回统一学习记录。
- 对已映射的作文卡片补齐了三条主链动作：
  - 查看统一学习记录详情
  - 聚焦单条记录生成学习报告
  - 直接加入复习清单或打开复习页
- 保留“去 Essay 查看”入口，继续作为原作文工作台的深度入口。

## 当前判断

- 这次补的是 `Essay -> study_assets -> reports/review` 的反向接回，不是把 Essay 整站迁进 Socrates。
- 这样可以让语文作文模块不再只有“外跳 Essay”，而是开始具备主平台内的记录、报告和复习闭环。
- 旧 `EssayHistoryBridge.tsx` 保留未删，避免在编码不稳定的旧文件上做高风险清理；当前模块页已改走 clean 版本。

## 影响范围

- `/study/chinese/composition-review`
- `apps/socrates/components/study/EssayHistoryBridgeV2.tsx`
- `apps/socrates/app/(student)/study/[subject]/[module]/page.tsx`

## 验证

- `pnpm exec tsc --noEmit -p apps/socrates/tsconfig.json`

## 备注

- 本机 Node 仍为 `v22.19.0`，仓库期望仍为 `20.x`。
- 本次未跑 smoke；这轮改动集中在前端桥接和客户端懒同步接线，先以静态校验收口。
