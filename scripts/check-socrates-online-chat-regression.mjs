import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { randomUUID } from 'node:crypto';
import {
  appDir,
  defaultHost,
  isHealthyHttpStatus,
  probePortOpen,
  readArg,
  readNumberArg,
  repoRoot,
  requestHttpStatus,
} from './socrates-local-utils.mjs';

const nextBin = path.join(appDir, 'node_modules', 'next', 'dist', 'bin', 'next');

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

  throw new Error(`Online chat regression server did not become healthy within ${timeoutMs}ms.`);
}

async function ensurePortAvailable(host, port) {
  const open = await probePortOpen(host, port, 1500);
  if (open) {
    throw new Error(`Port ${port} on ${host} is already listening. Stop the existing service before running online chat regression.`);
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
  if (!targetPath || !fs.existsSync(targetPath)) {
    return;
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
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

function stopChildProcess(pid) {
  if (!pid) {
    return;
  }

  try {
    process.kill(pid);
    return;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ESRCH') {
      return;
    }
  }

  try {
    execFileSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], {
      encoding: 'utf8',
      windowsHide: true,
      stdio: 'pipe',
    });
  } catch {
    // Best-effort cleanup only.
  }
}

function isPidAlive(pid) {
  if (!pid) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function formatServerFailure(server, prefix) {
  const lines = [prefix];

  if (server?.child?.pid) {
    lines.push(`PID: ${server.child.pid}`);
    lines.push(`ALIVE: ${isPidAlive(server.child.pid) ? 'yes' : 'no'}`);
  }

  if (typeof server?.exitCode !== 'undefined') {
    lines.push(`EXIT_CODE: ${server.exitCode}`);
  }

  if (typeof server?.exitSignal !== 'undefined' && server.exitSignal !== null) {
    lines.push(`EXIT_SIGNAL: ${server.exitSignal}`);
  }

  return lines.join('\n');
}

function startForegroundProcess({ command, args, cwd, envOverrides = {} }) {
  const child = spawn(command, args, {
    cwd,
    shell: false,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...envOverrides,
    },
  });

  const server = {
    child,
    exitCode: undefined,
    exitSignal: undefined,
  };

  child.on('exit', (code, signal) => {
    server.exitCode = code;
    server.exitSignal = signal;
  });

  return server;
}

async function requestJson(baseUrl, pathname, init = {}) {
  const response = await fetch(new URL(pathname, baseUrl), init);
  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    throw new Error(`${pathname} failed with ${response.status}: ${JSON.stringify(payload)}`);
  }

  return payload;
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(text, needle, label) {
  assertCondition(typeof text === 'string' && text.includes(needle), `${label} is missing expected text: ${needle}`);
}

async function runOnlineRegression(baseUrl) {
  const mathFirstTurn = await requestJson(baseUrl, '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: '我不知道从哪一步开始',
      subject: 'math',
      questionType: 'proof',
      grade: 'junior',
      userLevel: 'free',
      questionContent: '已知三角形ABC中，AB=AC，求证∠B=∠C',
    }),
  });
  assertIncludes(mathFirstTurn.content, '题目已经明确告诉了你哪个条件', 'math first turn');
  console.log('PASS online_math_first_turn');

  const geometryFirstTurn = await requestJson(baseUrl, '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: '我看不懂这道图形题',
      subject: 'math',
      questionType: 'proof',
      grade: 'junior',
      userLevel: 'free',
      questionContent: '如图，已知△ABC中，D是BC中点，求证AD⊥BC',
      geometryData: {
        type: 'triangle',
      },
    }),
  });
  assertIncludes(geometryFirstTurn.content, '图里最关键的一个点、线或角是哪一个', 'geometry first turn');
  console.log('PASS online_geometry_first_turn');

  const englishFirstTurn = await requestJson(baseUrl, '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: '我不会做这道阅读题',
      subject: 'english',
      questionType: 'reading',
      grade: 'junior',
      userLevel: 'free',
      questionContent: 'Read the passage and choose the best title.',
    }),
  });
  assertIncludes(englishFirstTurn.content, '题干现在问的是细节、主旨，还是推断', 'english first turn');
  console.log('PASS online_english_first_turn');

  const chineseSessionId = randomUUID();
  await requestJson(baseUrl, '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: chineseSessionId,
      message: '我看不懂',
      subject: 'chinese',
      questionType: 'reading',
      grade: 'junior',
      userLevel: 'free',
      questionContent: '阅读短文，概括人物心情变化。',
    }),
  });
  const chineseRepeated = await requestJson(baseUrl, '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: chineseSessionId,
      message: '还是看不懂',
      subject: 'chinese',
      questionType: 'reading',
      grade: 'junior',
      userLevel: 'free',
      questionContent: '阅读短文，概括人物心情变化。',
    }),
  });
  assertIncludes(chineseRepeated.content, '你觉得答案应该回原文哪一句或哪一段找', 'chinese repeated confusion');
  console.log('PASS online_chinese_repeated_confusion');

  const clearOldSessionId = randomUUID();
  const clearNewSessionId = randomUUID();
  await requestJson(baseUrl, '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: clearOldSessionId,
      message: '我看不懂这道题',
      subject: 'chinese',
      questionType: 'reading',
      grade: 'junior',
      userLevel: 'free',
      questionContent: '阅读短文，概括人物心情变化。',
    }),
  });
  const clearHistoryResult = await requestJson(baseUrl, '/api/chat/clear-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: clearOldSessionId,
      newSessionId: clearNewSessionId,
      subject: 'chinese',
      questionType: 'reading',
      grade: 'junior',
      userLevel: 'free',
      questionContent: '阅读短文，概括人物心情变化。',
    }),
  });
  assertCondition(clearHistoryResult?.success === true, 'clear-history should return success=true');

  const clearHistoryGet = await requestJson(
    baseUrl,
    `/api/chat?session_id=${encodeURIComponent(clearNewSessionId)}`,
  );
  assertCondition(Array.isArray(clearHistoryGet?.history), 'clear-history GET should return history array');
  assertCondition(clearHistoryGet.history.length === 0, 'new session should start without user-visible history');

  const clearHistoryFirstTurn = await requestJson(baseUrl, '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: clearNewSessionId,
      message: '我看不懂',
      subject: 'chinese',
      questionType: 'reading',
      grade: 'junior',
      userLevel: 'free',
      questionContent: '阅读短文，概括人物心情变化。',
    }),
  });
  assertIncludes(clearHistoryFirstTurn.content, '题干里最关键的词是哪一个', 'clear-history rebuilt first turn');
  console.log('PASS online_clear_history_rebuild');

  const deleteResult = await requestJson(
    baseUrl,
    `/api/chat?session_id=${encodeURIComponent(clearNewSessionId)}`,
    { method: 'DELETE' },
  );
  assertCondition(deleteResult?.success === true, 'DELETE /api/chat should return success=true');
  console.log('PASS online_session_param_compat');

  console.log('PASS online_chat_regression total=6');
}

async function main() {
  const port = readNumberArg(process.argv, 'port', 3010);
  const host = readArg(process.argv, 'host', defaultHost);
  const timeoutMs = readNumberArg(process.argv, 'timeout-ms', 600000);
  const intervalMs = readNumberArg(process.argv, 'poll-ms', 1000);
  const node22Exe = findNode22Executable();

  if (!node22Exe) {
    throw new Error('Unable to locate a Node 22 executable. Pass --node22 <path> or set NODE22_EXE.');
  }

  if (!fs.existsSync(nextBin)) {
    throw new Error(`Next CLI was not found at ${nextBin}`);
  }

  await ensurePortAvailable(host, port);

  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const currentNextPath = path.join(appDir, '.next');
  const backupNextPath = fs.existsSync(currentNextPath)
    ? path.join(appDir, `.next.pre-online-regression-${stamp}`)
    : '';
  const probeDistRelative = path.join('.next-probe', `online-chat-regression-${stamp}`);
  const probeDistPath = path.join(appDir, probeDistRelative);
  let server = null;

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

    server = startForegroundProcess({
      command: node22Exe,
      args: [nextBin, 'start', '-H', host, '-p', String(port)],
      cwd: appDir,
      envOverrides: {
        AI_API_KEY_LOGIC: '',
        AI_API_KEY_VISION: '',
        DASHSCOPE_API_KEY: '',
      },
    });

    const baseUrl = `http://${host}:${port}`;
    let statusCode = null;
    try {
      statusCode = await waitForReady({
        baseUrl,
        timeoutMs,
        intervalMs,
      });
    } catch (error) {
      throw new Error(
        formatServerFailure(
          server,
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
    assertCondition(isHealthyHttpStatus(statusCode), `Unexpected online regression health status: ${statusCode}`);

    await runOnlineRegression(baseUrl);
  } finally {
    if (server?.child?.pid) {
      stopChildProcess(server.child.pid);
    }

    try {
      restoreProbeAssets({ currentNextPath, backupNextPath });
    } catch {
      // Best-effort cleanup only.
    }

    try {
      cleanupProbeOutput(probeDistPath);
    } catch {
      // Best-effort cleanup only.
    }
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
