-- =====================================================
-- 修复社区触发器 + 重置负数计数
-- =====================================================

-- 1. 重新创建点赞触发器
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

-- 2. 重新创建评论计数触发器
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

-- 3. 修复负数计数（重置为实际值）
UPDATE community_posts
SET likes_count = (SELECT COUNT(*) FROM community_likes WHERE post_id = community_posts.id)
WHERE likes_count < 0;

UPDATE community_posts
SET comments_count = (SELECT COUNT(*) FROM community_comments WHERE post_id = community_posts.id AND is_hidden = false)
WHERE comments_count < 0;

-- 4. 确保计数不为负
UPDATE community_posts SET likes_count = 0 WHERE likes_count < 0;
UPDATE community_posts SET comments_count = 0 WHERE comments_count < 0;

-- 5. 查看结果
SELECT id, LEFT(content, 30) as content_preview, likes_count, comments_count
FROM community_posts
ORDER BY created_at DESC
LIMIT 10;
