const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');
const Module = require('node:module');

const traceFile = process.env.SOCRA_CHILD_TRACE_FILE || '';
const sanitizeExportConfig = process.env.SOCRA_SANITIZE_EXPORT_CONFIG === '1';
const retryUnlink = process.env.SOCRA_RETRY_UNLINK === '1';
const retryUnlinkAttempts = Number.parseInt(process.env.SOCRA_RETRY_UNLINK_ATTEMPTS || '6', 10);
const retryUnlinkDelayMs = Number.parseInt(process.env.SOCRA_RETRY_UNLINK_DELAY_MS || '250', 10);
const traceTargetFiles = process.env.SOCRA_TRACE_TARGET_FILES === '1';
const distDirOverride = process.env.SOCRA_NEXT_DIST_DIR || '';
const webpackBuildWorkerOverride = parseBooleanOverride(process.env.SOCRA_NEXT_WEBPACK_BUILD_WORKER);
const workerThreadsOverride = parseBooleanOverride(process.env.SOCRA_NEXT_WORKER_THREADS);

function parseBooleanOverride(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const normalizedValue = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalizedValue)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalizedValue)) {
    return false;
  }

  return undefined;
}

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

function withOverriddenExport(target, key, value) {
  const wrapper = Object.create(target);
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  Object.defineProperty(wrapper, key, {
    value,
    enumerable: descriptor ? descriptor.enumerable : true,
    configurable: true,
    writable: true,
  });
  return wrapper;
}

function normalizeTargetPath(targetPath) {
  if (typeof targetPath === 'string') {
    return targetPath;
  }

  if (targetPath instanceof URL) {
    return targetPath.pathname;
  }

  return String(targetPath);
}

function matchesTargetFile(targetPath) {
  if (!targetPath) {
    return false;
  }

  const normalizedPath = normalizeTargetPath(targetPath).replace(/\//g, '\\').toLowerCase();
  return (
    normalizedPath.endsWith('\\export-detail.json') ||
    normalizedPath.endsWith('\\app-path-routes-manifest.json')
  );
}

function serializeDataSnippet(data, maxLength = 160) {
  if (typeof data === 'string') {
    return truncate(data, maxLength);
  }

  if (Buffer.isBuffer(data)) {
    return truncate(data.toString('utf8'), maxLength);
  }

  if (data instanceof Uint8Array) {
    return truncate(Buffer.from(data).toString('utf8'), maxLength);
  }

  return undefined;
}

function snapshotTargetFile(targetPath) {
  const normalizedTargetPath = normalizeTargetPath(targetPath);
  try {
    const stat = fs.statSync(normalizedTargetPath);
    return {
      exists: true,
      size: stat.size,
      mtimeMs: stat.mtimeMs,
      birthtimeMs: stat.birthtimeMs,
    };
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return { exists: false };
    }

    return {
      exists: false,
      statError: serializeError(error),
    };
  }
}

async function runRenameProbe(targetPath, attempt) {
  const normalizedTargetPath = normalizeTargetPath(targetPath);
  const probePath = `${normalizedTargetPath}.socra-rename-probe-${process.pid}-${attempt}`;

  try {
    await fs.promises.rename(normalizedTargetPath, probePath);
    await fs.promises.rename(probePath, normalizedTargetPath);
    log({
      event: 'unlink-rename-probe-success',
      targetPath: normalizedTargetPath,
      probePath,
      attempt,
      snapshot: snapshotTargetFile(normalizedTargetPath),
    });
  } catch (error) {
    log({
      event: 'unlink-rename-probe-error',
      targetPath: normalizedTargetPath,
      probePath,
      attempt,
      error: serializeError(error),
      snapshot: snapshotTargetFile(normalizedTargetPath),
      stack: captureStack(),
    });

    try {
      if (fs.existsSync(probePath) && !fs.existsSync(normalizedTargetPath)) {
        await fs.promises.rename(probePath, normalizedTargetPath);
      }
    } catch (restoreError) {
      log({
        event: 'unlink-rename-probe-restore-error',
        targetPath: normalizedTargetPath,
        probePath,
        attempt,
        error: serializeError(restoreError),
      });
    }
  }
}

function patchTargetFileTracing() {
  if (!traceTargetFiles) {
    return;
  }

  const originalWriteFile = fs.promises.writeFile.bind(fs.promises);
  const originalRename = fs.promises.rename.bind(fs.promises);

  fs.promises.writeFile = async function patchedWriteFile(targetPath, data, ...rest) {
    const normalizedTargetPath = normalizeTargetPath(targetPath);
    const isTarget = matchesTargetFile(normalizedTargetPath);

    if (isTarget) {
      log({
        event: 'target-write-start',
        targetPath: normalizedTargetPath,
        snapshot: snapshotTargetFile(normalizedTargetPath),
        dataPreview: serializeDataSnippet(data),
        stack: captureStack(),
      });
    }

    try {
      const result = await originalWriteFile(targetPath, data, ...rest);
      if (isTarget) {
        log({
          event: 'target-write-success',
          targetPath: normalizedTargetPath,
          snapshot: snapshotTargetFile(normalizedTargetPath),
        });
      }
      return result;
    } catch (error) {
      if (isTarget) {
        log({
          event: 'target-write-error',
          targetPath: normalizedTargetPath,
          error: serializeError(error),
          snapshot: snapshotTargetFile(normalizedTargetPath),
        });
      }
      throw error;
    }
  };

  fs.promises.rename = async function patchedRename(fromPath, toPath, ...rest) {
    const normalizedFromPath = normalizeTargetPath(fromPath);
    const normalizedToPath = normalizeTargetPath(toPath);
    const isTarget = matchesTargetFile(normalizedFromPath) || matchesTargetFile(normalizedToPath);

    if (isTarget) {
      log({
        event: 'target-rename-start',
        fromPath: normalizedFromPath,
        toPath: normalizedToPath,
        fromSnapshot: snapshotTargetFile(normalizedFromPath),
        toSnapshot: snapshotTargetFile(normalizedToPath),
        stack: captureStack(),
      });
    }

    try {
      const result = await originalRename(fromPath, toPath, ...rest);
      if (isTarget) {
        log({
          event: 'target-rename-success',
          fromPath: normalizedFromPath,
          toPath: normalizedToPath,
          fromSnapshot: snapshotTargetFile(normalizedFromPath),
          toSnapshot: snapshotTargetFile(normalizedToPath),
        });
      }
      return result;
    } catch (error) {
      if (isTarget) {
        log({
          event: 'target-rename-error',
          fromPath: normalizedFromPath,
          toPath: normalizedToPath,
          error: serializeError(error),
          fromSnapshot: snapshotTargetFile(normalizedFromPath),
          toSnapshot: snapshotTargetFile(normalizedToPath),
        });
      }
      throw error;
    }
  };
}

function patchNextExportConfigSerialization() {
  if (!sanitizeExportConfig) {
    return;
  }

  const originalLoad = Module._load;
  let patched = false;

  Module._load = function patchedLoad(request, parent, isMain) {
    const loaded = originalLoad.apply(this, arguments);
    if (
      loaded &&
      typeof loaded === 'object' &&
      typeof loaded.Worker === 'function' &&
      (request === '../lib/worker' || request === '../../lib/worker' || request === 'next/dist/lib/worker')
    ) {
      const OriginalWorker = loaded.Worker;
      class SanitizedWorker extends OriginalWorker {
        constructor(...args) {
          super(...args);
          const [, options] = args;
          if (!options?.exposedMethods?.includes('exportPages') || typeof this.exportPages !== 'function') {
            return;
          }

          const originalExportPages = this.exportPages.bind(this);
          this.exportPages = (input) => {
            const functionPaths = [];
            if (input?.nextConfig && typeof input.nextConfig === 'object') {
              const nextConfigEntries = [];
              for (const [key, value] of Object.entries(input.nextConfig)) {
                if (typeof value === 'function') {
                  functionPaths.push(`nextConfig.${key}`);
                  continue;
                }
                nextConfigEntries.push([key, value]);
              }

              if (functionPaths.length > 0) {
                const nextConfig = Object.fromEntries(nextConfigEntries);
                log({
                  event: 'sanitize-export-pages-input',
                  functionPaths,
                  remainingFunctionPaths: Object.entries(nextConfig)
                    .filter(([, value]) => typeof value === 'function')
                    .map(([key]) => `nextConfig.${key}`),
                });
                input = {
                  ...input,
                  nextConfig,
                };
              }
            }

            return originalExportPages(input);
          };
        }
      }

      return withOverriddenExport(loaded, 'Worker', SanitizedWorker);
    }

    if (patched) {
      return loaded;
    }

    if (request !== '../export' && request !== 'next/dist/export' && request !== './export') {
      return loaded;
    }

    if (!loaded || typeof loaded.default !== 'function') {
      return loaded;
    }

    const originalExport = loaded.default;
    const wrappedExport = async function wrappedExport(dir, options, nextBuildSpan) {
      const functionPaths = [];
      const seen = new WeakSet();

      function walk(value, currentPath) {
        if (!value || typeof value !== 'object' || seen.has(value)) {
          return;
        }

        seen.add(value);
        for (const [key, child] of Object.entries(value)) {
          const nextPath = currentPath ? `${currentPath}.${key}` : key;
          if (typeof child === 'function') {
            functionPaths.push(nextPath);
            continue;
          }

          walk(child, nextPath);
        }
      }

      walk(options, 'options');
      log({
        event: 'export-options-function-paths',
        functionPaths,
      });

      if (options?.nextConfig && typeof options.nextConfig === 'object') {
        const removed = [];
        const nextConfig = Object.fromEntries(
          Object.entries(options.nextConfig).filter(([key, value]) => {
            if (typeof value === 'function') {
              removed.push(`nextConfig.${key}`);
              return false;
            }

            return true;
          }),
        );

        if (removed.length === 0) {
          return originalExport.call(this, dir, options, nextBuildSpan);
        }

        options = {
          ...options,
          nextConfig,
        };
        log({
          event: 'sanitize-export-config',
          removed,
        });
      }

      return originalExport.call(this, dir, options, nextBuildSpan);
    };
    patched = true;
    log({
      event: 'patch-export-module',
      request,
    });

    return withOverriddenExport(loaded, 'default', wrappedExport);
  };
}

function isNextConfigRequest(request) {
  return request === '../server/config' || request === 'next/dist/server/config';
}

function patchNextConfigOverrides() {
  if (
    !distDirOverride &&
    webpackBuildWorkerOverride === undefined &&
    workerThreadsOverride === undefined
  ) {
    return;
  }

  const originalLoad = Module._load;

  Module._load = function patchedLoad(request, parent, isMain) {
    const loaded = originalLoad.apply(this, arguments);
    if (!isNextConfigRequest(request)) {
      return loaded;
    }

    const wrapLoadConfig = (loadConfig) => {
      if (typeof loadConfig !== 'function' || loadConfig.__socraConfigPatched) {
        return loadConfig;
      }

      const wrappedLoadConfig = async function wrappedLoadConfig(...args) {
        const config = await loadConfig.apply(this, args);
        if (!config || typeof config !== 'object') {
          return config;
        }

        const nextConfig = {
          ...config,
        };
        const changed = {};

        if (distDirOverride) {
          nextConfig.distDir = distDirOverride;
          changed.distDir = distDirOverride;
        }

        if (webpackBuildWorkerOverride !== undefined || workerThreadsOverride !== undefined) {
          nextConfig.experimental = {
            ...(config.experimental || {}),
          };
        }

        if (webpackBuildWorkerOverride !== undefined) {
          nextConfig.experimental.webpackBuildWorker = webpackBuildWorkerOverride;
          changed.webpackBuildWorker = webpackBuildWorkerOverride;
        }

        if (workerThreadsOverride !== undefined) {
          nextConfig.experimental.workerThreads = workerThreadsOverride;
          changed.workerThreads = workerThreadsOverride;
        }

        log({
          event: 'patch-next-config',
          changed,
        });

        return nextConfig;
      };

      wrappedLoadConfig.__socraConfigPatched = true;
      return wrappedLoadConfig;
    };

    if (typeof loaded === 'function') {
      return wrapLoadConfig(loaded);
    }

    if (loaded && typeof loaded === 'object' && typeof loaded.default === 'function') {
      return withOverriddenExport(loaded, 'default', wrapLoadConfig(loaded.default));
    }

    return loaded;
  };
}

function isRetriableUnlinkPath(targetPath) {
  return matchesTargetFile(targetPath);
}

function sleep(delayMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function patchFsUnlinkRetries() {
  if (!retryUnlink) {
    return;
  }

  const originalUnlink = fs.promises.unlink.bind(fs.promises);

  fs.promises.unlink = async function patchedUnlink(targetPath, ...rest) {
    const normalizedTargetPath = normalizeTargetPath(targetPath);

    for (let attempt = 1; attempt <= retryUnlinkAttempts; attempt += 1) {
      try {
        const result = await originalUnlink(targetPath, ...rest);
        if (attempt > 1) {
          log({
            event: 'unlink-retry-success',
            targetPath: normalizedTargetPath,
            attempt,
          });
        }
        return result;
      } catch (error) {
        const retryable = error?.code === 'EPERM' && isRetriableUnlinkPath(normalizedTargetPath);
        log({
          event: 'unlink-error',
          targetPath: normalizedTargetPath,
          attempt,
          retryable,
          error: serializeError(error),
          snapshot: snapshotTargetFile(normalizedTargetPath),
        });

        if (retryable && traceTargetFiles) {
          await runRenameProbe(normalizedTargetPath, attempt);
        }

        if (!retryable || attempt === retryUnlinkAttempts) {
          throw error;
        }

        await sleep(retryUnlinkDelayMs * attempt);
      }
    }
  };
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

patchNextConfigOverrides();
patchNextExportConfigSerialization();
patchTargetFileTracing();
patchFsUnlinkRetries();

log({
  event: 'trace-ready',
  argv: process.argv,
  cwd: process.cwd(),
});
