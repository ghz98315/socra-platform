import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  appDir,
  defaultPort,
  findListenerPid,
  getPidFile,
  getProbeStateFile,
  readNumberArg,
  readTrackedPid,
} from './socrates-local-utils.mjs';

const port = readNumberArg(process.argv, 'port', defaultPort);
const pidFile = getPidFile(port);
const probeStateFile = getProbeStateFile(port);
const appDirResolved = path.resolve(appDir);

function stopPid(pid) {
  try {
    process.kill(pid);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ESRCH') {
      return false;
    }

    execFileSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], {
      encoding: 'utf8',
      windowsHide: true,
      stdio: 'pipe',
    });
    return true;
  }
}

function isWithinAppDir(targetPath) {
  const resolvedPath = path.resolve(targetPath);
  return resolvedPath === appDirResolved || resolvedPath.startsWith(`${appDirResolved}${path.sep}`);
}

function removePathForRestore(targetPath) {
  if (!targetPath || !fs.existsSync(targetPath)) {
    return false;
  }

  if (!isWithinAppDir(targetPath)) {
    throw new Error(`Refusing to remove path outside apps/socrates: ${targetPath}`);
  }

  const stats = fs.lstatSync(targetPath);
  if (stats.isSymbolicLink()) {
    fs.rmSync(targetPath, { force: true, recursive: true });
    return true;
  }

  fs.rmSync(targetPath, { force: true, recursive: true });
  return true;
}

function cleanupProbeArtifacts(state) {
  const currentNextPath = state?.currentNextPath || path.join(appDir, '.next');
  const backupNextPath = state?.backupNextPath || '';
  const probeDistPath = state?.probeDistPath || '';
  const nextPathChanged = removePathForRestore(currentNextPath);

  if (backupNextPath) {
    if (!isWithinAppDir(backupNextPath)) {
      throw new Error(`Refusing to restore backup outside apps/socrates: ${backupNextPath}`);
    }

    if (fs.existsSync(backupNextPath)) {
      fs.renameSync(backupNextPath, currentNextPath);
    }
  }

  if (probeDistPath) {
    removePathForRestore(probeDistPath);
  }

  const probeRoot = path.join(appDir, '.next-probe');
  if (fs.existsSync(probeRoot) && fs.readdirSync(probeRoot).length === 0) {
    removePathForRestore(probeRoot);
  }

  return nextPathChanged || Boolean(backupNextPath || probeDistPath);
}

function readProbeState() {
  if (!fs.existsSync(probeStateFile)) {
    return null;
  }

  const raw = fs.readFileSync(probeStateFile, 'utf8');
  return JSON.parse(raw);
}

let pid = null;
let probeState = null;

try {
  probeState = readProbeState();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`Failed to parse probe-local state file: ${message}`);
}

pid = readTrackedPid(fs, port);
const listenerPid = findListenerPid(port);

if (pid && listenerPid && pid !== listenerPid) {
  pid = listenerPid;
}

if (!pid) {
  pid = listenerPid;
}

if (!pid) {
  if (!probeState) {
    console.log('No Socrates local listener found. Nothing to stop.');
    try {
      fs.rmSync(pidFile, { force: true });
    } catch {
      // Ignore cleanup failure in restricted environments.
    }
    process.exit(0);
  }
}

try {
  if (pid) {
    const stopped = stopPid(pid);
    console.log(stopped ? `Stopped Socrates local service PID ${pid}.` : `Tracked Socrates local PID ${pid} had already exited.`);
  } else {
    console.log('No running Socrates local listener found. Continuing with probe-local cleanup.');
  }
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
  if (probeState) {
    const restored = cleanupProbeArtifacts(probeState);
    console.log(restored ? 'Restored probe-local .next state and cleaned probe artifacts.' : 'Probe-local cleanup found no restorable artifacts.');
  }
  fs.rmSync(probeStateFile, { force: true });
  fs.rmSync(pidFile, { force: true });
} catch {
  // Ignore cleanup failure in restricted environments.
}
