import fs from 'node:fs';
import process from 'node:process';
import { findListenerPid } from './socrates-local-utils.mjs';
import {
  defaultHost,
  defaultPort,
  getPidFile,
  getProbeStateFile,
  isHealthyHttpStatus,
  isPidAlive,
  probePortOpen,
  requestHttpStatus,
  readArg,
  readNumberArg,
  readTrackedPid,
} from './socrates-local-utils.mjs';

const host = readArg(process.argv, 'host', defaultHost);
const port = readNumberArg(process.argv, 'port', defaultPort);
const baseUrl = `http://${host}:${port}`;
const pidFile = getPidFile(port);
const probeStateFile = getProbeStateFile(port);
const pid = readTrackedPid(fs, port);
const alive = Number.isFinite(pid) ? isPidAlive(pid) : false;
const listenerPid = findListenerPid(port);
const trackedPidMatchesListener = Number.isFinite(pid) && Number.isFinite(listenerPid) && pid === listenerPid;
const portOpen = await probePortOpen(host, port, 1200);
let probeState = null;
let probeStateStatus = 'missing';

if (fs.existsSync(probeStateFile)) {
  try {
    probeState = JSON.parse(fs.readFileSync(probeStateFile, 'utf8'));
    probeStateStatus = 'present';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    probeStateStatus = `invalid:${message}`;
  }
}

let statusCode = null;
let status = 'unreachable';
try {
  statusCode = await requestHttpStatus(baseUrl, 2000);
  status = String(statusCode);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  status = `error:${message}`;
}

const healthy = portOpen && isHealthyHttpStatus(statusCode);
let state = 'down';
let note = '';
let mode = probeState?.mode || 'standard';

if (healthy && mode === 'probe-local' && trackedPidMatchesListener) {
  state = 'healthy_probe_local_tracked_pid';
} else if (healthy && mode === 'probe-local') {
  state = 'healthy_probe_local';
  if (!trackedPidMatchesListener && Number.isFinite(listenerPid)) {
    note = 'Probe-local state is active. Listener PID is the source of truth.';
  }
} else if (healthy && trackedPidMatchesListener) {
  state = 'healthy_tracked_pid';
} else if (healthy && Number.isFinite(listenerPid)) {
  state = 'healthy_listener_pid';
  if (alive && !trackedPidMatchesListener) {
    note = 'Tracked PID is alive but belongs to a different listener/process. Port listener is the source of truth.';
  }
} else if (healthy) {
  state = 'healthy_port_stale_pid';
  note = 'Tracked PID is stale or unavailable. HTTP readiness is the source of truth.';
} else if (probeState?.mode === 'probe-local') {
  state = 'probe_local_not_ready';
  note = 'Probe-local state file exists but local HTTP readiness is failing. Run `pnpm socrates:stop:local` to restore .next before retrying.';
} else if (alive) {
  state = 'tracked_process_not_ready';
  note = 'Tracked process exists but the local app is not yet serving healthy HTTP.';
} else if (portOpen) {
  state = 'port_open_http_unhealthy';
  note = 'The port is open but HTTP readiness is failing. Inspect the latest local start logs.';
}

console.log(`PID=${Number.isFinite(pid) ? pid : 'missing'}`);
console.log(`ALIVE=${alive ? 'yes' : 'no'}`);
console.log(`LISTENER_PID=${Number.isFinite(listenerPid) ? listenerPid : 'missing'}`);
console.log(`PORT_OPEN=${portOpen ? 'yes' : 'no'}`);
console.log(`URL=${baseUrl}`);
console.log(`HTTP=${status}`);
console.log(`HEALTH=${healthy ? 'yes' : 'no'}`);
console.log(`MODE=${mode}`);
console.log(`STATE=${state}`);
console.log(`PID_FILE=${pidFile}`);
console.log(`PROBE_STATE=${probeStateStatus}`);
console.log(`PROBE_STATE_FILE=${probeStateFile}`);
if (probeState?.probeDistPath) {
  console.log(`PROBE_DIST=${probeState.probeDistPath}`);
}
if (probeState?.backupNextPath) {
  console.log(`PROBE_BACKUP=${probeState.backupNextPath}`);
}
if (note) {
  console.log(`NOTE=${note}`);
}
