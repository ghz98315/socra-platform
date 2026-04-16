import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const libRoot = path.join(repoRoot, 'apps', 'socrates', 'lib');
const compiledOutDir = path.join(repoRoot, '.codex_tmp', 'wrap-up-regression-check');

function findExisting(paths) {
  return paths.find((candidate) => candidate && fs.existsSync(candidate)) || '';
}

function findPnpmCjs() {
  const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  const userProfile = process.env.USERPROFILE || os.homedir();
  const candidates = [
    path.join(appData, 'npm', 'node_modules', 'pnpm', 'bin', 'pnpm.cjs'),
    path.join(userProfile, 'AppData', 'Roaming', 'npm', 'node_modules', 'pnpm', 'bin', 'pnpm.cjs'),
    'C:\\Users\\BYD\\AppData\\Roaming\\npm\\node_modules\\pnpm\\bin\\pnpm.cjs',
  ];

  return findExisting(candidates);
}

function compileWrapUpSubtree() {
  fs.rmSync(compiledOutDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(compiledOutDir), { recursive: true });

  const pnpmCjs = findPnpmCjs();
  if (!pnpmCjs) {
    throw new Error('Unable to locate pnpm.cjs in the current profile.');
  }

  execFileSync(
    process.execPath,
    [
      pnpmCjs,
      'exec',
      'tsc',
      '--module',
      'commonjs',
      '--moduleResolution',
      'node',
      '--target',
      'es2022',
      '--outDir',
      compiledOutDir,
      '--rootDir',
      libRoot,
      path.join(libRoot, 'prompts', 'types.ts'),
      path.join(libRoot, 'chat', 'mock-response.ts'),
      path.join(libRoot, 'chat', 'wrap-up-signal.ts'),
      path.join(libRoot, 'error-loop', 'taxonomy.ts'),
      path.join(libRoot, 'error-loop', 'wrap-up-heuristics.ts'),
    ],
    {
      cwd: repoRoot,
      stdio: 'inherit',
      windowsHide: true,
    },
  );
}

function readModule(relativePath) {
  const modulePath = path.join(compiledOutDir, relativePath);
  if (!fs.existsSync(modulePath)) {
    throw new Error(`Compiled module not found: ${modulePath}`);
  }

  delete require.cache[modulePath];
  return require(modulePath);
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function checkNeedsMoreClarification(buildStatusFromMessages) {
  const messages = [{ role: 'user', content: '我不会，没思路' }];
  const status = buildStatusFromMessages(messages);

  assertCondition(status.status === 'needs_more_clarification', 'confused-only turn should need more clarification');
  console.log('PASS wrapup_confused_status');
}

function checkIndependentReasoningScenario(buildStatusFromMessages, selectHeuristicRootCause, showsIndependentReasoning) {
  const messages = [
    { role: 'assistant', content: '先别急，你现在最确定的条件是什么？' },
    { role: 'user', content: '我不会，没思路' },
    { role: 'assistant', content: '好，那先从移项开始想。' },
    { role: 'user', content: '我觉得应该先把 3 移到右边，所以 2x = 8，答案是 x = 4' },
  ];

  const status = buildStatusFromMessages(messages);
  const rootCause = selectHeuristicRootCause(messages);

  assertCondition(showsIndependentReasoning(messages[messages.length - 1].content), 'answer path should count as independent reasoning');
  assertCondition(status.status === 'ready_to_wrap', 'independent answer path should be ready to wrap');
  assertCondition(
    !(rootCause.category === 'pseudo_mastery' && rootCause.subtype === 'prompt_dependency'),
    'independent answer path should not be prompt dependency',
  );
  assertCondition(
    rootCause.category === 'strategy_gap' && rootCause.subtype === 'no_entry_strategy',
    'earlier confusion plus later reasoning should fall back to strategy gap',
  );
  console.log('PASS wrapup_independent_reasoning');
}

function checkAnswerSeekingScenario(selectHeuristicRootCause, showsIndependentReasoning) {
  const messages = [{ role: 'user', content: '直接告诉我答案' }];
  const rootCause = selectHeuristicRootCause(messages);

  assertCondition(!showsIndependentReasoning(messages[0].content), 'answer-seeking should not count as independent reasoning');
  assertCondition(
    rootCause.category === 'pseudo_mastery' && rootCause.subtype === 'prompt_dependency',
    'explicit answer seeking should remain prompt dependency',
  );
  console.log('PASS wrapup_answer_seeking');
}

function main() {
  console.log('==> Compile wrap-up heuristic subtree');
  compileWrapUpSubtree();

  const {
    buildStatusFromMessages,
    selectHeuristicRootCause,
    showsIndependentReasoning,
  } = readModule(path.join('error-loop', 'wrap-up-heuristics.js'));

  console.log('==> Run wrap-up regression checks');
  checkNeedsMoreClarification(buildStatusFromMessages);
  checkIndependentReasoningScenario(buildStatusFromMessages, selectHeuristicRootCause, showsIndependentReasoning);
  checkAnswerSeekingScenario(selectHeuristicRootCause, showsIndependentReasoning);
  console.log('PASS wrapup_regression total=3');
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
}
