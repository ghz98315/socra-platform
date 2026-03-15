-- =====================================================
-- Add role-specific avatar columns to profiles
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'student_avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN student_avatar_url TEXT;
    COMMENT ON COLUMN profiles.student_avatar_url IS '学生端头像 URL';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'parent_avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN parent_avatar_url TEXT;
    COMMENT ON COLUMN profiles.parent_avatar_url IS '家长端头像 URL';
  END IF;
END $$;

UPDATE profiles
SET student_avatar_url = COALESCE(student_avatar_url, avatar_url)
WHERE student_avatar_url IS NULL;

UPDATE profiles
SET parent_avatar_url = COALESCE(parent_avatar_url, avatar_url)
WHERE parent_avatar_url IS NULL;
