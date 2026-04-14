import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {
  appDir,
  defaultHost,
  defaultPort,
  findListenerPid,
  getPidFile,
  getProbeStateFile,
  isHealthyHttpStatus,
  probePortOpen,
  requestHttpStatus,
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

  const override = readArg(process.argv, 'node22', process.env.NODE22_EXE || '');
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

function sleep(delayMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

async function waitForReady({ baseUrl, timeoutMs, intervalMs }) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const statusCode = await requestHttpStatus(baseUrl, intervalMs);
      if (statusCode >= 200 && statusCode < 500) {
        return statusCode;
      }
    } catch {
      // Keep polling until timeout.
    }

    await sleep(intervalMs);
  }

  throw new Error(`Socrates probe local start did not become healthy within ${timeoutMs}ms.`);
}

async function inspectExistingService(host, port) {
  const portOpen = await probePortOpen(host, port, 1500);
  if (!portOpen) {
    return {
      portOpen: false,
      statusCode: null,
      healthy: false,
    };
  }

  let statusCode = null;
  try {
    statusCode = await requestHttpStatus(`http://${host}:${port}`, 2000);
  } catch {
    statusCode = null;
  }

  return {
    portOpen,
    statusCode,
    healthy: isHealthyHttpStatus(statusCode),
  };
}

async function ensurePortAvailable(host, port) {
  const open = await probePortOpen(host, port, 1500);
  if (open) {
    throw new Error(`Port ${port} on ${host} is already listening. Stop the existing service before starting a new one.`);
  }
}

function run(command, args, cwd, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
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

      reject(new Error(`command ${command} ${args.join(' ')} exited with code ${code ?? 'unknown'}`));
    });
  });
}

function removePathForRestore(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return;
  }

  try {
    fs.rmSync(targetPath, { recursive: true, force: true });
    return;
  } catch {
    // Keep falling back.
  }

  try {
    fs.rmdirSync(targetPath);
    return;
  } catch {
    // Keep falling back.
  }

  try {
    fs.unlinkSync(targetPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to remove path during probe restore: ${targetPath}. ${message}`);
  }
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

function stopPid(pid) {
  if (!Number.isFinite(pid)) {
    return;
  }

  try {
    process.kill(pid);
    return;
  } catch {
    execFileSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], {
      encoding: 'utf8',
      windowsHide: true,
      stdio: 'pipe',
    });
  }
}

function restoreProbeAssets({ currentNextPath, backupNextPath }) {
  removePathForRestore(currentNextPath);

  if (backupNextPath && fs.existsSync(backupNextPath)) {
    fs.renameSync(backupNextPath, currentNextPath);
  }
}

function cleanupProbeOutput(probeDistPath) {
  if (probeDistPath && fs.existsSync(probeDistPath)) {
    fs.rmSync(probeDistPath, { recursive: true, force: true });
  }

  const probeRoot = path.join(appDir, '.next-probe');
  if (fs.existsSync(probeRoot) && fs.readdirSync(probeRoot).length === 0) {
    fs.rmSync(probeRoot, { recursive: true, force: true });
  }
}

async function main() {
  const port = readNumberArg(process.argv, 'port', defaultPort);
  const host = readArg(process.argv, 'host', defaultHost);
  const timeoutMs = readNumberArg(process.argv, 'timeout-ms', 240000);
  const intervalMs = readNumberArg(process.argv, 'poll-ms', 1000);
  const node22Exe = findNode22Executable();
  const pidFile = getPidFile(port);
  const probeStateFile = getProbeStateFile(port);

  if (!node22Exe) {
    throw new Error('Unable to locate a Node 22 executable. Pass --node22 <path> or set NODE22_EXE.');
  }

  if (!fs.existsSync(nextBin)) {
    throw new Error(`Next CLI was not found at ${nextBin}`);
  }

  if (fs.existsSync(probeStateFile)) {
    throw new Error(
      `Found an existing probe-local state file at ${probeStateFile}. Run \`pnpm socrates:stop:local\` first to restore the previous .next state before starting a new probe-local session.`,
    );
  }

  const existing = await inspectExistingService(host, port);
  if (existing.healthy) {
    const baseUrl = `http://${host}:${port}`;
    const listenerPid = findListenerPid(port);
    if (Number.isFinite(listenerPid)) {
      fs.writeFileSync(pidFile, String(listenerPid), 'utf8');
    }
    console.log('EXISTING=yes');
    console.log('MODE=existing');
    console.log(`URL=${baseUrl}`);
    console.log(`STATUS=${existing.statusCode}`);
    console.log('NOTE=Local Socrates is already healthy. Reusing the existing service.');
    return;
  }

  if (existing.portOpen) {
    throw new Error(
      `Port ${port} on ${host} is already listening but did not return a healthy HTTP response. Stop the existing service and inspect the local start logs before retrying.`,
    );
  }

  await ensurePortAvailable(host, port);

  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const currentNextPath = path.join(appDir, '.next');
  const backupNextPath = fs.existsSync(currentNextPath)
    ? path.join(appDir, `.next.pre-probe-${stamp}`)
    : '';
  const probeDistRelative = path.join('.next-probe', `probe-local-${stamp}`);
  const probeDistPath = path.join(appDir, probeDistRelative);
  const outLogPath = path.join(repoRoot, `.codex-socrates-probe-start-${stamp}.out.log`);
  const errLogPath = path.join(repoRoot, `.codex-socrates-probe-start-${stamp}.err.log`);
  let pid = null;

  try {
    await run(
      node22Exe,
      [
        path.join(repoRoot, 'scripts', 'probe-socrates-build.mjs'),
        '--mode',
        'full',
        '--dist-dir',
        probeDistRelative,
        '--trace-children',
        '--disable-telemetry',
        '--webpack-build-worker',
        'false',
        '--worker-threads',
        'true',
        '--sanitize-export-config',
        '--retry-unlink',
      ],
      repoRoot,
    );

    if (!fs.existsSync(path.join(probeDistPath, 'BUILD_ID'))) {
      throw new Error(`Probe build output is missing BUILD_ID: ${path.join(probeDistPath, 'BUILD_ID')}`);
    }

    if (backupNextPath) {
      fs.renameSync(currentNextPath, backupNextPath);
    }

    fs.symlinkSync(probeDistPath, currentNextPath, 'junction');

    pid = startDetachedProcess({
      command: node22Exe,
      args: [nextBin, 'start', '-H', host, '-p', String(port)],
      cwd: appDir,
      outLogPath,
      errLogPath,
    });
    fs.writeFileSync(pidFile, String(pid), 'utf8');
    fs.writeFileSync(
      probeStateFile,
      JSON.stringify(
        {
          version: 1,
          mode: 'probe-local',
          host,
          port,
          pid,
          currentNextPath,
          backupNextPath,
          probeDistPath,
          outLogPath,
          errLogPath,
          startedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
      'utf8',
    );

    const baseUrl = `http://${host}:${port}`;
    const statusCode = await waitForReady({
      baseUrl,
      timeoutMs,
      intervalMs,
    });

    console.log(`PID=${pid}`);
    console.log('MODE=probe-local');
    console.log(`URL=${baseUrl}`);
    console.log(`STATUS=${statusCode}`);
    console.log(`PROBE_DIST=${quoteArg(probeDistPath)}`);
    console.log(`OUT=${quoteArg(outLogPath)}`);
    console.log(`ERR=${quoteArg(errLogPath)}`);
    console.log('NOTE=Probe-local start is active. Run `pnpm socrates:stop:local` to stop the service and restore the previous .next state.');
  } catch (error) {
    if (Number.isFinite(pid)) {
      try {
        stopPid(pid);
      } catch {
        // Best-effort cleanup only.
      }
    }

    try {
      restoreProbeAssets({ currentNextPath, backupNextPath });
    } catch {
      // Cleanup failure should not hide the original error.
    }

    try {
      cleanupProbeOutput(probeDistPath);
    } catch {
      // Best-effort cleanup only.
    }

    try {
      fs.rmSync(pidFile, { force: true });
      fs.rmSync(probeStateFile, { force: true });
    } catch {
      // Best-effort cleanup only.
    }

    throw error;
  }
}

try {
  await main();
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
}
