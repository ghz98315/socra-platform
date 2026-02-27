-- =====================================================
-- 确保 profiles 表有 phone 字段
-- =====================================================

-- 添加 phone 字段（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
    COMMENT ON COLUMN profiles.phone IS '用户手机号';
  END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- 验证
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
