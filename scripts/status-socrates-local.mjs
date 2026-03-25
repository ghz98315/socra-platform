import fs from 'node:fs';
import process from 'node:process';
import { findListenerPid } from './socrates-local-utils.mjs';
import {
  defaultHost,
  defaultPort,
  isPidAlive,
  probePortOpen,
  readArg,
  readNumberArg,
  readTrackedPid,
} from './socrates-local-utils.mjs';

const host = readArg(process.argv, 'host', defaultHost);
const port = readNumberArg(process.argv, 'port', defaultPort);
const baseUrl = `http://${host}:${port}`;
const pid = readTrackedPid(fs);
const alive = Number.isFinite(pid) ? isPidAlive(pid) : false;
const listenerPid = findListenerPid(port);
const portOpen = await probePortOpen(host, port, 1200);

let status = 'unreachable';
try {
  const response = await fetch(baseUrl, {
    redirect: 'manual',
  });
  status = String(response.status);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  status = `error:${message}`;
}

console.log(`PID=${Number.isFinite(pid) ? pid : 'missing'}`);
console.log(`ALIVE=${alive ? 'yes' : 'no'}`);
console.log(`LISTENER_PID=${Number.isFinite(listenerPid) ? listenerPid : 'missing'}`);
console.log(`PORT_OPEN=${portOpen ? 'yes' : 'no'}`);
console.log(`URL=${baseUrl}`);
console.log(`HTTP=${status}`);
