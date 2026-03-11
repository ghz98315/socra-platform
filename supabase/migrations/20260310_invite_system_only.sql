-- =====================================================
-- Project Socrates - Invite System Only Migration
-- 邀请系统数据库迁移 (仅包含邀请系统相关内容)
-- =====================================================

-- 注意：积分系统相关表已在 20260309_points_system.sql 中定义
-- 本迁移文件只包含邀请系统特有的表和逻辑

-- =====================================================
-- 1. 邀请系统表
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
  updated_at TIMESTAMP WITH TIME Zone DEFAULT NOW(),
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
  completed_at TIMESTAMP WITH TIME Zone,
  updated_at TIMESTAMP WITH TIME Zone DEFAULT NOW(),
  UNIQUE(invitee_id)                              -- 每个用户只能被邀请一次
);

-- =====================================================
-- 2. 索引
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_user ON invite_codes(user_id);

CREATE INDEX IF NOT EXISTS idx_invite_records_inviter ON invite_records(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invite_records_invitee ON invite_records(invitee_id);
CREATE INDEX IF NOT EXISTS idx_invite_records_status ON invite_records(status);

-- =====================================================
-- 3. RLS 策略
-- =====================================================

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_records ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Service role full access" on invite_records
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 4. 触发器 - 自动创建用户邀请码
-- =====================================================

-- 当新用户注册时自动创建邀请码
CREATE OR REPLACE FUNCTION handle_new_user_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  -- 生成邀请码： SC + 用户ID前8位
  INSERT INTO invite_codes (user_id, code, is_active)
  VALUES (NEW.id, 'SC' || substring(upper(NEW.id::text), 1, 8), true)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created_invite_code ON auth.users;
CREATE TRIGGER on_auth_user_created_invite_code
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_invite_code();
