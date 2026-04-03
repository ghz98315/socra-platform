import { createHash, randomBytes } from 'crypto';

export type PhoneCodePurpose = 'login' | 'register';

export interface PhoneCodeProfilePayload {
  display_name?: string;
  avatar_url?: string | null;
  student_avatar_url?: string | null;
  parent_avatar_url?: string | null;
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '');
}

export function isValidMainlandPhone(phone: string) {
  return /^1[3-9]\d{9}$/.test(normalizePhone(phone));
}

export function phoneToPseudoEmail(phone: string) {
  return `${normalizePhone(phone)}@student.local`;
}

export function hashVerificationCode(code: string) {
  return createHash('sha256').update(code).digest('hex');
}

export const VERIFICATION_CODE_PATTERN = /^\d{6,8}$/;
export const VERIFICATION_CODE_MAX_LENGTH = 8;

export function isValidVerificationCode(code: string) {
  return VERIFICATION_CODE_PATTERN.test(code.trim());
}

export function generateRandomPassword(length = 24) {
  const raw = randomBytes(length).toString('base64url');
  return `${raw}A1!`;
}

export function getOtpTypeForPurpose(purpose: PhoneCodePurpose) {
  return purpose === 'register' ? 'signup' : 'magiclink';
}

export function getOtpExpiryMinutes() {
  const raw = Number(process.env.AUTH_CODE_EXPIRES_MINUTES || '10');
  return Number.isFinite(raw) && raw > 0 ? raw : 10;
}

export function getResendCooldownSeconds() {
  const raw = Number(process.env.AUTH_CODE_RESEND_COOLDOWN_SECONDS || '60');
  return Number.isFinite(raw) && raw > 0 ? raw : 60;
}

export function getMaxSendAttemptsPerWindow() {
  const raw = Number(process.env.AUTH_CODE_MAX_ATTEMPTS_PER_10_MIN || '5');
  return Number.isFinite(raw) && raw > 0 ? raw : 5;
}

export function getMaxSendAttemptsPerIpWindow() {
  const raw = Number(process.env.AUTH_CODE_MAX_ATTEMPTS_PER_IP_10_MIN || '12');
  return Number.isFinite(raw) && raw > 0 ? raw : 12;
}

export function formatOtpMessage(code: string, expiryMinutes: number) {
  return `【Socrates】您的验证码为 ${code}，用于登录或注册，${expiryMinutes} 分钟内有效，请勿泄露给他人。`;
}
