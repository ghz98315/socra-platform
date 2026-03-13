CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (created_by)
);

CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'child',
  nickname TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (family_id, user_id)
);

CREATE TABLE IF NOT EXISTS parent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL DEFAULT 'practice',
  subject TEXT,
  target_count INTEGER NOT NULL DEFAULT 1,
  target_duration INTEGER,
  priority INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  reward_points INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES parent_tasks(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  progress_count INTEGER NOT NULL DEFAULT 0,
  progress_duration INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (task_id, child_id)
);

CREATE TABLE IF NOT EXISTS parent_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  plan_code TEXT NOT NULL UNIQUE,
  plan_name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  original_price NUMERIC(10, 2),
  duration_days INTEGER NOT NULL,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(10, 2) NOT NULL,
  description TEXT,
  expires_at TIMESTAMPTZ,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_orders (
  id TEXT PRIMARY KEY,
  order_no TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id TEXT,
  plan_code TEXT NOT NULL,
  plan_name TEXT,
  original_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  coupon_id TEXT,
  coupon_code TEXT,
  expired_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  out_trade_no TEXT,
  callback_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id TEXT,
  plan_code TEXT NOT NULL,
  plan_name TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  payment_method TEXT,
  payment_id TEXT,
  paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  coupon_id TEXT,
  coupon_code TEXT,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  action_url TEXT,
  action_text TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  priority INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  summary TEXT,
  report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'generated',
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (parent_id, child_id, week_start)
);

ALTER TABLE family_groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE parent_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS rewarded_at TIMESTAMPTZ;
ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE parent_reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS usage_limit INTEGER;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS used_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS callback_data JSONB;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS out_trade_no TEXT;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_text TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS report_data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'generated';
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'message'
  ) THEN
    EXECUTE 'UPDATE notifications SET content = COALESCE(content, message) WHERE content IS NULL';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'read'
  ) THEN
    EXECUTE 'UPDATE notifications SET is_read = COALESCE(is_read, read)';
  END IF;
END $$;

ALTER TABLE notifications DROP COLUMN IF EXISTS message;
ALTER TABLE notifications DROP COLUMN IF EXISTS read;

CREATE INDEX IF NOT EXISTS idx_family_groups_created_by ON family_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_family_groups_invite_code ON family_groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_role ON family_members(role);
CREATE INDEX IF NOT EXISTS idx_parent_tasks_parent_id ON parent_tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_tasks_child_id ON parent_tasks(child_id);
CREATE INDEX IF NOT EXISTS idx_parent_tasks_status ON parent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_parent_tasks_due_date ON parent_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_child_id ON task_completions(child_id);
CREATE INDEX IF NOT EXISTS idx_parent_reviews_parent_id ON parent_reviews(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_reviews_session_id ON parent_reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active_sort ON subscription_plans(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_no ON payment_orders(order_no);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_parent_id ON weekly_reports(parent_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_child_id ON weekly_reports(child_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week_start ON weekly_reports(week_start DESC);

ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_family_groups_updated_at ON family_groups;
CREATE TRIGGER trg_family_groups_updated_at
  BEFORE UPDATE ON family_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_family_members_updated_at ON family_members;
CREATE TRIGGER trg_family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_parent_tasks_updated_at ON parent_tasks;
CREATE TRIGGER trg_parent_tasks_updated_at
  BEFORE UPDATE ON parent_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_task_completions_updated_at ON task_completions;
CREATE TRIGGER trg_task_completions_updated_at
  BEFORE UPDATE ON task_completions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_parent_reviews_updated_at ON parent_reviews;
CREATE TRIGGER trg_parent_reviews_updated_at
  BEFORE UPDATE ON parent_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER trg_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_coupons_updated_at ON coupons;
CREATE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_payment_orders_updated_at ON payment_orders;
CREATE TRIGGER trg_payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER trg_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_weekly_reports_updated_at ON weekly_reports;
CREATE TRIGGER trg_weekly_reports_updated_at
  BEFORE UPDATE ON weekly_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO subscription_plans (
  id,
  plan_code,
  plan_name,
  description,
  price,
  original_price,
  duration_days,
  features,
  is_active,
  is_popular,
  sort_order
)
VALUES
  (
    'a16e85fb-2c15-48aa-91b4-43dbad243539',
    'pro_monthly',
    'Monthly Pro',
    'Pro access billed monthly',
    29.90,
    39.90,
    30,
    '{"daily_ai_chats": -1, "subjects": ["math", "chinese", "english", "physics", "chemistry"], "advanced_analysis": true, "priority_support": true, "bonus_points": 30}'::jsonb,
    TRUE,
    FALSE,
    1
  ),
  (
    '1732af1b-d1dd-4763-9b8e-c2a3d81f0c3b',
    'pro_quarterly',
    'Quarterly Pro',
    'Pro access billed quarterly',
    79.90,
    119.70,
    90,
    '{"daily_ai_chats": -1, "subjects": ["math", "chinese", "english", "physics", "chemistry"], "advanced_analysis": true, "priority_support": true, "bonus_points": 120}'::jsonb,
    TRUE,
    TRUE,
    2
  ),
  (
    'd7c55bb4-a311-4f5c-919b-f05d0f07808d',
    'pro_yearly',
    'Yearly Pro',
    'Pro access billed yearly',
    239.90,
    358.80,
    365,
    '{"daily_ai_chats": -1, "subjects": ["math", "chinese", "english", "physics", "chemistry"], "advanced_analysis": true, "priority_support": true, "bonus_points": 600}'::jsonb,
    TRUE,
    FALSE,
    3
  )
ON CONFLICT (plan_code) DO UPDATE SET
  plan_name = EXCLUDED.plan_name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  duration_days = EXCLUDED.duration_days,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  is_popular = EXCLUDED.is_popular,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO coupons (
  id,
  code,
  name,
  discount_type,
  discount_value,
  description,
  expires_at,
  is_active
)
VALUES
  (
    'd6f5f631-a9d7-4a0d-9cab-a4e3f3de17d7',
    'WELCOME10',
    'WELCOME10',
    'percentage',
    10,
    'New user welcome discount',
    '2026-12-31T23:59:59Z',
    TRUE
  ),
  (
    '0a57f321-70b4-4e76-a6b6-6f4df0eb45bf',
    'SAVE20',
    'SAVE20',
    'percentage',
    20,
    'Limited-time promotion',
    '2026-06-30T23:59:59Z',
    TRUE
  ),
  (
    'de8e9cb7-7ca3-4f8a-b80c-78c8b1778f3d',
    'PRO30',
    'PRO30',
    'percentage',
    30,
    'Pro membership promotion',
    NULL,
    TRUE
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  description = EXCLUDED.description,
  expires_at = EXCLUDED.expires_at,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- These functions have changed return shapes across migrations. Supabase/Postgres
-- won't allow CREATE OR REPLACE to change a function's return type, so we must
-- drop first to keep this migration re-runnable.
DROP FUNCTION IF EXISTS check_feature_limit(UUID, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION check_feature_limit(
  p_user_id UUID,
  p_feature TEXT,
  p_current_usage INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  limit_value INTEGER,
  remaining INTEGER,
  is_pro BOOLEAN
) AS $$
DECLARE
  v_is_pro BOOLEAN := FALSE;
  v_limit INTEGER := 0;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND plan_code LIKE 'pro%%'
      AND (expires_at IS NULL OR expires_at > NOW())
  )
  INTO v_is_pro;

  IF v_is_pro THEN
    RETURN QUERY SELECT TRUE, -1, -1, TRUE;
    RETURN;
  END IF;

  IF p_feature IN ('geometry_board', 'review_plan', 'time_planner', 'learning_report') THEN
    RETURN QUERY SELECT FALSE, 0, 0, FALSE;
    RETURN;
  END IF;

  v_limit := CASE p_feature
    WHEN 'ai_chat' THEN 50
    WHEN 'error_review' THEN 5
    WHEN 'pdf_export' THEN 3
    WHEN 'essay' THEN 3
    ELSE 0
  END;

  RETURN QUERY SELECT
    (v_limit > 0 AND p_current_usage < v_limit),
    v_limit,
    GREATEST(v_limit - p_current_usage, 0),
    FALSE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_pro_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND plan_code LIKE 'pro%%'
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS generate_weekly_report(UUID, UUID, DATE);

CREATE OR REPLACE FUNCTION generate_weekly_report(
  p_parent_id UUID,
  p_child_id UUID,
  p_week_start DATE
)
RETURNS TABLE (
  id UUID,
  parent_id UUID,
  child_id UUID,
  week_start DATE,
  week_end DATE,
  summary TEXT,
  report_data JSONB,
  status TEXT,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_week_end DATE := p_week_start + 6;
  v_total_minutes INTEGER := 0;
  v_total_errors INTEGER := 0;
  v_mastered_errors INTEGER := 0;
  v_pending_errors INTEGER := 0;
  v_balance INTEGER := 0;
  v_level INTEGER := 1;
  v_streak_days INTEGER := 0;
  v_child_profile JSONB := '{}'::jsonb;
  v_subject_breakdown JSONB := '{}'::jsonb;
BEGIN
  SELECT COALESCE(SUM(total_minutes), 0)
  INTO v_total_minutes
  FROM usage_logs
  WHERE user_id = p_child_id
    AND date >= p_week_start
    AND date <= v_week_end;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'mastered'),
    COUNT(*) FILTER (WHERE status IN ('analyzing', 'guided_learning'))
  INTO v_total_errors, v_mastered_errors, v_pending_errors
  FROM error_sessions
  WHERE student_id = p_child_id
    AND created_at >= p_week_start::timestamp
    AND created_at < (v_week_end + 1)::timestamp;

  SELECT COALESCE(balance, 0), COALESCE(level, 1), COALESCE(streak_days, 0)
  INTO v_balance, v_level, v_streak_days
  FROM socra_points
  WHERE user_id = p_child_id;

  SELECT jsonb_build_object(
    'id', id,
    'display_name', display_name,
    'avatar_url', avatar_url,
    'grade_level', grade_level
  )
  INTO v_child_profile
  FROM profiles
  WHERE id = p_child_id;

  SELECT COALESCE(
    jsonb_object_agg(subject, subject_count),
    '{}'::jsonb
  )
  INTO v_subject_breakdown
  FROM (
    SELECT COALESCE(subject, 'unknown') AS subject, COUNT(*) AS subject_count
    FROM error_sessions
    WHERE student_id = p_child_id
      AND created_at >= p_week_start::timestamp
      AND created_at < (v_week_end + 1)::timestamp
    GROUP BY COALESCE(subject, 'unknown')
  ) AS subject_stats;

  RETURN QUERY
  INSERT INTO weekly_reports (
    parent_id,
    child_id,
    week_start,
    week_end,
    summary,
    report_data,
    status
  )
  VALUES (
    p_parent_id,
    p_child_id,
    p_week_start,
    v_week_end,
    format(
      '学习 %s 分钟，处理 %s 道错题，掌握 %s 道',
      v_total_minutes,
      v_total_errors,
      v_mastered_errors
    ),
    jsonb_build_object(
      'child', COALESCE(v_child_profile, '{}'::jsonb),
      'summary', jsonb_build_object(
        'totalMinutes', v_total_minutes,
        'totalErrors', v_total_errors,
        'masteredErrors', v_mastered_errors,
        'pendingErrors', v_pending_errors,
        'currentPoints', v_balance,
        'currentLevel', v_level,
        'streakDays', v_streak_days
      ),
      'subjectBreakdown', COALESCE(v_subject_breakdown, '{}'::jsonb),
      'generatedAt', NOW()
    ),
    'generated'
  )
  ON CONFLICT (parent_id, child_id, week_start)
  DO UPDATE SET
    week_end = EXCLUDED.week_end,
    summary = EXCLUDED.summary,
    report_data = EXCLUDED.report_data,
    status = EXCLUDED.status,
    updated_at = NOW()
  RETURNING
    weekly_reports.id,
    weekly_reports.parent_id,
    weekly_reports.child_id,
    weekly_reports.week_start,
    weekly_reports.week_end,
    weekly_reports.summary,
    weekly_reports.report_data,
    weekly_reports.status,
    weekly_reports.viewed_at,
    weekly_reports.created_at,
    weekly_reports.updated_at;
END;
$$ LANGUAGE plpgsql;
