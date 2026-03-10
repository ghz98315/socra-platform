-- =====================================================
-- Socra Platform - Unified Points System
-- 统一积分系统
-- 创建时间: 2026-03-09
-- =====================================================

-- =====================================================
-- 1. 用户积分表 (统一积分)
-- =====================================================
CREATE TABLE IF NOT EXISTS socra_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- 积分余额
  balance INTEGER DEFAULT 0 NOT NULL,          -- 当前可用积分
  total_earned INTEGER DEFAULT 0 NOT NULL,     -- 累计获得积分
  total_spent INTEGER DEFAULT 0 NOT NULL,      -- 累计消费积分

  -- 等级信息 (冗余存储，方便查询)
  level INTEGER DEFAULT 1 NOT NULL,            -- 当前等级
  level_name VARCHAR(50) DEFAULT '学习新手',    -- 等级称号

  -- 连续学习
  streak_days INTEGER DEFAULT 0,               -- 连续学习天数
  longest_streak INTEGER DEFAULT 0,            -- 最长连续天数
  last_earn_date DATE,                         -- 最后获得积分的日期

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_socra_points_user ON socra_points(user_id);
CREATE INDEX IF NOT EXISTS idx_socra_points_level ON socra_points(level);
CREATE INDEX IF NOT EXISTS idx_socra_points_balance ON socra_points(balance DESC);

-- 注释
COMMENT ON TABLE socra_points IS '统一积分系统 - 用户积分账户';
COMMENT ON COLUMN socra_points.balance IS '当前可用积分';
COMMENT ON COLUMN socra_points.total_earned IS '累计获得积分';
COMMENT ON COLUMN socra_points.total_spent IS '累计消费积分';
COMMENT ON COLUMN socra_points.level IS '当前等级 (1-15)';
COMMENT ON COLUMN socra_points.streak_days IS '连续学习天数';

-- =====================================================
-- 2. 积分流水表 (交易记录)
-- =====================================================
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 交易信息
  amount INTEGER NOT NULL,                     -- 积分变动 (正数增加，负数减少)
  balance_after INTEGER NOT NULL,              -- 交易后余额
  transaction_type VARCHAR(50) NOT NULL,       -- 交易类型
  source VARCHAR(50) NOT NULL,                 -- 来源模块

  -- 关联信息
  related_id UUID,                             -- 关联ID (错题ID/作文ID/邀请ID等)
  related_type VARCHAR(50),                    -- 关联类型

  -- 描述
  description TEXT,                            -- 交易描述

  -- 元数据
  metadata JSONB DEFAULT '{}',                 -- 扩展信息

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON point_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created ON point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_related ON point_transactions(related_id, related_type);

-- 注释
COMMENT ON TABLE point_transactions IS '积分流水表 - 所有积分变动记录';
COMMENT ON COLUMN point_transactions.amount IS '积分变动 (正数增加，负数减少)';
COMMENT ON COLUMN point_transactions.transaction_type IS '交易类型: earn/spend/expire/admin_adjust';
COMMENT ON COLUMN point_transactions.source IS '来源: error_review/essay/invite/streak/task/achievement/admin';

-- =====================================================
-- 3. 等级配置表 (定义等级规则)
-- =====================================================
CREATE TABLE IF NOT EXISTS level_configs (
  level INTEGER PRIMARY KEY,
  level_name VARCHAR(50) NOT NULL,
  required_points INTEGER NOT NULL,         -- 升级所需累计积分
  badge_icon VARCHAR(10),                   -- 徽章图标 (emoji)
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_level_configs_points ON level_configs(required_points);

-- 注释
COMMENT ON TABLE level_configs IS '等级配置表 - 定义各等级的升级规则';
COMMENT ON COLUMN level_configs.level IS '等级 (1-15)';
COMMENT ON COLUMN level_configs.required_points IS '升级所需累计积分';

-- 初始化等级配置数据
INSERT INTO level_configs (level, level_name, required_points, badge_icon, description) VALUES
  (1, '学习新手', 0, '🌱', '开始你的学习之旅'),
  (2, '学习达人', 100, '📚', '渐入佳境'),
  (3, '学霸', 300, '⭐', '小有所成'),
  (4, '学霸达人', 500, '🌟', '学业精进'),
  (5, '学霸高手', 800, '🏅', '成绩斐然'),
  (6, '学习之星', 1200, '✨', '脱颖而出'),
  (7, '知识达人', 1800, '💫', '知识渊博'),
  (8, '学习大师', 2500, '🎯', '炉火纯青'),
  (9, '智慧之星', 3500, '🔥', '智慧超群'),
  (10, '学神预备', 5000, '👑', '接近巅峰'),
  (11, '学神新秀', 7000, '💎', '登堂入室'),
  (12, '学神达人', 10000, '🏆', '出类拔萃'),
  (13, '学神高手', 15000, '🎖️', '登峰造极'),
  (14, '学神大师', 20000, '🥇', '独步天下'),
  (15, '学神', 30000, '🎓', '登峰造极')
ON CONFLICT (level) DO NOTHING;

-- =====================================================
-- 4. 交易类型枚举 (文档说明)
-- =====================================================
/*
交易类型 (transaction_type):
  - 'earn'       : 获得积分
  - 'spend'      : 消费积分
  - 'expire'     : 积分过期
  - 'admin_adjust': 管理员调整
  - 'reward'     : 系统奖励

来源类型 (source):
  - 'error_review'   : 错题学习完成
  - 'error_mastered' : 错题掌握
  - 'essay'          : 作文批改完成
  - 'invite'         : 邀请好友
  - 'streak'         : 连续学习奖励
  - 'daily_login'    : 每日登录
  - 'task'           : 家长任务
  - 'achievement'    : 成就解锁
  - 'subscription'   : 订阅奖励
  - 'share'          : 分享奖励
  - 'admin'          : 管理员操作
*/

-- =====================================================
-- 4. 积分规则表 (可配置的积分规则)
-- =====================================================
CREATE TABLE IF NOT EXISTS point_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_code VARCHAR(100) UNIQUE NOT NULL,      -- 规则代码
  rule_name VARCHAR(200) NOT NULL,             -- 规则名称
  source VARCHAR(50) NOT NULL,                 -- 来源模块

  -- 积分配置
  points INTEGER NOT NULL,                     -- 积分数量
  daily_limit INTEGER DEFAULT 0,               -- 每日上限 (0表示无限制)
  total_limit INTEGER DEFAULT 0,               -- 总上限 (0表示无限制)

  -- 条件
  conditions JSONB DEFAULT '{}',               -- 触发条件

  -- 状态
  is_active BOOLEAN DEFAULT TRUE,              -- 是否启用

  -- 描述
  description TEXT,

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 注释
COMMENT ON TABLE point_rules IS '积分规则配置表';

-- 初始化积分规则
INSERT INTO point_rules (rule_code, rule_name, source, points, daily_limit, description) VALUES
  ('error_review_complete', '错题学习完成', 'error_review', 10, 50, '每完成一道错题学习获得10积分，每日最多50'),
  ('error_mastered', '错题掌握', 'error_mastered', 20, 0, '错题从"学习中"变为"已掌握"获得20积分'),
  ('essay_review_complete', '作文批改完成', 'essay', 15, 45, '每完成一篇作文批改获得15积分，每日最多45'),
  ('daily_login', '每日登录', 'daily_login', 5, 5, '每日首次登录获得5积分'),
  ('streak_bonus', '连续学习奖励', 'streak', 5, 5, '连续学习每天额外获得5积分'),
  ('invite_success', '邀请好友成功', 'invite', 100, 0, '好友通过邀请码注册成功获得100积分'),
  ('invitee_first_learn', '被邀请人首次学习', 'invite', 50, 0, '被邀请人完成首次学习，邀请人获得50积分'),
  ('parent_task_complete', '完成家长任务', 'task', 20, 0, '完成家长布置的任务获得积分'),
  ('achievement_unlock', '成就解锁', 'achievement', 30, 0, '解锁成就获得30积分')
ON CONFLICT (rule_code) DO NOTHING;

-- =====================================================
-- 6. RLS 策略
-- =====================================================

-- 启用 RLS
ALTER TABLE socra_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_configs ENABLE ROW LEVEL SECURITY;

-- socra_points 策略
CREATE POLICY "Users can view own points" ON socra_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own points" ON socra_points
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own points" ON socra_points
  FOR UPDATE USING (auth.uid() = user_id);

-- point_transactions 策略
CREATE POLICY "Users can view own transactions" ON point_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON point_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- point_rules 策略 (所有人可读)
CREATE POLICY "Anyone can view active rules" ON point_rules
  FOR SELECT USING (is_active = TRUE);

-- level_configs 策略 (所有人可读)
CREATE POLICY "Anyone can view level configs" ON level_configs
  FOR SELECT USING (TRUE);

-- =====================================================
-- 7. 核心函数
-- =====================================================

-- 更新时间戳函数 (如果不存在则创建)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 自动更新 socra_points 的 updated_at
DROP TRIGGER IF EXISTS update_socra_points_updated_at ON socra_points;
CREATE TRIGGER update_socra_points_updated_at
  BEFORE UPDATE ON socra_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 自动更新 point_rules 的 updated_at
DROP TRIGGER IF EXISTS update_point_rules_updated_at ON point_rules;
CREATE TRIGGER update_point_rules_updated_at
  BEFORE UPDATE ON point_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. 积分操作函数
-- =====================================================

-- 增加积分函数
CREATE OR REPLACE FUNCTION add_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_source VARCHAR(50),
  p_transaction_type VARCHAR(50) DEFAULT 'earn',
  p_related_id UUID DEFAULT NULL,
  p_related_type VARCHAR(50) DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_balance INTEGER;
  v_level INTEGER;
  v_level_name VARCHAR(50);
  v_total_earned INTEGER;
BEGIN
  -- 检查积分数量
  IF p_amount <= 0 THEN
    RAISE EXCEPTION '积分数量必须大于0';
  END IF;

  -- 确保用户积分记录存在
  INSERT INTO socra_points (user_id, balance, total_earned)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- 更新积分
  UPDATE socra_points
  SET
    balance = balance + p_amount,
    total_earned = total_earned + p_amount,
    last_earn_date = CURRENT_DATE
  WHERE user_id = p_user_id
  RETURNING balance, total_earned, level INTO v_balance, v_total_earned, v_level;

  -- 计算新等级
  SELECT l.level, l.level_name INTO v_level, v_level_name
  FROM level_configs l
  WHERE l.required_points <= v_total_earned
  ORDER BY l.level DESC
  LIMIT 1;

  -- 更新等级
  UPDATE socra_points
  SET level = v_level, level_name = v_level_name
  WHERE user_id = p_user_id AND level < v_level;

  -- 创建交易记录
  INSERT INTO point_transactions (
    user_id, amount, balance_after, transaction_type, source,
    related_id, related_type, description, metadata
  ) VALUES (
    p_user_id, p_amount, v_balance, p_transaction_type, p_source,
    p_related_id, p_related_type, p_description, p_metadata
  );

  -- 返回结果
  RETURN jsonb_build_object(
    'success', TRUE,
    'amount', p_amount,
    'balance', v_balance,
    'level', v_level,
    'level_name', v_level_name,
    'total_earned', v_total_earned
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 消费积分函数
CREATE OR REPLACE FUNCTION spend_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_source VARCHAR(50),
  p_related_id UUID DEFAULT NULL,
  p_related_type VARCHAR(50) DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_balance INTEGER;
  v_level INTEGER;
  v_level_name VARCHAR(50);
  v_total_spent INTEGER;
BEGIN
  -- 检查积分数量
  IF p_amount <= 0 THEN
    RAISE EXCEPTION '积分数量必须大于0';
  END IF;

  -- 获取当前余额
  SELECT balance INTO v_balance FROM socra_points WHERE user_id = p_user_id;

  -- 检查余额是否足够
  IF v_balance IS NULL OR v_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', '积分不足',
      'balance', COALESCE(v_balance, 0),
      'required', p_amount
    );
  END IF;

  -- 更新积分
  UPDATE socra_points
  SET
    balance = balance - p_amount,
    total_spent = total_spent + p_amount
  WHERE user_id = p_user_id
  RETURNING balance, total_spent, level INTO v_balance, v_total_spent, v_level;

  -- 获取等级名称
  SELECT level_name INTO v_level_name FROM socra_points WHERE user_id = p_user_id;

  -- 创建交易记录
  INSERT INTO point_transactions (
    user_id, amount, balance_after, transaction_type, source,
    related_id, related_type, description, metadata
  ) VALUES (
    p_user_id, -p_amount, v_balance, 'spend', p_source,
    p_related_id, p_related_type, p_description, p_metadata
  );

  -- 返回结果
  RETURN jsonb_build_object(
    'success', TRUE,
    'amount', p_amount,
    'balance', v_balance,
    'level', v_level,
    'level_name', v_level_name,
    'total_spent', v_total_spent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取用户积分信息
CREATE OR REPLACE FUNCTION get_user_points(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'balance', COALESCE(sp.balance, 0),
    'total_earned', COALESCE(sp.total_earned, 0),
    'total_spent', COALESCE(sp.total_spent, 0),
    'level', COALESCE(sp.level, 1),
    'level_name', COALESCE(sp.level_name, '学习新手'),
    'streak_days', COALESCE(sp.streak_days, 0),
    'longest_streak', COALESCE(sp.longest_streak, 0),
    'next_level_points', (
      SELECT required_points FROM level_configs
      WHERE level > COALESCE(sp.level, 1)
      ORDER BY level ASC LIMIT 1
    ),
    'progress_to_next', CASE
      WHEN sp.level >= 15 THEN 100
      ELSE ROUND(
        (COALESCE(sp.total_earned, 0) - (
          SELECT COALESCE(MAX(required_points), 0) FROM level_configs
          WHERE level <= COALESCE(sp.level, 1)
        ))::NUMERIC /
        NULLIF((
          SELECT required_points FROM level_configs
          WHERE level > COALESCE(sp.level, 1)
          ORDER BY level ASC LIMIT 1
        ) - (
          SELECT COALESCE(MAX(required_points), 0) FROM level_configs
          WHERE level <= COALESCE(sp.level, 1)
        ), 0) * 100, 1
      )
    END
  ) INTO result
  FROM socra_points sp
  WHERE sp.user_id = p_user_id;

  RETURN COALESCE(result, jsonb_build_object(
    'balance', 0,
    'total_earned', 0,
    'total_spent', 0,
    'level', 1,
    'level_name', '学习新手',
    'streak_days', 0,
    'longest_streak', 0,
    'next_level_points', 100,
    'progress_to_next', 0
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. 触发器：创建用户时自动初始化积分
-- =====================================================

CREATE OR REPLACE FUNCTION init_user_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO socra_points (user_id, balance, total_earned, level, level_name)
  VALUES (NEW.id, 0, 0, 1, '学习新手')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_init_points ON auth.users;
CREATE TRIGGER on_user_created_init_points
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION init_user_points();

-- =====================================================
-- 10. 视图：用户积分概览
-- =====================================================

CREATE OR REPLACE VIEW user_points_overview AS
SELECT
  sp.user_id,
  sp.balance,
  sp.total_earned,
  sp.total_spent,
  sp.level,
  sp.level_name,
  sp.streak_days,
  sp.longest_streak,
  lc.badge_icon,
  sp.last_earn_date,
  sp.updated_at
FROM socra_points sp
LEFT JOIN level_configs lc ON sp.level = lc.level;

COMMENT ON VIEW user_points_overview IS '用户积分概览视图';

-- =====================================================
-- 完成
-- =====================================================
