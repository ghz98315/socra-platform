const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');

const traceFile = process.env.SOCRA_CHILD_TRACE_FILE || '';

function ensureTraceDir() {
  if (!traceFile) {
    return;
  }

  fs.mkdirSync(path.dirname(traceFile), { recursive: true });
}

function truncate(value, maxLength = 400) {
  if (typeof value !== 'string') {
    return value;
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...<truncated>`;
}

function serializeError(error) {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }

  return {
    name: error.name,
    message: error.message,
    code: error.code,
    errno: error.errno,
    syscall: error.syscall,
    path: error.path,
    spawnargs: Array.isArray(error.spawnargs) ? error.spawnargs : undefined,
    stack: truncate(error.stack || '', 1200),
  };
}

function serializeOptions(options) {
  if (!options || typeof options !== 'object') {
    return undefined;
  }

  const env = options.env && typeof options.env === 'object'
    ? {
        NODE_OPTIONS: options.env.NODE_OPTIONS,
        NEXT_DISABLE_ESLINT: options.env.NEXT_DISABLE_ESLINT,
        NEXT_DISABLE_TYPECHECK: options.env.NEXT_DISABLE_TYPECHECK,
        CI: options.env.CI,
      }
    : undefined;

  return {
    cwd: options.cwd,
    shell: options.shell,
    detached: options.detached,
    windowsHide: options.windowsHide,
    stdio: Array.isArray(options.stdio) ? options.stdio : options.stdio,
    env,
  };
}

function log(entry) {
  if (!traceFile) {
    return;
  }

  ensureTraceDir();
  fs.appendFileSync(
    traceFile,
    `${JSON.stringify({
      ...entry,
      timestamp: new Date().toISOString(),
      pid: process.pid,
      ppid: process.ppid,
    })}\n`,
    'utf8',
  );
}

function captureStack() {
  const stack = new Error().stack || '';
  return stack
    .split('\n')
    .slice(3, 11)
    .map((line) => line.trim());
}

function attachChildListeners(method, child, baseEntry) {
  if (!child || typeof child.on !== 'function') {
    return;
  }

  child.on('spawn', () => {
    log({
      event: 'child-spawned',
      method,
      childPid: child.pid,
      ...baseEntry,
    });
  });

  child.on('error', (error) => {
    log({
      event: 'child-error',
      method,
      childPid: child.pid,
      error: serializeError(error),
      ...baseEntry,
    });
  });

  child.on('close', (code, signal) => {
    log({
      event: 'child-close',
      method,
      childPid: child.pid,
      code,
      signal,
      ...baseEntry,
    });
  });
}

function wrapMethod(methodName, normalizeCall) {
  const original = childProcess[methodName];

  childProcess[methodName] = function wrappedMethod(...args) {
    const normalized = normalizeCall(args);
    const baseEntry = {
      command: normalized.command,
      args: normalized.args,
      options: serializeOptions(normalized.options),
      stack: captureStack(),
    };

    log({
      event: 'invoke',
      method: methodName,
      ...baseEntry,
    });

    try {
      const child = original.apply(this, args);
      attachChildListeners(methodName, child, baseEntry);
      return child;
    } catch (error) {
      log({
        event: 'throw',
        method: methodName,
        error: serializeError(error),
        ...baseEntry,
      });
      throw error;
    }
  };
}

wrapMethod('spawn', ([command, args, options]) => ({
  command,
  args: Array.isArray(args) ? args : [],
  options: Array.isArray(args) ? options : args,
}));

wrapMethod('execFile', ([file, args, options]) => ({
  command: file,
  args: Array.isArray(args) ? args : [],
  options: Array.isArray(args) ? options : args,
}));

wrapMethod('fork', ([modulePath, args, options]) => ({
  command: modulePath,
  args: Array.isArray(args) ? args : [],
  options: Array.isArray(args) ? options : args,
}));

log({
  event: 'trace-ready',
  argv: process.argv,
  cwd: process.cwd(),
});
