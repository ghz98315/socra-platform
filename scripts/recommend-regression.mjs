import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

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

const repoRoot = readArg('repo-root', defaultRepoRoot);
const explicitFiles = readListArg('file');
const format = readArg('format', 'text');
const statusFile = readArg('status-file', '');
const statusText = statusFile ? fs.readFileSync(statusFile, 'utf8') : '';

try {
  const result = analyzeRegressionScope({ repoRoot, explicitFiles, statusText });
  printRecommendation(result, format);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
