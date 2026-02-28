-- =====================================================
-- Project Socrates - Variant Questions Table
-- 变式题目数据库表
-- =====================================================

-- 变式题目表
CREATE TABLE IF NOT EXISTS variant_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_session_id UUID NOT NULL REFERENCES error_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 科目
  subject VARCHAR(20) NOT NULL DEFAULT 'math' CHECK (subject IN ('math', 'physics', 'chemistry')),

  -- 题目内容
  question_text TEXT NOT NULL,
  question_image_url TEXT,

  -- AI 生成数据
  concept_tags TEXT[] DEFAULT '{}',
  difficulty VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  hints TEXT[] DEFAULT '{}',
  solution TEXT,
  answer TEXT NOT NULL,

  -- 学习状态
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'practicing', 'completed', 'mastered')),
  attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_practiced_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_variant_questions_student_id ON variant_questions(student_id);
CREATE INDEX IF NOT EXISTS idx_variant_questions_session_id ON variant_questions(original_session_id);
CREATE INDEX IF NOT EXISTS idx_variant_questions_status ON variant_questions(status);

-- 变式练习记录表
CREATE TABLE IF NOT EXISTS variant_practice_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES variant_questions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 练习结果
  is_correct BOOLEAN NOT NULL,
  student_answer TEXT,
  time_spent INTEGER DEFAULT 0,  -- 秒
  hints_used INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_variant_practice_logs_variant_id ON variant_practice_logs(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_practice_logs_student_id ON variant_practice_logs(student_id);

-- RLS 策略
ALTER TABLE variant_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_practice_logs ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（避免重复错误）
DROP POLICY IF EXISTS "Students can view their own variant questions" ON variant_questions;
DROP POLICY IF EXISTS "Students can insert their own variant questions" ON variant_questions;
DROP POLICY IF EXISTS "Students can update their own variant questions" ON variant_questions;
DROP POLICY IF EXISTS "Students can view their own practice logs" ON variant_practice_logs;
DROP POLICY IF EXISTS "Students can insert their own practice logs" ON variant_practice_logs;

-- 变式题目 RLS 策略
CREATE POLICY "Students can view their own variant questions"
  ON variant_questions FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own variant questions"
  ON variant_questions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own variant questions"
  ON variant_questions FOR UPDATE
  USING (auth.uid() = student_id);

-- 练习记录 RLS 策略
CREATE POLICY "Students can view their own practice logs"
  ON variant_practice_logs FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own practice logs"
  ON variant_practice_logs FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- 函数：更新变式题目状态
CREATE OR REPLACE FUNCTION update_variant_status()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新尝试次数
  UPDATE variant_questions
  SET
    attempts = attempts + 1,
    correct_attempts = correct_attempts + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    last_practiced_at = NOW(),
    status = CASE
      WHEN correct_attempts + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END >= 2 THEN 'mastered'
      WHEN attempts + 1 >= 1 THEN 'practicing'
      ELSE status
    END,
    completed_at = CASE
      WHEN correct_attempts + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END >= 2 THEN NOW()
      ELSE completed_at
    END
  WHERE id = NEW.variant_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 触发器：练习记录插入时自动更新变式题目状态
DROP TRIGGER IF EXISTS trigger_update_variant_status ON variant_practice_logs;
CREATE TRIGGER trigger_update_variant_status
  AFTER INSERT ON variant_practice_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_variant_status();

-- 注释
COMMENT ON TABLE variant_questions IS '变式题目表 - AI根据原错题生成的相似练习题';
COMMENT ON TABLE variant_practice_logs IS '变式练习记录表 - 学生练习变式题的记录';
