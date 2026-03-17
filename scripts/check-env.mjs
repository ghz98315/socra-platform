import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const values = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separator = line.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function loadEnv(appDir, files) {
  return files.reduce((accumulator, file) => {
    const filePath = path.join(rootDir, appDir, file);
    return { ...accumulator, ...readEnvFile(filePath) };
  }, {});
}

function hasValue(env, key) {
  return Boolean(env[key] ?? process.env[key]);
}

function validateApp({ name, env, required = [], oneOf = [], recommended = [] }) {
  const missingRequired = required.filter((key) => !hasValue(env, key));
  const missingOneOf = oneOf
    .filter((group) => !group.keys.some((key) => hasValue(env, key)))
    .map((group) => group.label);
  const missingRecommended = recommended.filter((key) => !hasValue(env, key));

  return {
    name,
    ok: missingRequired.length === 0 && missingOneOf.length === 0,
    missingRequired,
    missingOneOf,
    missingRecommended,
  };
}

function validateSmoke({ name, env, required = [], oneOf = [], optional = [] }) {
  const missingRequired = required.filter((key) => !hasValue(env, key));
  const missingOneOf = oneOf
    .filter((group) => !group.keys.some((key) => hasValue(env, key)))
    .map((group) => group.label);
  const missingOptional = optional.filter((key) => !hasValue(env, key));

  return {
    name,
    ready: missingRequired.length === 0 && missingOneOf.length === 0,
    missingRequired,
    missingOneOf,
    missingOptional,
  };
}

const socratesEnv = loadEnv('apps/socrates', [
  '.env.local',
  '.env.smoke.local',
  '.env.local.example',
  '.env.smoke.example',
]);
const essayEnv = loadEnv('apps/essay', ['.env.local', '.env.example']);

const results = [
  validateApp({
    name: 'Socrates',
    env: socratesEnv,
    required: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ],
    oneOf: [
      {
        label: 'AI logic key: AI_API_KEY_LOGIC or DASHSCOPE_API_KEY',
        keys: ['AI_API_KEY_LOGIC', 'DASHSCOPE_API_KEY'],
      },
      {
        label: 'AI vision key: AI_API_KEY_VISION or DASHSCOPE_API_KEY',
        keys: ['AI_API_KEY_VISION', 'DASHSCOPE_API_KEY'],
      },
    ],
    recommended: [
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_SITE_URL',
      'WECHAT_APP_ID',
      'WECHAT_APP_SECRET',
      'AI_MODEL_LOGIC',
    ],
  }),
  validateApp({
    name: 'Essay',
    env: essayEnv,
    required: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
    recommended: ['VITE_DASHSCOPE_API_KEY'],
  }),
];

const smokeResults = [
  validateSmoke({
    name: 'Socrates smoke',
    env: socratesEnv,
    required: ['SMOKE_USER_ID'],
    oneOf: [
      {
        label: 'base URL: SMOKE_BASE_URL or NEXT_PUBLIC_APP_URL',
        keys: ['SMOKE_BASE_URL', 'NEXT_PUBLIC_APP_URL'],
      },
    ],
    optional: [
      'SMOKE_PARENT_ID',
      'SMOKE_CHILD_ID',
      'SMOKE_COUPON_CODE',
      'SMOKE_PLAN_CODE',
      'SMOKE_PAYMENT_METHOD',
    ],
  }),
  validateSmoke({
    name: 'Study-flow smoke',
    env: socratesEnv,
    required: ['SMOKE_STUDY_USER_ID'],
    oneOf: [
      {
        label: 'base URL: SMOKE_BASE_URL or NEXT_PUBLIC_APP_URL',
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
  }),
];

let hasBlockingIssue = false;

console.log('Environment validation report');
console.log('==============================');

for (const result of results) {
  console.log(`\n[${result.name}] ${result.ok ? 'OK' : 'BLOCKED'}`);

  if (result.missingRequired.length > 0) {
    hasBlockingIssue = true;
    console.log(`  Missing required: ${result.missingRequired.join(', ')}`);
  }

  if (result.missingOneOf.length > 0) {
    hasBlockingIssue = true;
    console.log(`  Missing required groups: ${result.missingOneOf.join('; ')}`);
  }

  if (result.missingRecommended.length > 0) {
    console.log(`  Missing recommended: ${result.missingRecommended.join(', ')}`);
  }

  if (
    result.missingRequired.length === 0 &&
    result.missingOneOf.length === 0 &&
    result.missingRecommended.length === 0
  ) {
    console.log('  All required and recommended keys are present.');
  }
}

console.log('\nSmoke readiness');
console.log('===============');

for (const result of smokeResults) {
  console.log(`\n[${result.name}] ${result.ready ? 'READY' : 'SKIP'}`);

  if (result.missingRequired.length > 0) {
    console.log(`  Missing required: ${result.missingRequired.join(', ')}`);
  }

  if (result.missingOneOf.length > 0) {
    console.log(`  Missing required groups: ${result.missingOneOf.join('; ')}`);
  }

  if (result.missingOptional.length > 0) {
    console.log(`  Missing optional: ${result.missingOptional.join(', ')}`);
  }

  if (result.ready && result.missingOptional.length === 0) {
    console.log('  Smoke environment is fully configured.');
  }
}

if (hasBlockingIssue) {
  console.error('\nEnvironment validation failed.');
  process.exit(1);
}

console.log('\nEnvironment validation passed.');
