# Socrates Online Chat Regression Command

- Date: 2026-04-14
- Status: implemented and passing
- Scope: convert the remaining route-level online chat regression gap into one repeatable local command

## Command

```powershell
pnpm.cmd socrates:check:online-chat-regression
```

## What The Command Does

1. runs the proven isolated full probe build into `apps/socrates/.next-probe/**`
2. temporarily mounts that probe output as `apps/socrates/.next`
3. starts `next start` on `127.0.0.1:3010` inside the same Node process lifetime
4. clears AI key env vars so `/api/chat` deterministically uses the current mock fallback path
5. sends real HTTP requests to:
   - `POST /api/chat`
   - `POST /api/chat/clear-history`
   - `GET /api/chat?session_id=...`
   - `DELETE /api/chat?session_id=...`
6. always stops the server, restores `.next`, and removes probe output

## Why This Version Works On This Machine

- the earlier attempt failed because this command host hits Windows `spawn EPERM` when the script tries to launch child processes through pipe-based stdio capture
- the passing version keeps the route-level server launch in the same script and uses `stdio: 'inherit'`
- this keeps the online regression self-contained without relying on detached process persistence after command return

## Current Coverage

The command now verifies these route-level cases against the real HTTP endpoints:

- `math` first turn
- `geometry math` first turn
- `english reading` first turn
- `chinese` repeated confusion
- `clear-history` rebuild
- `session_id` GET/DELETE compatibility

Observed pass lines on 2026-04-14:

- `PASS online_math_first_turn`
- `PASS online_geometry_first_turn`
- `PASS online_english_first_turn`
- `PASS online_chinese_repeated_confusion`
- `PASS online_clear_history_rebuild`
- `PASS online_session_param_compat`
- `PASS online_chat_regression total=6`

## Current Judgment

- the remaining route-level prompt/session regression gap is now closed
- the lingering Windows local-start instability still matters for day-to-day manual local workflows
- but it no longer blocks commandized online regression for the current baseline
