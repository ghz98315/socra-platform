# Socrates 几何链部署前就绪说明

- 日期：2026-04-13
- 范围：几何恢复收口 + 几何门禁收紧 + 人工回归清单补齐
- 目标：确认当前改动已到“可提交、可部署前检查”状态

## 一、本轮代码范围

核心代码文件：
- `apps/socrates/app/(student)/workbench/page.tsx`
- `apps/socrates/app/api/geometry/route.ts`

配套文档：
- `docs/md_socrates_20260413_geometry_recovery_polish.md`
- `docs/md_socrates_20260413_geometry_gate_polish.md`
- `docs/md_socrates_20260413_geometry_manual_regression_checklist.md`

## 二、已完成验证

### 1. TypeScript 检查

执行命令：

```powershell
$env:NODE_OPTIONS='--max-old-space-size=4096'
pnpm.cmd --filter @socra/socrates exec tsc --noEmit
```

结果：
- 通过

补充：
- 默认堆内存下 `tsc` 可能会出现 `heap out of memory`
- 加大 Node 堆后本轮验证通过

### 2. 应用构建验证

执行命令：

```powershell
pnpm.cmd --filter @socra/socrates build
```

结果：
- 通过

说明：
- 首次执行被本地 3000 端口守卫拦截
- 停掉本地实例后重跑通过
- Next 构建完成，`/api/geometry` 路由已正常进入构建结果

### 3. 本地服务恢复

为避免影响后续人工验收，构建完成后已重新启动本地服务：

```powershell
pnpm.cmd socrates:start:local
pnpm.cmd socrates:status:local
```

当前状态：
- `HTTP=307`
- `HEALTH=yes`
- `STATE=healthy_port_stale_pid`

备注：
- 当前项目的本地状态脚本里，`stale pid` 并不代表服务不可用
- 以 `HTTP` 和 `HEALTH` 作为主要可用性判断

## 三、当前上线前结论

从工程验证角度看，当前已满足以下条件：
- 代码可通过 TS 检查
- `@socra/socrates` 可完成生产构建
- 本地服务可重新拉起
- 几何专项人工回归清单已整理完毕

因此当前状态可以进入：
- 人工回归
- 提交代码
- 正式部署前检查

## 四、正式部署前最小动作

建议按这个顺序执行：

1. 按 `docs/md_socrates_20260413_geometry_manual_regression_checklist.md` 跑最小 case
2. 至少确认以下四项通过：
   - 无图题不误进几何链
   - 标准几何题仍能识别
   - 再次识别失败时旧图会保留
   - 非数学学科不出现几何链
3. 确认后再执行提交与部署

## 五、建议的提交说明

如果后续直接提交，这轮建议的提交语义可参考：

```text
feat(socrates): harden geometry recovery flow and tighten geometry gate
```

## 六、后续建议

这轮之后优先级最高的不是再扩功能，而是：
- 先按清单完成人工回归
- 回归通过后再统一提交和部署

如果回归中发现真实误判样例，再针对样例继续压 `route.ts` 的门禁和 fallback 规则即可。
