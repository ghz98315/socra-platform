-- =====================================================
-- Project Socrates - Points and Invite System Migration
-- 积分系统和邀请系统数据库迁移
-- =====================================================

-- =====================================================
-- 1. 积分系统表
-- =====================================================

-- 用户积分表
CREATE TABLE IF NOT EXISTS socra_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,            -- 当前余额
  total_earned INTEGER NOT NULL DEFAULT 0,       -- 累计获得
  total_spent INTEGER NOT NULL DEFAULT 0,        -- 累计消费
  level INTEGER NOT NULL DEFAULT 1,              -- 当前等级
  streak_days INTEGER NOT NULL DEFAULT 0,        -- 连续学习天数
  longest_streak INTEGER NOT NULL DEFAULT 0,     -- 最长连续天数
  last_activity_date DATE,                       -- 最后活跃日期
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 积分交易记录表
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,                        -- 交易金额(正数获得,负数消费)
  balance_after INTEGER NOT NULL,                 -- 交易后余额
  source VARCHAR(50) NOT NULL,                    -- 来源类型
  transaction_type VARCHAR(20) NOT NULL DEFAULT 'earn', -- earn/spend/reward/expire
  related_id UUID,                                -- 关联ID
  related_type VARCHAR(50),                       -- 关联类型
  description TEXT,                               -- 描述
  metadata JSONB DEFAULT '{}',                    -- 元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. 邀请系统表
-- =====================================================

-- 邀请码表
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL UNIQUE,               -- 邀请码
  is_active BOOLEAN NOT NULL DEFAULT true,        -- 是否有效
  used_count INTEGER NOT NULL DEFAULT 0,           -- 使用次数
  max_uses INTEGER DEFAULT NULL,                  -- 最大使用次数(NULL无限制)
  expires_at TIMESTAMP WITH TIME ZONE,            -- 过期时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 邀请记录表
CREATE TABLE IF NOT EXISTS invite_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_name VARCHAR(100),                      -- 被邀请人昵称
  invitee_avatar TEXT,                            -- 被邀请人头像
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending/completed/cancelled
  reward_points INTEGER NOT NULL DEFAULT 50,      -- 奖励积分
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(invitee_id)                              -- 每个用户只能被邀请一次
);

-- =====================================================
-- 3. 索引
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_socra_points_user ON socra_points(user_id);
CREATE INDEX IF NOT EXISTS idx_socra_points_level ON socra_points(level);

CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_source ON point_transactions(source);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created ON point_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_user ON invite_codes(user_id);

CREATE INDEX IF NOT EXISTS idx_invite_records_inviter ON invite_records(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invite_records_invitee ON invite_records(invitee_id);
CREATE INDEX IF NOT EXISTS idx_invite_records_status ON invite_records(status);

-- =====================================================
-- 4. 数据库函数
-- =====================================================

-- 获取用户积分信息
CREATE OR REPLACE FUNCTION get_user_points(p_user_id UUID)
RETURNS TABLE (
  balance INTEGER,
  total_earned INTEGER,
  total_spent INTEGER,
  level INTEGER,
  level_name TEXT,
  streak_days INTEGER,
  longest_streak INTEGER,
  next_level_points INTEGER,
  progress_to_next INTEGER
) AS $$
DECLARE
  v_balance INTEGER;
  v_total_earned INTEGER;
  v_total_spent INTEGER;
  v_level INTEGER;
  v_streak_days INTEGER;
  v_longest_streak INTEGER;
  v_next_level_points INTEGER;
  v_progress INTEGER;
  v_level_name TEXT;
BEGIN
  -- 获取用户积分数据
  SELECT sp.balance, sp.total_earned, sp.total_spent, sp.level,
         sp.streak_days, sp.longest_streak
  INTO v_balance, v_total_earned, v_total_spent, v_level,
       v_streak_days, v_longest_streak
  FROM socra_points sp
  WHERE sp.user_id = p_user_id;

  -- 如果用户没有积分记录，返回默认值
  IF v_balance IS NULL THEN
    v_balance := 0;
    v_total_earned := 0;
    v_total_spent := 0;
    v_level := 1;
    v_streak_days := 0;
    v_longest_streak := 0;
  END IF;

  -- 计算等级名称和下一级所需积分
  v_level_name := CASE v_level
    WHEN 1 THEN '青铜学童'
    WHEN 2 THEN '白银学子'
    WHEN 3 THEN '黄金学士'
    WHEN 4 THEN '铂金学霸'
    WHEN 5 THEN '钻石学神'
    ELSE '传奇学者'
  END;

  v_next_level_points := CASE v_level
    WHEN 1 THEN 100
    WHEN 2 THEN 500
    WHEN 3 THEN 1500
    WHEN 4 THEN 5000
    WHEN 5 THEN 15000
    ELSE 50000
  END;

  v_progress := LEAST(100, FLOOR((v_total_earned::FLOAT / v_next_level_points) * 100));

  RETURN QUERY SELECT
    v_balance,
    v_total_earned,
    v_total_spent,
    v_level,
    v_level_name,
    v_streak_days,
    v_longest_streak,
    v_next_level_points,
    v_progress;
END;
$$ LANGUAGE plpgsql;

-- 添加积分
CREATE OR REPLACE FUNCTION add_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_source VARCHAR(50),
  p_transaction_type VARCHAR(20) DEFAULT 'earn',
  p_related_id UUID DEFAULT NULL,
  p_related_type VARCHAR(50) DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS TABLE (
  success BOOLEAN,
  new_balance INTEGER,
  new_level INTEGER
) AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_total_earned INTEGER;
  v_new_level INTEGER;
BEGIN
  -- 获取当前余额
  SELECT COALESCE(sp.balance, 0), COALESCE(sp.total_earned, 0)
  INTO v_current_balance, v_total_earned
  FROM socra_points sp
  WHERE sp.user_id = p_user_id;

  -- 如果用户没有积分记录，创建一个
  IF v_current_balance IS NULL THEN
    INSERT INTO socra_points (user_id, balance, total_earned)
    VALUES (p_user_id, 0, 0);
    v_current_balance := 0;
    v_total_earned := 0;
  END IF;

  -- 计算新余额
  v_new_balance := v_current_balance + p_amount;

  -- 计算新等级
  v_new_level := CASE
    WHEN v_total_earned + p_amount >= 15000 THEN 5
    WHEN v_total_earned + p_amount >= 5000 THEN 4
    WHEN v_total_earned + p_amount >= 1500 THEN 3
    WHEN v_total_earned + p_amount >= 500 THEN 2
    ELSE 1
  END;

  -- 更新积分表
  INSERT INTO socra_points (user_id, balance, total_earned, total_spent, level, updated_at)
  VALUES (
    p_user_id,
    v_new_balance,
    v_total_earned + CASE WHEN p_amount > 0 THEN p_amount ELSE 0 END,
    CASE WHEN p_amount < 0 THEN ABS(p_amount) ELSE 0 END,
    v_new_level,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    balance = v_new_balance,
    total_earned = socra_points.total_earned + CASE WHEN p_amount > 0 THEN p_amount ELSE 0 END,
    total_spent = socra_points.total_spent + CASE WHEN p_amount < 0 THEN ABS(p_amount) ELSE 0 END,
    level = v_new_level,
    updated_at = NOW();

  -- 记录交易
  INSERT INTO point_transactions (
    user_id, amount, balance_after, source, transaction_type,
    related_id, related_type, description, metadata
  ) VALUES (
    p_user_id, p_amount, v_new_balance, p_source, p_transaction_type,
    p_related_id, p_related_type, p_description, p_metadata
  );

  RETURN QUERY SELECT TRUE, v_new_balance, v_new_level;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. RLS 策略
-- =====================================================

ALTER TABLE socra_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_records ENABLE ROW LEVEL SECURITY;

-- socra_points 策略
CREATE POLICY "Users can view own points" ON socra_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON socra_points
  FOR ALL USING (auth.role() = 'service_role');

-- point_transactions 策略
CREATE POLICY "Users can view own transactions" ON point_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON point_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- invite_codes 策略
CREATE POLICY "Users can view own codes" ON invite_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own codes" ON invite_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own codes" ON invite_codes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON invite_codes
  FOR ALL USING (auth.role() = 'service_role');

-- invite_records 策略
CREATE POLICY "Users can view own invite records" ON invite_records
  FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Service role full access" ON invite_records
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 6. 触发器 - 自动创建用户积分记录
-- =====================================================

-- 当新用户注册时自动创建积分记录
CREATE OR REPLACE FUNCTION handle_new_user_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO socra_points (user_id, balance, total_earned, level)
  VALUES (NEW.id, 0, 0, 1)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created_points ON auth.users;
CREATE TRIGGER on_auth_user_created_points
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_points();
