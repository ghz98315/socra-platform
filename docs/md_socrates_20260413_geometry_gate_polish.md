# Socrates 几何链门禁收紧记录

- 日期：2026-04-13
- 阶段：几何识别 API 误触发收口
- 目标：减少非几何题误进几何链，优先拦在 `apps/socrates/app/api/geometry/route.ts` 入口。

## 本轮改动

### 1. 新增几何信号检测

新增了 `detectGeometrySignals(text)`，按几类信号做判断：
- 明确图形词：三角形、四边形、矩形、圆、半径、直径、切线等
- 关系词：线段、垂直、平行、中点、角平分线、高、中线等
- 图示词：如图、下图、图中、图形、几何
- 函数图像词：函数图像、反比例函数、二次函数、坐标系、x轴、y轴、`y=` 等
- 点位与关系组合：`点A/点B`、坐标点、角、线段关系、交于点等

### 2. 新增几何门禁

新增了 `isLikelyGeometryText(text, subject)`：
- 非 `math` 学科直接拦截
- 明确图形信号、函数图像信号、显式图形引用信号任一命中则通过
- 否则至少要求“两个点位信号 + 一个关系信号”才通过

目的：
- 不再因为 `AB`、`BC`、`坐标` 这类过宽关键词就直接进入几何链

### 3. 不像几何题时直接返回空 unknown

之前：
- 旧关键词没命中时会走 `buildFallbackGeometry(text)`

现在：
- 新门禁未通过时，直接返回空 `unknown`
- 不再继续做 fallback 猜图

这一步很关键，因为很多误触发并不是“识别差”，而是“根本不该进几何链”。

## 影响

预计改善的场景：
- 普通数学文字题中出现少量字母或坐标字样
- 非几何场景下出现 `AB`、`BC`、`OA` 等字母组合
- OCR 轻微误识别导致旧宽关键词偶发命中

保留能力：
- 明确几何题
- 函数图像题
- 坐标系几何题
- 带点名和关系描述的图形题

## 本轮验证

已执行：
- `$env:NODE_OPTIONS='--max-old-space-size=4096'; pnpm.cmd -C "D:\github\Socrates_ analysis\socra-platform" --filter @socra/socrates exec tsc --noEmit`

结果：
- 通过

说明：
- 直接执行 `tsc --noEmit` 时出现 Node 堆内存不足
- 加大 Node 堆后验证通过，当前没有发现新增 TypeScript 错误

## 下一步建议

建议继续两项中的一项：
- 做一轮人工回归，重点验证“无图题不弹几何卡、有图题仍能识别”
- 再压一轮 `buildFallbackGeometry` 内部的启发式，进一步降低函数/图形混判
