import { formatSmokeEnvFailure, validateSmokeEnv } from './smoke-env.mjs';

const smokeEnv = validateSmokeEnv({
  required: ['SMOKE_USER_ID'],
  oneOf: [
    {
      label: 'SMOKE_BASE_URL or NEXT_PUBLIC_APP_URL',
      keys: ['SMOKE_BASE_URL', 'NEXT_PUBLIC_APP_URL'],
    },
  ],
  optional: [
    'SMOKE_PARENT_ID',
    'SMOKE_CHILD_ID',
    'SMOKE_COUPON_CODE',
    'SMOKE_PLAN_CODE',
    'SMOKE_PAYMENT_METHOD',
    'SMOKE_CREATE_ORDER',
  ],
});

if (!smokeEnv.ready) {
  console.error(formatSmokeEnvFailure('Socrates smoke', smokeEnv));
  process.exit(1);
}

const env = smokeEnv.env;
const baseUrl = env.SMOKE_BASE_URL || env.NEXT_PUBLIC_APP_URL;
const userId = env.SMOKE_USER_ID || '';
const parentId = env.SMOKE_PARENT_ID || userId;
const childId = env.SMOKE_CHILD_ID || '';
const couponCode = env.SMOKE_COUPON_CODE || 'WELCOME10';
const planCode = env.SMOKE_PLAN_CODE || 'pro_monthly';
const paymentMethod = env.SMOKE_PAYMENT_METHOD || 'alipay';
const createOrder = String(env.SMOKE_CREATE_ORDER || 'false').toLowerCase() === 'true';

function buildUrl(path) {
  return new URL(path, baseUrl).toString();
}

async function request(name, path, init = {}, validate) {
  const response = await fetch(buildUrl(path), init);
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(`${name} failed with ${response.status}: ${JSON.stringify(payload)}`);
  }

  if (validate) {
    validate(payload);
  }

  console.log(`PASS ${name}`);
  return payload;
}

const checks = [];

checks.push(() =>
  request('points', `/api/points?user_id=${encodeURIComponent(userId)}`, {}, (payload) => {
    if (typeof payload?.balance !== 'number') {
      throw new Error('points.balance is missing');
    }
  })
);

checks.push(() =>
  request('subscription', `/api/subscription?user_id=${encodeURIComponent(userId)}`, {}, (payload) => {
    if (typeof payload?.is_pro !== 'boolean') {
      throw new Error('subscription.is_pro is missing');
    }
  })
);

checks.push(() =>
  request(
    'feature-check',
    '/api/subscription/check-feature',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        feature: 'ai_chat',
        current_usage: 0,
      }),
    },
    (payload) => {
      if (typeof payload?.allowed !== 'boolean') {
        throw new Error('feature-check.allowed is missing');
      }
    }
  )
);

checks.push(() =>
  request(
    'coupon-validate',
    `/api/coupon/validate?code=${encodeURIComponent(couponCode)}`,
    {},
    (payload) => {
      if (payload?.valid !== true) {
        throw new Error('coupon validation did not return valid=true');
      }
    }
  )
);

checks.push(() =>
  request('dashboard-stats', `/api/dashboard/stats?user_id=${encodeURIComponent(userId)}`, {}, (payload) => {
    if (typeof payload?.totalPoints !== 'number') {
      throw new Error('dashboard.totalPoints is missing');
    }
  })
);

checks.push(() =>
  request('notifications', `/api/notifications?user_id=${encodeURIComponent(userId)}&limit=5`, {}, (payload) => {
    if (!Array.isArray(payload?.data)) {
      throw new Error('notifications.data is missing');
    }
  })
);

checks.push(() =>
  request('family', `/api/family?user_id=${encodeURIComponent(parentId)}`, {}, (payload) => {
    if (!('family' in payload) || !Array.isArray(payload?.members)) {
      throw new Error('family response shape mismatch');
    }
  })
);

if (parentId) {
  checks.push(() =>
    request(
      'family-dashboard',
      `/api/family/dashboard?parent_id=${encodeURIComponent(parentId)}`,
      {},
      (payload) => {
        if (!Array.isArray(payload?.children) || typeof payload?.summary !== 'object') {
          throw new Error('family dashboard shape mismatch');
        }
      }
    )
  );
}

if (childId) {
  checks.push(() =>
    request(
      'parent-tasks',
      `/api/parent-tasks?child_id=${encodeURIComponent(childId)}`,
      {},
      (payload) => {
        if (!Array.isArray(payload?.tasks)) {
          throw new Error('parent tasks shape mismatch');
        }
      }
    )
  );

  const weekStart = (() => {
    const current = new Date();
    const day = current.getDay();
    const diff = day === 0 ? 6 : day - 1;
    current.setDate(current.getDate() - diff);
    current.setHours(0, 0, 0, 0);
    return current.toISOString().split('T')[0];
  })();

  checks.push(() =>
    request(
      'weekly-reports-list',
      `/api/weekly-reports?parent_id=${encodeURIComponent(parentId)}&child_id=${encodeURIComponent(childId)}`,
      {},
      (payload) => {
        if (!Array.isArray(payload?.reports)) {
          throw new Error('weekly reports shape mismatch');
        }
      }
    )
  );

  checks.push(() =>
    request(
      'weekly-reports-generate',
      '/api/weekly-reports',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_id: parentId,
          child_id: childId,
          week_start: weekStart,
        }),
      },
      (payload) => {
        if (!payload?.success || !payload?.report) {
          throw new Error('weekly report generation failed');
        }
      }
    )
  );
}

if (createOrder) {
  checks.push(() =>
    request(
      'payment-create-order',
      '/api/payment/create-order',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          plan_code: planCode,
          payment_method: paymentMethod,
          coupon_code: couponCode,
        }),
      },
      (payload) => {
        if (!payload?.success || !payload?.orderId) {
          throw new Error('payment create-order response mismatch');
        }
      }
    )
  );
}

const failures = [];

for (const run of checks) {
  try {
    await run();
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
    console.error(`FAIL ${failures.at(-1)}`);
  }
}

if (failures.length > 0) {
  console.error(`Smoke test failed: ${failures.length} check(s) failed.`);
  process.exit(1);
}

console.log('Smoke test passed.');
