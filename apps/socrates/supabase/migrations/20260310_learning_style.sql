-- =====================================================
-- Project Socrates - Learning Style Test Migration
-- 学习风格测试数据库迁移 (VARK 模型)
-- =====================================================

-- =====================================================
-- 1. 学习风格测试题目表
-- =====================================================

-- 学习风格测试题目表
CREATE TABLE IF NOT EXISTS learning_style_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_number INTEGER NOT NULL UNIQUE,          -- 题号
  category VARCHAR(50) NOT NULL,                    -- 类别: visual, auditory, kinesthetic, reading
  question_text TEXT NOT NULL,                      -- 题目内容
  option_a TEXT NOT NULL,                           -- 选项A
  option_b TEXT NOT NULL,                           -- 选项B
  option_c TEXT NOT NULL,                           -- 选项C
  option_d TEXT NOT NULL,                           -- 选项D
  scores JSONB NOT NULL,                            -- 各选项得分 {"a": {"visual": 1}, "b": {"auditory": 1}, ...}
  is_active BOOLEAN DEFAULT true,                   -- 是否启用
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. 学习风格测评记录表
-- =====================================================

-- 学习风格测评记录表
CREATE TABLE IF NOT EXISTS learning_style_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,                           -- 答案记录 {"1": "a", "2": "b", ...}
  visual_score INTEGER DEFAULT 0,                   -- 视觉型得分
  auditory_score INTEGER DEFAULT 0,                 -- 听觉型得分
  kinesthetic_score INTEGER DEFAULT 0,              -- 动觉型得分
  reading_score INTEGER DEFAULT 0,                  -- 读写型得分
  primary_style VARCHAR(50),                        -- 主要学习风格
  secondary_style VARCHAR(50),                      -- 次要学习风格
  recommendations TEXT[],                           -- 个性化学习建议
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)                                   -- 每个用户只有一条测评记录
);

-- =====================================================
-- 3. 索引
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_style_questions_category ON learning_style_questions(category);
CREATE INDEX IF NOT EXISTS idx_style_assessments_user ON learning_style_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_style_assessments_style ON learning_style_assessments(primary_style);

-- =====================================================
-- 4. RLS 策略
-- =====================================================

ALTER TABLE learning_style_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_style_assessments ENABLE ROW LEVEL SECURITY;

-- learning_style_questions 策略 (所有人可读)
CREATE POLICY "Questions are readable by all" ON learning_style_questions
  FOR SELECT USING (true);

CREATE POLICY "Service role full access" ON learning_style_questions
  FOR ALL USING (auth.role() = 'service_role');

-- learning_style_assessments 策略
CREATE POLICY "Users can view own assessment" ON learning_style_assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessment" ON learning_style_assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessment" ON learning_style_assessments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON learning_style_assessments
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 5. 插入学习风格测试题目 (VARK 模型)
-- =====================================================

INSERT INTO learning_style_questions (question_number, category, question_text, option_a, option_b, option_c, option_d, scores) VALUES
(1, 'general', '当你学习新技能时，你更喜欢：',
  '看图表、视频或演示', '听老师讲解或讨论', '亲手操作或实践', '阅读说明书或笔记',
  '{"a": {"visual": 1}, "b": {"auditory": 1}, "c": {"kinesthetic": 1}, "d": {"reading": 1}}'),

(2, 'general', '记住某件事的最佳方式是：',
  '在脑海中形成画面', '重复说出来或讨论', '做动作或走动', '写下来或做笔记',
  '{"a": {"visual": 1}, "b": {"auditory": 1}, "c": {"kinesthetic": 1}, "d": {"reading": 1}}'),

(3, 'study', '复习功课时，你倾向于：',
  '画思维导图或看图解', '朗读或听录音', '做题或动手实验', '整理笔记或看书',
  '{"a": {"visual": 1}, "b": {"auditory": 1}, "c": {"kinesthetic": 1}, "d": {"reading": 1}}'),

(4, 'instruction', '组装新玩具时，你会：',
  '看图示或视频教程', '听别人口头指导', '直接动手尝试', '阅读说明书',
  '{"a": {"visual": 1}, "b": {"auditory": 1}, "c": {"kinesthetic": 1}, "d": {"reading": 1}}'),

(5, 'communication', '表达想法时，你更喜欢：',
  '画图或展示图片', '口头描述或比喻', '用手势或动作', '写文字或列表',
  '{"a": {"visual": 1}, "b": {"auditory": 1}, "c": {"kinesthetic": 1}, "d": {"reading": 1}}'),

(6, 'general', '在课堂上，你最容易分心是因为：',
  '看不到板书或图片', '听不清老师的声音', '坐太久不能活动', '没有文字材料参考',
  '{"a": {"visual": 1}, "b": {"auditory": 1}, "c": {"kinesthetic": 1}, "d": {"reading": 1}}'),

(7, 'study', '背诵课文时，你会：',
  '想象故事场景', '大声朗读出来', '边走边背', '抄写多遍',
  '{"a": {"visual": 1}, "b": {"auditory": 1}, "c": {"kinesthetic": 1}, "d": {"reading": 1}}'),

(8, 'problem', '解决难题时，你习惯：',
  '画图或列表示意', '自言自语或讨论', '尝试不同方法', '列出步骤分析',
  '{"a": {"visual": 1}, "b": {"auditory": 1}, "c": {"kinesthetic": 1}, "d": {"reading": 1}}'),

(9, 'general', '你对某人的印象主要来自：',
  '他们的外貌和穿着', '他们说话的声音和语气', '他们的动作和姿态', '他们说的话的内容',
  '{"a": {"visual": 1}, "b": {"auditory": 1}, "c": {"kinesthetic": 1}, "d": {"reading": 1}}'),

(10, 'study', '学习数学概念时，你更喜欢：',
  '看图形或动画演示', '听老师讲解原理', '用实物或模型操作', '看公式和例题',
  '{"a": {"visual": 1}, "b": {"auditory": 1}, "c": {"kinesthetic": 1}, "d": {"reading": 1}}'),

(11, 'leisure', '空闲时间，你喜欢：',
  '看电影或画画', '听音乐或播客', '运动或手工', '看书或写日记',
  '{"a": {"visual": 1}, "b": {"auditory": 1}, "c": {"kinesthetic": 1}, "d": {"reading": 1}}'),

(12, 'general', '记住电话号码，你会：',
  '在脑中看到数字', '默念几遍', '用手指比划', '写下来或输入手机',
  '{"a": {"visual": 1}, "b": {"auditory": 1}, "c": {"kinesthetic": 1}, "d": {"reading": 1}}'),

(13, 'instruction', '学习新软件，你倾向于：',
  '看视频教程', '听别人讲解', '自己摸索尝试', '阅读帮助文档',
  '{"a": {"visual": 1}, "b": {"auditory": 1}, "c": {"kinesthetic": 1}, "d": {"reading": 1}}'),

(14, 'communication', '向朋友指路时，你会：',
  '画地图或用手势', '口头详细描述', '带他们走一遍', '写详细的路线说明',
  '{"a": {"visual": 1}, "b": {"auditory": 1}, "c": {"kinesthetic": 1}, "d": {"reading": 1}}'),

(15, 'study', '记住英语单词，你更喜欢：',
  '看图片联想', '听发音和跟读', '边写边记', '看例句和文章',
  '{"a": {"visual": 1}, "b": {"auditory": 1}, "c": {"kinesthetic": 1}, "d": {"reading": 1}}'),

(16, 'general', '你认为最好的考试形式是：',
  '看图回答问题', '口头问答', '实际操作演示', '书面问答',
  '{"a": {"visual": 1}, "b": {"auditory": 1}, "c": {"kinesthetic": 1}, "d": {"reading": 1}}')
ON CONFLICT (question_number) DO NOTHING;
