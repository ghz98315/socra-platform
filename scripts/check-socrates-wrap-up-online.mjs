import { randomUUID } from 'node:crypto';

import { formatSmokeEnvFailure, validateSmokeEnv } from './smoke-env.mjs';

const ACTIVE_PROFILE_COOKIE = 'socrates-active-profile';

const smokeEnv = validateSmokeEnv({
  required: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  oneOf: [
    {
      label: 'SMOKE_BASE_URL or NEXT_PUBLIC_APP_URL',
      keys: ['SMOKE_BASE_URL', 'NEXT_PUBLIC_APP_URL'],
    },
  ],
  optional: [
    'SMOKE_WRAP_UP_PARENT_PHONE',
    'SMOKE_WRAP_UP_PARENT_PASSWORD',
    'SMOKE_WRAP_UP_PARENT_NAME',
    'SMOKE_WRAP_UP_CHILD_NAME',
    'SMOKE_WRAP_UP_CHILD_GRADE',
  ],
});

if (!smokeEnv.ready) {
  console.error(formatSmokeEnvFailure('Socrates wrap-up regression', smokeEnv));
  process.exit(1);
}

const env = smokeEnv.env;
const rawBaseUrl = env.SMOKE_BASE_URL || env.NEXT_PUBLIC_APP_URL;
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const parentPhone = env.SMOKE_WRAP_UP_PARENT_PHONE || '13900009991';
const parentPassword = env.SMOKE_WRAP_UP_PARENT_PASSWORD || 'Passw0rd!';
const parentName = env.SMOKE_WRAP_UP_PARENT_NAME || 'Wrap-up Smoke Parent';
const childName = env.SMOKE_WRAP_UP_CHILD_NAME || 'Wrap-up Smoke Child';
const childGrade = Number.parseInt(env.SMOKE_WRAP_UP_CHILD_GRADE || '7', 10) || 7;
const reusableSmokeStudentId = env.SMOKE_STUDY_USER_ID || env.SMOKE_USER_ID || '';
const MAX_COOKIE_CHUNK_SIZE = 3180;

function normalizeBaseUrl(url) {
  const target = new URL(url);
  if (target.protocol === 'http:' && target.hostname !== 'localhost' && target.hostname !== '127.0.0.1') {
    target.protocol = 'https:';
  }

  return target.toString();
}

const baseUrl = normalizeBaseUrl(rawBaseUrl);

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function pseudoEmailFromPhone(phone) {
  return `${normalizePhone(phone)}@student.local`;
}

function buildStudentAuthEmail(studentId, phone) {
  if (phone) {
    return pseudoEmailFromPhone(phone);
  }

  return `student-profile+${studentId}@socra.local`;
}

function buildUrl(pathname) {
  return new URL(pathname, baseUrl).toString();
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function formatError(error) {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const cause =
    error.cause instanceof Error
      ? `${error.cause.name}: ${error.cause.message}`
      : error.cause
        ? String(error.cause)
        : '';

  return cause ? `${error.message} | cause=${cause}` : error.message;
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
  assertCondition(/^1[3-9]\d{9}$/.test(phone), 'SMOKE_WRAP_UP_PARENT_PHONE must be a valid mainland phone number');

  const email = pseudoEmailFromPhone(phone);
  let userId = null;

  const { data: existingParentProfile, error: parentProfileError } = await admin
    .from('profiles')
    .select('id, role, phone, display_name')
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
      theme_preference: childGrade <= 6 ? 'junior' : 'senior',
    },
    { onConflict: 'id' },
  );

  if (upsertParentError) {
    throw new Error(`Failed to upsert smoke parent profile: ${upsertParentError.message}`);
  }

  return {
    id: userId,
    phone,
    email,
  };
}

async function createChildProfileViaAdmin(admin, parentId) {
  const childId = randomUUID();
  const childEmail = buildStudentAuthEmail(childId, null);
  const bootstrapPassword = `Tmp!${randomUUID()}Aa`;

  const { data: createdAuthUser, error: createAuthUserError } = await admin.auth.admin.createUser({
    email: childEmail,
    password: bootstrapPassword,
    email_confirm: true,
    user_metadata: {
      display_name: childName,
      linked_parent_id: parentId,
      profile_mode: 'child_profile_backing_user',
    },
  });

  if (createAuthUserError || !createdAuthUser?.user?.id) {
    throw new Error(`Failed to create fallback child auth user: ${createAuthUserError?.message || 'unknown error'}`);
  }

  const { error: insertProfileError } = await admin.from('profiles').insert({
    id: createdAuthUser.user.id,
    role: 'student',
    parent_id: parentId,
    display_name: childName,
    grade_level: childGrade,
    theme_preference: childGrade <= 6 ? 'junior' : 'senior',
  });

  if (insertProfileError) {
    await admin.auth.admin.deleteUser(createdAuthUser.user.id).catch(() => {});
    throw new Error(`Failed to create fallback child profile: ${insertProfileError.message}`);
  }

  console.warn('WARN students-add is not available on the current deployment; used admin fallback child provisioning.');

  return {
    id: createdAuthUser.user.id,
    display_name: childName,
  };
}

async function linkReusableSmokeStudent(admin, parentId) {
  if (!reusableSmokeStudentId || reusableSmokeStudentId === parentId) {
    return null;
  }

  const { data: existingStudent, error: existingStudentError } = await admin
    .from('profiles')
    .select('id, role, display_name')
    .eq('id', reusableSmokeStudentId)
    .eq('role', 'student')
    .maybeSingle();

  if (existingStudentError) {
    throw new Error(`Failed to load reusable smoke student: ${existingStudentError.message}`);
  }

  if (!existingStudent?.id) {
    return null;
  }

  const { error: updateStudentError } = await admin
    .from('profiles')
    .update({ parent_id: parentId })
    .eq('id', existingStudent.id);

  if (updateStudentError) {
    throw new Error(`Failed to link reusable smoke student: ${updateStudentError.message}`);
  }

  console.warn(`WARN students-add is not available on the current deployment; reused smoke student ${existingStudent.id}.`);

  return {
    id: existingStudent.id,
    display_name: existingStudent.display_name || childName,
  };
}

async function createAuthCookieHeader(createClient, parent, activeProfileId = null) {
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
    email: parent.email,
    password: parentPassword,
  });

  if (error || !data?.session) {
    throw new Error(`Failed to sign in smoke parent: ${error?.message || 'missing session'}`);
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

async function request(name, pathname, init = {}, validate) {
  let response;

  try {
    response = await fetch(buildUrl(pathname), init);
  } catch (error) {
    throw new Error(`${name} fetch failed for ${buildUrl(pathname)}: ${formatError(error)}`);
  }

  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
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

async function authedRequest(name, pathname, cookieHeader, init = {}, validate) {
  const nextHeaders = {
    ...(init.headers || {}),
    Cookie: cookieHeader,
  };

  return request(
    name,
    pathname,
    {
      ...init,
      headers: nextHeaders,
    },
    validate,
  );
}

function sleep(delayMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

async function waitForStudentVisibility(parentCookieHeader, childId) {
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const payload = await authedRequest('students-list-refresh', '/api/students', parentCookieHeader);
    const matched = Array.isArray(payload?.data) ? payload.data.find((student) => student?.id === childId) : null;
    if (matched) {
      return;
    }

    await sleep(1000);
  }

  throw new Error(`child profile ${childId} is still not visible in /api/students after provisioning`);
}

async function ensureChildProfile(parentCookieHeader, admin, parentId) {
  const existingStudents = await authedRequest(
    'students-list',
    '/api/students',
    parentCookieHeader,
    {},
    (payload) => {
      assertCondition(Array.isArray(payload?.data), 'students-list.data should be an array');
    },
  );

  const matched = existingStudents.data.find((student) => student?.display_name === childName);
  if (matched?.id) {
    return {
      id: matched.id,
      display_name: childName,
    };
  }

  const reusableStudent = await linkReusableSmokeStudent(admin, parentId);
  if (reusableStudent?.id) {
    return reusableStudent;
  }

  let created;

  try {
    created = await authedRequest(
      'students-add',
      '/api/students/add',
      parentCookieHeader,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: childName,
          grade_level: childGrade,
        }),
      },
      (payload) => {
        assertCondition(typeof payload?.data?.id === 'string', 'students-add.id should be present');
      },
    );
  } catch (error) {
    const message = formatError(error);
    if (!message.includes('students-add failed with 500')) {
      throw error;
    }

    return createChildProfileViaAdmin(admin, parentId);
  }

  return {
    id: created.data.id,
    display_name: created.data.display_name || childName,
  };
}

function assertWrapUpData(data, label) {
  assertCondition(data && typeof data === 'object', `${label}.data is missing`);
  assertCondition(
    ['ongoing', 'ready_to_wrap', 'needs_more_clarification'].includes(data.status),
    `${label}.status is invalid`,
  );
  assertCondition(typeof data.title === 'string' && data.title.trim().length > 0, `${label}.title is missing`);
  assertCondition(typeof data.summary === 'string' && data.summary.trim().length > 0, `${label}.summary is missing`);
  assertCondition(
    typeof data.evidence_summary === 'string' && data.evidence_summary.trim().length > 0,
    `${label}.evidence_summary is missing`,
  );
  assertCondition(
    typeof data.suggested_root_cause_category === 'string' && data.suggested_root_cause_category.trim().length > 0,
    `${label}.suggested_root_cause_category is missing`,
  );
  assertCondition(
    typeof data.suggested_root_cause_subtype === 'string' && data.suggested_root_cause_subtype.trim().length > 0,
    `${label}.suggested_root_cause_subtype is missing`,
  );
  assertCondition(
    Number.isInteger(data.suggested_difficulty_rating) &&
      data.suggested_difficulty_rating >= 1 &&
      data.suggested_difficulty_rating <= 5,
    `${label}.suggested_difficulty_rating must be an integer from 1 to 5`,
  );
}

async function main() {
  const { createClient, admin } = await createSupabaseClients();
  const parent = await ensureParentAccount(admin);
  const parentCookieHeader = await createAuthCookieHeader(createClient, parent);
  const child = await ensureChildProfile(parentCookieHeader, admin, parent.id);
  await waitForStudentVisibility(parentCookieHeader, child.id);
  const cookieHeader = await createAuthCookieHeader(createClient, parent, child.id);

  const profileBundle = await authedRequest(
    'account-profile',
    '/api/account/profile',
    cookieHeader,
    {},
    (payload) => {
      assertCondition(payload?.data?.account_profile?.id === parent.id, 'account profile mismatch');
      assertCondition(payload?.data?.account_profile?.role === 'parent', 'account profile should be parent');
      assertCondition(Array.isArray(payload?.data?.available_profiles), 'available profiles should be an array');
      const matchedChild = payload.data.available_profiles.find((profile) => profile?.id === child.id);
      assertCondition(Boolean(matchedChild), 'child profile is missing from available profiles');
    },
  );

  const createdSession = await authedRequest(
    'wrap-up-create-session',
    '/api/error-session',
    cookieHeader,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: child.id,
        subject: 'math',
        extracted_text: '[smoke-wrap-up] 已知△ABC中，AB=AC，D为BC中点，判断AD与BC的关系。',
        difficulty_rating: 3,
        concept_tags: ['smoke', 'wrap_up', 'geometry'],
        initial_messages: [
          {
            role: 'user',
            content: '我一开始不知道从哪里下手。',
          },
          {
            role: 'assistant',
            content: '先别急着算。题目现在要你证明或求什么？',
          },
          {
            role: 'user',
            content: '应该是想证明 AD 和 BC 垂直。',
          },
          {
            role: 'assistant',
            content: '对，接下来只盯目标。哪条已知和“垂直”最可能搭上关系？',
          },
          {
            role: 'user',
            content: 'D 是 BC 中点，而且 AB=AC，所以我怀疑可以先证明 AD 是底边上的中线，再联系等腰三角形三线合一。',
          },
        ],
      }),
    },
    (payload) => {
      assertCondition(typeof payload?.data?.session_id === 'string', 'created session id is missing');
    },
  );

  const sessionId = createdSession.data.session_id;

  const preview = await authedRequest(
    'wrap-up-preview',
    '/api/error-session/wrap-up',
    cookieHeader,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'preview',
        session_id: sessionId,
      }),
    },
    (payload) => {
      assertCondition(payload?.success === true, 'wrap-up-preview.success must be true');
      assertWrapUpData(payload?.data, 'wrap-up-preview');
    },
  );

  const previewData = preview.data;

  const submitted = await authedRequest(
    'wrap-up-submit',
    '/api/error-session/wrap-up',
    cookieHeader,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'submit',
        session_id: sessionId,
        root_cause_category: previewData.suggested_root_cause_category,
        root_cause_subtype: previewData.suggested_root_cause_subtype,
        difficulty_rating: previewData.suggested_difficulty_rating,
      }),
    },
    (payload) => {
      assertCondition(payload?.success === true, 'wrap-up-submit.success must be true');
      assertCondition(payload?.data?.session_id === sessionId, 'wrap-up-submit.session_id mismatch');
      assertCondition(
        payload?.data?.primary_root_cause_category === previewData.suggested_root_cause_category,
        'wrap-up-submit category mismatch',
      );
      assertCondition(
        payload?.data?.primary_root_cause_subtype === previewData.suggested_root_cause_subtype,
        'wrap-up-submit subtype mismatch',
      );
      assertCondition(
        payload?.data?.student_difficulty_rating === previewData.suggested_difficulty_rating,
        'wrap-up-submit student difficulty mismatch',
      );
      assertCondition(typeof payload?.data?.final_difficulty_rating === 'number', 'wrap-up-submit final difficulty is missing');
    },
  );

  await authedRequest(
    'wrap-up-session-readback',
    `/api/error-session?student_id=${encodeURIComponent(child.id)}`,
    cookieHeader,
    {},
    (payload) => {
      assertCondition(Array.isArray(payload?.data), 'wrap-up-session-readback.data must be an array');

      const matched = payload.data.find((item) => item?.id === sessionId);
      assertCondition(Boolean(matched), 'wrap-up-session-readback could not find the target session');
      assertCondition(matched.student_id === child.id, 'readback student_id mismatch');
      assertCondition(matched.primary_root_cause_category === submitted.data.primary_root_cause_category, 'readback category mismatch');
      assertCondition(matched.primary_root_cause_subtype === submitted.data.primary_root_cause_subtype, 'readback subtype mismatch');
      assertCondition(matched.student_difficulty_rating === submitted.data.student_difficulty_rating, 'readback student difficulty mismatch');
      assertCondition(matched.final_difficulty_rating === submitted.data.final_difficulty_rating, 'readback final difficulty mismatch');
      assertCondition(matched.closure_state === 'open', 'readback closure_state should be open after wrap-up submit');
    },
  );

  console.log(
    `Wrap-up regression passed. parent_id=${profileBundle.data.account_profile.id} child_id=${child.id} session_id=${sessionId} status=${previewData.status}`,
  );
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
