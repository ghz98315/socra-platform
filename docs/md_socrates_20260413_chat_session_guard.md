# Socrates Chat Session Guard 加固
Date: 2026-04-13
Status: implemented

## 本轮目标

- 收紧 `chat` 路由的会话边界处理。
- 避免在极端情况下出现以下问题：
  - 缺少 `sessionId / session_id` 时直接拿空值做内存会话 key
  - `GET / DELETE` 只认一种 query 参数名，导致不同调用风格不一致

## 已完成内容

### 1. 缺少会话 id 时自动生成临时 id

`chat` 路由现在会按下面顺序取会话 id：

1. `sessionId`
2. `session_id`
3. `randomUUID()`

这样即使调用方漏传会话 id，也不会把会话历史错误地挂在空 key 上。

### 2. 返回当前实际使用的 sessionId

`POST /api/chat` 现在会在响应里带回：

- `sessionId`

这为后续调用方需要兜底接管临时会话提供了兼容空间，同时不影响现有调用。

### 3. GET / DELETE 同时兼容两种参数名

以下接口现在同时支持：

- `sessionId`
- `session_id`

适用于：

- `GET /api/chat`
- `DELETE /api/chat`

## 触达文件

- `apps/socrates/app/api/chat/route.ts`

## 本轮收益

- 会话边界更稳，不会因为漏传 session id 造成内存会话污染。
- 新旧参数风格兼容更完整。
- 为后续前端若需要接收服务端兜底 sessionId 留了空间。

## 验证

- Command:
  - `pnpm.cmd -C "D:\github\Socrates_ analysis\socra-platform" --filter @socra/socrates exec tsc --noEmit`
- Result:
  - passed
