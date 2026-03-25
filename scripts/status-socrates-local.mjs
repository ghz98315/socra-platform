import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
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

function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

const host = readArg('host', '127.0.0.1');
const port = readNumberArg('port', 3000);
const baseUrl = `http://${host}:${port}`;
const pid = fs.existsSync(pidFile) ? Number.parseInt(fs.readFileSync(pidFile, 'utf8').trim(), 10) : null;
const alive = Number.isFinite(pid) ? isPidAlive(pid) : false;

let status = 'unreachable';
try {
  const response = await fetch(baseUrl, {
    redirect: 'manual',
  });
  status = String(response.status);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  status = `error:${message}`;
}

console.log(`PID=${Number.isFinite(pid) ? pid : 'missing'}`);
console.log(`ALIVE=${alive ? 'yes' : 'no'}`);
console.log(`URL=${baseUrl}`);
console.log(`HTTP=${status}`);
