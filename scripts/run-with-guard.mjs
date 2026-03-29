import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const args = process.argv.slice(2);

function readArg(name, fallback = '') {
  const index = args.indexOf(`--${name}`);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }

  return args[index + 1];
}

function readNumberArg(name, fallback) {
  const rawValue = readArg(name, '');
  if (!rawValue) {
    return fallback;
  }

  const value = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid --${name}: ${rawValue}. Use an integer.`);
  }

  return value;
}

function quoteArg(value) {
  if (/[\s"]/u.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }

  return value;
}

function resolveCommandArgs() {
  const separatorIndex = args.indexOf('--');
  if (separatorIndex === -1 || separatorIndex === args.length - 1) {
    throw new Error('Missing guarded command. Use `node scripts/run-with-guard.mjs ... -- <command> [args...]`.');
  }

  return {
    command: args[separatorIndex + 1],
    commandArgs: args.slice(separatorIndex + 2),
  };
}

function printHeader(title) {
  console.error('');
  console.error(`==> ${title}`);
}

function runDiagnosticCommand(label, command, commandArgs, timeoutMs = 120000) {
  printHeader(label);

  try {
    execFileSync(command, commandArgs, {
      cwd: repoRoot,
      stdio: 'inherit',
      windowsHide: true,
      timeout: timeoutMs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[guard] Diagnostic command failed: ${message}`);
  }
}

function readLatestLogFiles(limit = 2) {
  return fs
    .readdirSync(repoRoot)
    .filter((name) => /^\.codex-socrates-start-.*\.(out|err)\.log$/u.test(name))
    .map((name) => {
      const fullPath = path.join(repoRoot, name);
      const stat = fs.statSync(fullPath);
      return {
        name,
        fullPath,
        mtimeMs: stat.mtimeMs,
      };
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs)
    .slice(0, limit);
}

function printTail(filePath, lineLimit = 30) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/u).filter(Boolean);
    const tail = lines.slice(-lineLimit);

    if (tail.length === 0) {
      console.error('[guard] log is empty');
      return;
    }

    for (const line of tail) {
      console.error(line);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[guard] Unable to read log tail: ${message}`);
  }
}

function printLatestStartLogs() {
  const latestLogs = readLatestLogFiles(2);
  if (latestLogs.length === 0) {
    return;
  }

  for (const log of latestLogs) {
    printHeader(`Latest log tail: ${log.name}`);
    printTail(log.fullPath);
  }
}

function runDiagnostics(diagnoseKind) {
  switch (diagnoseKind) {
    case 'local-start':
      runDiagnosticCommand('Local status', process.execPath, [path.join(repoRoot, 'scripts', 'status-socrates-local.mjs')]);
      printLatestStartLogs();
      break;
    case 'socrates-build':
      runDiagnosticCommand('Local status', process.execPath, [path.join(repoRoot, 'scripts', 'status-socrates-local.mjs')]);
      runDiagnosticCommand(
        'Build probe',
        process.execPath,
        [path.join(repoRoot, 'scripts', 'probe-socrates-build.mjs'), '--trace-children'],
        180000,
      );
      break;
    case 'socrates-smoke':
      runDiagnosticCommand('Local status', process.execPath, [path.join(repoRoot, 'scripts', 'status-socrates-local.mjs')]);
      printLatestStartLogs();
      break;
    default:
      console.error('[guard] No timeout diagnostics configured for this command.');
      break;
  }
}

function terminateProcessTree(pid) {
  if (!Number.isFinite(pid)) {
    return;
  }

  try {
    if (process.platform === 'win32') {
      execFileSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
      return;
    }

    process.kill(pid, 'SIGTERM');
    setTimeout(() => {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {
        // Process already exited.
      }
    }, 2000).unref();
  } catch {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // Process already exited.
    }
  }
}

const label = readArg('label', 'Guarded command');
const diagnoseKind = readArg('diagnose', 'generic');
const cwd = path.resolve(readArg('cwd', process.cwd()));
const timeoutMs = readNumberArg('timeout-ms', 20 * 60 * 1000);
const disableGuard = process.env.SOCRA_GUARD_DISABLE === '1';
const { command, commandArgs } = resolveCommandArgs();

console.log(`==> ${label}`);
console.log(`[guard] cwd=${quoteArg(cwd)}`);
console.log(`[guard] timeout_ms=${timeoutMs}`);

const child = spawn(command, commandArgs, {
  cwd,
  stdio: 'inherit',
  shell: false,
  env: process.env,
});

let timedOut = false;
let timeoutHandle = null;
let settled = false;

function finalize(code = 1, signal = null) {
  if (settled) {
    return;
  }

  settled = true;

  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
  }

  if (timedOut) {
    process.exit(124);
  }

  if (signal) {
    console.error(`[guard] ${label} exited with signal ${signal}`);
    process.exit(1);
  }

  process.exit(code ?? 1);
}

if (!disableGuard) {
  timeoutHandle = setTimeout(() => {
    timedOut = true;
    console.error('');
    console.error(`[guard] ${label} exceeded ${Math.round(timeoutMs / 60000)} minute(s).`);
    console.error('[guard] The command will be stopped and local diagnostics will run before exit.');
    terminateProcessTree(child.pid);
    runDiagnostics(diagnoseKind);
  }, timeoutMs);
}

child.on('error', (error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[guard] ${label} failed to start: ${message}`);
  finalize(1);
});

child.on('exit', (code, signal) => {
  finalize(code ?? 1, signal);
});

child.on('close', (code, signal) => {
  finalize(code ?? 1, signal);
});
