import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {
  appDir,
  defaultHost,
  defaultPort,
  findListenerPid,
  pidFile,
  probePortOpen,
  readArg,
  readNumberArg,
  repoRoot,
} from './socrates-local-utils.mjs';

const nextBin = path.join(appDir, 'node_modules', 'next', 'dist', 'bin', 'next');

function quoteArg(value) {
  if (/[\s"]/u.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }

  return value;
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

function ensureBuildExists() {
  const buildIdPath = path.join(appDir, '.next', 'BUILD_ID');
  if (!fs.existsSync(buildIdPath)) {
    throw new Error('Socrates build output is missing. Run `pnpm --filter @socra/socrates build` first.');
  }
}

async function ensurePortAvailable(host, port) {
  const open = await probePortOpen(host, port, 1500);
  if (open) {
    throw new Error(`Port ${port} on ${host} is already listening. Stop the existing service before starting a new one.`);
  }
}

function sleep(delayMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

async function waitForReady({ baseUrl, timeoutMs, intervalMs }) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(baseUrl, {
        redirect: 'manual',
      });

      if (response.status >= 200 && response.status < 500) {
        return response.status;
      }
    } catch {
      // Keep polling until timeout.
    }

    await sleep(intervalMs);
  }

  throw new Error(`Socrates local start did not become healthy within ${timeoutMs}ms.`);
}

function startDetachedProcess({ command, args, cwd, outLogPath, errLogPath }) {
  const outFd = fs.openSync(outLogPath, 'a');
  const errFd = fs.openSync(errLogPath, 'a');

  const child = spawn(command, args, {
    cwd,
    detached: true,
    windowsHide: true,
    shell: false,
    stdio: ['ignore', outFd, errFd],
    env: process.env,
  });

  child.unref();
  fs.closeSync(outFd);
  fs.closeSync(errFd);

  if (!Number.isFinite(child.pid)) {
    throw new Error('Unable to determine started process pid.');
  }

  return child.pid;
}

async function main() {
  const port = readNumberArg(process.argv, 'port', defaultPort);
  const host = readArg(process.argv, 'host', defaultHost);
  const timeoutMs = readNumberArg(process.argv, 'timeout-ms', 120000);
  const intervalMs = readNumberArg(process.argv, 'poll-ms', 1000);
  const node22Exe = findNode22Executable();

  if (!node22Exe) {
    throw new Error('Unable to locate a Node 22 executable. Pass --node22 <path> or set NODE22_EXE.');
  }

  if (!fs.existsSync(nextBin)) {
    throw new Error(`Next CLI was not found at ${nextBin}`);
  }

  ensureBuildExists();
  await ensurePortAvailable(host, port);

  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const outLogPath = path.join(repoRoot, `.codex-socrates-start-${stamp}.out.log`);
  const errLogPath = path.join(repoRoot, `.codex-socrates-start-${stamp}.err.log`);
  const pid = startDetachedProcess({
    command: node22Exe,
    args: [nextBin, 'start', '-H', host, '-p', String(port)],
    cwd: appDir,
    outLogPath,
    errLogPath,
  });
  fs.writeFileSync(pidFile, String(pid), 'utf8');

  const baseUrl = `http://${host}:${port}`;
  const statusCode = await waitForReady({
    baseUrl,
    timeoutMs,
    intervalMs,
  });
  const listenerPid = findListenerPid(port);
  if (Number.isFinite(listenerPid)) {
    fs.writeFileSync(pidFile, String(listenerPid), 'utf8');
  }

  console.log(`PID=${Number.isFinite(listenerPid) ? listenerPid : pid}`);
  console.log(`URL=${baseUrl}`);
  console.log(`STATUS=${statusCode}`);
  console.log(`OUT=${quoteArg(outLogPath)}`);
  console.log(`ERR=${quoteArg(errLogPath)}`);
}

try {
  await main();
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
}
