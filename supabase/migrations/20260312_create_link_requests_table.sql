-- =====================================================
-- Project Socrates - Link Requests Table
-- 家长关联学生请求表
-- =====================================================

-- 创建 link_requests 表
CREATE TABLE IF NOT EXISTS link_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(parent_id, student_id)
);

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_link_requests_parent_id ON link_requests(parent_id);
CREATE INDEX IF NOT EXISTS idx_link_requests_student_id ON link_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_link_requests_status ON link_requests(status);

-- 启用 RLS
ALTER TABLE link_requests ENABLE ROW LEVEL SECURITY;

-- RLS 策略：家长可以查看自己发送的请求
CREATE POLICY "Parents can view their sent requests"
  ON link_requests FOR SELECT
  USING (auth.uid() = parent_id);

-- RLS 策略：学生可以查看收到的请求
CREATE POLICY "Students can view their received requests"
  ON link_requests FOR SELECT
  USING (auth.uid() = student_id);

-- RLS 策略：家长可以创建请求
CREATE POLICY "Parents can create requests"
  ON link_requests FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

-- RLS 策略：学生可以更新（接受/拒绝）收到的请求
CREATE POLICY "Students can update their received requests"
  ON link_requests FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- 创建触发器函数：当请求被接受时自动更新 profiles.parent_id
CREATE OR REPLACE FUNCTION handle_link_request_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- 当状态变为 accepted 时，更新学生的 parent_id
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    UPDATE profiles
    SET parent_id = NEW.parent_id
    WHERE id = NEW.student_id;

    -- 设置响应时间
    NEW.responded_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_link_request_accepted ON link_requests;
CREATE TRIGGER on_link_request_accepted
  BEFORE UPDATE ON link_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_link_request_accepted();

-- 添加注释
COMMENT ON TABLE link_requests IS '家长关联学生的请求表';
COMMENT ON COLUMN link_requests.id IS '请求唯一ID';
COMMENT ON COLUMN link_requests.parent_id IS '发起请求的家长ID';
COMMENT ON COLUMN link_requests.student_id IS '被请求关联的学生ID';
COMMENT ON COLUMN link_requests.status IS '请求状态：pending-待处理, accepted-已接受, rejected-已拒绝';
COMMENT ON COLUMN link_requests.message IS '请求附带的留言';
COMMENT ON COLUMN link_requests.created_at IS '请求创建时间';
COMMENT ON COLUMN link_requests.responded_at IS '请求响应时间';
