-- =====================================================
-- Study Plans Table for Time Management Feature
-- 学习计划表 - 时间规划功能
-- =====================================================

-- 创建学习计划表
CREATE TABLE IF NOT EXISTS study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  title VARCHAR(200) NOT NULL,
  subject VARCHAR(50) NOT NULL DEFAULT 'other',
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  scheduled_time TIME NOT NULL DEFAULT '16:00:00',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以加速查询
CREATE INDEX IF NOT EXISTS idx_study_plans_student_id ON study_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_plan_date ON study_plans(plan_date);
CREATE INDEX IF NOT EXISTS idx_study_plans_student_date ON study_plans(student_id, plan_date);

-- 启用 RLS
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;

-- RLS 策略：学生只能查看和编辑自己的计划
CREATE POLICY "Students can view their own study plans"
  ON study_plans FOR SELECT
  USING (auth.uid()::uuid = student_id);

CREATE POLICY "Students can insert their own study plans"
  ON study_plans FOR INSERT
  WITH CHECK (auth.uid()::uuid = student_id);

CREATE POLICY "Students can update their own study plans"
  ON study_plans FOR UPDATE
  USING (auth.uid()::uuid = student_id);

CREATE POLICY "Students can delete their own study plans"
  ON study_plans FOR DELETE
  USING (auth.uid()::uuid = student_id);

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_study_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_study_plans_updated_at
  BEFORE UPDATE ON study_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_study_plans_updated_at();

-- 添加注释
COMMENT ON TABLE study_plans IS '学习计划表 - 用于时间规划功能';
COMMENT ON COLUMN study_plans.student_id IS '学生ID';
COMMENT ON COLUMN study_plans.plan_date IS '计划日期';
COMMENT ON COLUMN study_plans.title IS '任务标题';
COMMENT ON COLUMN study_plans.subject IS '科目：math/physics/chemistry/review/other';
COMMENT ON COLUMN study_plans.duration_minutes IS '计划时长（分钟）';
COMMENT ON COLUMN study_plans.scheduled_time IS '计划开始时间';
COMMENT ON COLUMN study_plans.status IS '状态：pending/in_progress/completed';
