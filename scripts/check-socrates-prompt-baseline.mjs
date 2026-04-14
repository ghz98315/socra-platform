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
const promptRoot = path.join(repoRoot, 'apps', 'socrates', 'lib', 'prompts');
const compiledOutDir = path.join(repoRoot, '.codex_tmp', 'prompt-check');

function quoteArg(value) {
  if (/[\s"]/u.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }

  return value;
}

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

function compilePromptSubtree() {
  fs.rmSync(compiledOutDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(compiledOutDir), { recursive: true });

  const tscArgs = [
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
    promptRoot,
    path.join(promptRoot, 'index.ts'),
  ];

  const pnpmCjs = findPnpmCjs();
  if (!pnpmCjs) {
    throw new Error('Unable to locate pnpm.cjs in the current profile.');
  }

  execFileSync(
    process.execPath,
    [
      pnpmCjs,
      ...tscArgs,
    ],
    {
      cwd: repoRoot,
      stdio: 'inherit',
      windowsHide: true,
    },
  );
}

function readBuilder() {
  const builderPath = path.join(compiledOutDir, 'builder.js');
  if (!fs.existsSync(builderPath)) {
    throw new Error(`Compiled prompt builder not found at ${builderPath}`);
  }

  delete require.cache[builderPath];
  return require(builderPath);
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runCase(buildSystemPrompt, testCase) {
  const prompt = buildSystemPrompt(testCase.options);

  assertCondition(
    prompt.includes('<first_turn_focus>') === testCase.expectFirstTurnFocus,
    `${testCase.name}: first_turn_focus expectation failed`,
  );
  assertCondition(
    prompt.includes('<knowledge_base>') === testCase.expectKnowledgeBase,
    `${testCase.name}: knowledge_base expectation failed`,
  );
  assertCondition(
    prompt.includes('<few_shot_examples>') === testCase.expectFewShotExamples,
    `${testCase.name}: few_shot_examples expectation failed`,
  );

  for (const anchor of testCase.requiredAnchors || []) {
    assertCondition(prompt.includes(anchor), `${testCase.name}: missing anchor "${anchor}"`);
  }

  console.log(`PASS ${testCase.name}`);
}

function main() {
  console.log('==> Compile prompt subtree');
  compilePromptSubtree();

  const { buildSystemPrompt } = readBuilder();
  if (typeof buildSystemPrompt !== 'function') {
    throw new Error('buildSystemPrompt is not available from compiled prompt builder.');
  }

  const cases = [
    {
      name: 'math_first_turn',
      options: {
        subject: 'math',
        grade: 'junior',
        userLevel: 'free',
        subjectConfidence: 1,
        questionType: 'proof',
        questionContent: '已知等腰三角形ABC中，AB=AC，求证∠B=∠C。',
        isFirstTurn: true,
      },
      expectFirstTurnFocus: true,
      expectKnowledgeBase: false,
      expectFewShotExamples: false,
      requiredAnchors: ['已知', '目标'],
    },
    {
      name: 'geometry_math_first_turn',
      options: {
        subject: 'math',
        grade: 'junior',
        userLevel: 'free',
        subjectConfidence: 1,
        questionType: 'proof',
        questionContent: '如图，已知△ABC中，D是BC中点，求证AD⊥BC。',
        geometryData: {
          type: 'triangle',
        },
        isFirstTurn: true,
      },
      expectFirstTurnFocus: true,
      expectKnowledgeBase: false,
      expectFewShotExamples: false,
      requiredAnchors: ['点', '线', '角'],
    },
    {
      name: 'english_reading_first_turn',
      options: {
        subject: 'english',
        grade: 'junior',
        userLevel: 'free',
        subjectConfidence: 1,
        questionType: 'reading',
        questionContent: 'Read the passage and choose the best title.',
        isFirstTurn: true,
      },
      expectFirstTurnFocus: true,
      expectKnowledgeBase: false,
      expectFewShotExamples: false,
      requiredAnchors: ['细节', '主旨', '推断'],
    },
    {
      name: 'chinese_first_turn',
      options: {
        subject: 'chinese',
        grade: 'junior',
        userLevel: 'free',
        subjectConfidence: 1,
        questionType: 'reading',
        questionContent: '阅读短文，概括人物心情变化。',
        isFirstTurn: true,
      },
      expectFirstTurnFocus: true,
      expectKnowledgeBase: false,
      expectFewShotExamples: false,
      requiredAnchors: ['题干', '原文'],
    },
    {
      name: 'generic_first_turn',
      options: {
        subject: 'generic',
        grade: 'junior',
        userLevel: 'free',
        subjectConfidence: 0.4,
        questionType: 'unknown',
        questionContent: '我不知道从哪一步开始。',
        isFirstTurn: true,
      },
      expectFirstTurnFocus: true,
      expectKnowledgeBase: false,
      expectFewShotExamples: false,
      requiredAnchors: ['已知', '目标', '最小可执行动作'],
    },
    {
      name: 'math_later_turn',
      options: {
        subject: 'math',
        grade: 'junior',
        userLevel: 'free',
        subjectConfidence: 1,
        questionType: 'proof',
        questionContent: '已知等腰三角形ABC中，AB=AC，求证∠B=∠C。',
        isFirstTurn: false,
      },
      expectFirstTurnFocus: false,
      expectKnowledgeBase: true,
      expectFewShotExamples: true,
    },
    {
      name: 'chinese_later_turn',
      options: {
        subject: 'chinese',
        grade: 'junior',
        userLevel: 'free',
        subjectConfidence: 1,
        questionType: 'reading',
        questionContent: '阅读短文，概括人物心情变化。',
        isFirstTurn: false,
      },
      expectFirstTurnFocus: false,
      expectKnowledgeBase: true,
      expectFewShotExamples: true,
    },
    {
      name: 'generic_later_turn',
      options: {
        subject: 'generic',
        grade: 'junior',
        userLevel: 'free',
        subjectConfidence: 0.4,
        questionType: 'unknown',
        questionContent: '我不知道从哪一步开始。',
        isFirstTurn: false,
      },
      expectFirstTurnFocus: false,
      expectKnowledgeBase: true,
      expectFewShotExamples: true,
    },
  ];

  console.log('==> Run prompt baseline checks');
  for (const testCase of cases) {
    runCase(buildSystemPrompt, testCase);
  }

  console.log(`PASS prompt_baseline total=${cases.length}`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
}
