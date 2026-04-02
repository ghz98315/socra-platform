ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN profiles.email IS 'Compatibility column for legacy auth/profile flows';

UPDATE profiles AS p
SET email = u.email
FROM auth.users AS u
WHERE p.id = u.id
  AND (p.email IS NULL OR btrim(p.email) = '')
  AND u.email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON profiles(email)
  WHERE email IS NOT NULL;
