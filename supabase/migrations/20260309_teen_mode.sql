-- =====================================================
-- Socra Platform - Teen Mode & Compliance
-- 青少年模式与合规功能
-- 创建时间: 2026-03-09
-- =====================================================

-- =====================================================
-- 1. 青少年模式配置表
-- =====================================================
CREATE TABLE IF NOT EXISTS teen_mode_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- 模式开关
  enabled BOOLEAN DEFAULT FALSE,

  -- 使用时长限制
  daily_time_limit INTEGER DEFAULT 120,        -- 每日使用时长限制 (分钟)
  rest_reminder_interval INTEGER DEFAULT 45,   -- 休息提醒间隔 (分钟)
  force_rest_duration INTEGER DEFAULT 15,      -- 强制休息时长 (分钟)

  -- 使用时段限制
  allowed_time_slots JSONB DEFAULT '[{"start":"08:00","end":"22:00"}]',

  -- 功能限制
  restricted_features JSONB DEFAULT '["social", "community"]',  -- 限制的功能

  -- 内容过滤等级
  content_filter_level VARCHAR(20) DEFAULT 'standard',  -- 'off', 'light', 'standard', 'strict'

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_teen_mode_user ON teen_mode_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_teen_mode_enabled ON teen_mode_settings(enabled);

-- 注释
COMMENT ON TABLE teen_mode_settings IS '青少年模式配置表';
COMMENT ON COLUMN teen_mode_settings.daily_time_limit IS '每日使用时长限制 (分钟)';
COMMENT ON COLUMN teen_mode_settings.allowed_time_slots IS '允许使用时段 JSON 数组';
COMMENT ON COLUMN teen_mode_settings.content_filter_level IS '内容过滤等级: off/light/standard/strict';

-- =====================================================
-- 2. 使用时长记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,

  -- 时长统计
  total_minutes INTEGER DEFAULT 0,              -- 总使用时长 (分钟)
  sessions JSONB DEFAULT '[]',                  -- 使用会话记录

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, date)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_date ON usage_logs(date);

-- 注释
COMMENT ON TABLE usage_logs IS '使用时长记录表';
COMMENT ON COLUMN usage_logs.sessions IS '使用会话 JSON: [{start, end, duration}]';

-- =====================================================
-- 3. 家长授权表
-- =====================================================
CREATE TABLE IF NOT EXISTS parental_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 授权类型
  consent_type VARCHAR(50) NOT NULL,            -- 'data_collection', 'ai_interaction', 'social_feature', 'full_access'

  -- 授权状态
  granted BOOLEAN DEFAULT FALSE,
  granted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- 授权详情
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(parent_id, child_id, consent_type)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_parental_consents_parent ON parental_consents(parent_id);
CREATE INDEX IF NOT EXISTS idx_parental_consents_child ON parental_consents(child_id);
CREATE INDEX IF NOT EXISTS idx_parental_consents_type ON parental_consents(consent_type);

-- 注释
COMMENT ON TABLE parental_consents IS '家长授权表';
COMMENT ON COLUMN parental_consents.consent_type IS '授权类型: data_collection/ai_interaction/social_feature/full_access';

-- =====================================================
-- 4. 内容审核日志表
-- =====================================================
CREATE TABLE IF NOT EXISTS content_moderation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 内容信息
  content_type VARCHAR(50) NOT NULL,            -- 'ai_response', 'user_post', 'comment', 'image'
  content_id UUID,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- 审核结果
  action VARCHAR(20) NOT NULL,                  -- 'approved', 'rejected', 'flagged', 'pending'
  reason TEXT,

  -- 审核方式
  moderator_type VARCHAR(20) NOT NULL,          -- 'ai', 'human', 'auto'
  moderator_id UUID,

  -- 原始内容 (用于审计)
  original_content TEXT,

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_content_moderation_type ON content_moderation_logs(content_type);
CREATE INDEX IF NOT EXISTS idx_content_moderation_action ON content_moderation_logs(action);
CREATE INDEX IF NOT EXISTS idx_content_moderation_user ON content_moderation_logs(user_id);

-- 注释
COMMENT ON TABLE content_moderation_logs IS '内容审核日志表';

-- =====================================================
-- 5. RLS 策略
-- =====================================================

-- 启用 RLS
ALTER TABLE teen_mode_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE parental_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation_logs ENABLE ROW LEVEL SECURITY;

-- teen_mode_settings 策略
CREATE POLICY "Users can view own teen mode settings" ON teen_mode_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own teen mode settings" ON teen_mode_settings
  FOR ALL USING (auth.uid() = user_id);

-- usage_logs 策略
CREATE POLICY "Users can view own usage logs" ON usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs" ON usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage logs" ON usage_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- parental_consents 策略
CREATE POLICY "Parents can view their consents" ON parental_consents
  FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "Parents can manage their consents" ON parental_consents
  FOR ALL USING (auth.uid() = parent_id);

-- content_moderation_logs 策略 (仅管理员可访问)
CREATE POLICY "Only service role can manage moderation logs" ON content_moderation_logs
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 6. 触发器
-- =====================================================

-- 自动更新 updated_at
DROP TRIGGER IF EXISTS update_teen_mode_settings_updated_at ON teen_mode_settings;
CREATE TRIGGER update_teen_mode_settings_updated_at
  BEFORE UPDATE ON teen_mode_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_logs_updated_at ON usage_logs;
CREATE TRIGGER update_usage_logs_updated_at
  BEFORE UPDATE ON usage_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_parental_consents_updated_at ON parental_consents;
CREATE TRIGGER update_parental_consents_updated_at
  BEFORE UPDATE ON parental_consents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. 核心函数
-- =====================================================

-- 检查用户是否在青少年模式
CREATE OR REPLACE FUNCTION is_teen_mode_enabled(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_enabled BOOLEAN;
BEGIN
  SELECT enabled INTO is_enabled
  FROM teen_mode_settings
  WHERE user_id = p_user_id;

  RETURN COALESCE(is_enabled, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查当前时间是否在允许使用时段
CREATE OR REPLACE FUNCTION is_within_allowed_hours(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  time_slots JSONB;
  v_current_time TIME;
  slot_start TIME;
  slot_end TIME;
  slot_data JSONB;
BEGIN
  -- 获取允许时段
  SELECT allowed_time_slots INTO time_slots
  FROM teen_mode_settings
  WHERE user_id = p_user_id AND enabled = TRUE;

  -- 如果没有配置或青少年模式未开启，默认允许
  IF time_slots IS NULL OR jsonb_array_length(time_slots) = 0 THEN
    RETURN TRUE;
  END IF;

  v_current_time := CAST(CURRENT_TIME AS TIME);

  -- 检查当前时间是否在任一允许时段内
  FOR i IN 0..jsonb_array_length(time_slots) - 1 LOOP
    slot_data := time_slots->i;
    slot_start := (slot_data->>'start')::TIME;
    slot_end := (slot_data->>'end')::TIME;

    IF v_current_time >= slot_start AND v_current_time <= slot_end THEN
      RETURN TRUE;
    END IF;
  END LOOP;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取今日剩余使用时长
CREATE OR REPLACE FUNCTION get_remaining_time_today(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  daily_limit INTEGER;
  used_today INTEGER;
  remaining INTEGER;
BEGIN
  -- 获取每日限制
  SELECT daily_time_limit INTO daily_limit
  FROM teen_mode_settings
  WHERE user_id = p_user_id AND enabled = TRUE;

  -- 如果青少年模式未开启，返回 -1 (无限制)
  IF daily_limit IS NULL THEN
    RETURN -1;
  END IF;

  -- 获取今日已使用时长
  SELECT COALESCE(total_minutes, 0) INTO used_today
  FROM usage_logs
  WHERE user_id = p_user_id AND date = CURRENT_DATE;

  remaining := daily_limit - COALESCE(used_today, 0);

  RETURN GREATEST(remaining, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 记录使用时长
CREATE OR REPLACE FUNCTION log_usage(
  p_user_id UUID,
  p_duration_minutes INTEGER,
  p_session_start TIMESTAMPTZ,
  p_session_end TIMESTAMPTZ
)
RETURNS JSONB AS $$
DECLARE
  new_session JSONB;
  current_total INTEGER;
BEGIN
  -- 创建会话记录
  new_session := jsonb_build_object(
    'start', p_session_start,
    'end', p_session_end,
    'duration', p_duration_minutes
  );

  -- 插入或更新使用记录
  INSERT INTO usage_logs (user_id, date, total_minutes, sessions)
  VALUES (p_user_id, CURRENT_DATE, p_duration_minutes, jsonb_build_array(new_session))
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_minutes = usage_logs.total_minutes + p_duration_minutes,
    sessions = usage_logs.sessions || new_session,
    updated_at = NOW()
  RETURNING total_minutes INTO current_total;

  -- 返回结果
  RETURN jsonb_build_object(
    'success', TRUE,
    'added_minutes', p_duration_minutes,
    'total_minutes', current_total,
    'date', CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查家长授权
CREATE OR REPLACE FUNCTION check_parental_consent(
  p_child_id UUID,
  p_consent_type VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
  has_consent BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM parental_consents
    WHERE child_id = p_child_id
    AND consent_type = p_consent_type
    AND granted = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO has_consent;

  RETURN has_consent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. 视图
-- =====================================================

-- 青少年模式状态视图
CREATE OR REPLACE VIEW teen_mode_status AS
SELECT
  tms.user_id,
  tms.enabled,
  tms.daily_time_limit,
  tms.content_filter_level,
  ul.total_minutes AS used_today,
  tms.daily_time_limit - COALESCE(ul.total_minutes, 0) AS remaining_minutes,
  CASE
    WHEN tms.enabled AND (tms.daily_time_limit - COALESCE(ul.total_minutes, 0)) <= 0
    THEN TRUE
    ELSE FALSE
  END AS is_time_exceeded
FROM teen_mode_settings tms
LEFT JOIN usage_logs ul ON tms.user_id = ul.user_id AND ul.date = CURRENT_DATE;

COMMENT ON VIEW teen_mode_status IS '青少年模式状态视图';

-- =====================================================
-- 完成
-- =====================================================
