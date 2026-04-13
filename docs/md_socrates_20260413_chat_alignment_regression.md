# Socrates Chat Alignment 最小回归
Date: 2026-04-13
Status: passed locally

## 回归目标

- 验证本轮聊天链路对齐后的最小可用性：
  - `sessionId` 兜底
  - `clear-history` 重建
  - `GET / DELETE` 双参数兼容
  - mock fallback 下的“连续看不懂”回退逻辑

## 本地环境

- Base URL:
  - `http://127.0.0.1:3000`
- 本地状态检查：
  - `pnpm.cmd -C "D:\github\Socrates_ analysis\socra-platform" socrates:status:local`
- 结果：
  - `HTTP=307`
  - `HEALTH=yes`

## 回归结果

### 1. chat 自动返回 sessionId

- 未主动传 `sessionId` 发起 `/api/chat`
- 返回结果中成功带回 `sessionId`
- 说明后端兜底会话 id 生效

### 2. clear-history 可正常重建新会话

- 调用 `/api/chat/clear-history`
- 传入：
  - 原 `sessionId`
  - 新 `newSessionId`
- 返回成功
- 后续使用新 `sessionId` 继续调用 `/api/chat` 正常

### 3. GET / DELETE 双参数兼容通过

- `GET /api/chat?session_id=...`
  - 正常返回历史
- `DELETE /api/chat?session_id=...`
  - 执行后成功清空
- 再用 `GET /api/chat?sessionId=...`
  - 返回空历史

### 4. mock fallback 下“连续看不懂”逻辑通过

本地接口本次运行在：

- `modelUsed = mock (fallback)`

数学场景验证结果：

- 第一次输入：
  - `看不懂`
- 返回：
  - 收窄问题
  - 例：先问题目已经明确给了哪个条件

- 第二次输入：
  - `还是看不懂`
- 返回：
  - 明确回退一层
  - 例：退回到“题目最后要求什么”

这与本轮目标一致：

- 第一次先缩小
- 第二次同一步再困惑时回退

## 结论

- 本轮 prompt 主链、clear-history、fallback mock、session 边界加固已形成一致闭环。
- 当前建议：
  - 到此停止继续扩面
  - 保存当前节点
  - 准备提交或 preview 验收
