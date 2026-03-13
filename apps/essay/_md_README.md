# AI Essay Reviewer

> 20年教龄AI名师，为孩子作文把脉诊断

## 开发

```bash
# 安装依赖（在 monorepo 根目录）
pnpm install

# 开发模式
cd apps/essay
pnpm dev
```

## 环境变量

复制 `.env.example` 为 `.env.local` 并填入配置：

```bash
cp .env.example .env.local
```

## 部署

```bash
pnpm build
```

## 与 Socrates 关系

- 共享 Supabase 认证
- 独立部署到 essay.socra.cn
- 数据可通过 API 同步到 Socrates
