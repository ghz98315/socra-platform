import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const appDir = path.join(repoRoot, 'apps', 'socrates');
const nextBin = path.join(appDir, 'node_modules', 'next', 'dist', 'bin', 'next');
const pidFile = path.join(repoRoot, '.codex-socrates-start.pid');

function readArg(name, fallback = '') {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1 || index === process.argv.length - 1) {
    return fallback;
  }

  return process.argv[index + 1];
}

function readNumberArg(name, fallback) {
  const rawValue = readArg(name, '');
  if (!rawValue) {
    return fallback;
  }

  const value = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid --${name}: ${rawValue}`);
  }

  return value;
}

function quoteArg(value) {
  if (/[\s"]/u.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }

  return value;
}

function escapePowerShellSingleQuoted(value) {
  return String(value).replace(/'/g, "''");
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
  await new Promise((resolve, reject) => {
    const socket = new net.Socket();

    const finalize = (error) => {
      socket.destroy();
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    socket.setTimeout(1500);
    socket.once('connect', () => {
      finalize(new Error(`Port ${port} on ${host} is already listening. Stop the existing service before starting a new one.`));
    });
    socket.once('timeout', () => {
      finalize();
    });
    socket.once('error', (error) => {
      if (error?.code === 'ECONNREFUSED') {
        finalize();
        return;
      }

      finalize(error);
    });

    socket.connect(port, host);
  });
}

function sleep(delayMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

async function waitForReady({ baseUrl, timeoutMs, intervalMs, child, errLogPath }) {
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

function findListenerPid(port) {
  try {
    const output = execFileSync('netstat.exe', ['-ano'], {
      encoding: 'utf8',
      windowsHide: true,
    });
    const listenerLine = output
      .split(/\r?\n/u)
      .find((line) => line.includes(`:${port}`) && line.includes('LISTENING'));

    if (!listenerLine) {
      return null;
    }

    const match = listenerLine.trim().match(/(\d+)\s*$/u);
    return match ? Number.parseInt(match[1], 10) : null;
  } catch {
    return null;
  }
}

function startDetachedWindowsProcess({ command, args, cwd, outLogPath, errLogPath }) {
  const cwdLiteral = escapePowerShellSingleQuoted(cwd);
  const outLiteral = escapePowerShellSingleQuoted(outLogPath);
  const errLiteral = escapePowerShellSingleQuoted(errLogPath);
  const powershellExe = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
  const innerCommand = `& '${escapePowerShellSingleQuoted(command)}' ${args.map((arg) => `'${escapePowerShellSingleQuoted(arg)}'`).join(' ')}`;
  const script = [
    `$argList = @('-NoProfile', '-Command', "${innerCommand.replace(/"/g, '`"')}")`,
    `$p = Start-Process -FilePath '${powershellExe}' -ArgumentList $argList -WorkingDirectory '${cwdLiteral}' -RedirectStandardOutput '${outLiteral}' -RedirectStandardError '${errLiteral}' -PassThru -WindowStyle Hidden`,
    'Write-Output $p.Id',
  ].join('; ');

  const output = execFileSync(powershellExe, ['-NoProfile', '-Command', script], {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  }).trim();
  const pid = Number.parseInt(output, 10);

  if (!Number.isFinite(pid)) {
    throw new Error(`Unable to determine started process pid from output: ${output}`);
  }

  return pid;
}

async function main() {
  const port = readNumberArg('port', 3000);
  const host = readArg('host', '127.0.0.1');
  const timeoutMs = readNumberArg('timeout-ms', 120000);
  const intervalMs = readNumberArg('poll-ms', 1000);
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
  const pid = startDetachedWindowsProcess({
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
    errLogPath,
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
