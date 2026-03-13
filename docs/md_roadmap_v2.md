# Socra Platform - 下一阶段规划 (v2.0)

> 2026-03-09 规划文档 | 基于教育系统三端需求深度分析

---

## 一、整体战略

```
┌─────────────────────────────────────────────────────────────────┐
│                        Socra 生态系统                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│   │  合规基础    │ → │  平台整合    │ → │  商业化     │         │
│   └─────────────┘    └─────────────┘    └─────────────┘         │
│          ↓                  ↓                  ↓                │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│   │  学生体验    │    │  家长能力    │    │  B端拓展    │         │
│   └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、需求缺口分析

### 2.1 学生端需求

| 类别 | 当前状态 | 缺失功能 | 重要性 |
|------|----------|----------|--------|
| **学习诊断** | 基础复习计划 | 学习风格诊断、知识图谱、薄弱点分析、智能学习路径 | ⭐⭐⭐ |
| **学科覆盖** | 数学为主 | 语文阅读理解、英语作文/语法、物理化学公式识别 | ⭐⭐⭐ |
| **学习动力** | XP+徽章 | 每日挑战、排行榜、组队学习、虚拟装扮、学习伙伴 | ⭐⭐ |
| **学习工具** | 基础功能 | 错题打印导出、知识闪卡、语音笔记、学习提醒 | ⭐⭐ |
| **社交学习** | 基础社区 | 学习小组、同学互答、老师答疑通道、班级圈子 | ⭐⭐ |

### 2.2 家长端需求

| 类别 | 当前状态 | 缺失功能 | 重要性 |
|------|----------|----------|--------|
| **监督管控** | 仅查看报告 | 学习时段限制、休息提醒强制、内容过滤、使用时长控制 | ⭐⭐⭐ |
| **深度分析** | 基础Dashboard | 周报/月报推送、同龄人对比、知识点热力图、AI学习建议 | ⭐⭐⭐ |
| **多子女** | 单一角色 | 多子女账号管理、子女对比报告、资源公平分配 | ⭐⭐ |
| **家校协同** | 无 | 老师分享通道、家长社群、学习计划协同 | ⭐⭐ |
| **远程干预** | 无 | 远程布置任务、积分/奖励发放、学习后解锁娱乐 | ⭐⭐ |

### 2.3 商业增长需求

| 类别 | 当前状态 | 缺失功能 | 重要性 |
|------|----------|----------|--------|
| **合规安全** | 基础认证 | 青少年模式、隐私保护(COPPA)、内容审核、教育备案 | ⭐⭐⭐ |
| **数据运营** | 无 | 用户行为分析、转化漏斗、A/B测试、用户分层 | ⭐⭐⭐ |
| **渠道拓展** | 无 | 学校/机构B端、教师推荐奖励、线下引流、内容营销 | ⭐⭐⭐ |
| **收入多元** | 仅会员规划 | 单次付费、专题课程、题库销售、学校版授权 | ⭐⭐ |
| **留存召回** | 无 | 流失预警、召回机制、权益递增、社区运营 | ⭐⭐ |

---

## 三、详细功能规划

### 3.1 合规基础 (Phase 0)

#### 3.1.1 青少年模式

```typescript
// 青少年模式配置
interface TeenModeConfig {
  enabled: boolean;
  daily_time_limit: number;        // 每日使用时长限制(分钟)
  allowed_time_slots: {            // 允许使用时段
    start: string;                 // "08:00"
    end: string;                   // "22:00"
  }[];
  rest_reminder_interval: number;  // 休息提醒间隔(分钟)
  force_rest_duration: number;     // 强制休息时长(分钟)
}

// 数据库设计
CREATE TABLE teen_mode_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  daily_time_limit INTEGER DEFAULT 120,
  allowed_time_slots JSONB DEFAULT '[{"start":"08:00","end":"22:00"}]',
  rest_reminder_interval INTEGER DEFAULT 45,
  force_rest_duration INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

// 使用时长记录
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_minutes INTEGER DEFAULT 0,
  sessions JSONB DEFAULT '[]',  // [{start, end, duration}]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

#### 3.1.2 隐私保护

```typescript
// 家长授权机制
interface ParentalConsent {
  id: string;
  parent_id: string;
  child_id: string;
  consent_type: 'data_collection' | 'ai_interaction' | 'social_feature';
  granted_at: Date;
  expires_at: Date | null;
}

// 数据库设计
CREATE TABLE parental_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  UNIQUE(parent_id, child_id, consent_type)
);

// 数据脱敏规则
CREATE TABLE data_masking_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name VARCHAR(100) NOT NULL,
  mask_type VARCHAR(20) NOT NULL,  // 'partial', 'hash', 'remove'
  apply_to_role VARCHAR(20) NOT NULL,  // 'public', 'parent', 'teacher'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.1.3 内容安全

```typescript
// 内容审核配置
interface ContentModeration {
  ai_output_filter: boolean;       // AI输出审核
  user_content_filter: boolean;    // 用户内容过滤
  sensitive_words: string[];       // 敏感词库
  image_scan: boolean;             // 图片扫描
}

// 审核日志
CREATE TABLE moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50) NOT NULL,  // 'ai_response', 'user_post', 'image'
  content_id UUID,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(20) NOT NULL,        // 'approved', 'rejected', 'flagged'
  reason TEXT,
  moderator_type VARCHAR(20) NOT NULL,  // 'ai', 'human'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### 3.2 学习诊断增强 (Phase 1.5)

#### 3.2.1 知识图谱

```typescript
// 学科知识点树
interface KnowledgeNode {
  id: string;
  subject: string;           // 学科
  grade: string;             // 年级
  name: string;              // 知识点名称
  parent_id: string | null;  // 父节点
  level: number;             // 层级
  description: string;       // 描述
  related_formulas: string[]; // 相关公式
  difficulty: 1 | 2 | 3 | 4 | 5;
}

// 数据库设计
CREATE TABLE knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject VARCHAR(50) NOT NULL,
  grade VARCHAR(20) NOT NULL,
  name VARCHAR(200) NOT NULL,
  parent_id UUID REFERENCES knowledge_nodes(id),
  level INTEGER NOT NULL,
  description TEXT,
  related_formulas JSONB DEFAULT '[]',
  difficulty INTEGER DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_knowledge_subject_grade ON knowledge_nodes(subject, grade);

// 用户知识点掌握度
CREATE TABLE user_knowledge_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  knowledge_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  mastery_level DECIMAL(3,2) DEFAULT 0,  -- 0.00 - 1.00
  practice_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  last_practice_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, knowledge_id)
);

CREATE INDEX idx_mastery_user ON user_knowledge_mastery(user_id);
```

#### 3.2.2 学习风格诊断

```typescript
// 学习风格类型
type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading';

// 诊断问卷
interface StyleQuestion {
  id: string;
  question: string;
  options: {
    text: string;
    style: LearningStyle;
  }[];
}

// 用户风格档案
interface LearningStyleProfile {
  user_id: string;
  primary_style: LearningStyle;
  secondary_style: LearningStyle | null;
  scores: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    reading: number;
  };
  recommendations: string[];
  assessed_at: Date;
}

// 数据库设计
CREATE TABLE learning_style_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  visual_score DECIMAL(3,2) DEFAULT 0,
  auditory_score DECIMAL(3,2) DEFAULT 0,
  kinesthetic_score DECIMAL(3,2) DEFAULT 0,
  reading_score DECIMAL(3,2) DEFAULT 0,
  primary_style VARCHAR(20) NOT NULL,
  secondary_style VARCHAR(20),
  recommendations JSONB DEFAULT '[]',
  assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

#### 3.2.3 对比分析

```typescript
// 同龄人对比数据
interface PeerComparison {
  user_id: string;
  subject: string;
  user_score: number;
  peer_average: number;
  peer_percentile: number;  // 百分位
  grade_level: string;
  region: string;
}

// 数据库设计 - 聚合统计表
CREATE TABLE peer_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject VARCHAR(50) NOT NULL,
  grade VARCHAR(20) NOT NULL,
  region VARCHAR(50) DEFAULT 'china',
  stat_date DATE NOT NULL,
  avg_score DECIMAL(5,2),
  median_score DECIMAL(5,2),
  percentile_25 DECIMAL(5,2),
  percentile_75 DECIMAL(5,2),
  sample_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subject, grade, region, stat_date)
);

// 进步趋势预测
interface ProgressPrediction {
  user_id: string;
  subject: string;
  current_level: number;
  predicted_level_30d: number;
  predicted_level_90d: number;
  confidence: number;
  factors: string[];  // 影响因素
}
```

---

### 3.3 家长能力增强 (Phase 2.5)

#### 3.3.1 多子女管理

```typescript
// 家庭组
interface FamilyGroup {
  id: string;
  name: string;
  owner_id: string;  // 家长ID
  members: FamilyMember[];
  created_at: Date;
}

interface FamilyMember {
  user_id: string;
  role: 'parent' | 'child';
  nickname: string;
  joined_at: Date;
}

// 数据库设计
CREATE TABLE family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('parent', 'child')),
  nickname VARCHAR(50),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

CREATE INDEX idx_family_members_user ON family_members(user_id);
CREATE INDEX idx_family_members_family ON family_members(family_id);
```

#### 3.3.2 远程干预

```typescript
// 家长布置的任务
interface ParentTask {
  id: string;
  parent_id: string;
  child_id: string;
  title: string;
  description: string;
  task_type: 'error_review' | 'essay_write' | 'study_time' | 'custom';
  target_value: number;
  reward_points: number;
  deadline: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  completed_at: Date | null;
}

// 数据库设计
CREATE TABLE parent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  task_type VARCHAR(50) NOT NULL,
  target_value INTEGER DEFAULT 1,
  current_value INTEGER DEFAULT 0,
  reward_points INTEGER DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_parent_tasks_child ON parent_tasks(child_id);
CREATE INDEX idx_parent_tasks_parent ON parent_tasks(parent_id);

// 奖励发放记录
CREATE TABLE reward_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason VARCHAR(200),
  related_task_id UUID REFERENCES parent_tasks(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.3.3 周报推送

```typescript
// 推送配置
interface PushConfig {
  user_id: string;
  push_type: 'weekly_report' | 'daily_summary' | 'alert';
  channels: ('wechat' | 'email' | 'app_push')[];
  push_time: string;  // "HH:mm"
  enabled: boolean;
}

// 数据库设计
CREATE TABLE push_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  push_type VARCHAR(50) NOT NULL,
  channels JSONB DEFAULT '["app_push"]',
  push_time VARCHAR(5) DEFAULT '20:00',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, push_type)
);

// 周报模板
interface WeeklyReport {
  child_id: string;
  parent_id: string;
  period: { start: Date; end: Date };
  summary: {
    total_study_time: number;
    errors_reviewed: number;
    essays_completed: number;
    streak_days: number;
  };
  highlights: string[];
  areas_to_improve: string[];
  peer_comparison: PeerComparison[];
  ai_recommendations: string[];
}
```

---

### 3.4 平台整合 (原规划)

#### 3.4.1 统一用户系统

**目标**: Socrates + Essay 数据打通，统一学习报告

```typescript
// 统一学习数据模型
interface UnifiedLearningData {
  user_id: string;

  // 错题数据 (from Socrates)
  errors: {
    total: number;
    mastered: number;
    by_subject: Record<string, number>;
  };

  // 作文数据 (from Essay)
  essays: {
    total: number;
    avg_score: number;
    recent_titles: string[];
  };

  // 学习时长 (from Planner)
  study_time: {
    weekly_minutes: number;
    daily_average: number;
    streak_days: number;
  };

  // 统一积分
  points: number;
  level: number;
}
```

#### 3.4.2 统一积分系统

| 行为 | 积分 | 说明 |
|------|------|------|
| 错题学习完成 | +10 XP | 每道错题 |
| 作文批改完成 | +15 XP | 每篇作文 |
| 连续学习 | +5 XP/天 | 连续学习奖励 |
| 邀请好友 | +50 XP | 每成功邀请 |
| 完成家长任务 | +20 XP | 额外奖励 |

| 等级 | 所需积分 | 称号 |
|------|----------|------|
| 1 | 0 | 学习新手 |
| 2 | 100 | 学习达人 |
| 3 | 300 | 学霸 |
| 5 | 800 | 学霸达人 |
| 10 | 3000 | 学神预备 |
| 15 | 10000 | 学神 |

---

### 3.5 用户增长 (原规划)

#### 3.5.1 邀请奖励系统

```
用户 A 分享邀请码 → 好友 B 注册 → 双方获得奖励
```

| 阶段 | 条件 | 奖励 |
|------|------|------|
| 注册 | 新用户注册 | 7天 Pro 会员 |
| 首次学习 | 完成首次学习 | +50 XP |
| 邀请人奖励 | 被邀请人注册 | +100 XP |

#### 3.5.2 学习打卡分享

- 今日学习时长
- 完成的错题/作文数
- 连续学习天数
- 徽章成就
- 分享渠道: 微信朋友圈、微信好友、生成图片

---

### 3.6 商业化 (原规划)

#### 3.6.1 会员体系

| 功能 | 免费版 | Pro版 |
|------|--------|-------|
| 错题学习 | 5次/天 | 无限制 |
| AI对话轮数 | 20轮/题 | 无限制 |
| 作文批改 | 3次/周 | 无限制 |
| 几何画板 | 基础 | 高级 |
| 复习计划 | 基础 | AI优化 |
| 时间规划 | 基础 | AI优化 |
| 学习报告 | 基础 | 详细分析 |
| 历史记录 | 7天 | 永久 |
| PDF导出 | 3次/月 | 无限制 |

| 方案 | 价格 | 适合 |
|------|------|------|
| 月卡 | ¥29/月 | 试用用户 |
| 季卡 | ¥79/季 (省10%) | 稳定用户 |
| 年卡 | ¥249/年 (省30%) | 忠实用户 |

#### 3.6.2 订阅系统

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'yearly'
  status VARCHAR(20) NOT NULL, -- 'active', 'cancelled', 'expired'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(50), -- 'wechat', 'alipay'
  payment_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### 3.7 B端拓展 (Phase 3.5)

#### 3.7.1 学校版功能

```typescript
// 学校/班级管理
interface School {
  id: string;
  name: string;
  type: 'primary' | 'middle' | 'high';
  region: string;
  admin_id: string;
  license_expiry: Date;
}

interface ClassGroup {
  id: string;
  school_id: string;
  name: string;
  grade: string;
  teacher_id: string;
  student_count: number;
}

// 数据库设计
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('primary', 'middle', 'high')),
  region VARCHAR(100),
  admin_id UUID REFERENCES auth.users(id),
  license_expiry TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE class_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  grade VARCHAR(20) NOT NULL,
  teacher_id UUID REFERENCES auth.users(id),
  invite_code VARCHAR(10) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE class_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES class_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'student')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, user_id)
);
```

#### 3.7.2 教师Dashboard

```typescript
// 教师视图数据
interface TeacherDashboard {
  class_id: string;
  summary: {
    total_students: number;
    active_today: number;
    avg_study_time: number;
    total_errors_reviewed: number;
  };
  student_rankings: {
    user_id: string;
    name: string;
    points: number;
    study_time: number;
    errors_mastered: number;
  }[];
  weak_knowledge_points: {
    knowledge_id: string;
    name: string;
    avg_mastery: number;
    student_count: number;
  }[];
  alerts: {
    type: 'low_activity' | 'declining_performance';
    student_id: string;
    message: string;
  }[];
}
```

#### 3.7.3 教师推荐奖励

```typescript
// 推荐记录
interface TeacherReferral {
  id: string;
  teacher_id: string;
  school_name: string;
  contact_person: string;
  contact_phone: string;
  status: 'pending' | 'contacted' | 'converted' | 'rejected';
  reward_points: number;
  reward_status: 'pending' | 'paid';
  created_at: Date;
}

// 数据库设计
CREATE TABLE teacher_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(100),
  contact_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  reward_points INTEGER DEFAULT 500,
  reward_status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### 3.8 数据运营 (Phase 4)

#### 3.8.1 用户行为分析

```typescript
// 事件追踪
interface AnalyticsEvent {
  user_id: string;
  event_name: string;
  event_properties: Record<string, any>;
  device_info: {
    platform: string;
    os_version: string;
    app_version: string;
  };
  timestamp: Date;
}

// 关键事件定义
const TRACKING_EVENTS = {
  // 用户获取
  'signup_complete': { channel: string, invite_code: string },
  'first_error_upload': { subject: string },
  'first_essay_submit': { grade: string },

  // 用户激活
  'first_ai_chat': { duration: number },
  'first_focus_session': { duration: number },
  'first_review_complete': { error_id: string },

  // 用户留存
  'daily_login': { streak_days: number },
  'study_session_complete': { duration: number, type: string },

  // 转化
  'subscription_view': { plan: string },
  'subscription_start': { plan: string, payment_method: string },

  // 推荐
  'invite_shared': { channel: string },
  'share_created': { type: string, platform: string }
};
```

#### 3.8.2 转化漏斗

```
┌─────────────────────────────────────────────────────────────┐
│                     转化漏斗模型                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│   访问着陆页     ──────────────────────→  100%              │
│        ↓                                                      │
│   注册账号       ──────────────────────→   40%              │
│        ↓                                                      │
│   首次使用       ──────────────────────→   60% (of reg)     │
│        ↓                                                      │
│   完成核心功能   ──────────────────────→   40% (of act)     │
│        ↓                                                      │
│   7日留存        ──────────────────────→   25%              │
│        ↓                                                      │
│   查看会员页     ──────────────────────→   15%              │
│        ↓                                                      │
│   付费转化       ──────────────────────→    5%              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

#### 3.8.3 流失预警

```typescript
// 流失风险评分
interface ChurnRiskScore {
  user_id: string;
  risk_level: 'low' | 'medium' | 'high';
  risk_score: number;  // 0-100
  factors: {
    factor: string;
    weight: number;
    value: number;
  }[];
  last_activity: Date;
  predicted_churn_date: Date;
}

// 流失因素
const CHURN_FACTORS = {
  'days_since_last_login': { weight: 0.3, threshold: 7 },
  'declining_session_frequency': { weight: 0.2, threshold: -0.3 },
  'low_feature_adoption': { weight: 0.15, threshold: 0.3 },
  'no_subscription': { weight: 0.15, threshold: true },
  'negative_feedback': { weight: 0.1, threshold: 1 },
  'low_engagement_score': { weight: 0.1, threshold: 0.2 }
};
```

---

## 四、实施路线图

### Phase 0: 合规基础 (1周)

| 任务 | 交付物 | 优先级 |
|------|--------|--------|
| 青少年模式 | teen_mode_settings, usage_logs | P0 |
| 使用时长追踪 | 前端计时 + 后端记录 | P0 |
| 隐私协议更新 | 用户协议、隐私政策 | P0 |
| 家长授权机制 | parental_consents | P1 |

### Phase 1: 基础设施 (2周)

| 任务 | 交付物 | 优先级 |
|------|--------|--------|
| 统一积分系统 | socra_points, point_transactions | P0 |
| 邀请码系统 | invite_codes | P0 |
| 统一报告API | /api/unified/report | P1 |
| 数据同步 | Essay 同步到 Socrates | P1 |

### Phase 1.5: 学习诊断 (2周)

| 任务 | 交付物 | 优先级 |
|------|--------|--------|
| 知识图谱数据 | knowledge_nodes (数学) | P0 |
| 知识点掌握度 | user_knowledge_mastery | P0 |
| 学习风格测试 | 诊断问卷 + 结果页 | P1 |
| 同龄人对比 | peer_statistics | P2 |

### Phase 2: 用户增长 (2周)

| 任务 | 交付物 | 优先级 |
|------|--------|--------|
| 邀请页面 | /invite 页面 | P0 |
| 奖励发放逻辑 | 注册奖励、邀请奖励 | P0 |
| 分享图片生成 | Canvas 分享图 | P1 |
| 微信分享SDK | JSSDK集成 | P1 |

### Phase 2.5: 家长增强 (2周)

| 任务 | 交付物 | 优先级 |
|------|--------|--------|
| 多子女管理 | family_groups, family_members | P0 |
| 统一报告视图 | 多子女Dashboard | P0 |
| 远程任务 | parent_tasks | P1 |
| 周报推送 | 推送配置 + 模板 | P1 |

### Phase 3: 商业化 (3周)

| 任务 | 交付物 | 优先级 |
|------|--------|--------|
| 订阅系统 | subscriptions | P0 |
| Pro权限检查 | 中间件 + 前端控制 | P0 |
| 微信支付集成 | 支付API | P0 |
| 会员页面 | 定价页 + 权益说明 | P0 |
| 首月优惠 | 优惠码系统 | P1 |

### Phase 3.5: B端拓展 (3周)

| 任务 | 交付物 | 优先级 |
|------|--------|--------|
| 学校/班级管理 | schools, class_groups | P0 |
| 教师Dashboard | 班级数据视图 | P0 |
| 批量账号导入 | Excel导入 | P1 |
| 教师推荐奖励 | teacher_referrals | P2 |

### Phase 4: 数据运营 (持续)

| 任务 | 交付物 | 优先级 |
|------|--------|--------|
| 事件追踪系统 | 埋点 + 数据收集 | P0 |
| 转化漏斗分析 | Dashboard | P1 |
| 流失预警模型 | 风险评分算法 | P1 |
| A/B测试框架 | 实验平台 | P2 |

---

## 五、时间规划

```
2026年3月
├── W1: Phase 0 - 合规基础
├── W2: Phase 1 - 基础设施 (积分系统)
└── W3-4: Phase 1.5 - 学习诊断

2026年4月
├── W1-2: Phase 2 - 用户增长
└── W3-4: Phase 2.5 - 家长增强

2026年5月
├── W1-3: Phase 3 - 商业化
└── W4: Phase 3.5 启动 - B端拓展

2026年6月+
├── Phase 3.5 完成 - B端拓展
└── Phase 4 - 数据运营持续迭代
```

---

## 六、成功指标

### 用户增长

| 指标 | 当前 | 3个月目标 | 6个月目标 |
|------|------|-----------|-----------|
| DAU | - | 1,000 | 5,000 |
| MAU | - | 5,000 | 20,000 |
| 邀请转化率 | - | 15% | 20% |
| 分享率 | - | 10% | 15% |

### 商业化

| 指标 | 当前 | 3个月目标 | 6个月目标 |
|------|------|-----------|-----------|
| 付费转化率 | - | 5% | 8% |
| ARPU | - | ¥25/月 | ¥35/月 |
| MRR | - | ¥25,000/月 | ¥100,000/月 |

### 产品指标

| 指标 | 当前 | 3个月目标 | 6个月目标 |
|------|------|-----------|-----------|
| 次日留存 | - | 40% | 50% |
| 7日留存 | - | 20% | 30% |
| 用户满意度 | - | 4.5/5 | 4.7/5 |

### B端指标

| 指标 | 当前 | 6个月目标 |
|------|------|-----------|
| 合作学校 | - | 10 |
| 班级数量 | - | 50 |
| B端学生数 | - | 2,000 |

---

## 七、风险与对策

| 风险 | 影响 | 概率 | 对策 |
|------|------|------|------|
| 支付接入延迟 | 高 | 中 | 优先微信支付，备用支付宝 |
| 免费用户反感 | 中 | 中 | 限制宽松，强调Pro增值 |
| 邀请作弊 | 中 | 中 | 设备指纹 + 行为检测 |
| 服务器成本 | 中 | 低 | 按量付费，缓存优化 |
| 合规问题 | 高 | 低 | 青少年模式优先 |
| B端销售周期长 | 中 | 高 | C端先行，B端跟进 |

---

## 八、页面布局规划

### 8.1 Landing Page 布局

#### 当前结构 → 规划结构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Landing Page (socra.cn)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  【当前】Nav: 产品 | 关于 | 开始学习                                         │
│  【规划】Nav: 产品 | 定价 | 关于 | 登录 | 开始学习                           │
│                                                                              │
│  【当前】Hero: 立即体验                                                      │
│  【规划】Hero: 免费体验 | 查看定价                                           │
│                                                                              │
│  【新增区块】                                                                │
│  - 用户评价轮播                                                              │
│  - FAQ 常见问题                                                              │
│                                                                              │
│  【Footer 新增】                                                             │
│  - 产品链接 | 定价链接 | 隐私政策 | 用户协议                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Landing 新增页面

| 路由 | 页面 | Phase |
|------|------|-------|
| `/pricing` | 定价页 | Phase 3 |
| `/privacy` | 隐私政策 | Phase 0 |
| `/terms` | 用户协议 | Phase 0 |

---

### 8.2 Socrates 路由规划

#### 当前路由

```
socrates.socra.cn/
├── (auth)/
│   ├── /login                    # 登录
│   ├── /register                 # 注册
│   └── /select-profile           # 角色选择
│
├── (student)/
│   ├── /workbench                # 工作台
│   ├── /error-book               # 错题本
│   ├── /error-book/[id]          # 错题详情
│   ├── /review                   # 复习计划
│   ├── /review/session/[id]      # 复习会话
│   ├── /planner                  # 时间规划
│   ├── /achievements             # 成就系统
│   ├── /reports                  # 学习报告
│   ├── /community                # 社区
│   └── /settings                 # 设置
│
└── (parent)/
    └── /dashboard                # 家长Dashboard
```

#### 规划路由 v2.0

```
socrates.socra.cn/
├── (auth)/
│   ├── /login                    # 登录
│   ├── /register                 # 注册
│   ├── /select-profile           # 角色选择
│   └── /invite?code=XXX          # 邀请注册 ★新增
│
├── (student)/
│   ├── /workbench                # 工作台 (更新:青少年模式提示)
│   ├── /error-book               # 错题本
│   ├── /error-book/[id]          # 错题详情 (更新:关联知识点)
│   ├── /review                   # 复习计划
│   ├── /review/session/[id]      # 复习会话
│   ├── /planner                  # 时间规划 (更新:AI优化)
│   ├── /knowledge                # 知识图谱 ★新增
│   ├── /knowledge/[subject]      # 学科知识点 ★新增
│   ├── /style-test               # 学习风格测试 ★新增
│   ├── /achievements             # 成就系统 (更新:统一积分)
│   ├── /reports                  # 学习报告 (更新:同龄人对比)
│   ├── /invite                   # 邀请好友 ★新增
│   ├── /community                # 社区
│   ├── /subscription             # 会员订阅 ★新增
│   ├── /subscription/success     # 支付成功 ★新增
│   └── /settings                 # 设置 (更新:青少年模式)
│
├── (parent)/
│   ├── /dashboard                # 家长Dashboard (更新:多子女)
│   ├── /family                   # 家庭管理 ★新增
│   ├── /tasks                    # 远程任务 ★新增
│   ├── /reports                  # 周报设置 ★新增
│   └── /controls                 # 管控设置 ★新增
│
└── (school)/                     # Phase 3.5 ★新增
    ├── /dashboard                # 教师Dashboard
    ├── /classes                  # 班级管理
    ├── /students                 # 学生管理
    └── /analytics                # 班级分析
```

---

### 8.3 导航栏规划

#### 学生端导航

```
【当前】
┌───────────────────────────────────────────────────────────────────────┐
│ [Logo]  工作台 | 错题本 | 复习 | 规划 | 成就 | 社区    [头像▼]        │
└───────────────────────────────────────────────────────────────────────┘

【规划 v2.0】
┌───────────────────────────────────────────────────────────────────────┐
│ [Logo] 工作台 | 错题本 | 复习 | 规划 | 知识图谱 | 成就    [头像▼]     │
│                                             ↑ 新增                     │
│ 头像下拉: [我的主页 | 邀请好友 | 会员中心 | 学习风格 | 设置 | 退出]   │
└───────────────────────────────────────────────────────────────────────┘

【底部状态栏 - 新增】
┌───────────────────────────────────────────────────────────────────────┐
│ 🔥 连续学习 7 天  |  ⭐ 1250 XP  |  👑 Lv.5 学霸  |  Pro会员          │
└───────────────────────────────────────────────────────────────────────┘
```

#### 家长端导航

```
【当前】
┌───────────────────────────────────────────────────────────────────────┐
│ [Logo]  Dashboard                                      [切换角色] [头像]│
└───────────────────────────────────────────────────────────────────────┘

【规划 v2.0】
┌───────────────────────────────────────────────────────────────────────┐
│ [Logo] Dashboard | 家庭 | 任务 | 报告 | 管控    [子女选择▼] [头像▼]   │
│                    ↑ 新增                 ↑ 新增      ↑ 新增          │
└───────────────────────────────────────────────────────────────────────┘
```

---

### 8.4 核心页面布局

#### 会员定价页 (/pricing)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  选择你的学习计划 | 免费试用 7 天                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   免费版     │  │   Pro 月卡   │  │   Pro 年卡   │                  │
│  │   ¥0/月     │  │   ¥29/月     │  │   ¥249/年    │                  │
│  │   ★ 最受欢迎 │  │   💰 省30%   │  │              │                  │
│  │ ────────────│  │ ────────────│  │ ────────────│                  │
│  │ ✓ 5次错题/天│  │ ✓ 无限错题  │  │ ✓ 无限错题  │                  │
│  │ ✓ 20轮AI对话│  │ ✓ 无限AI对话│  │ ✓ 无限AI对话│                  │
│  │ ✓ 3次作文/周│  │ ✓ 无限作文  │  │ ✓ 无限作文  │                  │
│  │ ✓ 基础报告  │  │ ✓ 详细报告  │  │ ✓ 详细报告  │                  │
│  │ ✗ 7天历史   │  │ ✓ 永久历史  │  │ ✓ 永久历史  │                  │
│  │ ✗ AI优化    │  │ ✓ AI学习优化│  │ ✓ AI学习优化│                  │
│  │ [当前计划]  │  │ [立即订阅]  │  │ [立即订阅]  │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│  💳 支付方式: 微信支付 | 支付宝                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 邀请好友页 (/invite)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  邀请好友，共同进步 | 双方各得 7 天 Pro 会员 + 100 XP                    │
├─────────────────────────────────────────────────────────────────────────┤
│  你的专属邀请码: [ ABC123 ]                                              │
│  [复制邀请码] [分享给微信好友] [生成分享海报]                            │
├─────────────────────────────────────────────────────────────────────────┤
│  邀请记录                                          已邀请: 5 人          │
│  ─────────────────────────────────────────────────────────────────────  │
│  | 头像 | 昵称  | 注册时间   | 状态   | 你的奖励    |                   │
│  | 👤  | 小明  | 2026-03-01 | 已注册 | +100 XP    |                   │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 知识图谱页 (/knowledge)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [数学 ▼] [七年级 ▼]                           整体掌握度: 68%         │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────┐  ┌────────────────────────────────────┐   │
│  │  知识点树形结构          │  │  选中知识点详情                    │   │
│  │  📁 代数                 │  │  📐 一元二次方程                   │   │
│  │  ├─ 📁 方程与不等式      │  │  掌握度: ████████░░ 75%            │   │
│  │  │  ├─ ✅ 一元一次 (90%) │  │  练习次数: 12 次                   │   │
│  │  │  ├─ ⚠️ 一元二次 (75%) │  │  正确率: 8/12 (67%)                │   │
│  │  │  └─ ❌ 二元一次 (40%) │  │  薄弱点: 配方法/韦达定理           │   │
│  │  └─ 📁 函数             │  │  [开始练习] [查看相关错题]         │   │
│  │  📁 几何                 │  │                                    │   │
│  │  图例: ✅掌握 ⚠️一般 ❌薄弱│  │                                    │   │
│  └──────────────────────────┘  └────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 家长管控设置页 (/(parent)/controls)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  青少年模式设置                                     当前: 小明 ▼        │
├─────────────────────────────────────────────────────────────────────────┤
│  🔒 青少年模式                                    [开关: 已开启]        │
│  ─────────────────────────────────────────────────────────────────────  │
│  ⏰ 每日使用时长限制: 120 分钟 | 今日已用: 45 分钟 (剩余 75 分钟)        │
│  🕐 允许使用时段: 工作日 17:00-21:00 | 周末 08:00-22:00                 │
│  😴 休息提醒: 每 45 分钟提醒休息，强制休息 15 分钟                       │
│  📊 本周使用: ████████████░░░░ 12.5h (日均 1.8h)                        │
│  [保存设置]                                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 8.5 页面更新/新增清单

#### 需要更新的页面

| 页面 | 路由 | 更新内容 | Phase |
|------|------|----------|-------|
| Landing | `/` | 添加定价链接、隐私政策 | Phase 3 |
| 学生端导航 | - | 添加知识图谱、邀请入口 | Phase 1.5/2 |
| 学生端设置 | `/settings` | 青少年模式开关 | Phase 0 |
| 家长端导航 | - | 多入口(家庭/任务/管控) | Phase 2.5 |
| 家长Dashboard | `/(parent)/dashboard` | 多子女切换 | Phase 2.5 |

#### 需要新增的页面

| 页面 | 路由 | Phase | 优先级 |
|------|------|-------|--------|
| 定价页 | `/pricing` | Phase 3 | P0 |
| 邀请页 | `/invite` | Phase 2 | P0 |
| 知识图谱 | `/knowledge` | Phase 1.5 | P0 |
| 学习风格测试 | `/style-test` | Phase 1.5 | P1 |
| 会员订阅 | `/subscription` | Phase 3 | P0 |
| 家庭管理 | `/(parent)/family` | Phase 2.5 | P0 |
| 远程任务 | `/(parent)/tasks` | Phase 2.5 | P1 |
| 管控设置 | `/(parent)/controls` | Phase 0 | P0 |
| 周报设置 | `/(parent)/reports` | Phase 2.5 | P1 |
| 隐私政策 | `/privacy` | Phase 0 | P0 |
| 用户协议 | `/terms` | Phase 0 | P0 |

---

## 九、下一步行动

### 本周任务

- [ ] 创建 teen_mode_settings 数据表
- [ ] 创建 usage_logs 数据表
- [ ] 实现使用时长追踪 (前端)
- [ ] 更新隐私协议

### 下周任务

- [ ] 统一积分系统数据表
- [ ] 邀请码系统
- [ ] 知识图谱数据导入 (数学)

---

*文档更新日期: 2026-03-09*
*版本: v2.2 - 完整三端需求规划 + 页面布局规划*
