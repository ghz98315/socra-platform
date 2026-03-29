import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import process from 'node:process';
import { defaultPort, findListenerPid, getPidFile, readNumberArg, readTrackedPid } from './socrates-local-utils.mjs';

const port = readNumberArg(process.argv, 'port', defaultPort);
const pidFile = getPidFile(port);

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

pid = readTrackedPid(fs, port);
const listenerPid = findListenerPid(port);

if (pid && listenerPid && pid !== listenerPid) {
  pid = listenerPid;
}

if (!pid) {
  pid = listenerPid;
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
