-- =====================================================
-- Project Socrates - Study Assets Tables
-- 统一学习记录索引层
-- =====================================================

CREATE TABLE IF NOT EXISTS study_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  study_session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,

  subject VARCHAR(20) NOT NULL
    CHECK (subject IN ('math', 'chinese', 'english', 'physics', 'chemistry', 'generic')),
  module VARCHAR(50) NOT NULL,
  source_type VARCHAR(30) NOT NULL DEFAULT 'study_module',
  source_id TEXT,

  input_type VARCHAR(30) NOT NULL DEFAULT 'text',
  question_type VARCHAR(20) NOT NULL DEFAULT 'unknown'
    CHECK (question_type IN ('choice', 'fill', 'solution', 'proof', 'calculation', 'reading', 'writing', 'listening', 'unknown')),

  title TEXT,
  summary TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'completed', 'archived')),

  payload JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_assets_student_id ON study_assets(student_id);
CREATE INDEX IF NOT EXISTS idx_study_assets_subject_module ON study_assets(subject, module);
CREATE INDEX IF NOT EXISTS idx_study_assets_study_session_id ON study_assets(study_session_id);
CREATE INDEX IF NOT EXISTS idx_study_assets_updated_at ON study_assets(updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_study_assets_source_unique
  ON study_assets(source_type, source_id)
  WHERE source_id IS NOT NULL;

ALTER TABLE study_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view their own study assets" ON study_assets;
DROP POLICY IF EXISTS "Students can insert their own study assets" ON study_assets;
DROP POLICY IF EXISTS "Students can update their own study assets" ON study_assets;

CREATE POLICY "Students can view their own study assets"
  ON study_assets FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own study assets"
  ON study_assets FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own study assets"
  ON study_assets FOR UPDATE
  USING (auth.uid() = student_id);

DROP TRIGGER IF EXISTS update_study_assets_updated_at ON study_assets;
CREATE TRIGGER update_study_assets_updated_at
  BEFORE UPDATE ON study_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE study_assets IS '统一学习记录索引表 - 用于挂接多学科、多模块学习资产';
COMMENT ON COLUMN study_assets.source_type IS '来源类型，如 error_session / essay / study_module';
COMMENT ON COLUMN study_assets.payload IS '模块原始输入与补充元数据';

CREATE TABLE IF NOT EXISTS study_asset_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES study_assets(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_asset_messages_asset_id ON study_asset_messages(asset_id);
CREATE INDEX IF NOT EXISTS idx_study_asset_messages_created_at ON study_asset_messages(created_at DESC);

ALTER TABLE study_asset_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view messages for own study assets" ON study_asset_messages;
DROP POLICY IF EXISTS "Students can insert messages for own study assets" ON study_asset_messages;

CREATE POLICY "Students can view messages for own study assets"
  ON study_asset_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM study_assets
      WHERE study_assets.id = study_asset_messages.asset_id
        AND study_assets.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert messages for own study assets"
  ON study_asset_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM study_assets
      WHERE study_assets.id = study_asset_messages.asset_id
        AND study_assets.student_id = auth.uid()
    )
  );

COMMENT ON TABLE study_asset_messages IS '统一学习记录消息表 - 存储 study_assets 下的模块对话';
