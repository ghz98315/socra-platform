-- =====================================================
-- Project Socrates - Prompt System v2.0 数据库迁移
-- 执行时间: 2026-02-28
-- 功能: 支持科目识别、用户分层、对话模式区分
-- =====================================================

-- =====================================================
-- 1. 用户表：添加订阅等级字段
-- =====================================================

-- 添加 subscription_tier 字段（用户等级：free/premium）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free';

-- 添加注释
COMMENT ON COLUMN profiles.subscription_tier IS '用户订阅等级: free(免费) / premium(付费)';

-- 创建索引（可选，用于快速筛选付费用户）
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);

-- =====================================================
-- 2. 错题会话表：添加 OCR 识别信息字段
-- =====================================================

-- 添加科目识别字段
ALTER TABLE error_sessions ADD COLUMN IF NOT EXISTS ocr_subject VARCHAR(20);
ALTER TABLE error_sessions ADD COLUMN IF NOT EXISTS ocr_subject_confidence FLOAT;

-- 添加题型识别字段
ALTER TABLE error_sessions ADD COLUMN IF NOT EXISTS ocr_question_type VARCHAR(20);
ALTER TABLE error_sessions ADD COLUMN IF NOT EXISTS ocr_question_type_confidence FLOAT;

-- 添加注释
COMMENT ON COLUMN error_sessions.ocr_subject IS 'OCR识别的科目: math/chinese/english/generic';
COMMENT ON COLUMN error_sessions.ocr_subject_confidence IS '科目识别置信度 (0-1)';
COMMENT ON COLUMN error_sessions.ocr_question_type IS 'OCR识别的题型: choice/fill/solution/proof/calculation/reading/writing/unknown';
COMMENT ON COLUMN error_sessions.ocr_question_type_confidence IS '题型识别置信度 (0-1)';

-- 创建索引（可选，用于按科目/题型筛选）
CREATE INDEX IF NOT EXISTS idx_error_sessions_ocr_subject ON error_sessions(ocr_subject);
CREATE INDEX IF NOT EXISTS idx_error_sessions_ocr_question_type ON error_sessions(ocr_question_type);

-- =====================================================
-- 3. 更新现有数据（可选）
-- =====================================================

-- 将现有错题会话的科目设置为 math（历史数据兼容）
UPDATE error_sessions
SET ocr_subject = 'math',
    ocr_subject_confidence = 1.0
WHERE ocr_subject IS NULL AND subject = 'math';

-- =====================================================
-- 4. 修复 study_sessions 表
-- =====================================================

-- 添加 last_heartbeat 列（如果不存在）
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMPTZ;

-- 添加注释
COMMENT ON COLUMN study_sessions.last_heartbeat IS '最后心跳时间，用于判断会话是否活跃';

-- =====================================================
-- 5. 验证迁移结果
-- =====================================================

-- 查询 profiles 表结构
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('subscription_tier');

-- 查询 error_sessions 表新增字段
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'error_sessions'
AND column_name IN ('ocr_subject', 'ocr_subject_confidence', 'ocr_question_type', 'ocr_question_type_confidence');

-- =====================================================
-- 迁移完成
-- =====================================================
