# Socrates 2026-04-27 回归收口发布安排

Date: 2026-04-27
Repo: `D:\github\Socrates_ analysis\socra-platform`
Baseline commit: `ef23866 fix parent login profile selection redirect`

## 当前状态

- 当前工作区不是干净发布面，而是基于 `ef23866` 的脏延续工作区。
- auth/profile 主线的人工闭环验收已通过。
- 2026-04-27 新增了 auth/profile 回归脚本，用于覆盖登录态和 parent/student 权限边界。
- 本轮目标不是继续加功能，而是把当前 auth/profile 延续改动收束为可部署、可复验的一次发布。

## 本轮已完成的回归收口

- 统一手机验证码开关来源：
  - `apps/socrates/lib/auth/phone-auth-config.ts`
  - `apps/socrates/app/(auth)/login/page.tsx`
  - `apps/socrates/app/(auth)/register/RegisterPageV3.tsx`
  - `apps/socrates/app/api/auth/send-code/route.ts`
  - `apps/socrates/app/api/auth/verify-code/route.ts`
- 更新 `scripts/smoke-auth-phone.mjs`，兼容当前“验证码登录关闭”与未来“验证码登录开启”两种状态。
- 新增 auth/profile 在线回归脚本：
  - `scripts/check-socrates-auth-profile-regression.mjs`
- 新增 npm 命令入口：
  - `pnpm.cmd socrates:check:auth-profile-regression`

## 2026-04-27 已完成验证

- `node --check scripts/check-socrates-auth-profile-regression.mjs`: passed
- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`: passed
- `pnpm.cmd --filter @socra/socrates build`: passed
- 本地启动 Socrates 后，用 `SMOKE_BASE_URL=http://127.0.0.1:3000 pnpm.cmd socrates:check:auth-profile-regression`: passed
- 本地回归脚本验证后，已执行 `pnpm.cmd socrates:stop:local` 停止服务

## 当前不能直接据此做线上结论的原因

- 这台机器访问 `https://socrates.socra.cn` 仍然会在 TLS 握手前失败，不能作为当前回归验证目标。
- `https://socra-platform.vercel.app` 可以访问，但其 `/api/parent-tasks` 返回结果与当前仓库代码不一致：
  - 实际返回 `400 {"error":"parent_id or child_id is required"}`
  - 当前仓库实现的未登录行为应走 `401 {"error":"Not authenticated"}`
- 结论：
  - 当前线上 alias 不是这份工作区当前状态的可靠验证面
  - 必须先从当前工作区整理出干净发布面，再部署，再跑线上回归

## 部署判断

- 当前整个脏工作区：不能直接部署
- 当前 auth/profile 收口切片：可以继续整理为单独发布包，并进入干净 worktree 复验与部署阶段

直接判定为“不能直接部署”的原因：

- 当前 tracked diff 已达 49 个文件，且混有明显无关发布面的改动：
  - `apps/landing/vercel.json`
  - `book/*`
  - 多份历史 docs
  - 本地启动辅助脚本
  - 其他聊天/回归脚本
- 当前线上 alias 与本地工作区实现不一致，不能直接拿现网结果反推当前工作区可发布性。
- 当前还有若干 auth/profile 关键文件属于 untracked 新增文件，若不整理到干净提交里，发布面会不完整。

auth/profile 切片之所以可以继续进入发布准备：

- `@socra/socrates` 类型检查通过
- `@socra/socrates` build 通过
- 本地 auth/profile 回归脚本全量通过
- 当前未发现新的本地编译阻塞或明显接口契约冲突

## 下一步执行顺序

1. 整理发布范围

- 从当前脏工作区中抽出“本次要发”的 auth/profile 收口改动。
- 明确只纳入本轮发布的文件，避免把无关 landing、book、历史文档或其他实验性改动一起带上。

2. 建立干净部署工作树

- 基于 `origin/main` / `ef23866` 建立干净 `git worktree`。
- 只迁移本次发布需要的 auth/profile 文件和脚本。
- 不要从当前脏工作区直接发版。

3. 在干净工作树做本地复验

- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`
- `pnpm.cmd --filter @socra/socrates build`
- `pnpm.cmd smoke:auth-phone`
- `SMOKE_BASE_URL=http://127.0.0.1:3000 pnpm.cmd socrates:check:auth-profile-regression`

4. 提交并部署

- 生成单独 commit。
- 推送到 `main`。
- 从干净工作树部署到正确的 Vercel 项目：
  - project: `socra-socrates`

5. 部署后线上验证

- 优先使用新的 deployment URL 或可达 alias 做验证。
- 至少执行：
  - `pnpm.cmd smoke:socrates`
  - `pnpm.cmd smoke:auth-phone`
  - `pnpm.cmd socrates:check:auth-profile-regression`

6. 更新 checkpoint

- 将最终提交号、部署 URL、线上验证结果写回 `docs/LATEST_CHECKPOINT.md`
- 让下一次继续时直接从最新发布节点恢复，而不是再从旧 checkpoint 倒推

## 建议纳入本轮发布的 auth/profile 文件集

这次不建议再按“最小 12 个文件”理解。根据当前依赖链，建议按下面 4 组整理发布：

### 1. 认证与登录注册

- `apps/socrates/app/(auth)/login/page.tsx`
- `apps/socrates/app/(auth)/register/RegisterPageV3.tsx`
- `apps/socrates/app/api/auth/register/route.ts`
- `apps/socrates/app/api/auth/send-code/route.ts`
- `apps/socrates/app/api/auth/verify-code/route.ts`
- `apps/socrates/app/api/auth/change-password/route.ts`
- `apps/socrates/app/api/auth/verify-parent-password/route.ts`
- `apps/socrates/lib/auth/phone-auth-config.ts`

### 2. profile 选择与家长二次验证

- `apps/socrates/app/(auth)/select-profile/SelectProfilePageV3.tsx`
- `apps/socrates/app/(parent)/layout.tsx`
- `apps/socrates/app/workspace/page.tsx`
- `apps/socrates/lib/auth/parent-access.ts`
- `apps/socrates/lib/contexts/AuthContext.tsx`
- `apps/socrates/app/api/account/profile/route.ts`
- `apps/socrates/app/api/students/add/route.ts`

### 3. parent/student 数据边界与主线页面

- `apps/socrates/app/(parent)/tasks/page.tsx`
- `apps/socrates/app/(student)/my-tasks/page.tsx`
- `apps/socrates/app/(student)/review/page.tsx`
- `apps/socrates/app/(student)/settings/page.tsx`
- `apps/socrates/app/api/parent-tasks/route.ts`
- `apps/socrates/app/api/review/add/route.ts`
- `apps/socrates/app/api/review/attempt/route.ts`
- `apps/socrates/app/api/review/generate/route.ts`
- `apps/socrates/app/api/review/schedule/route.ts`
- `apps/socrates/app/api/student/stats/route.ts`
- `apps/socrates/app/api/task-progress/route.ts`
- `apps/socrates/app/api/reports/study/route.ts`
- `apps/socrates/app/api/weekly-reports/route.ts`
- `apps/socrates/app/api/family/route.ts`
- `apps/socrates/app/api/family/dashboard/route.ts`
- `apps/socrates/components/GlobalNavV2.tsx`
- `apps/socrates/components/OCRResult.tsx`
- `apps/socrates/components/error-loop/ParentInsightControlPage.tsx`
- `apps/socrates/components/error-loop/ReviewAttemptSessionPage.tsx`
- `apps/socrates/components/reports/ReportsDashboard.tsx`
- `apps/socrates/components/subscription/SubscriptionFeatures.tsx`

### 4. 回归与验证入口

- `scripts/smoke-auth-phone.mjs`
- `scripts/check-socrates-auth-profile-regression.mjs`
- `package.json`

## 明确建议排除出本轮发布面的内容

- `apps/landing/vercel.json`
- `book/*`
- `.codex_tmp/`
- `apps/socrates/.next-probe/`
- `apps/socrates-landing-page (2).zip`
- 非 auth/profile 方向的历史 docs 变更
- 本地启动辅助脚本，除非你计划同时发布本地工作流改造：
  - `scripts/socrates-local-utils.mjs`
  - `scripts/start-socrates-local.mjs`
  - `scripts/start-socrates-probe-local.mjs`
  - `scripts/status-socrates-local.mjs`
- 与本轮主线无关的聊天回归脚本：
  - `scripts/check-socrates-chat-regression.mjs`
  - `scripts/check-socrates-online-chat-regression.mjs`

## 当前推荐动作

- 先做“发布范围整理 + 干净 worktree 准备”。
- 在没有清理发布范围之前，不建议直接提交当前工作区，也不建议直接部署。
- 如果要进入真正的部署阶段，先按上面的 4 组文件集抽出干净发布面，再重复本地验证并生成单独提交。

## 2026-04-27 干净 worktree 验证结论

- 已创建干净发布工作树：
  - `D:\github\Socrates_ analysis\socra-platform-auth-release-20260427`
- 该 worktree 基于：
  - `ef23866 fix parent login profile selection redirect`
- 已将本轮 auth/profile 发布切片迁入该 worktree。

### 在干净 worktree 中完成的验证

- `pnpm.cmd install --no-frozen-lockfile`: passed
- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`: passed
- `pnpm.cmd --filter @socra/socrates build`: passed
- 本地启动后：
  - `SMOKE_BASE_URL=http://127.0.0.1:3000 pnpm.cmd smoke:auth-phone`: passed
  - `SMOKE_BASE_URL=http://127.0.0.1:3000 pnpm.cmd socrates:check:auth-profile-regression`: passed
- 验证完成后已执行：
  - `pnpm.cmd socrates:stop:local`

### 最终部署判断

- 当前原始脏工作区：仍然不建议直接部署
- 当前干净 worktree 发布切片：已经达到“本地可部署”状态
- 下一步可以进入：
  - `git add`
  - `git commit`
  - `git push`
  - 部署到 Vercel 项目 `socra-socrates`

### 仍需在线上完成的最后一步

- 当前只完成了“干净 worktree 本地可部署”验证，还没有完成新的线上 deployment 验证。
- 真正发版前后仍应补齐：
  - 新 deployment URL / alias 上的 `smoke:socrates`
  - 新 deployment URL / alias 上的 `smoke:auth-phone`
  - 新 deployment URL / alias 上的 `socrates:check:auth-profile-regression`

## 2026-04-27 生产部署结果

- clean worktree commit:
  - `8c64ef6 stabilize auth profile flow and regression coverage`
- pushed to:
  - `origin/main`
- production deployment:
  - `https://socra-socrates-7zb6j2g3i-ghz98315s-projects.vercel.app`
- deployment status:
  - `Ready`
- aliases confirmed by `vercel inspect`:
  - `https://socrates.socra.cn`
  - `https://socra-platform.vercel.app`
  - `https://socra-socrates-ghz98315s-projects.vercel.app`
  - `https://socra-socrates-git-main-ghz98315s-projects.vercel.app`

## 2026-04-27 线上验证现状

- Deployment URL itself is not a usable anonymous smoke surface from this environment because Vercel authentication protection is enabled there.
- Public alias verification is still blocked by this machine's external connectivity path:
  - `curl.exe -I https://socra-platform.vercel.app`: timeout / could not connect
  - `pnpm.cmd smoke:socrates` on the alias: fetch failures
  - `pnpm.cmd smoke:auth-phone` on the alias: fetch failure after anon signup
  - `pnpm.cmd socrates:check:auth-profile-regression` on the alias: fetch failure

## Final release status

- Code status:
  - pushed
- Production deployment status:
  - ready
- Local release validation:
  - passed
- External online validation from this machine:
  - not completed due deployment protection + network-path instability
- Practical conclusion:
  - this release is deploy-finished but externally unverified from the current machine
  - the remaining action is not more code work
  - the remaining action is external verification from a reachable network or with a Vercel bypass/authenticated path
