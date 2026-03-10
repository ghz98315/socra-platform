-- =====================================================
-- Socra Platform - Notification System
-- 通知系统
-- 创建时间: 2026-03-09
-- =====================================================

-- =====================================================
-- 1. 通知表
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,              -- 通知类型: 'review', 'task', 'achievement', 'system', 'subscription'
  title VARCHAR(200) NOT NULL,            -- 通知标题
  content TEXT,                           -- 通知内容
  data JSONB,                             -- 附加数据 (如任务ID、成就信息等)
  is_read BOOLEAN DEFAULT FALSE,          -- 是否已读
  read_at TIMESTAMPTZ,                    -- 阅读时间
  action_url VARCHAR(500),                -- 点击跳转链接
  action_text VARCHAR(100),               -- 操作按钮文字
  priority INTEGER DEFAULT 0,             -- 优先级: 0=普通, 1=重要, 2=紧急
  expires_at TIMESTAMPTZ,                 -- 过期时间
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- 添加注释
COMMENT ON TABLE notifications IS '用户通知表';
COMMENT ON COLUMN notifications.type IS '通知类型: review/task/achievement/system/subscription';
COMMENT ON COLUMN notifications.data IS '附加数据 (JSON格式)';
COMMENT ON COLUMN notifications.priority IS '优先级: 0=普通, 1=重要, 2=紧急';

-- =====================================================
-- 2. 通知设置表
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  -- 通知开关
  review_reminder BOOLEAN DEFAULT TRUE,   -- 复习提醒
  task_reminder BOOLEAN DEFAULT TRUE,     -- 任务提醒
  achievement_notify BOOLEAN DEFAULT TRUE,-- 成就通知
  system_notify BOOLEAN DEFAULT TRUE,     -- 系统通知
  subscription_notify BOOLEAN DEFAULT TRUE,-- 订阅通知
  -- 通知渠道
  in_app_enabled BOOLEAN DEFAULT TRUE,    -- 站内通知
  push_enabled BOOLEAN DEFAULT FALSE,     -- 浏览器推送
  email_enabled BOOLEAN DEFAULT FALSE,    -- 邮件通知
  -- 推送订阅信息
  push_subscription JSONB,                -- Web Push 订阅信息
  -- 时间设置
  quiet_hours_start TIME DEFAULT '22:00', -- 免打扰开始时间
  quiet_hours_end TIME DEFAULT '07:00',   -- 免打扰结束时间
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON notification_settings(user_id);

-- =====================================================
-- 3. 通知模板表
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL UNIQUE,       -- 通知类型
  title_template VARCHAR(200) NOT NULL,   -- 标题模板 (支持变量 {var})
  content_template TEXT,                  -- 内容模板 (支持变量 {var})
  default_action_url VARCHAR(500),        -- 默认跳转链接模板
  icon VARCHAR(50),                       -- 图标名称
  color VARCHAR(20),                      -- 颜色
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 插入默认模板
INSERT INTO notification_templates (type, title_template, content_template, default_action_url, icon, color)
VALUES
  ('review', '复习提醒', '该复习「{subject}」的知识点了！', '/review', 'BookOpen', 'blue'),
  ('task', '任务提醒', '您有一个任务「{task_name}」即将到期', '/my-tasks', 'ClipboardList', 'orange'),
  ('task_completed', '任务完成', '恭喜完成任务「{task_name}」！获得 {points} 积分', '/my-tasks', 'CheckCircle', 'green'),
  ('achievement', '成就解锁', '恭喜解锁成就「{achievement_name}」！', '/profile', 'Trophy', 'yellow'),
  ('points', '积分奖励', '您获得了 {points} 积分！原因：{reason}', '/profile', 'Star', 'purple'),
  ('streak', '连续学习', '太棒了！您已连续学习 {days} 天', '/dashboard', 'Flame', 'red'),
  ('subscription', '会员提醒', '{message}', '/subscription', 'Crown', 'warm'),
  ('system', '系统通知', '{message}', NULL, 'Bell', 'gray')
ON CONFLICT (type) DO NOTHING;

-- =====================================================
-- 4. RLS 策略
-- =====================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- notifications 策略
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (user_id = auth.uid());

-- notification_settings 策略
DROP POLICY IF EXISTS "Users can view own settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON notification_settings;

CREATE POLICY "Users can view own settings" ON notification_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own settings" ON notification_settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own settings" ON notification_settings FOR UPDATE USING (user_id = auth.uid());

-- notification_templates 策略 (所有人可读)
DROP POLICY IF EXISTS "Templates readable by all" ON notification_templates;
CREATE POLICY "Templates readable by all" ON notification_templates FOR SELECT USING (true);

-- =====================================================
-- 5. 辅助函数
-- =====================================================

-- 创建通知
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(200),
  p_content TEXT DEFAULT NULL,
  p_data JSONB DEFAULT NULL,
  p_action_url VARCHAR(500) DEFAULT NULL,
  p_action_text VARCHAR(100) DEFAULT NULL,
  p_priority INTEGER DEFAULT 0,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, type, title, content, data,
    action_url, action_text, priority, expires_at
  ) VALUES (
    p_user_id, p_type, p_title, p_content, p_data,
    p_action_url, p_action_text, p_priority, p_expires_at
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 批量标记已读
CREATE OR REPLACE FUNCTION mark_notifications_read(
  p_user_id UUID,
  p_notification_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_notification_ids IS NULL THEN
    -- 标记所有未读为已读
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE user_id = p_user_id AND is_read = FALSE;
  ELSE
    -- 标记指定通知为已读
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE user_id = p_user_id AND id = ANY(p_notification_ids) AND is_read = FALSE;
  END IF;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取未读数量
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM notifications
  WHERE user_id = p_user_id AND is_read = FALSE
    AND (expires_at IS NULL OR expires_at > NOW());

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 清理过期通知
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL AND expires_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取用户通知设置 (如果不存在则创建默认设置)
CREATE OR REPLACE FUNCTION get_or_create_notification_settings(p_user_id UUID)
RETURNS notification_settings AS $$
DECLARE
  v_settings notification_settings;
BEGIN
  SELECT * INTO v_settings FROM notification_settings WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO notification_settings (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_settings;
  END IF;

  RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 完成
-- =====================================================
SELECT 'Notification system tables created successfully!' as status;
