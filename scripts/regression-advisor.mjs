import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultRepoRoot = path.resolve(scriptDir, '..');

function normalizeFilePath(input) {
  let value = input.replace(/\r?\n$/u, '');
  if (!value) {
    return '';
  }

  if (value.length > 3 && value[2] === ' ') {
    value = value.slice(3).trim();
  } else {
    value = value.trim();
  }

  if (value.includes('->')) {
    value = value.split('->').at(-1)?.trim() || value;
  }

  return value.replace(/\\/g, '/');
}

function loadFilesFromGit(repoRoot) {
  const output = execFileSync('git', ['-C', repoRoot, 'status', '--short'], {
    encoding: 'utf8',
    windowsHide: true,
  });

  return output
    .split(/\r?\n/u)
    .map(normalizeFilePath)
    .filter(Boolean);
}

function loadFilesFromStatusText(statusText) {
  return statusText
    .split(/\r?\n/u)
    .map(normalizeFilePath)
    .filter(Boolean);
}

function matches(file, fragments) {
  return fragments.some((fragment) => file.includes(fragment));
}

function buildRecommendation(files) {
  const flags = {
    socrates: false,
    essay: false,
    landing: false,
    workspace: false,
    docsOnly: files.length > 0,
    sensitiveSocrates: false,
    studyFlow: false,
    multisubjectDocs: false,
    releaseDocs: false,
    runtimeDocs: false,
  };

  const reasons = [];
  const docs = new Set();

  for (const file of files) {
    if (!file.startsWith('docs/')) {
      flags.docsOnly = false;
    }

    if (matches(file, ['apps/socrates/', 'supabase/migrations/'])) {
      flags.socrates = true;
    }

    if (file.startsWith('apps/essay/')) {
      flags.essay = true;
    }

    if (file.startsWith('apps/landing/')) {
      flags.landing = true;
    }

    if (
      matches(file, [
        'packages/',
        'package.json',
        'pnpm-workspace.yaml',
        'turbo.json',
        'scripts/check-env.mjs',
        'scripts/smoke-socrates.mjs',
        'scripts/smoke-study-flow.mjs',
        'scripts/autopilot.mjs',
        'scripts/recommend-regression.mjs',
        'scripts/run-regression.mjs',
        'scripts/regression-advisor.mjs',
      ])
    ) {
      flags.workspace = true;
    }

    if (
      matches(file, [
        'apps/socrates/app/api/payment/',
        'apps/socrates/app/api/subscription/',
        'apps/socrates/app/api/family/',
        'apps/socrates/app/api/dashboard/',
        'apps/socrates/app/(student)/payment/',
        'scripts/smoke-socrates.mjs',
      ])
    ) {
      flags.sensitiveSocrates = true;
    }

    if (
      matches(file, [
        'apps/socrates/app/(student)/study/',
        'apps/socrates/components/study/',
        'apps/socrates/lib/study/',
        'apps/socrates/app/api/study/',
        'apps/socrates/app/(student)/reports/',
        'apps/socrates/components/reports/',
        'apps/socrates/lib/reports/',
        'apps/socrates/app/api/reports/',
        'apps/socrates/app/(student)/review/',
        'apps/socrates/app/api/review/',
        'scripts/smoke-study-flow.mjs',
        'docs/md_progress_socrates_multisubject_20260316_stage.md',
        'docs/md_multisubject_internal_beta_20260316.md',
        'docs/md_progress_socrates_multisubject_20260316_writing_studios.md',
        'docs/md_socrates_multisubject_plan.md',
      ])
    ) {
      flags.multisubjectDocs = true;
      flags.studyFlow = true;
    }

    if (matches(file, ['docs/md_TEST_GUIDE.md', 'docs/md_RELEASE_RUNBOOK.md'])) {
      flags.releaseDocs = true;
    }

    if (matches(file, ['docs/md_NODE20_SWITCH_GUIDE_20260317.md'])) {
      flags.runtimeDocs = true;
    }
  }

  if (flags.multisubjectDocs) {
    docs.add('docs/md_progress_socrates_multisubject_20260316_stage.md');
    docs.add('docs/md_multisubject_internal_beta_20260316.md');
  }

  if (flags.releaseDocs || flags.sensitiveSocrates || flags.workspace) {
    docs.add('docs/md_TEST_GUIDE.md');
  }

  if (flags.releaseDocs || flags.sensitiveSocrates) {
    docs.add('docs/md_RELEASE_RUNBOOK.md');
  }

  if (flags.runtimeDocs) {
    docs.add('docs/md_NODE20_SWITCH_GUIDE_20260317.md');
  }

  let target = null;
  let profile = null;

  const appCount = Number(flags.socrates) + Number(flags.essay) + Number(flags.landing);
  if (flags.workspace || appCount > 1) {
    target = 'workspace';
    reasons.push('shared workspace files or multiple apps are touched');
  } else if (flags.socrates) {
    target = 'socrates';
    reasons.push('only Socrates-facing files are touched');
  } else if (flags.essay) {
    target = 'essay';
    reasons.push('only Essay files are touched');
  } else if (flags.landing) {
    target = 'landing';
    reasons.push('only Landing files are touched');
  }

  if (flags.docsOnly && !target) {
    reasons.push('only docs changed; code build can be skipped unless docs claim new runtime readiness');
  }

  if (target === 'socrates' || target === 'workspace') {
    profile = flags.sensitiveSocrates ? 'full' : flags.studyFlow ? 'smoke' : 'build';
    if (flags.sensitiveSocrates) {
      reasons.push('sensitive Socrates API or payment/subscription/family flow changed');
    } else if (flags.studyFlow) {
      reasons.push('study/report/review flow changed; include build plus study-flow smoke when env is configured');
    }
  } else if (target) {
    profile = 'build';
  }

  const commands = [];
  if (target && profile) {
    commands.push(`node scripts/run-regression.mjs --target ${target} --profile ${profile}`);
  }

  return {
    target,
    profile,
    commands,
    docsToSync: Array.from(docs),
    reasons,
  };
}

export function analyzeRegressionScope({
  repoRoot = defaultRepoRoot,
  explicitFiles = [],
  statusText = '',
}) {
  let files = [];

  if (explicitFiles.length > 0) {
    files = explicitFiles.map(normalizeFilePath).filter(Boolean);
  } else if (statusText.trim()) {
    files = loadFilesFromStatusText(statusText);
  } else {
    try {
      files = loadFilesFromGit(repoRoot);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `git-status-unavailable: unable to inspect git status automatically. Use --file or --status-file instead. Original error: ${message}`,
      );
    }
  }

  return {
    repoRoot,
    files,
    recommendation: buildRecommendation(files),
  };
}

export function printRecommendation(result, format = 'text') {
  if (format === 'json') {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Files: ${result.files.length}`);
  for (const file of result.files) {
    console.log(`- ${file}`);
  }

  console.log('');
  console.log(`Recommended target: ${result.recommendation.target ?? 'none'}`);
  console.log(`Recommended profile: ${result.recommendation.profile ?? 'none'}`);

  if (result.recommendation.commands.length > 0) {
    console.log('Recommended commands:');
    for (const command of result.recommendation.commands) {
      console.log(`- ${command}`);
    }
  }

  if (result.recommendation.docsToSync.length > 0) {
    console.log('Docs to sync:');
    for (const item of result.recommendation.docsToSync) {
      console.log(`- ${item}`);
    }
  }

  if (result.recommendation.reasons.length > 0) {
    console.log('Reasons:');
    for (const reason of result.recommendation.reasons) {
      console.log(`- ${reason}`);
    }
  }
}
