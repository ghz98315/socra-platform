CREATE INDEX IF NOT EXISTS idx_auth_verification_codes_send_ip_created_at
  ON auth_verification_codes (send_ip, created_at DESC)
  WHERE send_ip IS NOT NULL;
