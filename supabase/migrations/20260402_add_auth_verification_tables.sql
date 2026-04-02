CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS auth_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('login', 'register', 'bind_phone', 'reset_password')),
  provider TEXT NOT NULL DEFAULT 'console',
  code_hash TEXT NOT NULL,
  supabase_otp_type TEXT NOT NULL DEFAULT 'magiclink',
  provider_message_id TEXT,
  send_ip TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_auth_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('phone', 'wechat')),
  provider_user_id TEXT NOT NULL,
  phone TEXT,
  union_id TEXT,
  open_id TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_auth_verification_codes_phone_purpose_created_at
  ON auth_verification_codes (phone, purpose, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auth_verification_codes_phone_created_at
  ON auth_verification_codes (phone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_auth_identities_user_id
  ON user_auth_identities (user_id);

CREATE INDEX IF NOT EXISTS idx_user_auth_identities_phone
  ON user_auth_identities (phone)
  WHERE phone IS NOT NULL;

ALTER TABLE auth_verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_auth_identities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_auth_verification_codes_updated_at'
  ) THEN
    CREATE TRIGGER set_auth_verification_codes_updated_at
      BEFORE UPDATE ON auth_verification_codes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_user_auth_identities_updated_at'
  ) THEN
    CREATE TRIGGER set_user_auth_identities_updated_at
      BEFORE UPDATE ON user_auth_identities
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
