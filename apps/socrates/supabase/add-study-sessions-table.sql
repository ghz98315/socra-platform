-- =====================================================
-- Project Socrates - Study Sessions Table
-- 学习会话记录表
-- =====================================================

-- 学习会话表
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 会话类型
  session_type VARCHAR(20) NOT NULL DEFAULT 'error_analysis'
    CHECK (session_type IN ('error_analysis', 'review', 'variant_practice')),

  -- 时间记录
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  last_heartbeat TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,

  -- 关联的错题会话（可选）
  error_session_id UUID REFERENCES error_sessions(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_study_sessions_student_id ON study_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_start_time ON study_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_study_sessions_session_type ON study_sessions(session_type);

-- RLS 策略
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own study sessions"
  ON study_sessions FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own study sessions"
  ON study_sessions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own study sessions"
  ON study_sessions FOR UPDATE
  USING (auth.uid() = student_id);

-- 注释
COMMENT ON TABLE study_sessions IS '学习会话记录表 - 记录学生的学习时长和会话信息';
