-- =====================================================
-- Project Socrates - Achievements Tables
-- 成就系统数据库表
-- =====================================================

-- 1. 用户成就表
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 100,
  UNIQUE(user_id, achievement_id)
);

-- 2. 用户等级表
CREATE TABLE IF NOT EXISTS user_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 索引
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON user_levels(user_id);

-- 4. RLS 策略
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的成就
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid()::uuid = user_id);

-- 用户只能插入自己的成就
CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

-- 用户只能查看自己的等级
CREATE POLICY "Users can view own level" ON user_levels
  FOR SELECT USING (auth.uid()::uuid = user_id);

-- 用户只能插入/更新自己的等级
CREATE POLICY "Users can manage own level" ON user_levels
  FOR ALL USING (auth.uid()::uuid = user_id);

-- 5. 触发器：创建用户时自动创建等级记录
CREATE OR REPLACE FUNCTION create_user_level()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_levels (user_id, level, xp, total_xp)
  VALUES (NEW.id, 1, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 删除已存在的触发器（如果有）
DROP TRIGGER IF EXISTS on_profile_created_create_level ON profiles;

-- 创建触发器
CREATE TRIGGER on_profile_created_create_level
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_user_level();
