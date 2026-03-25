import path from 'node:path';
import { spawn } from 'node:child_process';

function mergeNodeOptions(existing, injected) {
  const current = (existing || '').trim();
  if (!current) {
    return injected;
  }

  if (current.includes(injected)) {
    return current;
  }

  return `${current} ${injected}`.trim();
}

const rootDir = process.cwd();

function run(command, args, env, cwd = rootDir) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
      env,
      cwd,
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`command ${command} ${args.join(' ')} exited with signal ${signal}`));
        return;
      }

      if (code !== 0) {
        reject(new Error(`command ${command} ${args.join(' ')} exited with code ${code ?? 1}`));
        return;
      }

      resolve();
    });

    child.on('error', reject);
  });
}

const buildTargets = [
  {
    label: '@socra/auth',
    cwd: 'packages/auth',
    steps: [['node_modules/typescript/bin/tsc']],
  },
  {
    label: '@socra/config',
    cwd: 'packages/config',
    steps: [['node_modules/typescript/bin/tsc']],
  },
  {
    label: '@socra/database',
    cwd: 'packages/database',
    steps: [['node_modules/typescript/bin/tsc']],
  },
  {
    label: '@socra/ui',
    cwd: 'packages/ui',
    steps: [['node_modules/typescript/bin/tsc']],
  },
  {
    label: '@socra/landing',
    cwd: 'apps/landing',
    steps: [['node_modules/next/dist/bin/next', 'build']],
  },
  {
    label: '@socra/socrates',
    cwd: '.',
    steps: [['scripts/build-socrates-safe.mjs']],
  },
  {
    label: '@socra/essay',
    cwd: 'apps/essay',
    steps: [
      ['node_modules/typescript/bin/tsc'],
      ['node_modules/vite/bin/vite.js', 'build'],
    ],
  },
];

const env = {
  ...process.env,
  NODE_OPTIONS: mergeNodeOptions(process.env.NODE_OPTIONS, '--max-old-space-size=16384'),
};

for (const target of buildTargets) {
  console.log(`\n[workspace-build] Building ${target.label}`);

  for (const step of target.steps) {
    await run(process.execPath, step, env, path.join(rootDir, target.cwd));
  }
}
