-- =====================================================
-- Essay Reviewer Tables
-- 创建时间: 2026-03-03
-- =====================================================

-- essays 表：存储作文批改记录
CREATE TABLE IF NOT EXISTS essays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- 作文基本信息
  title VARCHAR(200),
  content TEXT,
  grade VARCHAR(50) NOT NULL,

  -- 图片存储（存储 base64 或 URL 数组的 JSON）
  images JSONB DEFAULT '[]'::jsonb,

  -- AI 分析结果
  analysis JSONB,

  -- 元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_essays_user_id ON essays(user_id);
CREATE INDEX IF NOT EXISTS idx_essays_profile_id ON essays(profile_id);
CREATE INDEX IF NOT EXISTS idx_essays_created_at ON essays(created_at DESC);

-- RLS 策略
ALTER TABLE essays ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的作文
CREATE POLICY "Users can view own essays" ON essays
  FOR SELECT USING (auth.uid() = user_id);

-- 用户只能插入自己的作文
CREATE POLICY "Users can insert own essays" ON essays
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的作文
CREATE POLICY "Users can update own essays" ON essays
  FOR UPDATE USING (auth.uid() = user_id);

-- 用户只能删除自己的作文
CREATE POLICY "Users can delete own essays" ON essays
  FOR DELETE USING (auth.uid() = user_id);

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_essays_updated_at
  BEFORE UPDATE ON essays
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 注释
COMMENT ON TABLE essays IS '作文批改记录表';
COMMENT ON COLUMN essays.user_id IS '用户ID（auth.users）';
COMMENT ON COLUMN essays.profile_id IS '档案ID（profiles）';
COMMENT ON COLUMN essays.title IS '作文标题';
COMMENT ON COLUMN essays.content IS '作文正文';
COMMENT ON COLUMN essays.grade IS '年级';
COMMENT ON COLUMN essays.images IS '图片数组（base64 或 URL）';
COMMENT ON COLUMN essays.analysis IS 'AI 分析结果（JSON）';
