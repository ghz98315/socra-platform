-- =====================================================
-- Socra Platform - Parent Tasks System
-- 家长任务布置系统
-- 创建时间: 2026-03-09
-- =====================================================

-- =====================================================
-- 1. 家长任务表
-- =====================================================
CREATE TABLE IF NOT EXISTS parent_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  task_type VARCHAR(50) NOT NULL DEFAULT 'practice',  -- 'practice', 'review', 'error_book', 'custom'
  subject VARCHAR(50),                                  -- 科目
  target_count INTEGER DEFAULT 1,                       -- 目标数量
  target_duration INTEGER,                              -- 目标时长(分钟)
  priority INTEGER DEFAULT 2,                           -- 优先级: 1-高, 2-中, 3-低
  status VARCHAR(20) DEFAULT 'pending',                 -- 'pending', 'in_progress', 'completed', 'cancelled'
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reward_points INTEGER DEFAULT 0,                      -- 完成奖励积分
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 添加注释
COMMENT ON TABLE parent_tasks IS '家长任务表';
COMMENT ON COLUMN parent_tasks.task_type IS '任务类型: practice-练习, review-复习, error_book-错题本, custom-自定义';
COMMENT ON COLUMN parent_tasks.target_count IS '目标数量(如完成10道题)';
COMMENT ON COLUMN parent_tasks.target_duration IS '目标时长(分钟)';
COMMENT ON COLUMN parent_tasks.priority IS '优先级: 1-高, 2-中, 3-低';
COMMENT ON COLUMN parent_tasks.status IS '状态: pending-待开始, in_progress-进行中, completed-已完成, cancelled-已取消';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_parent_tasks_parent ON parent_tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_tasks_child ON parent_tasks(child_id);
CREATE INDEX IF NOT EXISTS idx_parent_tasks_status ON parent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_parent_tasks_due_date ON parent_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_parent_tasks_child_status ON parent_tasks(child_id, status);

-- =====================================================
-- 2. 任务完成记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES parent_tasks(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  progress_count INTEGER DEFAULT 0,                     -- 完成数量
  progress_duration INTEGER DEFAULT 0,                  -- 完成时长(分钟)
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(task_id, child_id)
);

-- 添加注释
COMMENT ON TABLE task_completions IS '任务完成记录表';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_task_completions_task ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_child ON task_completions(child_id);

-- =====================================================
-- 3. RLS 策略
-- =====================================================

-- 启用 RLS
ALTER TABLE parent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

-- parent_tasks 策略
CREATE POLICY "Parents can view their tasks" ON parent_tasks
  FOR SELECT USING (auth.uid() = parent_id OR auth.uid() = child_id);

CREATE POLICY "Parents can create tasks" ON parent_tasks
  FOR INSERT WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their tasks" ON parent_tasks
  FOR UPDATE USING (auth.uid() = parent_id);

CREATE POLICY "Parents can delete their tasks" ON parent_tasks
  FOR DELETE USING (auth.uid() = parent_id);

-- task_completions 策略
CREATE POLICY "Users can view relevant completions" ON task_completions
  FOR SELECT USING (
    auth.uid() = child_id OR
    EXISTS (SELECT 1 FROM parent_tasks WHERE id = task_id AND parent_id = auth.uid())
  );

CREATE POLICY "Children can create completions" ON task_completions
  FOR INSERT WITH CHECK (auth.uid() = child_id);

CREATE POLICY "Children can update their completions" ON task_completions
  FOR UPDATE USING (auth.uid() = child_id);

-- =====================================================
-- 4. 触发器
-- =====================================================

-- 自动更新 updated_at
DROP TRIGGER IF EXISTS update_parent_tasks_updated_at ON parent_tasks;
CREATE TRIGGER update_parent_tasks_updated_at
  BEFORE UPDATE ON parent_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_completions_updated_at ON task_completions;
CREATE TRIGGER update_task_completions_updated_at
  BEFORE UPDATE ON task_completions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. 核心函数
-- =====================================================

-- 获取孩子的任务列表
CREATE OR REPLACE FUNCTION get_child_tasks(
  p_child_id UUID,
  p_status VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(200),
  description TEXT,
  task_type VARCHAR(50),
  subject VARCHAR(50),
  target_count INTEGER,
  target_duration INTEGER,
  priority INTEGER,
  status VARCHAR(20),
  due_date TIMESTAMPTZ,
  reward_points INTEGER,
  created_at TIMESTAMPTZ,
  progress_count INTEGER,
  progress_duration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pt.id,
    pt.title,
    pt.description,
    pt.task_type,
    pt.subject,
    pt.target_count,
    pt.target_duration,
    pt.priority,
    pt.status,
    pt.due_date,
    pt.reward_points,
    pt.created_at,
    COALESCE(tc.progress_count, 0) as progress_count,
    COALESCE(tc.progress_duration, 0) as progress_duration
  FROM parent_tasks pt
  LEFT JOIN task_completions tc ON pt.id = tc.task_id AND tc.child_id = p_child_id
  WHERE pt.child_id = p_child_id
    AND (p_status IS NULL OR pt.status = p_status)
  ORDER BY pt.priority ASC, pt.due_date ASC NULLS LAST, pt.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取家长的任务列表
CREATE OR REPLACE FUNCTION get_parent_tasks(
  p_parent_id UUID,
  p_status VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  child_id UUID,
  child_name VARCHAR(255),
  title VARCHAR(200),
  description TEXT,
  task_type VARCHAR(50),
  subject VARCHAR(50),
  target_count INTEGER,
  target_duration INTEGER,
  priority INTEGER,
  status VARCHAR(20),
  due_date TIMESTAMPTZ,
  reward_points INTEGER,
  created_at TIMESTAMPTZ,
  progress_count INTEGER,
  progress_duration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pt.id,
    pt.child_id,
    u.display_name as child_name,
    pt.title,
    pt.description,
    pt.task_type,
    pt.subject,
    pt.target_count,
    pt.target_duration,
    pt.priority,
    pt.status,
    pt.due_date,
    pt.reward_points,
    pt.created_at,
    COALESCE(tc.progress_count, 0) as progress_count,
    COALESCE(tc.progress_duration, 0) as progress_duration
  FROM parent_tasks pt
  LEFT JOIN task_completions tc ON pt.id = tc.task_id
  LEFT JOIN auth.users u ON pt.child_id = u.id
  WHERE pt.parent_id = p_parent_id
    AND (p_status IS NULL OR pt.status = p_status)
  ORDER BY pt.status ASC, pt.priority ASC, pt.due_date ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建任务
CREATE OR REPLACE FUNCTION create_parent_task(
  p_parent_id UUID,
  p_child_id UUID,
  p_title VARCHAR(200),
  p_description TEXT DEFAULT NULL,
  p_task_type VARCHAR(50) DEFAULT 'practice',
  p_subject VARCHAR(50) DEFAULT NULL,
  p_target_count INTEGER DEFAULT 1,
  p_target_duration INTEGER DEFAULT NULL,
  p_priority INTEGER DEFAULT 2,
  p_due_date TIMESTAMPTZ DEFAULT NULL,
  p_reward_points INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_task_id UUID;
BEGIN
  INSERT INTO parent_tasks (
    parent_id, child_id, title, description, task_type,
    subject, target_count, target_duration, priority,
    due_date, reward_points
  ) VALUES (
    p_parent_id, p_child_id, p_title, p_description, p_task_type,
    p_subject, p_target_count, p_target_duration, p_priority,
    p_due_date, p_reward_points
  ) RETURNING id INTO v_task_id;

  RETURN jsonb_build_object(
    'success', true,
    'task_id', v_task_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 更新任务进度
CREATE OR REPLACE FUNCTION update_task_progress(
  p_task_id UUID,
  p_child_id UUID,
  p_progress_count INTEGER DEFAULT 0,
  p_progress_duration INTEGER DEFAULT 0,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_task parent_tasks%ROWTYPE;
  v_completed BOOLEAN := FALSE;
BEGIN
  -- 获取任务信息
  SELECT * INTO v_task FROM parent_tasks WHERE id = p_task_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Task not found');
  END IF;

  -- 更新或创建进度记录
  INSERT INTO task_completions (task_id, child_id, progress_count, progress_duration, notes)
  VALUES (p_task_id, p_child_id, p_progress_count, p_progress_duration, p_notes)
  ON CONFLICT (task_id, child_id) DO UPDATE SET
    progress_count = p_progress_count,
    progress_duration = p_progress_duration,
    notes = COALESCE(p_notes, task_completions.notes),
    updated_at = NOW();

  -- 检查是否完成
  IF v_task.target_count IS NOT NULL AND v_task.target_count > 0 THEN
    v_completed := p_progress_count >= v_task.target_count;
  ELSIF v_task.target_duration IS NOT NULL AND v_task.target_duration > 0 THEN
    v_completed := p_progress_duration >= v_task.target_duration;
  END IF;

  -- 如果完成，更新任务状态
  IF v_completed THEN
    UPDATE parent_tasks
    SET status = 'completed', completed_at = NOW()
    WHERE id = p_task_id;

    -- TODO: 奖励积分
  ELSIF v_task.status = 'pending' THEN
    UPDATE parent_tasks SET status = 'in_progress' WHERE id = p_task_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'completed', v_completed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 完成
-- =====================================================
