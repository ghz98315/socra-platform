import { formatInvalidSmokeValueFailure, formatSmokeEnvFailure, isUuidLike, validateSmokeEnv } from './smoke-env.mjs';

const smokeEnv = validateSmokeEnv({
  required: ['SMOKE_STUDY_USER_ID'],
  oneOf: [
    {
      label: 'SMOKE_BASE_URL or NEXT_PUBLIC_APP_URL',
      keys: ['SMOKE_BASE_URL', 'NEXT_PUBLIC_APP_URL'],
    },
  ],
  optional: [
    'SMOKE_STUDY_SUBJECT',
    'SMOKE_STUDY_MODULE',
    'SMOKE_STUDY_QUESTION_TYPE',
    'SMOKE_STUDY_REPORT_DAYS',
    'SMOKE_STUDY_ADVANCE_REVIEW',
  ],
});

if (!smokeEnv.ready) {
  console.error(formatSmokeEnvFailure('Study-flow smoke', smokeEnv));
  process.exit(1);
}

const env = smokeEnv.env;
const baseUrl = env.SMOKE_BASE_URL || env.NEXT_PUBLIC_APP_URL;
const studentId = env.SMOKE_STUDY_USER_ID || '';
const subject = env.SMOKE_STUDY_SUBJECT || 'english';
const moduleName = env.SMOKE_STUDY_MODULE || 'writing-review';
const questionType = env.SMOKE_STUDY_QUESTION_TYPE || 'writing';
const reportDays = Number.parseInt(env.SMOKE_STUDY_REPORT_DAYS || '7', 10) || 7;
const advanceReview = String(env.SMOKE_STUDY_ADVANCE_REVIEW || 'false').toLowerCase() === 'true';

if (!isUuidLike(studentId)) {
  console.error(formatInvalidSmokeValueFailure('Study-flow smoke', ['SMOKE_STUDY_USER_ID']));
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

const stamp = new Date().toISOString();
const title = `[smoke] study-flow ${stamp}`;
const summary = 'Smoke regression asset for study/report/review bridge validation.';
const messageStamp = Date.now();
const resultSummary = [
  {
    id: 'overall',
    title: '总体评价',
    content: '内容基本完整，但语法和表达仍需修正。',
  },
  {
    id: 'grammar',
    title: '语法与拼写问题',
    content: '时态和单复数存在问题，需要统一。',
  },
  {
    id: 'checklist',
    title: '修改清单',
    content: '修正动词形式、补足连接词，并重写结尾句。',
  },
];

const createPayload = {
  student_id: studentId,
  subject,
  module: moduleName,
  source_type: 'study_module',
  input_type: 'text',
  question_type: questionType,
  title,
  summary,
  status: 'completed',
  payload: {
    taskInput: 'Polish the writing and explain the key grammar mistakes.',
    draftInput: 'I very like science because it help me understand world better.',
    answerInput: 'I like science very much because it helps me understand the world better.',
    noteInput: 'Created by smoke-study-flow.mjs',
    concept_tags: ['grammar', 'sentence structure', 'revision'],
    resultSummary,
  },
  messages: [
    {
      role: 'user',
      message_key: `smoke_user_${messageStamp}`,
      content: 'Please review this writing sample and point out the main issues.',
    },
    {
      role: 'assistant',
      message_key: `smoke_assistant_${messageStamp}`,
      content: 'I found grammar, expression, and revision issues. See the structured result summary.',
    },
  ],
};

let assetId = '';
let reviewId = '';

const created = await request(
  'study-assets-create',
  '/api/study/assets',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(createPayload),
  },
  (payload) => {
    const createdAssetId = payload?.data?.asset_id;
    if (typeof createdAssetId !== 'string' || !createdAssetId.trim()) {
      throw new Error('study asset id is missing');
    }
  },
);
assetId = created.data.asset_id;

await request(
  'study-assets-detail',
  `/api/study/assets?student_id=${encodeURIComponent(studentId)}&asset_id=${encodeURIComponent(assetId)}`,
  {},
  (payload) => {
    if (payload?.data?.asset?.id !== assetId) {
      throw new Error('study asset detail does not match created asset');
    }

    if (!Array.isArray(payload?.data?.messages) || payload.data.messages.length === 0) {
      throw new Error('study asset detail is missing messages');
    }
  },
);

const review = await request(
  'study-assets-review-bridge',
  '/api/study/assets/review',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      asset_id: assetId,
      student_id: studentId,
    }),
  },
  (payload) => {
    if (!payload?.success || typeof payload?.review_id !== 'string') {
      throw new Error('review bridge response mismatch');
    }
  },
);
reviewId = review.review_id;

await request(
  'reports-study-generate',
  '/api/reports/study',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      student_id: studentId,
      report_type: reportDays >= 30 ? 'monthly' : 'weekly',
      days: reportDays,
      focus_asset_id: assetId,
    }),
  },
  (payload) => {
    if (!payload?.success) {
      throw new Error('study report generation did not return success');
    }

    if (payload?.data?.focusAsset?.id !== assetId) {
      throw new Error('study report focus asset does not match created asset');
    }

    if (typeof payload?.data?.stats?.studyAssetCount !== 'number') {
      throw new Error('study report stats are incomplete');
    }
  },
);

await request(
  'reports-study-history',
  `/api/reports/study?student_id=${encodeURIComponent(studentId)}&limit=5`,
  {},
  (payload) => {
    if (!Array.isArray(payload?.data)) {
      throw new Error('study report history shape mismatch');
    }
  },
);

await request(
  'review-schedule-list',
  `/api/review/schedule?student_id=${encodeURIComponent(studentId)}&scope=all&include_counts=1`,
  {},
  (payload) => {
    if (!Array.isArray(payload?.data) || typeof payload?.summary !== 'object') {
      throw new Error('review schedule response shape mismatch');
    }

    const found = payload.data.some((item) => item?.id === reviewId);
    if (!found) {
      throw new Error('new review item is not visible in review schedule');
    }
  },
);

if (advanceReview) {
  await request(
    'review-schedule-advance',
    '/api/review/schedule',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        review_id: reviewId,
        student_id: studentId,
        result: 'correct',
      }),
    },
    (payload) => {
      if (!payload?.success) {
        throw new Error('review advance did not return success');
      }
    },
  );
}

console.log(`Study flow smoke passed. asset_id=${assetId} review_id=${reviewId}`);
