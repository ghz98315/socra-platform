import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const socratesDir = path.join(repoRoot, 'apps', 'socrates');

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

function hasValue(env, key) {
  const value = env[key];
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}

export function loadSocratesSmokeEnv() {
  const candidates = ['.env.local', '.env.smoke.local'].map((name) => ({
    name,
    path: path.join(socratesDir, name),
  }));

  const fileEnv = {};
  const loadedFiles = [];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate.path)) {
      continue;
    }

    Object.assign(fileEnv, readEnvFile(candidate.path));
    loadedFiles.push(candidate.path);
  }

  return {
    env: { ...fileEnv, ...process.env },
    checkedFiles: candidates.map((candidate) => candidate.path),
    loadedFiles,
    smokeExamplePath: path.join(socratesDir, '.env.smoke.example'),
    smokeLocalPath: path.join(socratesDir, '.env.smoke.local'),
  };
}

export function validateSmokeEnv({ required = [], oneOf = [], optional = [] }) {
  const context = loadSocratesSmokeEnv();
  const missingRequired = required.filter((key) => !hasValue(context.env, key));
  const missingOneOf = oneOf
    .filter((group) => !group.keys.some((key) => hasValue(context.env, key)))
    .map((group) => group.label);
  const missingOptional = optional.filter((key) => !hasValue(context.env, key));

  return {
    ...context,
    ready: missingRequired.length === 0 && missingOneOf.length === 0,
    missingRequired,
    missingOneOf,
    missingOptional,
  };
}

export function formatSmokeEnvFailure(name, result) {
  const lines = [`${name} environment is incomplete.`];

  if (result.missingRequired.length > 0) {
    lines.push(`Missing required: ${result.missingRequired.join(', ')}`);
  }

  if (result.missingOneOf.length > 0) {
    lines.push(`Missing required groups: ${result.missingOneOf.join('; ')}`);
  }

  if (result.loadedFiles.length > 0) {
    lines.push(`Loaded env files: ${result.loadedFiles.join(', ')}`);
  } else {
    lines.push('Loaded env files: none');
  }

  lines.push(`Checked env files: ${result.checkedFiles.join(', ')}`);
  lines.push(`Hint: copy ${result.smokeExamplePath} to ${result.smokeLocalPath} or export the variables in the current shell.`);

  return lines.join('\n');
}

export function isUuidLike(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function formatInvalidSmokeValueFailure(name, invalidKeys) {
  return [
    `${name} environment has invalid values.`,
    `Expected UUID format for: ${invalidKeys.join(', ')}`,
    'Hint: use real auth/profile UUIDs instead of phone numbers, usernames, or display labels.',
  ].join('\n');
}
