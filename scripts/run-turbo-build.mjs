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

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env,
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
  '@socra/auth',
  '@socra/config',
  '@socra/database',
  '@socra/ui',
  '@socra/essay',
  '@socra/landing',
  '@socra/socrates',
];

const env = {
  ...process.env,
  NODE_OPTIONS: mergeNodeOptions(process.env.NODE_OPTIONS, '--max-old-space-size=8192'),
};

for (const target of buildTargets) {
  console.log(`\n[workspace-build] Building ${target}`);
  await run('pnpm', ['--filter', target, 'build'], env);
}
