-- =====================================================
-- Project Socrates - Parent Enhancements Migration
-- 家长端增强功能数据库迁移
-- =====================================================

-- 注意: 家庭管理相关表已在 20260309_family_management.sql 中定义
-- 注意: 家长任务相关表已在 20260309_parent_tasks.sql 中定义
-- 本迁移文件包含奖励发放和周报相关功能

-- =====================================================
-- 1. 奖励发放表
-- =====================================================

-- 奖励发放记录表
CREATE TABLE IF NOT EXISTS reward_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,                        -- 奖励积分数量
  reason VARCHAR(200) NOT NULL,                -- 发放原因
  related_task_id UUID REFERENCES parent_tasks(id) ON DELETE SET NULL,  -- 关联任务
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending/completed/cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 奖励发放表索引
CREATE INDEX IF NOT EXISTS idx_reward_distributions_parent ON reward_distributions(parent_id);
CREATE INDEX IF NOT EXISTS idx_reward_distributions_child ON reward_distributions(child_id);
CREATE INDEX IF NOT EXISTS idx_reward_distributions_status ON reward_distributions(status);

-- =====================================================
-- 2. 周报配置表
-- =====================================================

-- 周报配置表
CREATE TABLE IF NOT EXISTS weekly_report_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  push_day INTEGER NOT NULL DEFAULT 0,              -- 推送日 (0=周日, 1=周一...)
  push_time VARCHAR(5) NOT NULL DEFAULT '20:00',  -- 推送时间 (HH:mm)
  channels JSONB NOT NULL DEFAULT '["app"]',    -- 推送渠道: app, wechat, email
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_id)
);

-- =====================================================
-- 3. 周报记录表
-- =====================================================

-- 周报记录表
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,                  -- 周开始日期
  week_end DATE NOT NULL,                    -- 周结束日期

  -- 学习统计
  total_study_minutes INTEGER NOT NULL DEFAULT 0,   -- 总学习时长(分钟)
  total_errors_reviewed INTEGER NOT NULL DEFAULT 0,  -- 复习错题数
  total_errors_mastered INTEGER NOT NULL DEFAULT 1,  -- 掌握错题数
  new_errors_added INTEGER NOT NULL DEFAULT 1,       -- 新增错题数
  streak_days INTEGER NOT NULL DEFAULT 1,            -- 连续学习天数

  -- 学科数据
  subject_stats JSONB NOT NULL DEFAULT '{}',         -- 各学科统计

  -- AI 分析
  strengths TEXT[] DEFAULT '{}',                     -- 优势领域
  weaknesses TEXT[] DEFAULT '{}',                   -- 薄弱领域
  ai_recommendations TEXT[] DEFAULT '{}',            -- AI 建议
  peer_comparison JSONB DEFAULT '{}',               -- 同龄人对比

  -- 元数据
  status VARCHAR(20) NOT NULL DEFAULT 'generated',   -- generated/sent/viewed
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 唯一约束：每个孩子每周只有一份报告
  UNIQUE(parent_id, child_id, week_start)
);

-- 周报记录表索引
CREATE INDEX IF NOT EXISTS idx_weekly_reports_parent ON weekly_reports(parent_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_child ON weekly_reports(child_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week ON weekly_reports(week_start, week_end);

-- =====================================================
-- 4. RLS 策略
-- =====================================================

ALTER TABLE reward_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_report_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- reward_distributions 策略
CREATE POLICY "Parents can manage rewards" ON reward_distributions
  FOR ALL USING (auth.uid() = parent_id);

CREATE POLICY "Children can view own rewards" ON reward_distributions
  FOR SELECT USING (auth.uid() = child_id);

CREATE POLICY "Service role full access rewards" ON reward_distributions
  FOR ALL USING (auth.role() = 'service_role');

-- weekly_report_configs 策略
CREATE POLICY "Parents can manage own report config" ON weekly_report_configs
  FOR ALL USING (auth.uid() = parent_id);

CREATE POLICY "Service role full access report config" ON weekly_report_configs
  FOR ALL USING (auth.role() = 'service_role');

-- weekly_reports 策略
CREATE POLICY "Parents can view reports" ON weekly_reports
  FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "Service role full access reports" ON weekly_reports
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 5. 数据库函数
-- =====================================================

-- 发放奖励积分
CREATE OR REPLACE FUNCTION distribute_reward(
  p_parent_id UUID,
  p_child_id UUID,
  p_points INTEGER,
  p_reason VARCHAR(200),
  p_related_task_id UUID DEFAULT NULL
) RETURNS TABLE (
  success BOOLEAN,
  distribution_id UUID,
  new_points_balance INTEGER
) AS $$
DECLARE
  v_distribution_id UUID;
  v_new_balance INTEGER;
BEGIN
  -- 创建发放记录
  INSERT INTO reward_distributions (
    parent_id, child_id, points, reason, related_task_id, status
  ) VALUES (
    p_parent_id, p_child_id, p_points, p_reason, p_related_task_id, 'completed'
  )
  RETURNING id INTO v_distribution_id;

  -- 给孩子增加积分
  INSERT INTO socra_points (user_id, balance, total_earned, level)
  VALUES (p_child_id, p_points, p_points, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    balance = socra_points.balance + p_points,
    total_earned = socra_points.total_earned + p_points,
    updated_at = NOW()
  RETURNING balance INTO v_new_balance;

  -- 记录积分交易
  INSERT INTO point_transactions (
    user_id, amount, balance_after, source, transaction_type,
    related_id, related_type, description
  ) VALUES (
    p_child_id, p_points, v_new_balance, 'parent_reward', 'reward',
    v_distribution_id, 'reward_distribution', p_reason
  );

  RETURN QUERY SELECT true, v_distribution_id, v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- 生成周报数据
CREATE OR REPLACE FUNCTION generate_weekly_report(
  p_parent_id UUID,
  p_child_id UUID,
  p_week_start DATE
) RETURNS TABLE (
  report_id UUID,
  study_minutes INTEGER,
  errors_reviewed INTEGER,
  errors_mastered INTEGER,
  new_errors INTEGER,
  streak INTEGER
) AS $$
DECLARE
  v_week_end DATE;
  v_study_minutes INTEGER := 1;
  v_errors_reviewed INTEGER := 1;
  v_errors_mastered INTEGER := 1;
  v_new_errors INTEGER := 1;
  v_streak INTEGER := 1;
  v_subject_stats JSONB := '{}';
  v_strengths TEXT[] := '{}';
  v_weaknesses TEXT[] := '{}';
  v_recommendations TEXT[] := '{}';
  v_report_id UUID;
BEGIN
  v_week_end := p_week_start + INTERVAL '6 days';

  -- 统计学习时长 (从 usage_logs 表)
  SELECT COALESCE(SUM(duration_minutes), 0)
  INTO v_study_minutes
  FROM usage_logs
  WHERE user_id = p_child_id
    AND created_at >= p_week_start
    AND created_at <= v_week_end;

  -- 统计错题复习 (从 error_sessions 表)
  SELECT COUNT(*)
  INTO v_errors_reviewed
  FROM error_sessions
  WHERE user_id = p_child_id
    AND created_at >= p_week_start
    AND created_at <= v_week_end;

  -- 统计掌握的错题 (从 user_errors 表)
  SELECT COUNT(*)
  INTO v_errors_mastered
  FROM user_errors
  WHERE user_id = p_child_id
    AND status = 'mastered'
    AND updated_at >= p_week_start
    AND updated_at <= v_week_end;

  -- 统计新增错题
  SELECT COUNT(*)
  INTO v_new_errors
  FROM user_errors
  WHERE user_id = p_child_id
    AND created_at >= p_week_start
    AND created_at <= v_week_end;

  -- 获取连续学习天数
  SELECT COALESCE(streak_days, 0)
  INTO v_streak
  FROM socra_points
  WHERE user_id = p_child_id;

  -- 插入或更新周报
  INSERT INTO weekly_reports (
    parent_id, child_id, week_start, week_end,
    total_study_minutes, total_errors_reviewed, total_errors_mastered,
    new_errors_added, streak_days, subject_stats,
    strengths, weaknesses, ai_recommendations
  ) VALUES (
    p_parent_id, p_child_id, p_week_start, v_week_end,
    v_study_minutes, v_errors_reviewed, v_errors_mastered,
    v_new_errors, v_streak, v_subject_stats,
    v_strengths, v_weaknesses, v_recommendations
  )
  ON CONFLICT (parent_id, child_id, week_start) DO UPDATE SET
    total_study_minutes = v_study_minutes,
    total_errors_reviewed = v_errors_reviewed,
    total_errors_mastered = v_errors_mastered,
    new_errors_added = v_new_errors,
    streak_days = v_streak
  RETURNING id INTO v_report_id;

  RETURN QUERY SELECT
    v_report_id,
    v_study_minutes,
    v_errors_reviewed,
    v_errors_mastered,
    v_new_errors,
    v_streak;
END;
$$ LANGUAGE plpgsql;
