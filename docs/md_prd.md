# Project Socrates: Master Design Document

**Target Audience**: AI Coding Assistants (Cursor, Claude Code, Windsurf)
**Role**: Senior Full-Stack Engineer & Product Designer
**Mission**: Build a Socratic error-analysis agent for children, using domestic AI models (DeepSeek + Qwen).

**Current Version**: v1.4.0
**Last Updated**: 2026-02-28
**Status**: ✅ Released & Iterating

---

## v1.4.0 Updates (2026-02-28)

### 新功能：几何图形自动渲染

使用 **JSXGraph** 库实现几何图形的自动绘制：

```
上传图片 → OCR识别 → 检测几何关键词 → AI解析图形结构 → JSXGraph渲染
```

**支持的图形类型**：
- 三角形（等腰、等边、直角、一般）
- 四边形（正方形、矩形、平行四边形、梯形、菱形）
- 圆（圆心、半径、直径、切线）
- 角度（∠、直角标记）
- 组合图形

**关键文件**：
- `components/GeometryRenderer.tsx` - JSXGraph 渲染组件
- `app/api/geometry/route.ts` - 几何图形解析 API
- `types/jsxgraph.d.ts` - TypeScript 类型声明

### 新功能：变式题系统 (v1.3.0)

- AI 根据原题生成相似练习题
- 难度选择（简单/中等/困难）
- 提示系统（逐步揭示）
- 答案校验 + 解析展示

**关键文件**：
- `supabase/add-variant-questions-table.sql` - 数据库表
- `app/api/variants/route.ts` - API 端点
- `components/VariantPractice.tsx` - 前端组件

### 新功能：输入增强 (v1.2.0)

**数学符号快捷输入**：
- 10个符号分类：基础运算、比较、根号、幂次、下标、分数、希腊字母、几何、集合、箭头
- 文件：`components/MathSymbolPicker.tsx`

**图片标注画板**：
- 5种工具：画笔、直线、箭头、文字、橡皮擦
- 6种颜色、3种线宽
- 文件：`components/ImageAnnotator.tsx`

### OCR 符号输出规范

完整的初中数学符号输出规范，禁止 LaTeX 格式：
- 乘号：×（禁止 \times）
- 除号：÷（禁止 \div）
- 分数：a/b（禁止 \frac{}{}）
- 根号：√（禁止 \sqrt{}）
- 几何：∠△≌∽⊥∥（禁止 LaTeX）

---

## v1.0.0 Major Updates (2026-02-26)

### Architecture: Monorepo Migration

从单一项目迁移到 **Turborepo Monorepo** 架构：

```
socra-platform/                    # Monorepo 根目录
├── apps/
│   ├── landing/                   # 落地页 → socra.cn
│   └── socrates/                  # 苏格拉底 → socrates.socra.cn
├── packages/
│   ├── ui/                        # 共享 UI 组件
│   ├── auth/                      # 共享认证模块
│   ├── database/                  # 共享数据库工具
│   └── config/                    # 共享配置
├── pnpm-workspace.yaml
└── turbo.json
```

### New: Landing Page

- **风格**: 教育温馨风
- **Slogan**: AI 引导学习，培养独立思考
- **产品展示**: 3个已上线 + 7个即将上线
- **域名**: https://socra.cn

### OCR System: Cloud Migration

- **云端 OCR**: 通义千问 VL (qwen-vl-max)
- **移除**: Tesseract.js + Python OCR Server
- **优势**: 无需本地服务器、支持复杂数学公式、国内访问稳定

### Deployment Architecture

```
用户(国内) → Cloudflare CDN → Vercel (香港节点 hkg1)
```

### Domain Configuration

| 域名 | 应用 | 状态 |
|------|------|------|
| socra.cn | apps/landing | ✅ |
| socrates.socra.cn | apps/socrates | ✅ |
| essay.socra.cn | 作文批改 (预留) | - |
| planner.socra.cn | 学习规划 (预留) | - |

### UI Updates

- **Favicon**: 浏览器标签页显示 logo
- **Navigation Logo**: 导航栏 logo 替换图标
- **Login/Register Logo**: 登录注册页面 logo

---

## Development Progress Summary

| Module | Status | Completion |
|--------|--------|------------|
| Monorepo Architecture | ✅ Complete | 100% |
| Landing Page | ✅ Complete | 100% |
| Authentication System | ✅ Complete | 100% |
| Student Workbench | ✅ Complete | 100% |
| Parent Dashboard | ✅ Complete | 100% |
| Error Book | ✅ Complete | 100% |
| Achievement System | ✅ Complete | 100% |
| Community System | ✅ Complete | 100% |
| **Variant Questions** | ✅ Complete | 100% |
| **Geometry Rendering** | ✅ Complete | 100% |
| P2 Advanced Features | ✅ Complete | 100% |
| Cloud OCR | ✅ Complete | 100% |
| Deployment & CDN | ✅ Complete | 100% |

---

## 1. Tech Stack & Infrastructure

### Framework
- **Next.js**: 16.1.6 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Shadcn/UI
- **PDF**: @react-pdf/renderer
- **Monorepo**: Turborepo + pnpm

### Backend
- **Database**: Supabase (PostgreSQL, Auth, Storage)
- **AI Integration**: Multi-model support
  - 通义千问 (Qwen) - Recommended
  - DeepSeek
  - 豆包 (Doubao)
  - Custom OpenAI-compatible APIs
- **OCR**: 通义千问 VL (Cloud)
- **Offline Storage**: IndexedDB

### AI Models (Domestic)
- **Logic/Chat**: DeepSeek-V3, 通义千问
- **Vision/OCR**: 通义千问 VL-Max (Cloud)
- **Speech (TTS/STT)**: Web Speech API

### Deployment
- **Platform**: Vercel
- **CDN**: Cloudflare
- **Domains**: socra.cn, socrates.socra.cn

---

## 2. Database Schema (Supabase)

### Current Schema (v1.0.0)

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES: Handles multi-user logic (Parent + Students)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  role text check (role in ('admin', 'student', 'parent')),
  display_name text,
  phone text,                    -- NEW: Phone number for login
  grade_level int,               -- 3-6 (Primary/Junior), 7-9 (Middle/Senior)
  theme_preference text check (theme_preference in ('junior', 'senior')),
  parent_id uuid references profiles(id),  -- NEW: Link students to parent
  avatar_url text,
  xp_points int default 0,
  created_at timestamptz default now()
);

-- 2. ERROR_SESSIONS: The core unit of work (one problem)
create table error_sessions (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id),
  subject text check (subject in ('math', 'physics', 'chemistry')),
  original_image_url text,
  extracted_text text,
  status text check (status in ('analyzing', 'guided_learning', 'mastered')) default 'analyzing',
  difficulty_rating int,
  concept_tags text[],
  theme_used text check (theme_used in ('junior', 'senior')),  -- NEW: Track learning mode
  created_at timestamptz default now()
);

-- 3. CHAT_MESSAGES: History of the Socratic dialogue
create table chat_messages (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references error_sessions(id) on delete cascade,
  role text check (role in ('user', 'assistant', 'system')),
  content text,
  is_thought boolean default false,
  created_at timestamptz default now()
);

-- 4. REVIEW_SCHEDULE: Ebbinghaus Spaced Repetition Logic
create table review_schedule (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references error_sessions(id) on delete cascade,
  student_id uuid references profiles(id),
  review_stage int default 1,
  next_review_at timestamptz not null,
  is_completed boolean default false,
  variant_question_text text,
  created_at timestamptz default now()
);

-- 5. STUDY_SESSIONS: Learning time tracking
create table study_sessions (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id),
  session_type text check (session_type in ('error_analysis', 'review')),
  start_time timestamptz default now(),
  end_time timestamptz,
  duration_seconds int
);

-- 6. LEARNING_REPORTS: Weekly/Monthly reports
create table learning_reports (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id),
  report_type text check (report_type in ('weekly', 'monthly')),
  period_start date not null,
  period_end date not null,
  total_errors_analyzed int default 0,
  total_reviews_completed int default 0,
  mastery_rate numeric(5,2),
  weak_points jsonb,
  total_study_minutes int default 0,
  generated_at timestamptz default now()
);

-- Views for stats
create view student_stats as
select
  student_id,
  count(*) as total_errors,
  count(*) filter (where status = 'mastered') as mastered_count
from error_sessions
group by student_id;
```

### Migration Files
- ✅ `add-parent-id-column.sql` - Link students to parents
- ✅ `add-phone-column.sql` - Phone number support
- ✅ `fix-profile-role-constraint.sql` - Add 'parent' role
- ✅ `add-theme-used-column.sql` - Track learning mode

---

## 3. AI Provider Configuration

**File**: `lib/ai-models/`

```typescript
// lib/ai-models/config.ts
// Supports multiple AI providers

export const AVAILABLE_MODELS = [
  {
    id: 'qwen-turbo',
    provider: 'qwen',
    name: '通义千问 Turbo',
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    api_key_env: 'DASHSCOPE_API_KEY',
    recommended: true,
    enabled: true,
  },
  {
    id: 'deepseek-chat',
    provider: 'deepseek',
    name: 'DeepSeek Chat',
    base_url: 'https://api.deepseek.com/v1',
    api_key_env: 'AI_API_KEY_LOGIC',
    enabled: false,
  },
  // ... more models
];
```

---

## 4. System Prompts & Personas

### Persona A: "Jasper" (The Explorer)
- **Target**: Grade 3-6 (Junior)
- **Tone**: Fun, encouraging, emojis (🌟, 🚀)
- **Core Rule**: NEVER give the answer
- **UI**: Rounded fonts, orange theme

### Persona B: "Logic" (The Architect)
- **Target**: Grade 7-9 (Senior)
- **Tone**: Serious, concise, Socratic
- **Core Rule**: Focus on logic gaps
- **UI**: Dark mode, monospace font

---

## 5. UI/UX Architecture

### Navigation Layout (Implemented: 方案二 - 分层卡片设计)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🏆 Socrates                                            [🔔] [👤 用户 ▼] │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │ 📚 工作台 │ │ 📖 错题本 │ │ 📅 复习  │ │ ⚙️ 设置  │                   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │
├─────────────────────────────────────────────────────────────────────────┤
│                          页面内容区域                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Components
- `GlobalNav.tsx` - 全局导航栏
- `ImageUploader.tsx` - 图片上传 (动画渐变边框)
- `ChatMessage.tsx` - 聊天消息 (AI/用户区分色块)
- `ChatInput.tsx` - 聊天输入 (语音支持)

---

## 6. Completed Features

### Authentication System (100%)
- ✅ Phone number login/register
- ✅ Role selection (Junior/Senior/Parent)
- ✅ Role-based access control
- ✅ Session persistence (HTTP/HTTPS compatible)

### Student Workbench (95%)
- ✅ Image upload with drag & drop
- ✅ OCR text recognition
- ✅ AI Socratic tutoring
- ✅ Learning time tracking
- ✅ PDF export (Chinese font support)
- ✅ Voice input
- ✅ Theme tracking

### Parent Dashboard (90%)
- ✅ Student selection
- ✅ Learning statistics
- ✅ Heatmap visualization
- ✅ Weak knowledge points
- ✅ Add/delete students
- ✅ Permission verification
- ✅ Theme mode statistics

### P2 Advanced Features (100%)
- ✅ AI model switching
- ✅ Multi-device sync
- ✅ Offline mode

---

## 7. Pending Features

### High Priority (Phase 3)
- [x] ~~Parent AI conversation analysis~~ ✅ v1.0.0
- [ ] Review reminder system (微信模板消息)
- [ ] Learning report generation optimization
- [ ] PDF export optimization

### Medium Priority (Phase 4)
- [ ] Multi-subject expansion
- [ ] Social features enhancement (积分、徽章、排行榜)
- [ ] Performance optimization
- [ ] PWA support

---

## 8. Bug Fixes

### v1.0.0 (2026-02-26)

| Issue | Fix | Date |
|-------|-----|------|
| OCR localhost:8000 not accessible | Migrate to cloud OCR (Qwen VL) | 2026-02-26 |
| Tesseract.js CDN blocked in China | Use domestic cloud OCR API | 2026-02-26 |
| OCR $ symbols for spaces | Update OCR prompt instructions | 2026-02-26 |
| Vercel slow in China | Configure Cloudflare CDN | 2026-02-26 |
| AI chat mock responses | Add DASHSCOPE_API_KEY to Vercel | 2026-02-26 |
| Tailwind CSS v4 PostCSS error | Use @tailwindcss/postcss package | 2026-02-26 |
| radix-ui import errors | Change to @radix-ui/react-* | 2026-02-26 |
| Logo not showing | Add favicon + Image components | 2026-02-26 |

### v0.99 (2026-02-25)

| Issue | Fix | Date |
|-------|-----|------|
| PDF Chinese garbled | Register NotoSansSC font | 2026-02-25 |
| Login state lost | Cookie secure flag conditional | 2026-02-25 |
| Student can access parent | Role permission control | 2026-02-25 |
| Modal overlay too dark | bg-black/50 → bg-black/30 | 2026-02-25 |
| Image display incomplete | object-cover → object-contain | 2026-02-25 |

---

## 9. Critical Rules for AI Developer

1. **Latency Handling**: Always show skeleton loader during OCR
2. **No Hallucinations**: Use standard Shadcn components
3. **Error Boundaries**: Provide "Retry" or "Edit Text" button
4. **Domestic First**: Use custom configured AI providers
5. **Theme Tracking**: Always save theme_used when creating error sessions
6. **Permission Control**: Verify role before accessing parent features

---

## 10. File Structure

### Monorepo Structure (v1.0.0)

```
socra-platform/                    # Monorepo 根目录
├── apps/
│   ├── landing/                   # 落地页 (socra.cn)
│   │   ├── app/
│   │   │   ├── page.tsx           # 首页
│   │   │   └── layout.tsx         # 根布局
│   │   ├── public/
│   │   │   └── logo.png           # Logo
│   │   └── package.json
│   │
│   └── socrates/                  # 苏格拉底 (socrates.socra.cn)
│       ├── app/
│       │   ├── (auth)/            # Login, Register, Select-profile
│       │   ├── (parent)/          # Dashboard
│       │   ├── (student)/         # Workbench, Error-book, Achievements, Review, Settings
│       │   ├── api/               # All API routes
│       │   │   ├── ocr/           # Cloud OCR (Qwen VL)
│       │   │   ├── chat/          # AI Chat API
│       │   │   └── ...
│       │   └── layout.tsx
│       ├── components/            # React components
│       │   ├── GlobalNav.tsx      # 导航栏 (含 logo)
│       │   ├── ImageUploader.tsx
│       │   ├── ChatMessage.tsx
│       │   └── ...
│       ├── lib/
│       │   ├── ai-models/         # Multi-model AI service
│       │   ├── contexts/          # React Context (Auth, Sync, Offline)
│       │   ├── pdf/               # PDF export components
│       │   ├── offline/           # Offline mode support
│       │   ├── sync/              # Multi-device sync
│       │   └── supabase/          # Database client & types
│       ├── supabase/              # SQL migrations
│       └── public/
│           └── logo.png           # Logo
│
├── packages/
│   ├── ui/                        # 共享 UI 组件 (预留)
│   ├── auth/                      # 共享认证模块 (预留)
│   ├── database/                  # 共享数据库工具 (预留)
│   └── config/                    # 共享配置 (预留)
│
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

### Legacy Structure (v0.99)

```
socrates-app/
├── app/
│   ├── (auth)/           # Login, Register, Select-profile
│   ├── (parent)/         # Dashboard
│   ├── (student)/        # Workbench, Error-book, Achievements, Review, Settings
│   ├── api/              # All API routes
│   └── layout.tsx
├── components/           # React components
├── lib/
│   ├── ai-models/       # Multi-model AI service
│   ├── contexts/        # React Context (Auth, Sync, Offline)
│   ├── pdf/             # PDF export components
│   ├── offline/         # Offline mode support
│   ├── sync/            # Multi-device sync
│   └── supabase/        # Database client & types
├── supabase/            # SQL migrations
└── backend/             # Python OCR server (已移除)
```

---

*This document is updated as development progresses.*
