# Project Socrates - 开发经验总结

> 记录开发过程中遇到的逻辑错误和常见问题，避免重复踩坑

---

## 1. 数据库 RLS (Row Level Security) 问题

### 问题描述
使用 `anon` 密钥的 Supabase 客户端无法插入数据，报错：
```
Error: new row violates row-level security policy for table "error_sessions"
code: '42501'
```

### 根本原因
- Supabase 启用了 RLS (Row Level Security) 策略
- `anon` 客户端受策略限制，只能操作自己的数据
- 服务端 API 路由使用 `anon` 密钥时，没有认证上下文

### 解决方案
使用 `service_role` 密钥（服务端专用）绕过 RLS：

```typescript
// ❌ 错误 - 使用 anon 密钥
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // 受 RLS 限制
);

// ✅ 正确 - 使用 service_role 密钥
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // 绕过 RLS
);
```

### 影响范围
- `app/api/error-session/route.ts` - 创建错题会话
- `app/api/chat/route.ts` - 保存对话消息

### 相关文件
- `.env.local` - 添加 `SUPABASE_SERVICE_ROLE_KEY`
- `api.md` - 存储密钥配置

---

## 2. React 事件处理错误

### 问题描述
按钮的 `onClick` 传递了 React 事件对象给期望字符串参数的函数：

```typescript
// ❌ 错误 - onClick 直接传递 onConfirm
<Button onClick={onConfirm}>
  // React 自动传递 event 对象
  // handleOCRComplete(event: React.MouseEvent) 期望 (text: string)

// ✅ 正确 - 使用箭头函数传递参数
<Button onClick={() => onConfirm(text)}>
  // 显式传递 text 参数
```

### 错误表现
```
Error: Converting circular structure to JSON
at JSON.stringify (<anonymous>:null:null)
at saveErrorSession (file://...js:1527:28)
```

### 解决方案
```typescript
// components/OCRResult.tsx
<Button
  onClick={() => onConfirm(text)}  // 传递 text 参数
  disabled={!text || isProcessing}
>
```

---

## 3. 服务端认证逻辑错误

### 问题描述
在 API 路由中使用 `supabase.auth.getUser()` 获取用户信息：

```typescript
// ❌ 不适合服务端
const { data: { user } } = await supabase.auth.getUser();
// 服务端无认证会话，始终返回 null
```

### 根本原因
- `supabase.auth.getUser()` 依赖客户端的认证会话
- API 路由是无状态的，每个请求独立
- 服务端应该从请求参数获取用户信息

### 解决方案
```typescript
// ✅ 从前端传递 student_id
const { student_id, message, session_id } = await req.json();

// ✅ 直接使用 student_id 保存数据
await supabase
  .from('chat_messages')
  .insert({
    session_id: session_id,
    role: 'user',
    content: message,
    // 不需要 student_id，通过 session_id 关联
  });
```

---

## 4. 数据库设计理解错误

### 问题描述
试图在 `chat_messages` 表中插入 `student_id` 字段，但表结构中没有该字段。

### 数据结构
```sql
-- chat_messages 表结构
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES error_sessions(id),  -- 关联错题会话
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  is_thought BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- ❌ 没有 student_id 字段
```

### 设计意图
- `chat_messages` 通过 `session_id` 关联到 `error_sessions`
- `error_sessions` 表已有 `student_id` 字段
- 不需要冗余存储 `student_id` 在每条消息中

### RLS 策略
```sql
-- 通过 session_id 的所有权验证
CREATE POLICY "Users can view their own chat messages"
  ON chat_messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM error_sessions
      WHERE id = session_id AND student_id = auth.uid()
    )
  );
```

---

## 5. 环境变量热重载问题

### 问题描述
修改 `.env.local` 文件后，`npm run dev` 不会自动重载环境变量。

### 解决方案
需要手动重启开发服务器：
1. 在终端按 `Ctrl+C` 停止
2. 重新运行 `npm run dev`

### 验证方法
```typescript
// 在 API 路由中打印验证
console.log('SUPABASE_SERVICE_ROLE_KEY:',
  process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set'
);
```

---

## 6. Next.js 路由缓存问题

### 问题描述
修改 API 路由代码后，浏览器仍使用旧的缓存代码。

### 解决方案
- **硬刷新** (Ctrl+Shift+R 或 Ctrl+F5)
- 或清除 `.next` 缓存文件夹

---

## 7. 回调函数类型不匹配

### 问题描述
组件期望的回调签名与实际传递的不匹配：

```typescript
// ❌ 类型不匹配
interface OCRResultProps {
  onConfirm: () => void;  // 无参数
}

// ✅ 正确
interface OCRResultProps {
  onConfirm: (text: string) => void;  // 接收 text 参数
}
```

### 解决方案
确保 Props 类型定义与实际使用一致。

---

## 8. 常见开发建议

### 数据库操作
- ✅ 使用 `service_role` 密钥进行服务端操作
- ✅ 通过 `session_id` 关联而非冗余 `student_id`
- ✅ 添加 RLS 策略允许用户操作自己的数据

### API 设计
- ✅ 从请求参数获取用户信息，不依赖 `auth.getUser()`
- ✅ 返回清晰错误消息便于调试
- ✅ 使用 `try-catch` 不中断主流程

### 前端处理
- ✅ 使用箭头函数显式传递参数
- ✅ 硬刷新确保加载最新代码
- ✅ 在控制台打印关键日志便于调试

---

## 9. 快速检查清单

遇到数据库保存问题时，按顺序检查：

1. **环境变量是否配置**
   ```bash
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

2. **使用的是正确密钥**
   - API 路由 → `service_role`
   - 客户端组件 → `anon`

3. **RLS 策略是否存在**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'your_table';
   ```

4. **表结构是否匹配**
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'your_table';
   ```

5. **查看服务器日志**
   ```bash
   # Next.js 开发服务器日志
   # Supabase Dashboard > Logs
   ```
