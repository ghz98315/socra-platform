-- =====================================================
-- Project Socrates - Community Tables
-- 社区互动功能数据库表
-- 适合中小学生使用的温馨社区
-- =====================================================

-- 1. 社区用户档案表
-- 存储用户在社区的昵称、积分、徽章等
CREATE TABLE IF NOT EXISTS community_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  nickname TEXT NOT NULL,                    -- 社区昵称（可爱风格）
  avatar_emoji TEXT DEFAULT '🐻',            -- 头像表情（用emoji代替真实头像，保护隐私）
  points INTEGER DEFAULT 0,                  -- 积分
  badges TEXT[] DEFAULT '{}',                -- 徽章列表
  bio TEXT DEFAULT '',                       -- 个人简介
  is_parent BOOLEAN DEFAULT FALSE,           -- 是否是家长
  posts_count INTEGER DEFAULT 0,             -- 发布数量
  likes_received INTEGER DEFAULT 0,          -- 收到的点赞
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 社区分享/帖子表
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_type TEXT NOT NULL,                   -- 'insight'(心得) | 'question'(求助) | 'tip'(技巧) | 'mastery'(成就) | 'error_share'(错题分享)
  content TEXT NOT NULL,                     -- 内容
  subject TEXT,                              -- 学科分类: math, physics, chemistry, english, etc.
  grade_level TEXT,                          -- 年级
  error_session_id UUID,                     -- 关联的错题ID（可选）
  image_url TEXT,                            -- 图片URL（可选）
  is_anonymous BOOLEAN DEFAULT FALSE,        -- 是否匿名发布
  is_featured BOOLEAN DEFAULT FALSE,         -- 是否精华
  featured_at TIMESTAMPTZ,                   -- 设为精华的时间
  likes_count INTEGER DEFAULT 0,             -- 点赞数
  comments_count INTEGER DEFAULT 0,          -- 评论数
  views_count INTEGER DEFAULT 0,             -- 浏览数
  is_hidden BOOLEAN DEFAULT FALSE,           -- 是否隐藏（审核不通过等）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 点赞表
CREATE TABLE IF NOT EXISTS community_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)                   -- 每个用户对每个帖子只能点赞一次
);

-- 4. 评论表
CREATE TABLE IF NOT EXISTS community_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,  -- 支持回复
  likes_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 评论点赞表
CREATE TABLE IF NOT EXISTS community_comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 6. 收藏表
CREATE TABLE IF NOT EXISTS community_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- =====================================================
-- 索引
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_subject ON community_posts(subject);
CREATE INDEX IF NOT EXISTS idx_community_posts_featured ON community_posts(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_likes_post ON community_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_profiles_points ON community_profiles(points DESC);

-- =====================================================
-- RLS 策略 (Row Level Security)
-- =====================================================

-- 启用 RLS
ALTER TABLE community_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_favorites ENABLE ROW LEVEL SECURITY;

-- community_profiles 策略
CREATE POLICY "Anyone can view community profiles" ON community_profiles
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert own profile" ON community_profiles
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update own profile" ON community_profiles
  FOR UPDATE USING (auth.uid()::uuid = user_id);

-- community_posts 策略
CREATE POLICY "Anyone can view non-hidden posts" ON community_posts
  FOR SELECT USING (is_hidden = FALSE);

CREATE POLICY "Users can insert own posts" ON community_posts
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update own posts" ON community_posts
  FOR UPDATE USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete own posts" ON community_posts
  FOR DELETE USING (auth.uid()::uuid = user_id);

-- community_likes 策略
CREATE POLICY "Anyone can view likes" ON community_likes
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert own likes" ON community_likes
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete own likes" ON community_likes
  FOR DELETE USING (auth.uid()::uuid = user_id);

-- community_comments 策略
CREATE POLICY "Anyone can view non-hidden comments" ON community_comments
  FOR SELECT USING (is_hidden = FALSE);

CREATE POLICY "Users can insert own comments" ON community_comments
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update own comments" ON community_comments
  FOR UPDATE USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete own comments" ON community_comments
  FOR DELETE USING (auth.uid()::uuid = user_id);

-- community_comment_likes 策略
CREATE POLICY "Anyone can view comment likes" ON community_comment_likes
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert own comment likes" ON community_comment_likes
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete own comment likes" ON community_comment_likes
  FOR DELETE USING (auth.uid()::uuid = user_id);

-- community_favorites 策略
CREATE POLICY "Users can view own favorites" ON community_favorites
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert own favorites" ON community_favorites
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete own favorites" ON community_favorites
  FOR DELETE USING (auth.uid()::uuid = user_id);

-- =====================================================
-- 触发器和函数
-- =====================================================

-- 更新时间戳函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 自动更新 updated_at
DROP TRIGGER IF EXISTS update_community_profiles_updated_at ON community_profiles;
CREATE TRIGGER update_community_profiles_updated_at
  BEFORE UPDATE ON community_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_posts_updated_at ON community_posts;
CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_comments_updated_at ON community_comments;
CREATE TRIGGER update_community_comments_updated_at
  BEFORE UPDATE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建用户时自动创建社区档案
CREATE OR REPLACE FUNCTION create_community_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- 生成可爱的随机昵称
  INSERT INTO community_profiles (user_id, nickname, avatar_emoji, is_parent)
  VALUES (
    NEW.id,
    '小伙伴_' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6),
    (ARRAY['🐻', '🐰', '🦊', '🐼', '🐨', '🦁', '🐯', '🐸', '🦉', '🦋'])[FLOOR(RANDOM() * 10 + 1)],
    (NEW.role = 'parent')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_community ON profiles;
CREATE TRIGGER on_profile_created_community
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_community_profile();

-- 点赞后更新帖子点赞数
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    UPDATE community_profiles SET likes_received = likes_received + 1
      WHERE user_id = (SELECT user_id FROM community_posts WHERE id = NEW.post_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    UPDATE community_profiles SET likes_received = GREATEST(likes_received - 1, 0)
      WHERE user_id = (SELECT user_id FROM community_posts WHERE id = OLD.post_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_like_change_update_count ON community_likes;
CREATE TRIGGER on_like_change_update_count
  AFTER INSERT OR DELETE ON community_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- 评论后更新帖子评论数
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_comment_change_update_count ON community_comments;
CREATE TRIGGER on_comment_change_update_count
  AFTER INSERT OR DELETE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- 发布帖子后更新用户发帖数
CREATE OR REPLACE FUNCTION update_user_posts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_profiles SET posts_count = posts_count + 1 WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_profiles SET posts_count = GREATEST(posts_count - 1, 0) WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_post_change_update_count ON community_posts;
CREATE TRIGGER on_post_change_update_count
  AFTER INSERT OR DELETE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_user_posts_count();

-- =====================================================
-- 初始数据：一些示例精华帖子（用于落地页展示）
-- =====================================================

-- 注意：这些是示例数据，实际部署时可以删除或替换
-- 需要先有用户才能插入帖子，所以这里只是注释示例
/*
INSERT INTO community_posts (user_id, post_type, content, subject, grade_level, is_featured, likes_count)
VALUES
  ('用户UUID', 'insight', '今天终于理解了分数除法！原来就是问"有多少个"的问题，AI老师讲得比课本清楚多了~', 'math', '六年级', TRUE, 128),
  ('用户UUID', 'mastery', '坚持使用苏格拉底30天，数学从70分提到了95分！感谢AI老师！', 'math', '初二', TRUE, 89);
*/

-- =====================================================
-- 视图：精华帖子视图（用于落地页展示）
-- =====================================================
CREATE OR REPLACE VIEW featured_posts_view AS
SELECT
  p.id,
  p.content,
  p.post_type,
  p.subject,
  p.grade_level,
  p.likes_count,
  p.comments_count,
  p.featured_at,
  cp.nickname,
  cp.avatar_emoji,
  cp.is_parent
FROM community_posts p
JOIN community_profiles cp ON p.user_id = cp.user_id
WHERE p.is_featured = TRUE AND p.is_hidden = FALSE
ORDER BY p.featured_at DESC;

-- =====================================================
-- 积分规则说明（在应用层实现）
-- =====================================================
-- 发布分享: +5积分
-- 被点赞: +2积分
-- 被设为精华: +20积分
-- 回答他人问题: +10积分
-- 连续活跃: +3积分/天
