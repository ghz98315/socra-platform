# Latest Checkpoint

Date: 2026-04-22
Repo: `D:\github\Socrates_ analysis\socra-platform`
Branch: `main`

## Current node

- Latest pushed commit: `ef23866`
- Commit message: `fix parent login profile selection redirect`
- Production project: `socra-socrates`
- Production domain: `https://socrates.socra.cn`
- Production alias: `https://socra-platform.vercel.app`
- Latest successful production deployment:
  - `https://socra-socrates-i88c557wk-ghz98315s-projects.vercel.app`

## What changed in this node

- Tightened parent login redirect behavior.
- Parent account no longer reuses the last child `profile` by default after login.
- Parent account now returns to `/select-profile` first instead of jumping directly into student `workbench`.
- Student single-profile auto-redirect remains available.

## Files changed in this node

- `apps/socrates/lib/contexts/AuthContext.tsx`
- `apps/socrates/app/(auth)/login/page.tsx`
- `apps/socrates/app/workspace/page.tsx`
- `apps/socrates/app/(auth)/select-profile/SelectProfilePageV3.tsx`

## Deployment and validation status

- `git push origin main`: completed
- Production deploy to `socra-socrates`: completed
- Alias attached:
  - `https://socrates.socra.cn`
  - `https://socra-platform.vercel.app`

Automated checks passed on the public alias:

- `pnpm.cmd smoke:socrates`
- `pnpm.cmd socrates:check:online-wrap-up-regression`

Validated result:

- `smoke:socrates`: passed
- `online-wrap-up-regression`: passed

## Resume status on 2026-04-23

- Confirmed `git log -1 --oneline` is still `ef23866 fix parent login profile selection redirect`.
- Confirmed the four files listed under "Files changed in this node" have no new local diff on top of `ef23866`.
- Re-ran `pnpm.cmd probe:socrates-domain` from this machine:
  - `https://socrates.socra.cn` still fails at TLS handshake on this machine before application code runs.
  - `https://socra-platform.vercel.app` responds normally and should remain the preferred validation URL from this machine.
- Re-ran automated checks against the production alias with `SMOKE_BASE_URL=https://socra-platform.vercel.app`:
  - `pnpm.cmd socrates:check:online-wrap-up-regression`: passed on 2026-04-23
  - `pnpm.cmd smoke:socrates`: passed on 2026-04-23

Current conclusion:

- The deployed Socrates app on the production alias is healthy for the automated flows rerun in this resume session.
- The custom domain failure observed from this machine is still a network / edge-path issue, not evidence of a new app regression.
- The next unresolved item remains the browser-level manual acceptance for parent login -> `/select-profile` -> parent `/tasks` -> child learning flow -> logout/login stability.

## Latest production update on 2026-04-23

- Follow-up production deployment completed after the earlier parent-login redirect fix.
- Production deployment:
  - `https://socra-socrates-a4s1mi8zj-ghz98315s-projects.vercel.app`
- Alias attached:
  - `https://socrates.socra.cn`
- Additional behavior change in this deployment:
  - New registrations now create the account owner profile as `parent` instead of `student`.
  - Register success now mirrors login success:
    - `parent` accounts land on `/select-profile`
    - `student` accounts still land on the role-aware student destination
- Files additionally changed for this deployment:
  - `apps/socrates/app/(auth)/register/RegisterPageV3.tsx`
  - `apps/socrates/app/api/auth/register/route.ts`
  - `apps/socrates/app/api/auth/send-code/route.ts`
  - `apps/socrates/app/api/auth/verify-code/route.ts`
  - `apps/socrates/lib/contexts/AuthContext.tsx`
- Important validation note:
  - Existing accounts that were already created as `student` before this deployment will remain `student` unless migrated in the database.
  - Therefore, verification of this new behavior must use a never-before-registered phone number, or manually update the existing test account role in the database before retesting.

## Important operational notes

- Do not deploy from the dirty main workspace.
- Use a clean `git worktree` at the exact pushed commit for production deployment.
- The correct Vercel production project is `socra-socrates`.
- Do not deploy production to the separate `socra-platform` Vercel project.
- Temporary deployment URL may be protected by Vercel auth. For online smoke checks, prefer:
  - `https://socra-platform.vercel.app`
  - or `https://socrates.socra.cn`

## Immediate next manual test

Focus first on the role-selection regression that triggered this fix:

1. Login with a parent account.
2. Confirm the app lands on `/select-profile`.
3. Confirm it does not jump directly to `workbench`.
4. Select parent profile and confirm `/tasks`.
5. Select child profile and confirm student learning flow.
6. Logout and login again to confirm the same behavior is stable.

## If resuming in a new session

Start from this file first, then use:

- `docs/md_socrates_20260419_auth_study_chain_online_checklist.md`
- `docs/md_RELEASE_RUNBOOK.md`

## Latest production update on 2026-04-23 (Scheme A multi-student)

- Continued from the latest 2026-04-23 checkpoint and did not roll back to an earlier node.
- Current auth/profile direction:
  - one login account can switch between `parent` and multiple `student` profiles
  - entering parent view still requires a password verification step
  - the primary path does not depend on the old family child-linking flow

### Functional changes completed

- Registration now accepts password input in the phone-code signup path and creates the account owner as `parent`.
- Parent-owned accounts can add additional student profiles directly from `/select-profile`.
- `apps/socrates/app/(student)/settings/page.tsx` now sends `profile_id` during save, so grade changes apply to the currently active student profile.
- Grade, error-book, and review data remain separated by student profile id.

### Additional files changed in this node

- `apps/socrates/app/(student)/settings/page.tsx`
- `apps/socrates/app/api/auth/verify-parent-password/route.ts`
- `apps/socrates/lib/auth/parent-access.ts`

### Validation completed on 2026-04-23

- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`: passed
- `pnpm.cmd --filter @socra/socrates build`: passed
- `SMOKE_BASE_URL=https://socra-platform.vercel.app pnpm.cmd smoke:socrates`: passed
- `SMOKE_BASE_URL=https://socra-platform.vercel.app pnpm.cmd socrates:check:online-wrap-up-regression`: passed

### Production deployment completed on 2026-04-23

- Deployment:
  - `https://socra-socrates-i0dlxmhni-ghz98315s-projects.vercel.app`
- Alias attached:
  - `https://socrates.socra.cn`

### Network/path verification from this machine on 2026-04-23

- `pnpm.cmd probe:socrates-domain` still shows `https://socrates.socra.cn` failing before TLS is established on this machine.
- The same probe still reaches `https://socra-platform.vercel.app` successfully from this machine.
- Current conclusion:
  - this machine should keep using `https://socra-platform.vercel.app` for automated validation
  - manual browser verification on the domestic network is still required for the custom domain path

## Latest production update on 2026-04-23 (password change + phone-code disabled)

- Added authenticated password-change support for the current login account.
- Parent second-step verification still reuses the same account password, so after a password change the parent verification password changes with it automatically.
- Phone-code auth is now intentionally disabled in both UI and API until the SMS path is available again.

### Functional changes completed

- Added `POST /api/auth/change-password` for current-password verification plus password update.
- Added a password-change panel to `/settings`.
- Login page now defaults to password login and shows the phone-code login entry as disabled.
- Register page now defaults to password registration and shows the phone-code registration entry as disabled.
- `/api/auth/send-code` and `/api/auth/verify-code` now return a temporary unavailable response unless `NEXT_PUBLIC_PHONE_CODE_AUTH_ENABLED === 'true'`.

### Files additionally changed in this node

- `apps/socrates/app/(auth)/login/page.tsx`
- `apps/socrates/app/(auth)/register/RegisterPageV3.tsx`
- `apps/socrates/app/(student)/settings/page.tsx`
- `apps/socrates/app/api/auth/change-password/route.ts`
- `apps/socrates/app/api/auth/send-code/route.ts`
- `apps/socrates/app/api/auth/verify-code/route.ts`

### Validation completed on 2026-04-23

- `pnpm.cmd --filter @socra/socrates build`: passed
- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`: passed
- `SMOKE_BASE_URL=https://socra-platform.vercel.app pnpm.cmd smoke:socrates`: passed

### Production deployment completed on 2026-04-23

- Deployment:
  - `https://socra-socrates-20181q8z6-ghz98315s-projects.vercel.app`
- Alias attached:
  - `https://socrates.socra.cn`

## Resume status on 2026-04-24

- Continued from this latest checkpoint and did not roll back to any earlier node.
- Confirmed `git log -1 --oneline --decorate` is still:
  - `ef23866 (HEAD -> main, origin/main, origin/HEAD) fix parent login profile selection redirect`
- Confirmed the current `socra-platform` workspace is a dirty continuation on top of that baseline, not a detached older checkpoint.
- The current dirty workspace includes the later 2026-04-23 direction that was already described in this file:
  - parent second-step password verification before entering parent mode
  - password change flow for the current login account
  - phone-code login/register temporarily disabled in UI and API unless re-enabled by env
  - multi-student profile additions and broader auth-scoped parent/student API cleanup

### Local validation completed on 2026-04-24

- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`: passed
- `pnpm.cmd --filter @socra/socrates build`: passed

### Current conclusion on 2026-04-24

- The local continuation above the `ef23866` baseline is type-safe and build-safe on this machine.
- No new production deployment was performed in this resume step.
- The main unresolved work remains browser-level manual acceptance for the latest auth/profile flow, especially:
  - parent login -> `/select-profile`
  - parent second-step password verification -> `/tasks`
- add student profile from `/select-profile`
- switch parent/student profiles and confirm data isolation
- password change -> logout/login -> parent verification with the new password

## Resume status on 2026-04-27

- Continued from this latest checkpoint and did not roll back to any earlier node.
- Confirmed the latest git baseline is still:
  - `ef23866 (HEAD -> main, origin/main, origin/HEAD) fix parent login profile selection redirect`
- Confirmed the current workspace remains a dirty continuation above that baseline.
- Confirmed the auth/profile mainline manual acceptance had already passed earlier in the ongoing thread, so the current phase is regression closure and release preparation, not first-pass feature development.

### Regression closure completed on 2026-04-27

- Unified the phone-code auth feature flag and disabled-state copy into a shared helper:
  - `apps/socrates/lib/auth/phone-auth-config.ts`
- Updated login/register UI to use the shared helper instead of local hardcoded flags:
  - `apps/socrates/app/(auth)/login/page.tsx`
  - `apps/socrates/app/(auth)/register/RegisterPageV3.tsx`
- Updated phone-code auth API routes to use the same shared helper and response wording:
  - `apps/socrates/app/api/auth/send-code/route.ts`
  - `apps/socrates/app/api/auth/verify-code/route.ts`
- Updated `scripts/smoke-auth-phone.mjs` so it now validates both:
  - current expected state: phone-code auth disabled
  - future expected state: phone-code auth enabled
- Added a new auth/profile regression script:
  - `scripts/check-socrates-auth-profile-regression.mjs`
- Added package script entry:
  - `pnpm.cmd socrates:check:auth-profile-regression`

### Local validation completed on 2026-04-27

- `node --check scripts/check-socrates-auth-profile-regression.mjs`: passed
- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`: passed
- `pnpm.cmd --filter @socra/socrates build`: passed
- Local Socrates service was started successfully and verified healthy at `http://127.0.0.1:3000`
- `SMOKE_BASE_URL=http://127.0.0.1:3000 pnpm.cmd socrates:check:auth-profile-regression`: passed
- Local service was stopped after validation with `pnpm.cmd socrates:stop:local`

### Important online verification note on 2026-04-27

- `https://socrates.socra.cn` still fails TLS handshake from this machine and should not be used as the validation target from here.
- `https://socra-platform.vercel.app` remains reachable from this machine, but it is not currently a reliable validation surface for this dirty workspace continuation.
- Direct probe result observed on 2026-04-27:
  - `GET https://socra-platform.vercel.app/api/parent-tasks`
  - returned `400 {"error":"parent_id or child_id is required"}`
- That response does not match the current local workspace implementation for unauthenticated access, which should return `401 {"error":"Not authenticated"}`.
- Current conclusion:
  - the live alias is behind the current local continuation
  - no online regression result from that alias should be treated as evidence about this unpublished workspace state

### Immediate next release-prep task

Focus next on release preparation instead of new product work:

1. Extract the intended auth/profile regression-closure slice from the dirty workspace.
2. Create a clean `git worktree` from the pushed `main` baseline.
3. Move only the intended auth/profile files into that clean deployable workspace.
4. Re-run local validation in the clean workspace.
5. Deploy to the correct Vercel production project:
   - `socra-socrates`
6. Re-run online smoke/regression against the new deployment URL or reachable alias.
7. Update this checkpoint again with:
   - the new pushed commit
   - deployment URL
   - online validation results

### Supporting execution doc for the next step

- `docs/md_socrates_20260427_regression_release_arrangement.md`

### Clean worktree validation completed on 2026-04-27

- Created a clean release worktree at:
  - `D:\github\Socrates_ analysis\socra-platform-auth-release-20260427`
- That worktree is based on:
  - `ef23866 fix parent login profile selection redirect`
- Moved the auth/profile release slice into that clean worktree and validated it there.

Validation completed inside the clean worktree:

- `pnpm.cmd install --no-frozen-lockfile`: passed
- `pnpm.cmd --filter @socra/socrates exec tsc --noEmit`: passed
- `pnpm.cmd --filter @socra/socrates build`: passed
- `SMOKE_BASE_URL=http://127.0.0.1:3000 pnpm.cmd smoke:auth-phone`: passed
- `SMOKE_BASE_URL=http://127.0.0.1:3000 pnpm.cmd socrates:check:auth-profile-regression`: passed

Current conclusion after this step:

- The original dirty workspace should still not be deployed directly.
- The clean auth/profile release worktree is now locally deployable.
- The next unresolved step is no longer local validation.
- The next unresolved step is:
  - commit the clean worktree slice
  - push it
  - deploy it to `socra-socrates`
  - run the same smoke/regression checks against the new online deployment surface

Suggested resume prompt:

```text
请先读取 docs/LATEST_CHECKPOINT.md，然后基于其中的最新提交、部署状态和待测项继续，不要回退到更早的 checkpoint。
```
