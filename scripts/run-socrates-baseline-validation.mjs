import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

function findExisting(paths) {
  return paths.find((candidate) => candidate && fs.existsSync(candidate)) || '';
}

function findNode22Executable() {
  if (process.versions.node.startsWith('22.')) {
    return process.execPath;
  }

  const override = process.env.NODE22_EXE || '';
  if (override && fs.existsSync(override)) {
    return override;
  }

  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const userProfile = process.env.USERPROFILE || os.homedir();
  const candidates = [
    path.join(localAppData, 'nvm', 'v22.19.0', 'node.exe'),
    path.join(userProfile, 'AppData', 'Local', 'nvm', 'v22.19.0', 'node.exe'),
    'C:\\Users\\BYD\\AppData\\Local\\nvm\\v22.19.0\\node.exe',
    'C:\\nvm4w\\nodejs\\node.exe',
  ];

  return findExisting(candidates);
}

function findPnpmCjs() {
  const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  const userProfile = process.env.USERPROFILE || os.homedir();
  const candidates = [
    path.join(appData, 'npm', 'node_modules', 'pnpm', 'bin', 'pnpm.cjs'),
    path.join(userProfile, 'AppData', 'Roaming', 'npm', 'node_modules', 'pnpm', 'bin', 'pnpm.cjs'),
    'C:\\Users\\BYD\\AppData\\Roaming\\npm\\node_modules\\pnpm\\bin\\pnpm.cjs',
  ];

  return findExisting(candidates);
}

function run(command, args, { cwd = repoRoot, env = process.env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      shell: false,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`command ${command} ${args.join(' ')} exited with code ${code ?? 'unknown'}`));
    });
  });
}

function printHeader(title) {
  console.log('');
  console.log(`==> ${title}`);
}

async function main() {
  const node22Exe = findNode22Executable();
  if (!node22Exe) {
    throw new Error('Unable to locate a Node 22 executable. Set NODE22_EXE or install Node 22.19.0 via nvm.');
  }

  const pnpmCjs = findPnpmCjs();
  if (!pnpmCjs) {
    throw new Error('Unable to locate pnpm.cjs in the current Windows profile.');
  }

  console.log('Socrates baseline validation');
  console.log('============================');
  console.log(`RepoRoot: ${repoRoot}`);
  console.log(`Shell Node: ${process.version}`);
  console.log(`Node22: ${node22Exe}`);
  console.log(`pnpm.cjs: ${pnpmCjs}`);

  printHeader('Node 22 parity');
  await run(node22Exe, [path.join(repoRoot, 'scripts', 'check-node-version.mjs')]);

  printHeader('Socrates TypeScript');
  await run(node22Exe, [pnpmCjs, '--filter', '@socra/socrates', 'exec', 'tsc', '--noEmit']);

  printHeader('Prompt baseline');
  await run(node22Exe, [path.join(repoRoot, 'scripts', 'check-socrates-prompt-baseline.mjs')]);

  printHeader('Chat regression');
  await run(node22Exe, [path.join(repoRoot, 'scripts', 'check-socrates-chat-regression.mjs')]);

  printHeader('Wrap-up regression');
  await run(node22Exe, [path.join(repoRoot, 'scripts', 'check-socrates-wrap-up-regression.mjs')]);

  printHeader('Online chat regression');
  await run(node22Exe, [path.join(repoRoot, 'scripts', 'check-socrates-online-chat-regression.mjs')]);

  console.log('');
  console.log('PASS socrates_baseline_validation');
}

try {
  await main();
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
}
