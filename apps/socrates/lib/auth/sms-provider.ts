export interface SmsSendResult {
  provider: string;
  messageId?: string | null;
  debugCode?: string;
}

export async function sendVerificationSms(phone: string, message: string, code: string): Promise<SmsSendResult> {
  const provider = process.env.PHONE_AUTH_SMS_PROVIDER || 'console';

  if (provider === 'console') {
    console.log('[phone-auth] SMS provider=console', { phone, message, code });
    return {
      provider,
      messageId: null,
      debugCode: process.env.NODE_ENV === 'production' ? undefined : code,
    };
  }

  if (provider === 'tencent' || provider === 'aliyun') {
    throw new Error(
      `PHONE_AUTH_SMS_PROVIDER=${provider} is configured, but the provider adapter is not implemented yet. Complete service onboarding before enabling it.`,
    );
  }

  throw new Error(`Unsupported PHONE_AUTH_SMS_PROVIDER: ${provider}`);
}
