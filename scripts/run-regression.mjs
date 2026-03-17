import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultRepoRoot = path.resolve(scriptDir, '..');
const args = process.argv.slice(2);

function readArg(name, fallback) {
  const index = args.indexOf(`--${name}`);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }

  return args[index + 1];
}

function hasFlag(name) {
  return args.includes(`--${name}`);
}

const repoRoot = readArg('repo-root', defaultRepoRoot);
const target = readArg('target', 'socrates');
const profile = readArg('profile', 'build');
const skipEnvCheck = hasFlag('skip-env-check');

const validTargets = new Set(['socrates', 'essay', 'landing', 'workspace']);
const validProfiles = new Set(['quick', 'build', 'smoke', 'full']);

if (!validTargets.has(target)) {
  throw new Error(`Invalid --target: ${target}`);
}

if (!validProfiles.has(profile)) {
  throw new Error(`Invalid --profile: ${profile}`);
}

function hasSmokeEnv() {
  return Boolean(process.env.SMOKE_USER_ID) && Boolean(process.env.SMOKE_BASE_URL || process.env.NEXT_PUBLIC_APP_URL);
}

function hasStudyFlowSmokeEnv() {
  return Boolean(process.env.SMOKE_STUDY_USER_ID) && Boolean(process.env.SMOKE_BASE_URL || process.env.NEXT_PUBLIC_APP_URL);
}

function quoteArg(value) {
  if (/[\s"]/u.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }

  return value;
}

function run(label, commandLine) {
  return new Promise((resolve, reject) => {
    console.log(`==> ${label}`);
    const child = spawn('cmd.exe', ['/d', '/s', '/c', commandLine], {
      cwd: repoRoot,
      stdio: 'inherit',
      shell: false,
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} failed with exit code ${code ?? 'unknown'}`));
    });
  });
}

function readAppBuildDir(packageName) {
  if (packageName === '@socra/socrates') {
    return path.join(repoRoot, 'apps', 'socrates', '.next');
  }

  if (packageName === '@socra/essay') {
    return path.join(repoRoot, 'apps', 'essay', 'dist');
  }

  if (packageName === '@socra/landing') {
    return path.join(repoRoot, 'apps', 'landing', '.next');
  }

  return null;
}

function removeBuildDir(packageName) {
  const buildDir = readAppBuildDir(packageName);
  if (!buildDir || !fs.existsSync(buildDir)) {
    return false;
  }

  try {
    try {
      fs.rmSync(buildDir, { recursive: true, force: true });
    } catch (error) {
      execFileSync('cmd.exe', ['/d', '/s', '/c', `rd /s /q "${buildDir}"`], {
        windowsHide: true,
        stdio: 'ignore',
      });
    }
  } catch (error) {
    if (isWindowsLockError(error)) {
      throw new Error(`Unable to remove locked build output: ${buildDir}`);
    }

    throw new Error(`Unable to remove build output for ${packageName}: ${buildDir}`);
  }

  console.warn(`Removed stale build output: ${buildDir}`);
  return true;
}

function isRetriableBuildError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('exit code') || message.includes('EPERM') || message.includes('operation not permitted');
}

function isWindowsLockError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('EPERM') || message.includes('Access is denied') || message.includes('operation not permitted');
}

async function buildPackage(packageName) {
  const commandLine = `pnpm --filter ${quoteArg(packageName)} build`;

  try {
    await run(`Build ${packageName}`, commandLine);
  } catch (error) {
    if (!isRetriableBuildError(error)) {
      throw error;
    }

    try {
      if (!removeBuildDir(packageName)) {
        throw error;
      }
    } catch (cleanupError) {
      if (!isWindowsLockError(cleanupError)) {
        throw cleanupError;
      }

      throw new Error(
        `Build cache for ${packageName} is locked by another Windows process. Close local dev/build processes for this app, remove the build cache, then rerun regression.`,
      );
    }

    console.warn(`Retrying build for ${packageName} after clearing build cache.`);

    try {
      await run(`Build ${packageName} (retry)`, commandLine);
    } catch (retryError) {
      if (!isWindowsLockError(retryError)) {
        throw retryError;
      }

      throw new Error(
        `Build output for ${packageName} is still locked during retry. Close local dev/build processes for this app and rerun regression.`,
      );
    }
  }
}

console.log(`RepoRoot: ${repoRoot}`);
console.log(`Target:   ${target}`);
console.log(`Profile:  ${profile}`);

if (!skipEnvCheck && ['build', 'smoke', 'full'].includes(profile)) {
  await run('Environment check', 'pnpm check:env');
}

if (target === 'socrates') {
  await buildPackage('@socra/socrates');
} else if (target === 'essay') {
  await buildPackage('@socra/essay');
} else if (target === 'landing') {
  await buildPackage('@socra/landing');
} else if (target === 'workspace') {
  await buildPackage('@socra/socrates');
  await buildPackage('@socra/essay');
  await buildPackage('@socra/landing');
}

if (['smoke', 'full'].includes(profile) && ['socrates', 'workspace'].includes(target)) {
  if (hasSmokeEnv()) {
    await run('Socrates smoke', 'pnpm smoke:socrates');
  } else {
    console.warn('Smoke env is incomplete. Skipping pnpm smoke:socrates.');
  }

  if (hasStudyFlowSmokeEnv()) {
    await run('Study flow smoke', 'pnpm smoke:study-flow');
  } else {
    console.warn('Study-flow smoke env is incomplete. Skipping pnpm smoke:study-flow.');
  }
}

console.log('Regression profile completed.');
