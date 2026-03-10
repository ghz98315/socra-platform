-- =====================================================
-- Socra Platform - Safe Incremental Migration
-- 安全增量迁移脚本 (可重复执行)
-- 创建时间: 2026-03-09
-- =====================================================

-- =====================================================
-- 1. 知识节点表 (如果不存在则创建)
-- =====================================================
CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  subject VARCHAR(50) NOT NULL,
  grade_level INTEGER CHECK (grade_level >= 1 AND grade_level <= 12),
  chapter VARCHAR(100),
  difficulty INTEGER DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),
  description TEXT,
  key_points TEXT,
  prerequisites UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 创建索引 (如果不存在)
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_parent ON knowledge_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_subject ON knowledge_nodes(subject);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_grade_level ON knowledge_nodes(grade_level);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_chapter ON knowledge_nodes(chapter);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_difficulty ON knowledge_nodes(difficulty);

-- =====================================================
-- 2. 用户知识点掌握度表 (如果不存在则创建)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_knowledge_mastery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  confidence NUMERIC(3,2) DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  review_count INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_review_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, node_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_knowledge_mastery_user ON user_knowledge_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_user_knowledge_mastery_node ON user_knowledge_mastery(node_id);
CREATE INDEX IF NOT EXISTS idx_user_knowledge_mastery_level ON user_knowledge_mastery(mastery_level);

-- =====================================================
-- 3. RLS 策略 (先删除再创建)
-- =====================================================

-- 启用 RLS
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_knowledge_mastery ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略
DROP POLICY IF EXISTS "Knowledge nodes are readable by all" ON knowledge_nodes;
DROP POLICY IF EXISTS "Knowledge nodes insert admin only" ON knowledge_nodes;
DROP POLICY IF EXISTS "User knowledge mastery own data" ON user_knowledge_mastery;
DROP POLICY IF EXISTS "User knowledge mastery insert own" ON user_knowledge_mastery;
DROP POLICY IF EXISTS "User knowledge mastery update own" ON user_knowledge_mastery;

-- 创建策略
CREATE POLICY "Knowledge nodes are readable by all" ON knowledge_nodes FOR SELECT USING (true);
CREATE POLICY "Knowledge nodes insert admin only" ON knowledge_nodes FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "User knowledge mastery own data" ON user_knowledge_mastery FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "User knowledge mastery insert own" ON user_knowledge_mastery FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "User knowledge mastery update own" ON user_knowledge_mastery FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- 4. 家长任务表 (如果不存在则创建)
-- =====================================================
CREATE TABLE IF NOT EXISTS parent_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL,
  child_id UUID NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  task_type VARCHAR(50) DEFAULT 'practice',
  subject VARCHAR(50),
  target_count INTEGER DEFAULT 1,
  target_duration INTEGER,
  priority INTEGER DEFAULT 2,
  status VARCHAR(20) DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  reward_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_parent_tasks_parent ON parent_tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_tasks_child ON parent_tasks(child_id);
CREATE INDEX IF NOT EXISTS idx_parent_tasks_status ON parent_tasks(status);

-- =====================================================
-- 5. 任务完成记录表 (如果不存在则创建)
-- =====================================================
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES parent_tasks(id) ON DELETE CASCADE,
  child_id UUID NOT NULL,
  progress_count INTEGER DEFAULT 0,
  progress_duration INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(task_id, child_id)
);

CREATE INDEX IF NOT EXISTS idx_task_completions_task ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_child ON task_completions(child_id);

-- RLS for parent_tasks
ALTER TABLE parent_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents can view their tasks" ON parent_tasks;
DROP POLICY IF EXISTS "Parents can create tasks" ON parent_tasks;
DROP POLICY IF EXISTS "Parents can update their tasks" ON parent_tasks;
DROP POLICY IF EXISTS "Children can view assigned tasks" ON parent_tasks;

CREATE POLICY "Parents can view their tasks" ON parent_tasks FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "Parents can create tasks" ON parent_tasks FOR INSERT WITH CHECK (parent_id = auth.uid());
CREATE POLICY "Parents can update their tasks" ON parent_tasks FOR UPDATE USING (parent_id = auth.uid());
CREATE POLICY "Children can view assigned tasks" ON parent_tasks FOR SELECT USING (child_id = auth.uid());

-- RLS for task_completions
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Children can view their completions" ON task_completions;
DROP POLICY IF EXISTS "Children can update their completions" ON task_completions;

CREATE POLICY "Children can view their completions" ON task_completions FOR SELECT USING (child_id = auth.uid());
CREATE POLICY "Children can update their completions" ON task_completions FOR INSERT WITH CHECK (child_id = auth.uid());
CREATE POLICY "Children can insert their completions" ON task_completions FOR UPDATE USING (child_id = auth.uid());

-- =====================================================
-- 6. 积分系统表 (如果不存在则创建)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  description TEXT,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_points_user ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id);

-- RLS
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own points" ON user_points;
CREATE POLICY "Users can view own points" ON user_points FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own transactions" ON point_transactions;
CREATE POLICY "Users can view own transactions" ON point_transactions FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- 7. 订阅系统表 (如果不存在则创建)
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_code VARCHAR(50) NOT NULL UNIQUE,
  plan_name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  duration_days INTEGER NOT NULL,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(20) DEFAULT 'active',
  current_period_start TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- 插入默认套餐 (如果不存在)
INSERT INTO subscription_plans (plan_code, plan_name, price, original_price, duration_days, features)
VALUES
  ('pro_monthly', 'Pro 月度会员', 29.9, 49.9, 30, '{"max_uploads": -1, "ai_analysis": true, "essay_review": -1}'),
  ('pro_quarterly', 'Pro 季度会员', 79.9, 149.7, 90, '{"max_uploads": -1, "ai_analysis": true, "essay_review": -1}'),
  ('pro_yearly', 'Pro 年度会员', 239.9, 598.8, 365, '{"max_uploads": -1, "ai_analysis": true, "essay_review": -1}')
ON CONFLICT (plan_code) DO NOTHING;

-- RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Plans readable by all" ON subscription_plans;
CREATE POLICY "Plans readable by all" ON subscription_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- 完成
-- =====================================================
SELECT 'Migration completed successfully!' as status;
