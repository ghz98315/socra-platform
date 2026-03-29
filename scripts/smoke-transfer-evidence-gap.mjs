import { formatInvalidSmokeValueFailure, formatSmokeEnvFailure, isUuidLike, validateSmokeEnv } from './smoke-env.mjs';

const smokeEnv = validateSmokeEnv({
  required: ['SMOKE_STUDY_USER_ID'],
  oneOf: [
    {
      label: 'SMOKE_BASE_URL or NEXT_PUBLIC_APP_URL',
      keys: ['SMOKE_BASE_URL', 'NEXT_PUBLIC_APP_URL'],
    },
  ],
  optional: ['SMOKE_PARENT_ID'],
});

if (!smokeEnv.ready) {
  console.error(formatSmokeEnvFailure('Transfer-evidence smoke', smokeEnv));
  process.exit(1);
}

const env = smokeEnv.env;
const baseUrl = env.SMOKE_BASE_URL || env.NEXT_PUBLIC_APP_URL;
const studentId = env.SMOKE_STUDY_USER_ID || '';
const parentId = env.SMOKE_PARENT_ID || '';

const invalidUuidKeys = [
  ['SMOKE_STUDY_USER_ID', studentId],
  ['SMOKE_PARENT_ID', parentId],
].flatMap(([key, value]) => (value && !isUuidLike(value) ? [key] : []));

if (invalidUuidKeys.length > 0) {
  console.error(formatInvalidSmokeValueFailure('Transfer-evidence smoke', invalidUuidKeys));
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

function assertIncludes(list, value, label) {
  if (!Array.isArray(list) || !list.includes(value)) {
    throw new Error(`${label} is missing ${value}`);
  }
}

function findBySessionId(list, sessionId) {
  if (!Array.isArray(list)) {
    return null;
  }

  return (
    list.find((item) => item?.intervention_session_id === sessionId || item?.data?.session_id === sessionId) || null
  );
}

const stamp = new Date().toISOString();
const extractedText = '[smoke] math transfer evidence: Solve 2x + 5 = 17.';

const createdSession = await request(
  'error-session-create',
  '/api/error-session',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      student_id: studentId,
      subject: 'math',
      extracted_text: extractedText,
      difficulty_rating: 2,
      concept_tags: ['equation', 'algebra', 'solve for x'],
    }),
  },
  (payload) => {
    const sessionId = payload?.data?.session_id;
    if (typeof sessionId !== 'string' || !sessionId.trim()) {
      throw new Error('session_id is missing');
    }
  },
);

const sessionId = createdSession.data.session_id;

const reviewLoop = await request(
  'error-session-start-review-loop',
  '/api/error-session/complete',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      student_id: studentId,
    }),
  },
  (payload) => {
    if (!payload?.success || typeof payload?.review_id !== 'string') {
      throw new Error('review loop response mismatch');
    }
  },
);

const reviewId = reviewLoop.review_id;

const firstAttempt = await request(
  'review-attempt-provisional-mastered',
  '/api/review/attempt',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      review_id: reviewId,
      student_id: studentId,
      attempt_mode: 'original',
      independent_first: true,
      asked_ai: false,
      ai_hint_count: 0,
      solved_correctly: true,
      explained_correctly: true,
      confidence_score: 4,
      duration_seconds: 75,
      variant_passed: null,
      notes: '[smoke] first independent pass without transfer evidence',
    }),
  },
  (payload) => {
    if (!payload?.success || payload?.data?.mastery_judgement !== 'provisional_mastered') {
      throw new Error('first attempt should be provisional_mastered');
    }

    assertIncludes(payload?.data?.closure_gate_pending_keys, 'variant_transfer', 'first attempt pending gates');
    assertIncludes(payload?.data?.closure_gate_pending_keys, 'interval_stability', 'first attempt pending gates');

    if (payload?.data?.variant_evidence?.qualified_transfer_evidence === true) {
      throw new Error('first attempt should not already have transfer evidence');
    }
  },
);

if (parentId) {
  await request(
    'parent-review-task-transfer-gap',
    `/api/parent-tasks?parent_id=${encodeURIComponent(parentId)}`,
    {},
    (payload) => {
      if (!Array.isArray(payload?.tasks)) {
        throw new Error('parent tasks payload is missing tasks');
      }

      const matchedTask = findBySessionId(payload.tasks, sessionId);
      if (!matchedTask) {
        throw new Error('parent review intervention task was not created for transfer-evidence gap');
      }

      if (matchedTask?.task_type !== 'review_intervention') {
        throw new Error('parent task should be review_intervention');
      }

      if (matchedTask?.intervention_review_reason !== 'transfer_evidence_gap') {
        throw new Error('parent review task reason should be transfer_evidence_gap');
      }

      if (matchedTask?.status !== 'pending') {
        throw new Error('new parent review task should start as pending');
      }
    },
  );

  await request(
    'parent-mastery-notification-transfer-gap',
    `/api/notifications?user_id=${encodeURIComponent(parentId)}&type=mastery_update&limit=20`,
    {},
    (payload) => {
      if (!Array.isArray(payload?.data)) {
        throw new Error('notifications payload is missing data');
      }

      const matchedNotification = findBySessionId(payload.data, sessionId);
      if (!matchedNotification) {
        throw new Error('mastery_update notification was not created for transfer-evidence gap');
      }

      if (matchedNotification?.data?.risk_type !== 'transfer_evidence_gap') {
        throw new Error('mastery_update notification risk_type should be transfer_evidence_gap');
      }

      if (matchedNotification?.data?.intervention_status !== 'pending') {
        throw new Error('mastery_update notification should expose pending intervention status');
      }

      if (typeof matchedNotification?.data?.intervention_task_id !== 'string') {
        throw new Error('mastery_update notification is missing intervention_task_id');
      }
    },
  );
}

const generatedVariants = await request(
  'variant-generate',
  '/api/variants',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      student_id: studentId,
      subject: 'math',
      original_text: extractedText,
      concept_tags: ['equation', 'algebra', 'solve for x'],
      difficulty: 'medium',
      count: 1,
    }),
  },
  (payload) => {
    if (!payload?.success || !Array.isArray(payload?.data) || payload.data.length === 0) {
      throw new Error('variant generation did not return any variants');
    }
  },
);

const variant = generatedVariants.data[0];
if (typeof variant?.id !== 'string' || typeof variant?.answer !== 'string') {
  throw new Error('generated variant is missing id or answer');
}

await request(
  'variant-submit-transfer-evidence',
  '/api/variants/submit',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      variant_id: variant.id,
      student_id: studentId,
      student_answer: variant.answer,
      time_spent: 45,
      hints_used: 0,
    }),
  },
  (payload) => {
    if (!payload?.success) {
      throw new Error('variant submit did not return success');
    }

    if (payload?.practice_result?.counts_as_transfer_evidence !== true) {
      throw new Error('variant submit should count as transfer evidence');
    }

    if (payload?.summary?.qualified_transfer_evidence !== true) {
      throw new Error('variant summary should be marked as qualified transfer evidence');
    }
  },
);

await request(
  'review-attempt-stage-two',
  '/api/review/attempt',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      review_id: reviewId,
      student_id: studentId,
      attempt_mode: 'variant',
      independent_first: true,
      asked_ai: false,
      ai_hint_count: 0,
      solved_correctly: true,
      explained_correctly: true,
      confidence_score: 4,
      duration_seconds: 60,
      variant_passed: true,
      notes: '[smoke] second pass after adding transfer evidence',
    }),
  },
  (payload) => {
    if (!payload?.success || payload?.data?.mastery_judgement !== 'provisional_mastered') {
      throw new Error('second attempt should still be provisional_mastered');
    }

    if (Array.isArray(payload?.data?.closure_gate_pending_keys) && payload.data.closure_gate_pending_keys.includes('variant_transfer')) {
      throw new Error('variant_transfer should be cleared after transfer evidence is added');
    }

    assertIncludes(payload?.data?.closure_gate_pending_keys, 'interval_stability', 'second attempt pending gates');
  },
);

await request(
  'review-attempt-mastered',
  '/api/review/attempt',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      review_id: reviewId,
      student_id: studentId,
      attempt_mode: 'original',
      independent_first: true,
      asked_ai: false,
      ai_hint_count: 0,
      solved_correctly: true,
      explained_correctly: true,
      confidence_score: 5,
      duration_seconds: 50,
      variant_passed: null,
      notes: '[smoke] third pass should close the loop',
    }),
  },
  (payload) => {
    if (!payload?.success || payload?.data?.mastery_judgement !== 'mastered') {
      throw new Error('third attempt should be mastered');
    }

    if (payload?.data?.closed !== true) {
      throw new Error('third attempt should close the review loop');
    }

    if (payload?.data?.review?.mastery_state !== 'mastered_closed') {
      throw new Error('review mastery_state should be mastered_closed');
    }

    if (Array.isArray(payload?.data?.closure_gate_pending_keys) && payload.data.closure_gate_pending_keys.length > 0) {
      throw new Error('no closure gates should remain after mastered');
    }
  },
);

await request(
  'review-schedule-confirm-closed',
  `/api/review/schedule?student_id=${encodeURIComponent(studentId)}&scope=all&include_counts=1`,
  {},
  (payload) => {
    if (!Array.isArray(payload?.completed_data)) {
      throw new Error('completed review list is missing');
    }

    const closedReview = payload.completed_data.find((item) => item?.id === reviewId);
    if (!closedReview || closedReview?.mastery_state !== 'mastered_closed') {
      throw new Error('closed review is not visible in completed_data');
    }
  },
);

console.log(`Transfer evidence smoke passed. session_id=${sessionId} review_id=${reviewId} first_attempt=${firstAttempt.data.attempt.id}`);
