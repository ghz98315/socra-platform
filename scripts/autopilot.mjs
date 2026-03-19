import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

import { analyzeRegressionScope, printRecommendation } from './regression-advisor.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultRepoRoot = path.resolve(scriptDir, '..');
const args = process.argv.slice(2);

function readArg(name, fallback = null) {
  const index = args.indexOf(`--${name}`);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }

  return args[index + 1];
}

function readListArg(name) {
  const values = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === `--${name}` && index < args.length - 1) {
      values.push(args[index + 1]);
      index += 1;
    }
  }

  return values;
}

function hasFlag(name) {
  return args.includes(`--${name}`);
}

function quoteArg(value) {
  if (/[\s"]/u.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }

  return value;
}

function run(commandLine, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn('cmd.exe', ['/d', '/s', '/c', commandLine], {
      cwd,
      stdio: 'inherit',
      shell: false,
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed with exit code ${code ?? 'unknown'}`));
    });
  });
}

function printCloseoutTemplate(result, options = {}) {
  const lines = [];
  const command = result.recommendation.commands[0] || 'none';
  const docs = result.recommendation.docsToSync;
  const modeLabel = options.executed ? 'Executed regression:' : 'Recommended regression:';

  lines.push('');
  lines.push('Close-out template:');
  lines.push(`- Scope: ${result.recommendation.target ?? 'none'} / ${result.recommendation.profile ?? 'none'}`);
  lines.push(`- ${modeLabel} ${command}`);
  lines.push(`- Files considered: ${result.files.length}`);

  if (docs.length > 0) {
    lines.push(`- Docs to sync: ${docs.join(', ')}`);
  } else {
    lines.push('- Docs to sync: none');
  }

  lines.push('- Environment note: project expects Node 22.x; report if current machine is still on a different version.');

  if (result.recommendation.reasons.length > 0) {
    lines.push(`- Why this scope: ${result.recommendation.reasons.join('; ')}`);
  }

  lines.push('- Final summary should state: what changed, which command ran, whether smoke was skipped, and which docs were updated.');

  for (const line of lines) {
    console.log(line);
  }
}

const repoRoot = readArg('repo-root', defaultRepoRoot);
const explicitFiles = readListArg('file');
const format = readArg('format', 'text');
const statusFile = readArg('status-file', '');
const overrideTarget = readArg('target');
const overrideProfile = readArg('profile');
const shouldRun = hasFlag('run');
const skipEnvCheck = hasFlag('skip-env-check');
const statusText = statusFile ? fs.readFileSync(statusFile, 'utf8') : '';

let result;
try {
  result = analyzeRegressionScope({ repoRoot, explicitFiles, statusText });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
if (overrideTarget) {
  result.recommendation.target = overrideTarget;
}
if (overrideProfile) {
  result.recommendation.profile = overrideProfile;
}

result.recommendation.commands =
  result.recommendation.target && result.recommendation.profile
    ? [
        `node scripts/run-regression.mjs --target ${result.recommendation.target} --profile ${result.recommendation.profile}${skipEnvCheck ? ' --skip-env-check' : ''}`,
      ]
    : [];

printRecommendation(result, format);
printCloseoutTemplate(result, { executed: false });

if (!shouldRun) {
  process.exit(0);
}

if (!result.recommendation.target || !result.recommendation.profile) {
  console.error('No runnable recommendation is available for the current file set.');
  process.exit(1);
}

const commandLine = [
  'node',
  quoteArg(path.join(repoRoot, 'scripts', 'run-regression.mjs')),
  '--target',
  result.recommendation.target,
  '--profile',
  result.recommendation.profile,
];

if (skipEnvCheck) {
  commandLine.push('--skip-env-check');
}

await run(commandLine.join(' '), repoRoot);
printCloseoutTemplate(result, { executed: true });
