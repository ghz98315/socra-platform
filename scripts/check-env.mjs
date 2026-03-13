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

const socratesEnv = loadEnv('apps/socrates', ['.env.local', '.env.local.example']);
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

if (hasBlockingIssue) {
  console.error('\nEnvironment validation failed.');
  process.exit(1);
}

console.log('\nEnvironment validation passed.');
