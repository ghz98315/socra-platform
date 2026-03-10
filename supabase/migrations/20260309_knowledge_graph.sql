-- =====================================================
-- Socra Platform - Knowledge Graph System
-- 知识图谱系统
-- 创建时间: 2026-03-09
-- =====================================================

-- =====================================================
-- 1. 知识节点表 (知识图谱)
-- =====================================================
CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  subject VARCHAR(50) NOT NULL,                -- 科目: 'math', 'chinese', 'english', 'physics', 'chemistry'
  grade_level INTEGER CHECK (grade_level >= 1 AND grade_level <= 12),
  chapter VARCHAR(100),                        -- 章节/单元
  difficulty INTEGER DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),
  description TEXT,
  key_points TEXT,                             -- 关键点/公式
  prerequisites UUID[],                        -- 前置知识点 ID 数组
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 添加注释
COMMENT ON TABLE knowledge_nodes IS '知识节点表';
COMMENT ON COLUMN knowledge_nodes.subject IS '科目: math/chinese/english/physics/chemistry';
COMMENT ON COLUMN knowledge_nodes.grade_level IS '年级: 1-12';
COMMENT ON COLUMN knowledge_nodes.chapter IS '章节/单元';
COMMENT ON COLUMN knowledge_nodes.difficulty IS '难度: 1-5';
COMMENT ON COLUMN knowledge_nodes.description IS '知识点描述';
COMMENT ON COLUMN knowledge_nodes.key_points IS '关键点/公式';
COMMENT ON COLUMN knowledge_nodes.prerequisites IS '前置知识点 ID 数组';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_parent ON knowledge_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_subject ON knowledge_nodes(subject);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_grade_level ON knowledge_nodes(grade_level);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_chapter ON knowledge_nodes(chapter);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_difficulty ON knowledge_nodes(difficulty);

-- =====================================================
-- 2. 用户知识点掌握度表
-- =====================================================
CREATE TABLE IF NOT EXISTS user_knowledge_mastery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE NOT NULL,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 5),
  last_review_at TIMESTAMPTZ,
  review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
  last_practice_at TIMESTAMPTZ,
  last_practice_type TEXT,
  notes TEXT,
  streak_days INTEGER DEFAULT 0 CHECK (streak_days >= 0 AND streak_days <= 365),
  consecutive_correct_days INTEGER DEFAULT 0 CHECK (consecutive_correct_days >= 0 AND consecutive_correct_days <= 365),
  practice_duration_minutes INTEGER DEFAULT 0 CHECK (practice_duration_minutes >= 0),
  strengths TEXT[],   -- 优势
  weaknesses TEXT[],  -- 薄弱点
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, node_id)
);

-- 添加注释
COMMENT ON TABLE user_knowledge_mastery IS '用户知识点掌握度表';
COMMENT ON COLUMN user_knowledge_mastery.mastery_level IS '掌握等级: 0-5';
COMMENT ON COLUMN user_knowledge_mastery.confidence_score IS '置信度分数: 0-5';
COMMENT ON COLUMN user_knowledge_mastery.last_review_at IS '最后复习时间';
COMMENT ON COLUMN user_knowledge_mastery.review_count IS '复习次数';
COMMENT ON COLUMN user_knowledge_mastery.last_practice_at IS '最后练习时间';
COMMENT ON COLUMN user_knowledge_mastery.last_practice_type IS '最后练习类型';
COMMENT ON COLUMN user_knowledge_mastery.notes IS '笔记';
COMMENT ON COLUMN user_knowledge_mastery.streak_days IS '连续学习天数';
COMMENT ON COLUMN user_knowledge_mastery.consecutive_correct_days IS '连续正确天数';
COMMENT ON COLUMN user_knowledge_mastery.practice_duration_minutes IS '练习时长(分钟)';
COMMENT ON COLUMN user_knowledge_mastery.strengths IS '优势';
COMMENT ON COLUMN user_knowledge_mastery.weaknesses IS '薄弱点';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_knowledge_mastery_user ON user_knowledge_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_user_knowledge_mastery_node ON user_knowledge_mastery(node_id);
CREATE INDEX IF NOT EXISTS idx_user_knowledge_mastery_mastery ON user_knowledge_mastery(mastery_level);
CREATE INDEX IF NOT EXISTS idx_user_knowledge_mastery_last_review ON user_knowledge_mastery(last_review_at);
CREATE INDEX IF NOT EXISTS idx_user_knowledge_mastery_streak_days ON user_knowledge_mastery(streak_days);
CREATE INDEX IF NOT EXISTS idx_user_knowledge_mastery_practice_duration ON user_knowledge_mastery(practice_duration_minutes);

-- =====================================================
-- 3. RLS 策略
-- =====================================================

-- 启用 RLS
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_knowledge_mastery ENABLE ROW LEVEL SECURITY;

-- knowledge_nodes 策略 (公开读取)
CREATE POLICY "Knowledge nodes are readable by all" ON knowledge_nodes
  FOR SELECT USING (true);

-- user_knowledge_mastery 策略
CREATE POLICY "Users can view their own mastery" ON user_knowledge_mastery
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own mastery" ON user_knowledge_mastery
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 4. 触发器
-- =====================================================

-- 自动更新 updated_at
DROP TRIGGER IF EXISTS update_knowledge_nodes_updated_at ON knowledge_nodes;
CREATE TRIGGER update_knowledge_nodes_updated_at
  BEFORE UPDATE ON knowledge_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_knowledge_mastery_updated_at ON user_knowledge_mastery;
CREATE TRIGGER update_user_knowledge_mastery_updated_at
  BEFORE UPDATE ON user_knowledge_mastery
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. 核心函数
-- =====================================================

-- 获取用户的学习统计
CREATE OR REPLACE FUNCTION get_user_learning_stats(
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_total_nodes INTEGER;
  v_mastered_nodes INTEGER;
  v_avg_mastery NUMERIC;
  v_max_streak INTEGER;
BEGIN
  -- 获取总知识点数
  SELECT COUNT(*) INTO v_total_nodes FROM knowledge_nodes;

  -- 获取已掌握的知识点数 (掌握度 >= 4)
  SELECT COUNT(*) INTO v_mastered_nodes
  FROM user_knowledge_mastery
  WHERE user_id = p_user_id AND mastery_level >= 4;

  -- 获取平均掌握度
  SELECT COALESCE(AVG(mastery_level), 0) INTO v_avg_mastery
  FROM user_knowledge_mastery
  WHERE user_id = p_user_id;

  -- 获取最大连续天数
  SELECT COALESCE(MAX(streak_days), 0) INTO v_max_streak
  FROM user_knowledge_mastery
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'total_nodes', v_total_nodes,
    'mastered_nodes', v_mastered_nodes,
    'average_mastery', ROUND(v_avg_mastery, 1),
    'max_streak', v_max_streak
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取用户的薄弱知识点
CREATE OR REPLACE FUNCTION get_weak_knowledge_nodes(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  node_id UUID,
  description TEXT,
  subject VARCHAR(50),
  mastery_level INTEGER,
  review_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kn.id,
    kn.description,
    kn.subject,
    COALESCE(ukm.mastery_level, 0) as mastery_level,
    COALESCE(ukm.review_count, 0) as review_count
  FROM knowledge_nodes kn
  LEFT JOIN user_knowledge_mastery ukm ON kn.id = ukm.node_id AND ukm.user_id = p_user_id
  WHERE COALESCE(ukm.mastery_level, 0) < 3
  ORDER BY COALESCE(ukm.mastery_level, 0) ASC, kn.difficulty ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取用户需要复习的知识点 (基于遗忘曲线)
CREATE OR REPLACE FUNCTION get_nodes_for_review(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  node_id UUID,
  description TEXT,
  subject VARCHAR(50),
  last_review_at TIMESTAMPTZ,
  days_since_review INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kn.id,
    kn.description,
    kn.subject,
    ukm.last_review_at,
    EXTRACT(DAY FROM NOW() - ukm.last_review_at)::INTEGER as days_since_review
  FROM knowledge_nodes kn
  JOIN user_knowledge_mastery ukm ON kn.id = ukm.node_id AND ukm.user_id = p_user_id
  WHERE ukm.last_review_at IS NULL
     OR ukm.last_review_at < NOW() - INTERVAL '7 days'
  ORDER BY ukm.last_review_at ASC NULLS FIRST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 完成
-- =====================================================
