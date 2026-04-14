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
const compiledOutDir = path.join(repoRoot, '.codex_tmp', 'chat-regression-check');

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

function compileLibSubtree() {
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
      path.join(libRoot, 'prompts', 'index.ts'),
      path.join(libRoot, 'chat', 'conversation-history.ts'),
      path.join(libRoot, 'chat', 'mock-response.ts'),
      path.join(libRoot, 'chat', 'session-initializer.ts'),
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

function countQuestions(text) {
  const matches = text.match(/[？?]/g);
  return matches ? matches.length : 0;
}

function checkRepeatedConfusion(generateImprovedMockResponse) {
  const repeatedHistory = [
    { role: 'system', content: 'system' },
    { role: 'user', content: '我看不懂' },
    { role: 'assistant', content: '先别急着算。题目已经明确告诉了你哪个条件？' },
    { role: 'user', content: '还是看不懂' },
  ];

  const mathRepeated = generateImprovedMockResponse(
    '还是看不懂',
    'junior',
    repeatedHistory,
    'math',
    'proof',
    '已知等腰三角形ABC中，AB=AC，求证∠B=∠C。',
  );
  assertCondition(
    mathRepeated.includes('那我们先退一步。题目最后要你求什么？'),
    'math repeated confusion should step back one layer',
  );
  assertCondition(countQuestions(mathRepeated) === 1, 'math repeated confusion should ask exactly one question');
  console.log('PASS repeated_confusion_math');

  const chineseRepeated = generateImprovedMockResponse(
    '还是看不懂',
    'junior',
    repeatedHistory,
    'chinese',
    'reading',
    '阅读短文，概括人物心情变化。',
  );
  assertCondition(
    chineseRepeated.includes('那我们先退一步。你觉得答案应该回原文哪一句或哪一段找？'),
    'chinese repeated confusion should re-anchor to the original text',
  );
  assertCondition(countQuestions(chineseRepeated) === 1, 'chinese repeated confusion should ask exactly one question');
  console.log('PASS repeated_confusion_chinese');

  const englishRepeated = generateImprovedMockResponse(
    '还是看不懂',
    'junior',
    repeatedHistory,
    'english',
    'reading',
    'Read the passage and choose the best title.',
  );
  assertCondition(
    englishRepeated.includes('那我们先退一步。题干现在问的是细节、主旨，还是推断？'),
    'english reading repeated confusion should step back to question type',
  );
  assertCondition(countQuestions(englishRepeated) === 1, 'english repeated confusion should ask exactly one question');
  console.log('PASS repeated_confusion_english');
}

function checkMockFallbackBranches(generateImprovedMockResponse) {
  const askingForAnswer = generateImprovedMockResponse(
    '直接告诉我答案',
    'junior',
    [
      { role: 'system', content: 'system' },
      { role: 'user', content: '直接告诉我答案' },
    ],
    'math',
    'proof',
    '已知等腰三角形ABC中，AB=AC，求证∠B=∠C。',
  );
  assertCondition(
    askingForAnswer.includes('我不直接给答案。'),
    'asking-for-answer fallback should refuse direct answers',
  );
  assertCondition(
    askingForAnswer.includes('题目已经明确给了你什么'),
    'asking-for-answer fallback should pull the student back to known conditions',
  );
  assertCondition(countQuestions(askingForAnswer) === 1, 'asking-for-answer fallback should ask exactly one question');
  console.log('PASS fallback_asking_for_answer');

  const givingSolution = generateImprovedMockResponse(
    '我觉得先回原文定位',
    'junior',
    [
      { role: 'system', content: 'system' },
      { role: 'user', content: '我觉得先回原文定位' },
    ],
    'chinese',
    'reading',
    '阅读短文，概括人物心情变化。',
  );
  assertCondition(
    givingSolution.includes('这个切入点可以。'),
    'giving-solution fallback should acknowledge the student direction',
  );
  assertCondition(
    givingSolution.includes('下一步你想先回题干，还是先回原文定位？'),
    'giving-solution fallback should continue with one next-step question',
  );
  assertCondition(countQuestions(givingSolution) === 1, 'giving-solution fallback should ask exactly one question');
  console.log('PASS fallback_giving_solution');

  const genericFirstTurn = generateImprovedMockResponse(
    '我刚打开这道题',
    'junior',
    [
      { role: 'system', content: 'system' },
      { role: 'user', content: '我刚打开这道题' },
    ],
    'generic',
    'unknown',
    '我不知道从哪一步开始。',
  );
  assertCondition(
    genericFirstTurn.includes('我们先不急着整题往下做。'),
    'generic first turn fallback should open with a light diagnosis',
  );
  assertCondition(
    genericFirstTurn.includes('题目最后要你求什么'),
    'generic first turn fallback should keep the smallest guiding question',
  );
  assertCondition(countQuestions(genericFirstTurn) === 1, 'generic first turn fallback should ask exactly one question');
  console.log('PASS fallback_generic_first_turn');

  const geometryFirstTurn = generateImprovedMockResponse(
    '我看不懂这道图形题',
    'junior',
    [
      { role: 'system', content: 'system' },
      { role: 'user', content: '我看不懂这道图形题' },
    ],
    'math',
    'proof',
    '如图，已知△ABC中，D是BC中点，求证AD⊥BC。',
    { type: 'triangle' },
  );
  assertCondition(
    geometryFirstTurn.includes('图里最关键的一个点、线或角是哪一个'),
    'geometry first turn fallback should anchor on point-line-angle observation',
  );
  assertCondition(countQuestions(geometryFirstTurn) === 1, 'geometry first turn fallback should ask exactly one question');
  console.log('PASS fallback_geometry_first_turn');
}

function checkClearHistory(initializeConversationSession, getConversationHistoryStore) {
  const store = getConversationHistoryStore();
  store.clear();
  store.set('old-session', [
    { role: 'system', content: 'old-system' },
    { role: 'user', content: '旧消息' },
  ]);

  const result = initializeConversationSession({
    sessionId: 'old-session',
    newSessionId: 'new-session',
    subject: 'chinese',
    grade: 'junior',
    userLevel: 'free',
    subjectConfidence: 1,
    questionType: 'reading',
    questionContent: '阅读短文，概括人物心情变化。',
  });

  assertCondition(result.deletedExistingSession, 'clear-history helper should delete the previous session');
  assertCondition(result.initialized, 'clear-history helper should initialize the new session');
  assertCondition(!store.has('old-session'), 'old session should be removed from shared store');
  assertCondition(store.has('new-session'), 'new session should be written into the shared store');

  const newHistory = store.get('new-session') || [];
  assertCondition(newHistory.length === 1, 'new session should start with a single system message');
  assertCondition(newHistory[0]?.role === 'system', 'new session should start with a system message');
  assertCondition(
    newHistory[0]?.content.includes('<first_turn_focus>'),
    'clear-history rebuilt session should use current first-turn scaffold',
  );
  assertCondition(
    !newHistory[0]?.content.includes('<knowledge_base>'),
    'clear-history rebuilt first turn should not inject knowledge_base',
  );
  assertCondition(
    !newHistory[0]?.content.includes('<few_shot_examples>'),
    'clear-history rebuilt first turn should not inject few_shot_examples',
  );
  assertCondition(
    newHistory[0]?.content.includes('题干') && newHistory[0]?.content.includes('原文'),
    'clear-history rebuilt chinese session should preserve the current chinese first-turn anchors',
  );
  console.log('PASS clear_history_rebuild');

  store.clear();
}

function main() {
  console.log('==> Compile chat and prompt subtree');
  compileLibSubtree();

  const { generateImprovedMockResponse } = readModule(path.join('chat', 'mock-response.js'));
  const { initializeConversationSession } = readModule(path.join('chat', 'session-initializer.js'));
  const { getConversationHistoryStore } = readModule(path.join('chat', 'conversation-history.js'));

  console.log('==> Run chat regression checks');
  checkRepeatedConfusion(generateImprovedMockResponse);
  checkMockFallbackBranches(generateImprovedMockResponse);
  checkClearHistory(initializeConversationSession, getConversationHistoryStore);
  console.log('PASS chat_regression total=8');
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
}
