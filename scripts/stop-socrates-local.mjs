import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const pidFile = path.join(repoRoot, '.codex-socrates-start.pid');
const port = 3000;

function findListenerPid(targetPort) {
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

  if (!listenerLine) {
    return null;
  }

  const match = listenerLine.trim().match(/(\d+)\s*$/u);
  return match ? Number.parseInt(match[1], 10) : null;
}

function stopPid(pid) {
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

let pid = null;

if (fs.existsSync(pidFile)) {
  const rawPid = fs.readFileSync(pidFile, 'utf8').trim();
  const parsedPid = Number.parseInt(rawPid, 10);
  if (Number.isFinite(parsedPid)) {
    pid = parsedPid;
  }
}

if (!pid) {
  pid = findListenerPid(port);
}

if (!pid) {
  console.log('No Socrates local listener found. Nothing to stop.');
  try {
    fs.rmSync(pidFile, { force: true });
  } catch {
    // Ignore cleanup failure in restricted environments.
  }
  process.exit(0);
}

try {
  stopPid(pid);
  console.log(`Stopped Socrates local service PID ${pid}.`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const fallbackPid = findListenerPid(port);

  if (fallbackPid && fallbackPid !== pid) {
    stopPid(fallbackPid);
    console.log(`Stopped Socrates local service PID ${fallbackPid}.`);
  } else {
    console.warn(`taskkill reported: ${message}`);
  }
}

try {
  fs.rmSync(pidFile, { force: true });
} catch {
  // Ignore cleanup failure in restricted environments.
}
