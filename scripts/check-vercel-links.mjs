import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

const expectedProjects = [
  {
    app: 'landing',
    relativePath: path.join('apps', 'landing', '.vercel', 'project.json'),
    projectId: 'prj_c3so0fHNZadONoXDM5hp7RObCOE5',
    projectName: 'socra-landing',
    rootDirectory: 'apps/landing',
  },
  {
    app: 'socrates',
    relativePath: path.join('apps', 'socrates', '.vercel', 'project.json'),
    projectId: 'prj_f4pBZ4BLpWGEK5N5hEcStj0cRs2A',
    projectName: 'socra-socrates',
    rootDirectory: 'apps/socrates',
  },
  {
    app: 'essay',
    relativePath: path.join('apps', 'essay', '.vercel', 'project.json'),
    projectId: 'prj_30eHoHt8CCkzaLZDQ0IHgVZ5x8K2',
    projectName: 'socra-essay',
    rootDirectory: 'apps/essay',
  },
];

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to read ${filePath}: ${message}`);
  }
}

let hasFailure = false;

console.log('Vercel local link audit');
console.log('=======================');

for (const expected of expectedProjects) {
  const filePath = path.join(repoRoot, expected.relativePath);

  if (!fs.existsSync(filePath)) {
    hasFailure = true;
    console.log(`\n[${expected.app}] MISSING`);
    console.log(`  Expected file: ${filePath}`);
    console.log(`  Expected project: ${expected.projectName} (${expected.projectId})`);
    continue;
  }

  const current = readJson(filePath);
  const mismatches = [];

  if (current.projectId !== expected.projectId) {
    mismatches.push(`projectId=${current.projectId ?? 'missing'} expected=${expected.projectId}`);
  }

  if (current.projectName !== expected.projectName) {
    mismatches.push(`projectName=${current.projectName ?? 'missing'} expected=${expected.projectName}`);
  }

  if (current.orgId !== 'team_oGAI73uHlj5rSJavgqQ1mANw') {
    mismatches.push(`orgId=${current.orgId ?? 'missing'} expected=team_oGAI73uHlj5rSJavgqQ1mANw`);
  }

  console.log(`\n[${expected.app}] ${mismatches.length === 0 ? 'OK' : 'MISMATCH'}`);
  console.log(`  File: ${filePath}`);
  console.log(`  Project: ${current.projectName ?? 'missing'} (${current.projectId ?? 'missing'})`);
  console.log(`  Expected root directory: ${expected.rootDirectory}`);

  if (mismatches.length > 0) {
    hasFailure = true;
    for (const mismatch of mismatches) {
      console.log(`  ${mismatch}`);
    }
  }
}

if (hasFailure) {
  console.error('\nLocal Vercel links need attention.');
  process.exit(1);
}

console.log('\nLocal Vercel links are aligned.');
