import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  appDir,
  defaultHost,
  defaultPort,
  findListenerPid,
  isPidAlive,
  probePortOpen,
  readArg,
  readNumberArg,
  readTrackedPid,
  repoRoot,
} from './socrates-local-utils.mjs';

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
      cwd,
      env: process.env,
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

function printBuildBlockedMessage({ host, port, trackedPid, listenerPid, source }) {
  console.error('Socrates local build guard blocked this build.');
  console.error('');
  if (source === 'tracked-pid') {
    console.error('Reason: the helper-managed local Socrates service is still running and may keep `.next` files locked on Windows.');
    console.error(`PID file: ${path.relative(repoRoot, path.join(repoRoot, '.codex-socrates-start.pid'))}`);
    console.error(`Tracked PID: ${trackedPid}`);
  } else {
    console.error('Reason: an active listener was detected on the Socrates local port and may still be serving the existing `.next` output.');
  }
  if (Number.isFinite(listenerPid)) {
    console.error(`Listener PID on ${host}:${port}: ${listenerPid}`);
  }
  console.error('');
  console.error('Stop the local service first, then rerun the build:');
  console.error('  pnpm socrates:status:local');
  console.error('  pnpm socrates:stop:local');
  console.error('  pnpm --filter @socra/socrates build');
  if (source === 'listener-only') {
    console.error('');
    console.error('If you know this listener is unrelated to Socrates, rerun with:');
    console.error('  $env:SOCRA_ALLOW_ACTIVE_PORT_3000_BUILD=1');
    console.error('  pnpm --filter @socra/socrates build');
  }
}

async function ensureSafeToBuild({ host, port }) {
  const trackedPid = readTrackedPid(fs);
  const trackedPidAlive = Number.isFinite(trackedPid) && isPidAlive(trackedPid);
  const listenerPid = findListenerPid(port);
  const trackedPidMatchesListener = Number.isFinite(trackedPid) && Number.isFinite(listenerPid) && trackedPid === listenerPid;
  const allowActivePortBuild = process.env.SOCRA_ALLOW_ACTIVE_PORT_3000_BUILD === '1';
  const portOpen = await probePortOpen(host, port, 1200);

  if (trackedPidAlive && trackedPidMatchesListener) {
    printBuildBlockedMessage({ host, port, trackedPid, listenerPid, source: 'tracked-pid' });
    process.exit(1);
  }

  if (portOpen && !allowActivePortBuild) {
    printBuildBlockedMessage({ host, port, trackedPid, listenerPid, source: 'listener-only' });
    process.exit(1);
  }

  if (portOpen && allowActivePortBuild) {
    console.warn(`Warning: port ${port} on ${host} is listening, but SOCRA_ALLOW_ACTIVE_PORT_3000_BUILD=1 is set.`);
    console.warn('Continuing build despite the active listener override.');
  }
}

async function main() {
  const host = readArg(process.argv, 'host', defaultHost);
  const port = readNumberArg(process.argv, 'port', defaultPort);
  const checkOnly = process.argv.includes('--check-only');

  await ensureSafeToBuild({ host, port });

  if (checkOnly) {
    console.log('Socrates build guard passed.');
    return;
  }

  const nextBin = path.join(appDir, 'node_modules', 'next', 'dist', 'bin', 'next');
  if (!fs.existsSync(nextBin)) {
    throw new Error(`Next CLI was not found at ${nextBin}`);
  }

  await run(process.execPath, [nextBin, 'build'], appDir);
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
}
