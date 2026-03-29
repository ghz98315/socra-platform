import { execFileSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const args = process.argv.slice(2);

function readArg(name, fallback = '') {
  const index = args.indexOf(`--${name}`);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }

  return args[index + 1];
}

function hasFlag(name) {
  return args.includes(`--${name}`);
}

function unique(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

function resolveGitRoot() {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: repoRoot,
      encoding: 'utf8',
      windowsHide: true,
    }).trim();
  } catch {
    return repoRoot;
  }
}

const gitRoot = resolveGitRoot();

const dependencyMap = {
  landing: {
    description: 'Landing app plus shared config/ui packages',
    exact: [
      'package.json',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      'turbo.json',
      'scripts/vercel-ignore-build.mjs',
    ],
    prefixes: ['apps/landing/', 'packages/config/', 'packages/ui/'],
  },
  socrates: {
    description: 'Socrates app plus shared config/ui/database, scripts, and migrations',
    exact: [
      'package.json',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      'turbo.json',
      'scripts/vercel-ignore-build.mjs',
    ],
    prefixes: ['apps/socrates/', 'packages/config/', 'packages/database/', 'packages/ui/', 'scripts/', 'supabase/'],
  },
  essay: {
    description: 'Essay app plus shared package',
    exact: [
      'package.json',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      'turbo.json',
      'scripts/vercel-ignore-build.mjs',
    ],
    prefixes: ['apps/essay/', 'packages/shared/'],
  },
};

function readChangedFilesFromGit() {
  const head = process.env.VERCEL_GIT_COMMIT_SHA || 'HEAD';
  const explicitBase = process.env.VERCEL_GIT_PREVIOUS_SHA || '';
  const baseCandidates = unique([explicitBase, `${head}^`]);

  for (const base of baseCandidates) {
    if (!base) {
      continue;
    }

    try {
      const output = execFileSync('git', ['diff', '--name-only', base, head, '--'], {
        cwd: gitRoot,
        encoding: 'utf8',
        windowsHide: true,
      });

      return output
        .split(/\r?\n/u)
        .map((line) => line.trim().replace(/\\/g, '/'))
        .filter(Boolean);
    } catch {
      continue;
    }
  }

  return null;
}

function shouldBuild(app, changedFiles) {
  const config = dependencyMap[app];
  if (!config) {
    throw new Error(`Unknown --app ${app}`);
  }

  const matchedFiles = changedFiles.filter((file) => {
    if (config.exact.includes(file)) {
      return true;
    }

    return config.prefixes.some((prefix) => file.startsWith(prefix));
  });

  return {
    config,
    matchedFiles,
    build: matchedFiles.length > 0,
  };
}

const app = readArg('app');
const explicitFiles = readArg('files')
  .split(',')
  .map((value) => value.trim().replace(/\\/g, '/'))
  .filter(Boolean);
const verbose = hasFlag('verbose');

if (!app) {
  throw new Error('Missing --app <landing|socrates|essay>.');
}

const changedFiles = explicitFiles.length > 0 ? explicitFiles : readChangedFilesFromGit();
if (!changedFiles || changedFiles.length === 0) {
  console.log(`[ignore-build] ${app}: unable to determine changed files safely; continuing build.`);
  process.exit(1);
}

const decision = shouldBuild(app, changedFiles);

console.log(`[ignore-build] app=${app}`);
console.log(`[ignore-build] basis=${explicitFiles.length > 0 ? 'explicit-files' : 'git-diff'}`);
console.log(`[ignore-build] scope=${decision.config.description}`);

if (verbose) {
  console.log(`[ignore-build] changed_files=${changedFiles.length}`);
  for (const file of changedFiles) {
    console.log(`[ignore-build] file=${file}`);
  }
}

if (decision.build) {
  for (const file of decision.matchedFiles) {
    console.log(`[ignore-build] matched=${file}`);
  }
  console.log('[ignore-build] build required');
  process.exit(1);
}

console.log('[ignore-build] no matching files; skipping build');
process.exit(0);
