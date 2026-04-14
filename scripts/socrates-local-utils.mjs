import { execFileSync } from 'node:child_process';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(scriptDir, '..');
export const appDir = path.join(repoRoot, 'apps', 'socrates');
export const defaultHost = '127.0.0.1';
export const defaultPort = 3000;

export function getPidFile(port = defaultPort) {
  return port === defaultPort
    ? path.join(repoRoot, '.codex-socrates-start.pid')
    : path.join(repoRoot, `.codex-socrates-start-${port}.pid`);
}

export function getProbeStateFile(port = defaultPort) {
  return port === defaultPort
    ? path.join(repoRoot, '.codex-socrates-probe-start.json')
    : path.join(repoRoot, `.codex-socrates-probe-start-${port}.json`);
}

export function readArg(argv, name, fallback = '') {
  const index = argv.indexOf(`--${name}`);
  if (index === -1 || index === argv.length - 1) {
    return fallback;
  }

  return argv[index + 1];
}

export function readNumberArg(argv, name, fallback) {
  const rawValue = readArg(argv, name, '');
  if (!rawValue) {
    return fallback;
  }

  const value = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid --${name}: ${rawValue}`);
  }

  return value;
}

export function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function readTrackedPid(fsModule, port = defaultPort) {
  const pidFile = getPidFile(port);
  if (!fsModule.existsSync(pidFile)) {
    return null;
  }

  const rawPid = fsModule.readFileSync(pidFile, 'utf8').trim();
  const parsedPid = Number.parseInt(rawPid, 10);
  return Number.isFinite(parsedPid) ? parsedPid : null;
}

export function findListenerPid(targetPort) {
  let output = '';
  try {
    output = execFileSync('netstat.exe', ['-ano'], {
      encoding: 'utf8',
      windowsHide: true,
    });
  } catch {
    return null;
  }

  const listenerLine = output
    .split(/\r?\n/u)
    .find((line) => line.includes(`:${targetPort}`) && line.includes('LISTENING'));

  if (listenerLine) {
    const match = listenerLine.trim().match(/(\d+)\s*$/u);
    if (match) {
      return Number.parseInt(match[1], 10);
    }
  }

  try {
    const powershellExe = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
    const script = [
      `$conn = Get-NetTCPConnection -LocalPort ${targetPort} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess`,
      'if ($conn) { Write-Output $conn }',
    ].join('; ');
    output = execFileSync(powershellExe, ['-NoProfile', '-Command', script], {
      encoding: 'utf8',
      windowsHide: true,
    }).trim();
    const fallbackPid = Number.parseInt(output, 10);
    return Number.isFinite(fallbackPid) ? fallbackPid : null;
  } catch {
    return null;
  }
}

export function probePortOpen(host, port, timeoutMs = 1000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;

    const finalize = (error, open = false) => {
      if (settled) {
        return;
      }

      settled = true;
      socket.destroy();
      if (error) {
        reject(error);
        return;
      }

      resolve(open);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      finalize(null, true);
    });
    socket.once('timeout', () => {
      finalize(null, false);
    });
    socket.once('error', (error) => {
      if (error?.code === 'ECONNREFUSED') {
        finalize(null, false);
        return;
      }

      finalize(error);
    });

    socket.connect(port, host);
  });
}

export function requestHttpStatus(urlString, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const transport = url.protocol === 'https:' ? https : http;
    const request = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: 'GET',
        headers: {
          Connection: 'close',
        },
        timeout: timeoutMs,
        agent: false,
      },
      (response) => {
        const statusCode = Number(response.statusCode || 0);
        response.resume();
        response.once('end', () => {
          resolve(statusCode);
        });
      },
    );

    request.once('timeout', () => {
      request.destroy(new Error(`request timed out after ${timeoutMs}ms`));
    });

    request.once('error', (error) => {
      reject(error);
    });

    request.end();
  });
}

export function isHealthyHttpStatus(statusCode) {
  return Number.isFinite(statusCode) && statusCode >= 200 && statusCode < 500;
}
