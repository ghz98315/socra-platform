import { loadSocratesSmokeEnv } from './smoke-env.mjs';

const smokeEnv = loadSocratesSmokeEnv();
const mergedEnv = smokeEnv.env;

const DEFAULT_USER_ID = mergedEnv.SMOKE_USER_ID || mergedEnv.SMOKE_STUDY_USER_ID || '';
const DEFAULT_CUSTOM_BASE_URL = 'https://socrates.socra.cn';
const DEFAULT_ALIAS_BASE_URL = 'https://socra-platform.vercel.app';

const args = process.argv.slice(2);

function readArg(name, fallback = '') {
  const index = args.indexOf(`--${name}`);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }

  return args[index + 1];
}

function buildUrl(baseUrl, pathname) {
  return new URL(pathname, baseUrl).toString();
}

async function requestProbe(label, url, init = {}) {
  const startedAt = Date.now();

  try {
    const response = await fetch(url, init);
    const elapsedMs = Date.now() - startedAt;
    const text = await response.text();

    return {
      label,
      ok: response.ok,
      status: response.status,
      elapsedMs,
      bodyPreview: text.slice(0, 240),
    };
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : String(error);
    const causeMessage =
      error && typeof error === 'object' && 'cause' in error && error.cause
        ? error.cause instanceof Error
          ? error.cause.message
          : String(error.cause)
        : '';

    return {
      label,
      ok: false,
      status: null,
      elapsedMs,
      error: causeMessage ? `${message} | cause=${causeMessage}` : message,
      bodyPreview: '',
    };
  }
}

function printProbe(result) {
  console.log(`\n[${result.label}]`);
  console.log(`  status=${result.status ?? 'error'}`);
  console.log(`  elapsed_ms=${result.elapsedMs}`);

  if (result.error) {
    console.log(`  error=${result.error}`);
    return;
  }

  if (result.bodyPreview) {
    console.log(`  body=${JSON.stringify(result.bodyPreview)}`);
  }
}

const userId = readArg('user-id', DEFAULT_USER_ID);
if (!userId) {
  throw new Error('Missing --user-id and no SMOKE_USER_ID/SMOKE_STUDY_USER_ID found in env.');
}

const customBaseUrl = readArg('custom-base-url', DEFAULT_CUSTOM_BASE_URL);
const aliasBaseUrl = readArg('alias-base-url', DEFAULT_ALIAS_BASE_URL);

const pointsPath = `/api/points?user_id=${encodeURIComponent(userId)}`;
const postBody = {
  student_id: userId,
  subject: 'math',
  extracted_text: '[probe] domain path health check',
  difficulty_rating: 1,
  concept_tags: ['probe'],
};

const probes = [
  {
    label: 'custom-get-points',
    url: buildUrl(customBaseUrl, pointsPath),
    init: {},
  },
  {
    label: 'alias-get-points',
    url: buildUrl(aliasBaseUrl, pointsPath),
    init: {},
  },
  {
    label: 'custom-post-error-session',
    url: buildUrl(customBaseUrl, '/api/error-session'),
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postBody),
    },
  },
  {
    label: 'alias-post-error-session',
    url: buildUrl(aliasBaseUrl, '/api/error-session'),
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postBody),
    },
  },
];

console.log('Socrates domain path probe');
console.log('=========================');
console.log(`custom_base_url=${customBaseUrl}`);
console.log(`alias_base_url=${aliasBaseUrl}`);
console.log(`user_id=${userId}`);

let hasFailure = false;

for (const probe of probes) {
  const result = await requestProbe(probe.label, probe.url, probe.init);
  printProbe(result);

  if (probe.label.startsWith('alias-') && (result.error || result.status === null || result.status >= 500)) {
    hasFailure = true;
  }
}

if (hasFailure) {
  console.error('\nAlias probe failed; this is no longer just a custom-domain path issue.');
  process.exit(1);
}

console.log('\nAlias probe is healthy. Compare custom-domain results above for edge-path diagnosis.');
