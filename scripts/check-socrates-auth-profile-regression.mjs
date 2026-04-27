import { randomUUID } from 'node:crypto';

import { formatSmokeEnvFailure, validateSmokeEnv } from './smoke-env.mjs';

const ACTIVE_PROFILE_COOKIE = 'socrates-active-profile';
const MAX_COOKIE_CHUNK_SIZE = 3180;

const smokeEnv = validateSmokeEnv({
  required: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  oneOf: [
    {
      label: 'AUTH_SMOKE_BASE_URL or SMOKE_BASE_URL or NEXT_PUBLIC_APP_URL',
      keys: ['AUTH_SMOKE_BASE_URL', 'SMOKE_BASE_URL', 'NEXT_PUBLIC_APP_URL'],
    },
  ],
  optional: [
    'SMOKE_AUTH_PARENT_PHONE',
    'SMOKE_AUTH_PARENT_PASSWORD',
    'SMOKE_AUTH_PARENT_NAME',
    'SMOKE_AUTH_STUDENT_EMAIL',
    'SMOKE_AUTH_STUDENT_PASSWORD',
    'SMOKE_AUTH_STUDENT_NAME',
    'SMOKE_AUTH_STUDENT_GRADE',
    'SMOKE_WRAP_UP_PARENT_PHONE',
    'SMOKE_WRAP_UP_PARENT_PASSWORD',
    'SMOKE_WRAP_UP_PARENT_NAME',
    'SMOKE_WRAP_UP_CHILD_NAME',
    'SMOKE_WRAP_UP_CHILD_GRADE',
  ],
});

if (!smokeEnv.ready) {
  console.error(formatSmokeEnvFailure('Socrates auth/profile regression', smokeEnv));
  process.exit(1);
}

const env = smokeEnv.env;
const rawBaseUrl = env.AUTH_SMOKE_BASE_URL || env.SMOKE_BASE_URL || env.NEXT_PUBLIC_APP_URL;
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const parentPhone = env.SMOKE_AUTH_PARENT_PHONE || env.SMOKE_WRAP_UP_PARENT_PHONE || '13900009991';
const parentPassword = env.SMOKE_AUTH_PARENT_PASSWORD || env.SMOKE_WRAP_UP_PARENT_PASSWORD || 'Passw0rd!';
const parentName = env.SMOKE_AUTH_PARENT_NAME || env.SMOKE_WRAP_UP_PARENT_NAME || 'Auth Regression Parent';
const studentEmail = env.SMOKE_AUTH_STUDENT_EMAIL || 'auth-regression-student@socra.local';
const studentPassword = env.SMOKE_AUTH_STUDENT_PASSWORD || 'Passw0rd!';
const studentName = env.SMOKE_AUTH_STUDENT_NAME || env.SMOKE_WRAP_UP_CHILD_NAME || 'Auth Regression Student';
const studentGrade = Number.parseInt(
  env.SMOKE_AUTH_STUDENT_GRADE || env.SMOKE_WRAP_UP_CHILD_GRADE || '7',
  10,
) || 7;

function normalizeBaseUrl(url) {
  const target = new URL(url);
  if (target.protocol === 'http:' && target.hostname !== 'localhost' && target.hostname !== '127.0.0.1') {
    target.protocol = 'https:';
  }

  return target.toString();
}

const baseUrl = normalizeBaseUrl(rawBaseUrl);

function buildUrl(pathname) {
  return new URL(pathname, baseUrl).toString();
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function pseudoEmailFromPhone(phone) {
  return `${normalizePhone(phone)}@student.local`;
}

function assertCondition(condition, message, payload = null) {
  if (condition) {
    return;
  }

  const extra = payload === null ? '' : `\n${JSON.stringify(payload, null, 2)}`;
  throw new Error(`${message}${extra}`);
}

function createCookieChunks(key, value, chunkSize = MAX_COOKIE_CHUNK_SIZE) {
  const encodedValue = encodeURIComponent(value);

  if (encodedValue.length <= chunkSize) {
    return [{ name: key, value }];
  }

  const chunks = [];
  let remaining = encodedValue;

  while (remaining.length > 0) {
    let encodedChunkHead = remaining.slice(0, chunkSize);
    const lastEscapePos = encodedChunkHead.lastIndexOf('%');

    if (lastEscapePos > chunkSize - 3) {
      encodedChunkHead = encodedChunkHead.slice(0, lastEscapePos);
    }

    let valueHead = '';
    while (encodedChunkHead.length > 0) {
      try {
        valueHead = decodeURIComponent(encodedChunkHead);
        break;
      } catch (error) {
        if (error instanceof URIError && encodedChunkHead.at(-3) === '%' && encodedChunkHead.length > 3) {
          encodedChunkHead = encodedChunkHead.slice(0, encodedChunkHead.length - 3);
        } else {
          throw error;
        }
      }
    }

    chunks.push(valueHead);
    remaining = remaining.slice(encodedChunkHead.length);
  }

  return chunks.map((chunkValue, index) => ({
    name: `${key}.${index}`,
    value: chunkValue,
  }));
}

async function importSupabaseClient() {
  return import('../apps/socrates/node_modules/@supabase/supabase-js/dist/index.mjs');
}

async function createSupabaseClients() {
  const { createClient } = await importSupabaseClient();

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return { createClient, admin };
}

async function findAuthUserByEmail(admin, email) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw new Error(`Failed to list auth users: ${error.message}`);
    }

    const matched = (data?.users || []).find((user) => user.email === email);
    if (matched) {
      return matched;
    }

    if (!data?.users?.length || data.users.length < 200) {
      break;
    }
  }

  return null;
}

async function ensureParentAccount(admin) {
  const phone = normalizePhone(parentPhone);
  assertCondition(/^1[3-9]\d{9}$/.test(phone), 'SMOKE_AUTH_PARENT_PHONE must be a valid mainland phone number');

  const email = pseudoEmailFromPhone(phone);
  let userId = null;

  const { data: existingParentProfile, error: parentProfileError } = await admin
    .from('profiles')
    .select('id, role')
    .eq('phone', phone)
    .eq('role', 'parent')
    .maybeSingle();

  if (parentProfileError) {
    throw new Error(`Failed to load parent profile: ${parentProfileError.message}`);
  }

  if (existingParentProfile?.id) {
    userId = existingParentProfile.id;
  } else {
    const existingAuthUser = await findAuthUserByEmail(admin, email);
    if (existingAuthUser?.id) {
      userId = existingAuthUser.id;
    }
  }

  if (userId) {
    const { error: updateUserError } = await admin.auth.admin.updateUserById(userId, {
      email,
      password: parentPassword,
      email_confirm: true,
      user_metadata: {
        display_name: parentName,
        phone,
      },
    });

    if (updateUserError) {
      throw new Error(`Failed to update smoke parent auth user: ${updateUserError.message}`);
    }
  } else {
    const { data: createdUserData, error: createUserError } = await admin.auth.admin.createUser({
      email,
      password: parentPassword,
      email_confirm: true,
      user_metadata: {
        display_name: parentName,
        phone,
      },
    });

    if (createUserError || !createdUserData?.user?.id) {
      throw new Error(`Failed to create smoke parent auth user: ${createUserError?.message || 'unknown error'}`);
    }

    userId = createdUserData.user.id;
  }

  const { error: upsertParentError } = await admin.from('profiles').upsert(
    {
      id: userId,
      role: 'parent',
      phone,
      display_name: parentName,
      theme_preference: studentGrade <= 6 ? 'junior' : 'senior',
    },
    { onConflict: 'id' },
  );

  if (upsertParentError) {
    throw new Error(`Failed to upsert smoke parent profile: ${upsertParentError.message}`);
  }

  return {
    id: userId,
    email,
    password: parentPassword,
  };
}

async function ensureStudentAccount(admin, parentId) {
  let userId = null;

  const existingAuthUser = await findAuthUserByEmail(admin, studentEmail);
  if (existingAuthUser?.id) {
    userId = existingAuthUser.id;
  }

  if (userId) {
    const { error: updateUserError } = await admin.auth.admin.updateUserById(userId, {
      email: studentEmail,
      password: studentPassword,
      email_confirm: true,
      user_metadata: {
        display_name: studentName,
        linked_parent_id: parentId,
        profile_mode: 'auth_regression_student',
      },
    });

    if (updateUserError) {
      throw new Error(`Failed to update auth regression student user: ${updateUserError.message}`);
    }
  } else {
    const { data: createdUserData, error: createUserError } = await admin.auth.admin.createUser({
      email: studentEmail,
      password: studentPassword,
      email_confirm: true,
      user_metadata: {
        display_name: studentName,
        linked_parent_id: parentId,
        profile_mode: 'auth_regression_student',
      },
    });

    if (createUserError || !createdUserData?.user?.id) {
      throw new Error(`Failed to create auth regression student user: ${createUserError?.message || 'unknown error'}`);
    }

    userId = createdUserData.user.id;
  }

  const { error: upsertStudentError } = await admin.from('profiles').upsert(
    {
      id: userId,
      role: 'student',
      parent_id: parentId,
      display_name: studentName,
      grade_level: studentGrade,
      theme_preference: studentGrade <= 6 ? 'junior' : 'senior',
    },
    { onConflict: 'id' },
  );

  if (upsertStudentError) {
    throw new Error(`Failed to upsert auth regression student profile: ${upsertStudentError.message}`);
  }

  return {
    id: userId,
    email: studentEmail,
    password: studentPassword,
  };
}

async function createAuthCookieHeader(createClient, account, activeProfileId = null) {
  const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
  let sessionPayload = '';

  const storage = {
    getItem(key) {
      return key === storageKey ? sessionPayload : null;
    },
    setItem(key, value) {
      if (key === storageKey) {
        sessionPayload = value;
      }
    },
    removeItem(key) {
      if (key === storageKey) {
        sessionPayload = '';
      }
    },
  };

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage,
    },
  });

  const { data, error } = await client.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  });

  if (error || !data?.session) {
    throw new Error(`Failed to sign in regression account ${account.email}: ${error?.message || 'missing session'}`);
  }

  if (!sessionPayload) {
    sessionPayload = JSON.stringify(data.session);
  }

  const cookies = createCookieChunks(storageKey, sessionPayload).map((chunk) => `${chunk.name}=${chunk.value}`);
  if (activeProfileId) {
    cookies.push(`${ACTIVE_PROFILE_COOKIE}=${encodeURIComponent(activeProfileId)}`);
  }

  return cookies.join('; ');
}

async function request(pathname, init = {}) {
  const response = await fetch(buildUrl(pathname), init);
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

async function expectRequest(name, pathname, expectedStatus, init = {}, validate) {
  const result = await request(pathname, init);
  assertCondition(
    result.status === expectedStatus,
    `${name} expected ${expectedStatus} but got ${result.status}`,
    result.payload,
  );

  if (validate) {
    validate(result.payload);
  }

  console.log(`PASS ${name}`);
  return result.payload;
}

function withCookie(cookieHeader, init = {}) {
  return {
    ...init,
    headers: {
      ...(init.headers || {}),
      Cookie: cookieHeader,
    },
  };
}

function withJsonBody(cookieHeader, body) {
  return withCookie(cookieHeader, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

function expectErrorMessage(payload, expected) {
  assertCondition(payload?.error === expected, `expected error "${expected}"`, payload);
}

function expectStatsPayload(payload) {
  assertCondition(payload?.data && typeof payload.data === 'object', 'student stats should return data object', payload);
  assertCondition(typeof payload.data.total_errors === 'number', 'student stats should include total_errors', payload);
  assertCondition(typeof payload.data.mastery_rate === 'number', 'student stats should include mastery_rate', payload);
  assertCondition(Array.isArray(payload.data.heatmap_data), 'student stats should include heatmap_data', payload);
  assertCondition(Array.isArray(payload.data.weak_points), 'student stats should include weak_points', payload);
}

function expectListPayload(payload, fieldName = 'data') {
  assertCondition(Array.isArray(payload?.[fieldName]), `${fieldName} should be an array`, payload);
}

async function runUnauthedChecks() {
  await expectRequest('auth-regression unauthed parent-tasks', '/api/parent-tasks', 401, {}, (payload) => {
    expectErrorMessage(payload, 'Not authenticated');
  });

  await expectRequest('auth-regression unauthed student-stats', '/api/student/stats', 401, {}, (payload) => {
    expectErrorMessage(payload, 'Not authenticated');
  });

  await expectRequest(
    'auth-regression unauthed error-book',
    '/api/error-book',
    401,
    {},
    (payload) => {
      expectErrorMessage(payload, 'Not authenticated');
    },
  );

  await expectRequest(
    'auth-regression unauthed change-password',
    '/api/auth/change-password',
    401,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: 'Passw0rd!',
        new_password: 'Passw0rd!2',
      }),
    },
    (payload) => {
      expectErrorMessage(payload, 'Not authenticated');
    },
  );

  await expectRequest(
    'auth-regression unauthed verify-parent-password',
    '/api/auth/verify-parent-password',
    401,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: 'Passw0rd!',
      }),
    },
    (payload) => {
      expectErrorMessage(payload, 'Not authenticated');
    },
  );
}

async function runParentChecks(parentCookieHeader, parentStudentCookieHeader, childId) {
  await expectRequest(
    'auth-regression parent error-book requires student_id',
    '/api/error-book',
    400,
    withCookie(parentCookieHeader),
    (payload) => {
      expectErrorMessage(payload, 'student_id is required');
    },
  );

  await expectRequest(
    'auth-regression parent error-book by student_id',
    `/api/error-book?student_id=${encodeURIComponent(childId)}`,
    200,
    withCookie(parentCookieHeader),
    (payload) => {
      expectListPayload(payload);
    },
  );

  await expectRequest(
    'auth-regression parent error-book by active-profile',
    '/api/error-book',
    200,
    withCookie(parentStudentCookieHeader),
    (payload) => {
      expectListPayload(payload);
    },
  );

  await expectRequest(
    'auth-regression parent student-stats requires student_id',
    '/api/student/stats',
    400,
    withCookie(parentCookieHeader),
    (payload) => {
      expectErrorMessage(payload, 'student_id is required');
    },
  );

  await expectRequest(
    'auth-regression parent student-stats by student_id',
    `/api/student/stats?student_id=${encodeURIComponent(childId)}`,
    200,
    withCookie(parentCookieHeader),
    expectStatsPayload,
  );

  await expectRequest(
    'auth-regression parent student-stats rejects foreign student',
    `/api/student/stats?student_id=${encodeURIComponent(randomUUID())}`,
    404,
    withCookie(parentCookieHeader),
    (payload) => {
      expectErrorMessage(payload, 'Student not found');
    },
  );

  await expectRequest(
    'auth-regression parent verify password success',
    '/api/auth/verify-parent-password',
    200,
    withJsonBody(parentCookieHeader, {
      password: parentPassword,
    }),
    (payload) => {
      assertCondition(payload?.success === true, 'verify-parent-password should return success', payload);
    },
  );

  await expectRequest(
    'auth-regression parent change-password validation',
    '/api/auth/change-password',
    400,
    withJsonBody(parentCookieHeader, {
      current_password: parentPassword,
      new_password: parentPassword,
    }),
    (payload) => {
      expectErrorMessage(payload, 'New password must be different from current password');
    },
  );

  await expectRequest(
    'auth-regression parent review-schedule rejects no active child',
    '/api/review/schedule?include_counts=1',
    403,
    withCookie(parentCookieHeader),
    (payload) => {
      expectErrorMessage(payload, 'Only students can view review schedule');
    },
  );

  await expectRequest(
    'auth-regression parent review-schedule by active child',
    '/api/review/schedule?include_counts=1',
    200,
    withCookie(parentStudentCookieHeader),
    (payload) => {
      expectListPayload(payload);
      assertCondition(payload?.summary && typeof payload.summary === 'object', 'review schedule should include summary', payload);
    },
  );

  await expectRequest(
    'auth-regression parent parent-tasks list',
    '/api/parent-tasks',
    200,
    withCookie(parentCookieHeader),
    (payload) => {
      expectListPayload(payload, 'tasks');
    },
  );
}

async function runStudentChecks(studentCookieHeader) {
  await expectRequest(
    'auth-regression student error-book',
    '/api/error-book',
    200,
    withCookie(studentCookieHeader),
    (payload) => {
      expectListPayload(payload);
    },
  );

  await expectRequest(
    'auth-regression student error-book forbids foreign student_id',
    `/api/error-book?student_id=${encodeURIComponent(randomUUID())}`,
    403,
    withCookie(studentCookieHeader),
    (payload) => {
      expectErrorMessage(payload, 'Forbidden');
    },
  );

  await expectRequest(
    'auth-regression student student-stats',
    '/api/student/stats',
    200,
    withCookie(studentCookieHeader),
    expectStatsPayload,
  );

  await expectRequest(
    'auth-regression student review-schedule',
    '/api/review/schedule?include_counts=1',
    200,
    withCookie(studentCookieHeader),
    (payload) => {
      expectListPayload(payload);
      assertCondition(payload?.summary && typeof payload.summary === 'object', 'review schedule should include summary', payload);
    },
  );

  await expectRequest(
    'auth-regression student verify-parent-password forbidden',
    '/api/auth/verify-parent-password',
    403,
    withJsonBody(studentCookieHeader, {
      password: studentPassword,
    }),
    (payload) => {
      expectErrorMessage(payload, 'Only parent accounts can verify parent access');
    },
  );

  await expectRequest(
    'auth-regression student parent-tasks create forbidden',
    '/api/parent-tasks',
    403,
    withJsonBody(studentCookieHeader, {
      childId: randomUUID(),
      title: 'Student should not create parent task',
    }),
    (payload) => {
      expectErrorMessage(payload, 'Only parents can create tasks');
    },
  );

  await expectRequest(
    'auth-regression student parent-tasks list',
    '/api/parent-tasks',
    200,
    withCookie(studentCookieHeader),
    (payload) => {
      expectListPayload(payload, 'tasks');
    },
  );
}

async function main() {
  console.log(`Auth/profile regression target: ${baseUrl}`);

  const { createClient, admin } = await createSupabaseClients();
  const parent = await ensureParentAccount(admin);
  const student = await ensureStudentAccount(admin, parent.id);
  const parentCookieHeader = await createAuthCookieHeader(createClient, parent);
  const parentStudentCookieHeader = await createAuthCookieHeader(createClient, parent, student.id);
  const studentCookieHeader = await createAuthCookieHeader(createClient, student);

  await runUnauthedChecks();
  await runParentChecks(parentCookieHeader, parentStudentCookieHeader, student.id);
  await runStudentChecks(studentCookieHeader);

  console.log('PASS auth/profile regression');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
