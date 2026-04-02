# Socra Platform - Lessons Learned

> 最后更新: 2026-04-02
> 目的: 汇总这轮开发、调试、部署、测试与文档整理中已经反复验证过的经验，避免重复踩坑

---

## 1. 服务端写库不要误用 `anon` 客户端

### 结论

- 需要绕过 RLS 的服务端写操作，必须使用 `SUPABASE_SERVICE_ROLE_KEY`
- 前端组件和浏览器态调用，才使用 `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 典型问题

```text
new row violates row-level security policy
code: 42501
```

### 原因

- RLS 开着时，`anon` 客户端只能在策略允许范围内访问
- API 路由如果没有正确认证上下文，直接写库很容易被 RLS 拒绝

### 经验

- 服务端写库前先确认当前客户端身份
- 先分清“需要用户态鉴权”还是“需要服务端强权限”

---

## 2. API 路由不要假设浏览器认证上下文天然存在

### 结论

- API 路由里不能想当然依赖 `supabase.auth.getUser()` 获取稳定用户
- 服务端无状态场景下，优先从请求参数、服务端 session 或明确的业务关联字段取用户身份

### 典型误区

- 以为 API 路由里的 Supabase 客户端自动带浏览器登录态
- 以为拿不到用户一定是 Supabase 出错

### 经验

- 先定义接口输入，再定义服务端鉴权方式
- 不要把“认证问题”和“业务字段缺失”混为一类

---

## 3. 表关系要按真实所有权建模，避免冗余字段

### 结论

- `chat_messages` 这类从属表不必冗余存 `student_id`
- 通过 `session_id -> error_sessions -> student_id` 的链路校验所有权更稳

### 经验

- 写数据前先核对真实表结构
- 先确认字段应该“直接存在”还是“通过外键关系取得”
- RLS 策略设计要沿真实所有权链路写

---

## 4. React 事件回调最容易在参数签名上出错

### 典型问题

- 把 `onClick={fn}` 直接传给一个本来期望业务参数的回调
- React 自动塞进来的 `event` 对象被错误当成业务数据

### 典型后果

```text
Converting circular structure to JSON
```

### 经验

- 组件 props 先写清楚参数签名
- 需要传业务参数时，用箭头函数显式包一层
- 前端事件对象和业务 payload 永远不要混用

---

## 5. 环境变量、缓存和热更新问题要先排除

### 已验证结论

- 修改 `.env.local` 后，开发服务器通常需要重启
- 改了 API 或路由逻辑后，浏览器缓存和 Next 本地缓存都可能让你误判

### 经验

- 改环境变量后先重启服务
- 改 API 后先硬刷新
- 如果现象异常且无法解释，先怀疑缓存，再怀疑业务逻辑

---

## 6. Windows 本地构建问题，很多不是代码错，而是运行态没关干净

### 这轮反复验证的问题

- 本地 Socrates 服务没停干净时，Windows 会锁住 `.next` 文件
- 典型表现是构建或清理阶段出现 `EPERM unlink`
- 之前多次出现在 `app-path-routes-manifest.json` 等构建产物上

### 当前稳定做法

- 本机基线统一用 Node `22.x`
- 先跑 `pnpm check:node`
- 启动、查看状态、关闭本地 Socrates 用这些命令:

```bash
pnpm socrates:start:local
pnpm socrates:status:local
pnpm socrates:stop:local
```

### 经验

- 构建前确认没有残留本地进程
- 遇到 `EPERM unlink` 先查运行态，不要先怀疑代码
- 长时间卡住时优先查端口、PID、锁文件和本地 guard 输出

---

## 7. 本地长时间卡住时，不要盲等

### 这轮新增的有效做法

- 对本地启动、smoke、build 引入 guard
- 超过阈值后自动停掉命令并打印诊断，而不是无限等

### 经验

- 长时间无输出不等于还在正常执行
- 先看 guard 给出的状态和日志，再决定是否重试
- 遇到“像卡死一样慢”的情况，优先看本地环境和进程冲突

---

## 8. Vercel 绑定错误比代码错误更常见

### 已验证结论

- Socrates 正式生产项目只认 `socra-socrates`
- `socrates` 是误创建的重复项目，不能拿来部署或诊断
- Root Directory 没指向 `apps/socrates` 时，远端构建很容易报:

```text
No Next.js version detected
```

### 当前稳定做法

```bash
pnpm check:vercel-links
```

### 经验

- 做任何手工 Vercel 操作前，先查项目绑定
- 单看 CLI 报错不够，要把“项目绑定、Root Directory、ignoreCommand”一起看

---

## 9. 自定义域名异常时，先区分应用回归和链路问题

### 已验证结论

- `socrates.socra.cn` 异常时，优先怀疑 Cloudflare / 自定义域名链路
- `https://socra-platform.vercel.app` 是验证应用本体是否健康的重要对照
- 某些机器对 `*.vercel.app` 也会出现 DNS / 网络路径异常，单机结果不能直接当最终结论

### 当前稳定做法

```bash
pnpm probe:socrates-domain
```

### 判定顺序

1. 先看主域名
2. 再看 alias
3. alias 正常而主域名异常，先查 Cloudflare
4. alias 也异常时，再换机器或换网络复核

---

## 10. Smoke 失败时，先查 migration 和测试前置，不要立刻改代码

### 已验证结论

- `/api/study/assets` 失败，可能是 `study_assets` 相关 migration 没上
- transfer-evidence 的验证要区分:
  - 学生闭环是否成立
  - 家长跟进任务是否生成
  - 通知元数据是否同步

### 经验

- smoke 报错先分“代码错”还是“环境/数据没准备好”
- 先补 migration，再谈业务回归
- 有主域名问题时，用 alias 重跑同一套 smoke

---

## 11. 文档治理也需要像代码一样做收束

### 这轮踩过的问题

- 同一主题连续生成多份切片文档，后续检索成本会急剧升高
- 有些旧文档本身被编码污染，继续在上面增量修改风险很高
- 如果没有主文档入口，后续接手容易回到过时方案

### 当前稳定规则

- 主入口优先看 `docs/md_README_DOCS.md`
- 发布只维护一份主文档: `md_RELEASE_RUNBOOK.md`
- 国内部署与网络诊断只维护一份主文档: `md_deployment_cn.md`
- 人工验收只维护一份主文档: `md_TEST_GUIDE.md`
- 完整重测执行按 `md_socrates_full_test_execution_20260402.md`
- 同一主题出现多份切片后，要 rollup，再清理旧叶子稿

### 经验

- 不要继续从已清理过的冗余文档重新起步
- 文档一旦进入主入口，就要同步更新索引和进度文档
- 对已编码污染的旧稿，优先新建干净主文档，不要在脏稿上硬修

---

## 12. 当前最实用的调试顺序

遇到问题时，建议按这个顺序排查:

1. 先看当前是不是主文档里定义的正确环境
2. 先查 Node、env、Vercel 绑定
3. 再查本地运行态和 `.next` 锁定问题
4. 再查 migration 是否齐全
5. 再看 smoke 结果
6. 最后才去改业务代码

---

## 13. 快速检查清单

```bash
pnpm check:node
pnpm check:env
pnpm check:vercel-links
pnpm socrates:status:local
pnpm probe:socrates-domain
pnpm smoke:socrates
pnpm smoke:study-flow
pnpm smoke:transfer-evidence
```

如果问题还没收敛，再补查:

- 当前域名和 alias 是否都失败
- 当前机器是否只有 `*.vercel.app` 异常
- 本地是否仍有 Node / Next 残留进程
- `.next` 是否被 Windows 占用
- Supabase migration 是否完整
