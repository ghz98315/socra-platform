import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { validateSmokeEnv, formatSmokeEnvFailure } from './smoke-env.mjs';

const envResult = validateSmokeEnv({
  required: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  oneOf: [
    {
      label: 'AUTH_SMOKE_BASE_URL or SMOKE_BASE_URL or NEXT_PUBLIC_APP_URL',
      keys: ['AUTH_SMOKE_BASE_URL', 'SMOKE_BASE_URL', 'NEXT_PUBLIC_APP_URL'],
    },
  ],
  optional: ['AUTH_SMOKE_SKIP_ANON', 'AUTH_SMOKE_SKIP_APP', 'AUTH_SMOKE_PHONE_PREFIX'],
});

if (!envResult.ready) {
  console.error(formatSmokeEnvFailure('Auth phone smoke', envResult));
  process.exit(1);
}

const env = envResult.env;
const baseUrl = env.AUTH_SMOKE_BASE_URL || env.SMOKE_BASE_URL || env.NEXT_PUBLIC_APP_URL;
const skipAnon = String(env.AUTH_SMOKE_SKIP_ANON || 'false').toLowerCase() === 'true';
const skipApp = String(env.AUTH_SMOKE_SKIP_APP || 'false').toLowerCase() === 'true';
const phonePrefix = env.AUTH_SMOKE_PHONE_PREFIX || '139';
let phoneCounter = 0;
const verificationCodePattern = /^\d{6,8}$/;
const phoneCodeDisabledMessage = '手机验证码暂不可用，请先使用手机号加密码登录或注册。';

function nowPhone() {
  phoneCounter += 1;
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(-7);
  return `${phonePrefix}${stamp}${String(phoneCounter % 10)}`;
}

function pseudoEmailFromPhone(phone) {
  return `${phone}@student.local`;
}

function fail(message, extra = null) {
  const payload = extra ? `${message}\n${JSON.stringify(extra, null, 2)}` : message;
  throw new Error(payload);
}

function isLocalBaseUrl() {
  const hostname = new URL(baseUrl).hostname;
  return hostname === '127.0.0.1' || hostname === 'localhost';
}

async function readCodeFromLocalStartLog(phone) {
  if (!isLocalBaseUrl()) {
    return '';
  }

  const entries = await readdir(process.cwd(), { withFileTypes: true });
  const logFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.startsWith('.codex-socrates-start-') && name.endsWith('.out.log'))
    .sort()
    .reverse();

  for (const name of logFiles) {
    const content = await readFile(path.join(process.cwd(), name), 'utf8');
    const blockPattern = new RegExp(
      String.raw`\[phone-auth\] SMS provider=console \{[\s\S]*?phone: '${phone}',[\s\S]*?code: '(\d{6,8})'[\s\S]*?\}`,
      'g',
    );
    const matches = [...content.matchAll(blockPattern)];
    const code = matches.at(-1)?.[1] ?? '';
    if (verificationCodePattern.test(code)) {
      return code;
    }
  }

  return '';
}

async function resolveVerificationCode(sendPayload, phone) {
  const debugCode = typeof sendPayload?.debugCode === 'string' ? sendPayload.debugCode : '';
  if (verificationCodePattern.test(debugCode)) {
    return debugCode;
  }

  const logCode = await readCodeFromLocalStartLog(phone);
  if (verificationCodePattern.test(logCode)) {
    return logCode;
  }

  return '';
}

async function importSupabaseClient() {
  return import('../apps/socrates/node_modules/@supabase/supabase-js/dist/index.mjs');
}

async function requestJson(name, path, init = {}) {
  const response = await fetch(new URL(path, baseUrl), init);
  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    fail(`${name} failed with ${response.status}`, payload);
  }

  return payload;
}

async function requestJsonWithStatus(name, path, init = {}) {
  const response = await fetch(new URL(path, baseUrl), init);
  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  return {
    status: response.status,
    ok: response.ok,
    payload,
  };
}

async function runAnonSignupProbe(phone) {
  const { createClient } = await importSupabaseClient();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const email = pseudoEmailFromPhone(phone);
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'Passw0rd!',
    options: {
      data: {
        display_name: 'Auth Smoke',
        phone,
      },
    },
  });

  if (error) {
    fail('anon signUp failed', {
      email,
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name,
    });
  }

  if (!data.user) {
    fail('anon signUp returned no user', { email });
  }

  console.log(`PASS anon signUp (${email})`);
}

async function runPasswordRegisterProbe(phone) {
  const payload = await requestJson('password register', '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone,
      password: 'Passw0rd!',
      display_name: 'Auth Smoke Password',
    }),
  });

  if (!payload?.data?.id) {
    fail('password register returned unexpected payload', payload);
  }

  console.log(`PASS password register (${phone})`);
}

async function runPhoneCodeProbe(phone) {
  const registerSendResult = await requestJsonWithStatus('phone code register send', '/api/auth/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone,
      purpose: 'register',
      display_name: 'Auth Smoke Code',
    }),
  });

  if (registerSendResult.status === 503) {
    if (registerSendResult.payload?.error !== phoneCodeDisabledMessage) {
      fail('phone code register send returned unexpected disabled payload', registerSendResult);
    }

    const loginSendResult = await requestJsonWithStatus('phone code login send', '/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        purpose: 'login',
      }),
    });

    if (loginSendResult.status !== 503 || loginSendResult.payload?.error !== phoneCodeDisabledMessage) {
      fail('phone code login send returned unexpected disabled payload', loginSendResult);
    }

    console.log(`PASS phone code disabled guard (${phone})`);
    return;
  }

  if (!registerSendResult.ok) {
    fail(`phone code register send failed with ${registerSendResult.status}`, registerSendResult.payload);
  }

  const sendPayload = registerSendResult.payload;
  if (!sendPayload?.success) {
    fail('phone code send returned unexpected payload', sendPayload);
  }

  const code = await resolveVerificationCode(sendPayload, phone);
  if (!verificationCodePattern.test(code)) {
    fail('phone code send did not return debugCode', sendPayload);
  }

  const verifyPayload = await requestJson('phone code register verify', '/api/auth/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone,
      purpose: 'register',
      code,
      password: 'Passw0rd!',
    }),
  });

  if (!verifyPayload?.success || !verifyPayload?.session?.access_token) {
    fail('phone code register verify returned unexpected payload', verifyPayload);
  }

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const loginSendPayload = await requestJson('phone code login send', '/api/auth/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone,
      purpose: 'login',
    }),
  });

  const loginCode = await resolveVerificationCode(loginSendPayload, phone);
  if (!verificationCodePattern.test(loginCode)) {
    fail('phone code login send did not return debugCode', loginSendPayload);
  }

  const loginVerifyPayload = await requestJson('phone code login verify', '/api/auth/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone,
      purpose: 'login',
      code: loginCode,
    }),
  });

  if (!loginVerifyPayload?.success || !loginVerifyPayload?.session?.access_token) {
    fail('phone code login verify returned unexpected payload', loginVerifyPayload);
  }

  console.log(`PASS phone code register/login (${phone})`);
}

async function main() {
  console.log(`Auth smoke target: ${baseUrl}`);

  if (!skipAnon) {
    const anonPhone = nowPhone();
    await runAnonSignupProbe(anonPhone);
  } else {
    console.log('SKIP anon signUp probe');
  }

  if (!skipApp) {
    const passwordPhone = nowPhone();
    await runPasswordRegisterProbe(passwordPhone);

    const codePhone = nowPhone();
    await runPhoneCodeProbe(codePhone);
  } else {
    console.log('SKIP app auth probes');
  }

  console.log('PASS auth phone smoke');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
