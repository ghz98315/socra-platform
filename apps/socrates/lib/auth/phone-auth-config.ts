export const PHONE_CODE_AUTH_DISABLED_MESSAGE =
  '手机验证码暂不可用，请先使用手机号加密码登录或注册。';

export function isPhoneCodeAuthEnabled() {
  return process.env.NEXT_PUBLIC_PHONE_CODE_AUTH_ENABLED === 'true';
}
