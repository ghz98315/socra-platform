import { formatInvalidSmokeValueFailure, formatSmokeEnvFailure, isUuidLike, validateSmokeEnv } from './smoke-env.mjs';

const smokeEnv = validateSmokeEnv({
  required: ['SMOKE_WRAP_UP_SESSION_ID', 'SMOKE_WRAP_UP_STUDENT_ID'],
  oneOf: [
    {
      label: 'SMOKE_BASE_URL or NEXT_PUBLIC_APP_URL',
      keys: ['SMOKE_BASE_URL', 'NEXT_PUBLIC_APP_URL'],
    },
  ],
});

if (!smokeEnv.ready) {
  console.error(formatSmokeEnvFailure('Socrates wrap-up regression', smokeEnv));
  process.exit(1);
}

const env = smokeEnv.env;
const baseUrl = env.SMOKE_BASE_URL || env.NEXT_PUBLIC_APP_URL;
const sessionId = env.SMOKE_WRAP_UP_SESSION_ID || '';
const studentId = env.SMOKE_WRAP_UP_STUDENT_ID || '';

const invalidUuidKeys = [
  ['SMOKE_WRAP_UP_SESSION_ID', sessionId],
  ['SMOKE_WRAP_UP_STUDENT_ID', studentId],
].flatMap(([key, value]) => (value && !isUuidLike(value) ? [key] : []));

if (invalidUuidKeys.length > 0) {
  console.error(formatInvalidSmokeValueFailure('Socrates wrap-up regression', invalidUuidKeys));
  process.exit(1);
}

function buildUrl(pathname) {
  return new URL(pathname, baseUrl).toString();
}

async function request(name, pathname, init = {}, validate) {
  const response = await fetch(buildUrl(pathname), init);
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

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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

const preview = await request(
  'wrap-up-preview',
  '/api/error-session/wrap-up',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'preview',
      session_id: sessionId,
      student_id: studentId,
    }),
  },
  (payload) => {
    assertCondition(payload?.success === true, 'wrap-up-preview.success must be true');
    assertWrapUpData(payload?.data, 'wrap-up-preview');
  },
);

const previewData = preview.data;

const submitted = await request(
  'wrap-up-submit',
  '/api/error-session/wrap-up',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'submit',
      session_id: sessionId,
      student_id: studentId,
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
    assertCondition(
      typeof payload?.data?.final_difficulty_rating === 'number',
      'wrap-up-submit final difficulty is missing',
    );
  },
);

await request(
  'wrap-up-session-readback',
  `/api/error-session?student_id=${encodeURIComponent(studentId)}`,
  {},
  (payload) => {
    assertCondition(Array.isArray(payload?.data), 'wrap-up-session-readback.data must be an array');

    const matched = payload.data.find((item) => item?.id === sessionId);
    assertCondition(Boolean(matched), 'wrap-up-session-readback could not find the target session');
    assertCondition(matched.primary_root_cause_category === submitted.data.primary_root_cause_category, 'readback category mismatch');
    assertCondition(matched.primary_root_cause_subtype === submitted.data.primary_root_cause_subtype, 'readback subtype mismatch');
    assertCondition(matched.student_difficulty_rating === submitted.data.student_difficulty_rating, 'readback student difficulty mismatch');
    assertCondition(matched.final_difficulty_rating === submitted.data.final_difficulty_rating, 'readback final difficulty mismatch');
    assertCondition(matched.closure_state === 'open', 'readback closure_state should be open after wrap-up submit');
  },
);

console.log(`Wrap-up regression passed. session_id=${sessionId} status=${previewData.status}`);
