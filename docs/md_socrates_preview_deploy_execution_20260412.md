# Socrates Preview Deploy Execution
Date: 2026-04-12
Status: ready to execute on owning local Windows user

## Goal

- Push the current `Phase 2` closure checkpoint to preview as fast as possible.
- Keep preview validation narrow and focused on the active main chain.

## Preconditions

- Use the owning Windows user for git operations.
- Work from the real repo:
  - `D:\github\Socrates_ analysis\socra-platform`
- Do not run `pnpm` from:
  - `D:\github\Socrates_ analysis`

## Step 1: Local Preflight

```powershell
git config --global --add safe.directory "D:/github/Socrates_ analysis/socra-platform"
pnpm.cmd -C "D:\github\Socrates_ analysis\socra-platform" check:node
pnpm.cmd -C "D:\github\Socrates_ analysis\socra-platform" --filter @socra/socrates exec tsc --noEmit
```

Expected:

- `check:node` passes
- `tsc --noEmit` passes

## Step 2: Commit Current Checkpoint

Use the command set already captured in:

- `docs/md_progress_socrates_20260412_phase2_closure_checkpoint.md`

Recommended title:

- `feat(socrates): close phase2 error-loop flow and add local dev fallback`

### One-Paste Command Block

Replace `<your-branch>` before running:

```powershell
git config --global --add safe.directory "D:/github/Socrates_ analysis/socra-platform"
pnpm.cmd -C "D:\github\Socrates_ analysis\socra-platform" check:node
pnpm.cmd -C "D:\github\Socrates_ analysis\socra-platform" --filter @socra/socrates exec tsc --noEmit

git -C "D:\github\Socrates_ analysis\socra-platform" add `
  "apps/socrates/app/(student)/error-book/page.tsx" `
  "apps/socrates/app/(student)/error-book/[id]/page.tsx" `
  "apps/socrates/app/(student)/review/page.tsx" `
  "apps/socrates/app/(student)/workbench/page.tsx" `
  "apps/socrates/components/error-loop/ReviewAttemptSessionPage.tsx" `
  "scripts/start-socrates-local.mjs" `
  "package.json" `
  "docs/md_progress_socrates.md" `
  "docs/md_socrates_internal_closure_plan_20260409.md" `
  "docs/md_socrates_phase2_error_loop_acceptance_checklist_20260411.md" `
  "docs/md_socrates_phase2_error_loop_acceptance_execution_20260411.md" `
  "docs/md_RELEASE_RUNBOOK.md" `
  "docs/md_progress_socrates_20260412_phase2_closure_checkpoint.md" `
  "docs/md_socrates_post_preview_polish_plan_20260412.md" `
  "docs/md_socrates_preview_deploy_execution_20260412.md"

git -C "D:\github\Socrates_ analysis\socra-platform" commit `
  -m "feat(socrates): close phase2 error-loop flow and add local dev fallback" `
  -m "tighten error-book/review/workbench next-step flow" `
  -m "fix unauthenticated loading hangs on phase2 chain" `
  -m "add socrates:start:dev-local for windows local acceptance" `
  -m "backfill acceptance, checkpoint, and preview deploy docs"

git -C "D:\github\Socrates_ analysis\socra-platform" push origin <your-branch>
```

## Step 3: Push Preview

```powershell
git -C "D:\github\Socrates_ analysis\socra-platform" push origin <your-branch>
```

Expected:

- Vercel auto-creates or updates a preview deployment for the Socrates project

## Step 4: Preview Acceptance

Validate only the current active chain.

### Check 1: Error Book List

- Open `error-book`
- Confirm top `Next Step` has only one main action

### Check 2: Error Detail

- Open one `error-book/[id]`
- Confirm in-page `Next Step` is the single main action
- Confirm header does not duplicate main CTA

### Check 3: Review Hub

- Open `review`
- Confirm:
  - pending review -> main CTA is `继续复习`
  - no pending but completed record -> main CTA is `看复盘`

### Check 4: Review Session Completion

- Open `review/session/[id]`
- Complete one judgement
- Confirm result page only keeps the intended two exits

### Check 5: Workbench Restore

- Enter from `error-book` or `review` into `study/[subject]/problem?session=...`
- Confirm redirect lands in `workbench`
- Confirm chat area is not blank

## Step 5: Release Decision

- If all 5 checks pass:
  - current preview can be treated as valid
  - then decide whether to promote to production
- If preview fails:
  - do not mix polish work into the current checkpoint by default
  - only patch the true blocker

## Not In Current Preview Gate

These are queued after preview unless they block preview directly:

- geometry recognition / drawing refinement
- dialogue prompt optimization
- model whitelist cleanup
- default model cleanup

Reference:

- `docs/md_socrates_post_preview_polish_plan_20260412.md`

## Next Step

- Execute `Step 1 -> Step 4`.
- Only after preview is confirmed should the next polish round begin.
