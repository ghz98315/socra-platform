import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const args = process.argv.slice(2);

function hasFlag(name) {
  return args.includes(`--${name}`);
}

function readArg(name, fallback = '') {
  const index = args.indexOf(`--${name}`);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }

  return args[index + 1];
}

function print(message) {
  console.log(message);
}

function findExisting(paths) {
  return paths.find((candidate) => candidate && fs.existsSync(candidate)) || '';
}

function findNode22Executable() {
  if (process.versions.node.startsWith('22.')) {
    return process.execPath;
  }

  const override = readArg('node22', process.env.NODE22_EXE || '');
  if (override && fs.existsSync(override)) {
    return override;
  }

  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const userProfile = process.env.USERPROFILE || os.homedir();
  const candidates = [
    path.join(localAppData, 'nvm', 'v22.19.0', 'node.exe'),
    path.join(userProfile, 'AppData', 'Local', 'nvm', 'v22.19.0', 'node.exe'),
    'C:\\Users\\BYD\\AppData\\Local\\nvm\\v22.19.0\\node.exe',
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

function quoteArg(value) {
  if (/[\s"]/u.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }

  return value;
}

function prependNodeRequire(existingValue, requiredPath) {
  const normalizedPath = requiredPath.replace(/\\/g, '/');
  const requiredOption = `--require ${quoteArg(normalizedPath)}`;
  return existingValue ? `${existingValue} ${requiredOption}` : requiredOption;
}

function run({ label, command, commandArgs, cwd = repoRoot, env = process.env }) {
  return new Promise((resolve, reject) => {
    print(`==> ${label}`);
    const child = spawn(command, commandArgs, {
      cwd,
      env,
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

function removeDirWithFallback(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return false;
  }

  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
    return true;
  } catch {
    const windowsExtendedPath = dirPath.startsWith('\\\\?\\') ? dirPath : `\\\\?\\${dirPath}`;
    execFileSync('cmd.exe', ['/d', '/s', '/c', `rd /s /q "${windowsExtendedPath}"`], {
      windowsHide: true,
      stdio: 'ignore',
    });
    return true;
  }
}

function removeNextDir(appDir) {
  const nextDir = path.join(appDir, '.next');
  if (!fs.existsSync(nextDir)) {
    return false;
  }

  const swcPluginsDir = path.join(nextDir, 'cache', 'swc', 'plugins');
  try {
    if (fs.existsSync(swcPluginsDir)) {
      for (const entry of fs.readdirSync(swcPluginsDir, { withFileTypes: true })) {
        removeDirWithFallback(path.join(swcPluginsDir, entry.name));
      }
      removeDirWithFallback(swcPluginsDir);
    }

    removeDirWithFallback(nextDir);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to remove stale Socrates .next output: ${nextDir}. ${message}`);
  }
}

const node22Exe = findNode22Executable();
if (!node22Exe) {
  throw new Error('Unable to locate a Node 22 executable. Pass --node22 <path> or set NODE22_EXE.');
}

const pnpmCjs = findPnpmCjs();
if (!pnpmCjs) {
  throw new Error('Unable to locate pnpm.cjs in the current Windows profile.');
}

const appDir = path.join(repoRoot, 'apps', 'socrates');
const nextBin = path.join(appDir, 'node_modules', 'next', 'dist', 'bin', 'next');
const mode = readArg('mode', hasFlag('full') ? 'full' : 'compile');
const skipClean = hasFlag('skip-clean');
const traceChildren = hasFlag('trace-children') || Boolean(readArg('trace-file'));
const disableTelemetry = hasFlag('disable-telemetry');
const traceFile = traceChildren
  ? path.resolve(readArg('trace-file', path.join(os.tmpdir(), `socrates-build-child-trace-${Date.now()}.log`)))
  : '';
const tracePreload = path.join(repoRoot, 'scripts', 'trace-child-process.cjs');

if (!['compile', 'full'].includes(mode)) {
  throw new Error(`Invalid --mode: ${mode}`);
}

print(`RepoRoot: ${repoRoot}`);
print(`AppDir:   ${appDir}`);
print(`Node22:   ${node22Exe}`);
print(`pnpm.cjs: ${pnpmCjs}`);
print(`Mode:     ${mode}`);
print(`SkipClean:${skipClean ? ' yes' : ' no'}`);
print(`Telemetry:${disableTelemetry ? ' off' : ' on'}`);
if (traceChildren) {
  fs.mkdirSync(path.dirname(traceFile), { recursive: true });
  fs.writeFileSync(traceFile, '', 'utf8');
  print(`ChildTrace:${quoteArg(traceFile)}`);
}

await run({
  label: 'Node 22 version check',
  command: node22Exe,
  commandArgs: ['-v'],
});

if (!skipClean && removeNextDir(appDir)) {
  print(`Removed stale build output: ${quoteArg(path.join(appDir, '.next'))}`);
}

await run({
  label: 'Socrates TypeScript check',
  command: node22Exe,
  commandArgs: [pnpmCjs, '--dir', repoRoot, 'exec', 'tsc', '--noEmit', '-p', 'apps\\socrates\\tsconfig.json'],
});

const buildArgs = [nextBin, 'build', '--webpack'];
if (mode === 'compile') {
  buildArgs.push('--experimental-build-mode', 'compile');
}

const buildEnv = traceChildren
  ? {
      ...process.env,
      SOCRA_CHILD_TRACE_FILE: traceFile,
      NODE_OPTIONS: prependNodeRequire(process.env.NODE_OPTIONS || '', tracePreload),
    }
  : process.env;

if (disableTelemetry) {
  buildEnv.NEXT_TELEMETRY_DISABLED = '1';
}

await run({
  label: `Socrates webpack ${mode} build`,
  command: node22Exe,
  commandArgs: buildArgs,
  cwd: appDir,
  env: buildEnv,
});

print('Socrates build probe completed.');
