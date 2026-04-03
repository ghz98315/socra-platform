import { createHash, createHmac, randomUUID } from 'crypto';

export interface SmsSendResult {
  provider: string;
  messageId?: string | null;
  debugCode?: string;
}

interface VerificationSmsParams {
  phone: string;
  message: string;
  code: string;
  expiryMinutes: number;
}

type ProviderName = 'console' | 'tencent' | 'aliyun';

type TemplateContext = {
  phone: string;
  message: string;
  code: string;
  expiryMinutes: string;
};

const TENCENT_ALGORITHM = 'TC3-HMAC-SHA256';
const TENCENT_ACTION = 'SendSms';
const TENCENT_VERSION = '2021-01-11';
const TENCENT_REGION = 'ap-guangzhou';
const TENCENT_ENDPOINT = 'sms.tencentcloudapi.com';

const ALIYUN_ALGORITHM = 'ACS3-HMAC-SHA256';
const ALIYUN_ACTION = 'SendSms';
const ALIYUN_VERSION = '2017-05-25';
const ALIYUN_ENDPOINT = 'dysmsapi.aliyuncs.com';

function sha256Hex(value: string) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function hmacBuffer(key: string | Buffer, value: string) {
  return createHmac('sha256', key).update(value, 'utf8').digest();
}

function hmacHex(key: string | Buffer, value: string) {
  return createHmac('sha256', key).update(value, 'utf8').digest('hex');
}

function getProvider(): ProviderName {
  const raw = (process.env.PHONE_AUTH_SMS_PROVIDER || 'console').trim().toLowerCase();
  if (raw === 'console' || raw === 'tencent' || raw === 'aliyun') {
    return raw;
  }

  throw new Error(`Unsupported PHONE_AUTH_SMS_PROVIDER: ${raw}`);
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required when PHONE_AUTH_SMS_PROVIDER=${getProvider()}.`);
  }
  return value;
}

function toUtcDateString(input: Date) {
  return input.toISOString().slice(0, 10);
}

function toUtcIsoSeconds(input: Date) {
  return input.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function encodeRfc3986(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function buildTemplateContext(params: VerificationSmsParams): TemplateContext {
  return {
    phone: params.phone,
    message: params.message,
    code: params.code,
    expiryMinutes: String(params.expiryMinutes),
  };
}

function interpolateTemplateValue(value: unknown, context: TemplateContext): unknown {
  if (typeof value === 'string') {
    return value.replace(/\{\{\s*(phone|message|code|expiryMinutes)\s*\}\}/g, (_, key) => {
      return context[key as keyof TemplateContext];
    });
  }

  if (Array.isArray(value)) {
    return value.map((item) => interpolateTemplateValue(item, context));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        interpolateTemplateValue(nestedValue, context),
      ]),
    );
  }

  return value;
}

function parseTemplateEnv(envName: string, fallback: unknown, context: TemplateContext) {
  const raw = process.env[envName]?.trim();
  const parsed = raw ? JSON.parse(raw) : fallback;
  return interpolateTemplateValue(parsed, context);
}

function buildTencentTemplateParams(context: TemplateContext) {
  const parsed = parseTemplateEnv(
    'TENCENT_SMS_TEMPLATE_PARAMS_JSON',
    ['{{code}}', '{{expiryMinutes}}'],
    context,
  );

  if (!Array.isArray(parsed)) {
    throw new Error('TENCENT_SMS_TEMPLATE_PARAMS_JSON must be a JSON array.');
  }

  return parsed.map((item) => String(item ?? ''));
}

function buildAliyunTemplateParams(context: TemplateContext) {
  const parsed = parseTemplateEnv(
    'ALIYUN_SMS_TEMPLATE_PARAMS_JSON',
    { code: '{{code}}', minutes: '{{expiryMinutes}}' },
    context,
  );

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('ALIYUN_SMS_TEMPLATE_PARAMS_JSON must be a JSON object.');
  }

  return JSON.stringify(parsed);
}

async function parseProviderResponse(response: Response) {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  return payload;
}

async function sendWithTencent(params: VerificationSmsParams): Promise<SmsSendResult> {
  const secretId = getRequiredEnv('TENCENT_SMS_SECRET_ID');
  const secretKey = getRequiredEnv('TENCENT_SMS_SECRET_KEY');
  const sdkAppId = getRequiredEnv('TENCENT_SMS_SDK_APP_ID');
  const signName = getRequiredEnv('TENCENT_SMS_SIGN_NAME');
  const templateId = getRequiredEnv('TENCENT_SMS_TEMPLATE_ID');
  const region = process.env.TENCENT_SMS_REGION?.trim() || TENCENT_REGION;
  const host = process.env.TENCENT_SMS_ENDPOINT?.trim() || TENCENT_ENDPOINT;
  const sessionPrefix = process.env.TENCENT_SMS_SESSION_CONTEXT_PREFIX?.trim() || 'phone-auth';
  const context = buildTemplateContext(params);
  const payload = JSON.stringify({
    PhoneNumberSet: [`+86${params.phone}`],
    SmsSdkAppId: sdkAppId,
    SignName: signName,
    TemplateId: templateId,
    TemplateParamSet: buildTencentTemplateParams(context),
    SessionContext: `${sessionPrefix}:${Date.now()}`,
  });

  const timestamp = Math.floor(Date.now() / 1000);
  const date = toUtcDateString(new Date(timestamp * 1000));
  const signedHeaders = 'content-type;host;x-tc-action';
  const canonicalHeaders =
    `content-type:application/json; charset=utf-8\n` +
    `host:${host}\n` +
    `x-tc-action:${TENCENT_ACTION.toLowerCase()}\n`;
  const canonicalRequest = [
    'POST',
    '/',
    '',
    canonicalHeaders,
    signedHeaders,
    sha256Hex(payload),
  ].join('\n');
  const credentialScope = `${date}/sms/tc3_request`;
  const stringToSign = [
    TENCENT_ALGORITHM,
    String(timestamp),
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const secretDate = hmacBuffer(`TC3${secretKey}`, date);
  const secretService = hmacBuffer(secretDate, 'sms');
  const secretSigning = hmacBuffer(secretService, 'tc3_request');
  const signature = hmacHex(secretSigning, stringToSign);
  const authorization =
    `${TENCENT_ALGORITHM} Credential=${secretId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(`https://${host}`, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json; charset=utf-8',
      Host: host,
      'X-TC-Action': TENCENT_ACTION,
      'X-TC-Region': region,
      'X-TC-Timestamp': String(timestamp),
      'X-TC-Version': TENCENT_VERSION,
    },
    body: payload,
  });

  const payloadJson = await parseProviderResponse(response);
  const responseBody = payloadJson?.Response;
  const providerError = responseBody?.Error;
  const sendStatus = responseBody?.SendStatusSet?.[0];

  if (!response.ok || providerError || !sendStatus || sendStatus.Code !== 'Ok') {
    const code = providerError?.Code || sendStatus?.Code || `HTTP_${response.status}`;
    const message = providerError?.Message || sendStatus?.Message || 'Tencent SMS request failed.';
    throw new Error(`Tencent SMS send failed: ${code} ${message}`);
  }

  return {
    provider: 'tencent',
    messageId: sendStatus.SerialNo ?? responseBody?.RequestId ?? null,
  };
}

function buildCanonicalQueryString(params: Record<string, string>) {
  return Object.entries(params)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${encodeRfc3986(key)}=${encodeRfc3986(value)}`)
    .join('&');
}

async function sendWithAliyun(params: VerificationSmsParams): Promise<SmsSendResult> {
  const accessKeyId = getRequiredEnv('ALIYUN_SMS_ACCESS_KEY_ID');
  const accessKeySecret = getRequiredEnv('ALIYUN_SMS_ACCESS_KEY_SECRET');
  const signName = getRequiredEnv('ALIYUN_SMS_SIGN_NAME');
  const templateCode = getRequiredEnv('ALIYUN_SMS_TEMPLATE_CODE');
  const endpoint = process.env.ALIYUN_SMS_ENDPOINT?.trim() || ALIYUN_ENDPOINT;
  const outIdPrefix = process.env.ALIYUN_SMS_OUT_ID_PREFIX?.trim() || 'phone-auth';
  const now = new Date();
  const date = toUtcIsoSeconds(now);
  const nonce = randomUUID().replace(/-/g, '');
  const hashedPayload = sha256Hex('');
  const queryParams = {
    OutId: `${outIdPrefix}:${Date.now()}`,
    PhoneNumbers: params.phone,
    SignName: signName,
    TemplateCode: templateCode,
    TemplateParam: buildAliyunTemplateParams(buildTemplateContext(params)),
  };
  const canonicalQueryString = buildCanonicalQueryString(queryParams);
  const headerEntries = [
    ['host', endpoint],
    ['x-acs-action', ALIYUN_ACTION],
    ['x-acs-content-sha256', hashedPayload],
    ['x-acs-date', date],
    ['x-acs-signature-nonce', nonce],
    ['x-acs-version', ALIYUN_VERSION],
  ] as const;
  const canonicalHeaders = headerEntries.map(([key, value]) => `${key}:${value}\n`).join('');
  const signedHeaders = headerEntries.map(([key]) => key).join(';');
  const canonicalRequest = [
    'POST',
    '/',
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    hashedPayload,
  ].join('\n');
  const stringToSign = `${ALIYUN_ALGORITHM}\n${sha256Hex(canonicalRequest)}`;
  const signature = hmacHex(accessKeySecret, stringToSign);
  const authorization =
    `${ALIYUN_ALGORITHM} Credential=${accessKeyId},` +
    `SignedHeaders=${signedHeaders},Signature=${signature}`;

  const response = await fetch(`https://${endpoint}/?${canonicalQueryString}`, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      host: endpoint,
      'x-acs-action': ALIYUN_ACTION,
      'x-acs-content-sha256': hashedPayload,
      'x-acs-date': date,
      'x-acs-signature-nonce': nonce,
      'x-acs-version': ALIYUN_VERSION,
    },
  });

  const payloadJson = await parseProviderResponse(response);

  if (!response.ok || payloadJson?.Code !== 'OK') {
    const code = payloadJson?.Code || `HTTP_${response.status}`;
    const message = payloadJson?.Message || 'Aliyun SMS request failed.';
    throw new Error(`Aliyun SMS send failed: ${code} ${message}`);
  }

  return {
    provider: 'aliyun',
    messageId: payloadJson?.BizId ?? payloadJson?.RequestId ?? null,
  };
}

export async function sendVerificationSms(
  phone: string,
  message: string,
  code: string,
  expiryMinutes: number,
): Promise<SmsSendResult> {
  const provider = getProvider();

  if (provider === 'console') {
    console.log('[phone-auth] SMS provider=console', { phone, message, code });
    return {
      provider,
      messageId: null,
      debugCode: process.env.NODE_ENV === 'production' ? undefined : code,
    };
  }

  const params = { phone, message, code, expiryMinutes };

  if (provider === 'tencent') {
    return sendWithTencent(params);
  }

  return sendWithAliyun(params);
}
