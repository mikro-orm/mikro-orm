/* eslint-disable no-console */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { MetadataStorage } from '@mikro-orm/core';

process.env.MIKRO_ORM_ALLOW_GLOBAL_CONTEXT = '1';
process.env.MIKRO_ORM_ALLOW_GLOBAL_CLI = '1';
process.env.MIKRO_ORM_CLI_TS_CONFIG_PATH = './tests/tsconfig.dummy.json';

vi.resetModules();
vi.restoreAllMocks();
MetadataStorage.clear();
// Clear stale dynamicImportProvider so fs.dynamicImport uses a fresh import()
// from the current module evaluation context after vi.resetModules().
delete (globalThis as any).dynamicImportProvider;

const cwd = process.cwd();

// Machine-wide per-file lock, as fixed DB names on shared servers would clash when two checkouts run the same file.
const LOCK_DIR = path.join(os.tmpdir(), 'mikro-orm-test-locks');
const LOCK_TTL = 30 * 60 * 1000;
const LOCK_KEY = Symbol.for('mikro-orm-tests:file-lock');

function isStaleLock(lock: string): boolean {
  try {
    const pid = Number(fs.readFileSync(lock, 'utf8'));

    if (Date.now() - fs.statSync(lock).mtimeMs > LOCK_TTL) {
      return true;
    }

    // signal 0 only probes, it throws ESRCH when the owning worker is gone
    return pid > 0 && !process.kill(pid, 0);
  } catch (e: any) {
    return e.code === 'ESRCH';
  }
}

function unlockTestFile(): void {
  const lock: string | undefined = (globalThis as any)[LOCK_KEY];

  if (lock) {
    delete (globalThis as any)[LOCK_KEY];
    fs.rmSync(lock, { force: true });
  }
}

function lockTestFile(testPath: string): void {
  // a file that died before its `afterAll` leaves the lock with this (still alive) worker
  unlockTestFile();
  fs.mkdirSync(LOCK_DIR, { recursive: true });
  const lock = path.join(LOCK_DIR, createHash('sha1').update(path.relative(cwd, testPath)).digest('hex'));
  const sleep = new Int32Array(new SharedArrayBuffer(4));

  for (;;) {
    try {
      fs.writeFileSync(lock, `${process.pid}`, { flag: 'wx' });
      (globalThis as any)[LOCK_KEY] = lock;
      return;
    } catch (e: any) {
      if (e.code !== 'EEXIST') {
        throw e;
      }
    }

    if (isStaleLock(lock)) {
      fs.rmSync(lock, { force: true });
    } else {
      // blocking wait on purpose, timers may still be faked by the previous file in this worker
      Atomics.wait(sleep, 0, 0, 50);
    }
  }
}

const testPath = expect.getState().testPath;

if (testPath) {
  lockTestFile(testPath);
  afterAll(unlockTestFile);
}

function getCallSite(): string | null {
  const stack = new Error().stack;

  if (!stack) {
    return null;
  }

  const lines = stack.split('\n');

  // Find the first stack frame that's not in setup.ts
  for (let i = 1; i < lines.length; i++) {
    const callerLine = lines[i];

    if (!callerLine || callerLine.includes('tests/setup.ts')) {
      continue;
    }

    const match = /\((.*):(\d+):(\d+)\)/.exec(callerLine) || /at (.*):(\d+):(\d+)/.exec(callerLine);

    if (!match) {
      continue;
    }

    // eslint-disable-next-line prefer-const
    let [, file, line, col] = match;

    if (file.startsWith('file://')) {
      file = fileURLToPath(file);
    }

    if (file.startsWith('node:')) {
      continue;
    }

    const rel = path.relative(cwd, file);

    return `${rel}:${line}:${col}`;
  }

  return null;
}

// Vitest re-imports setup files for every test file (it invalidates them explicitly), while
// `isolate: false` keeps one `console` per worker — so without this guard every test file wraps the
// previous wrapper. Each `console.log` would then capture one stack trace and print one `at ...`
// line per test file the worker has already run.
const PATCHED = Symbol.for('mikro-orm-tests:console-patched');

if (!(console as any)[PATCHED]) {
  (console as any)[PATCHED] = true;

  for (const key of ['log', 'warn', 'error'] as const) {
    const original = console[key].bind(console);
    console[key] = (...args: unknown[]) => {
      const loc = getCallSite();

      if (loc) {
        // Prepend newline to first arg if it's a string (preserves format string substitution)
        if (typeof args[0] === 'string') {
          args[0] = '\n' + args[0];
        } else {
          args.unshift('\n');
        }
        original(...args, `\n\n  at ${loc}\n`);
      } else {
        original(...args);
      }
    };
  }
}
