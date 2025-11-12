/* eslint-disable no-console */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { MetadataStorage } from '@mikro-orm/core';

process.env.MIKRO_ORM_ALLOW_GLOBAL_CONTEXT = '1';
process.env.MIKRO_ORM_ALLOW_GLOBAL_CLI = '1';
process.env.MIKRO_ORM_ALLOW_VERSION_MISMATCH = '1';
process.env.MIKRO_ORM_CLI_TS_CONFIG_PATH = './tests/tsconfig.dummy.json';

vi.resetModules();
vi.restoreAllMocks();
MetadataStorage.clear();

const cwd = process.cwd();

function getCallSite(): string | null {
  const stack = new Error().stack;

  if (!stack) {
    return null;
  }

  const lines = stack.split('\n');
  const callerLine = lines[3];

  if (!callerLine) {
    return null;
  }

  const match = callerLine.match(/\((.*):(\d+):(\d+)\)/) || callerLine.match(/at (.*):(\d+):(\d+)/);

  if (!match) {
    return null;
  }

  // eslint-disable-next-line prefer-const
  let [, file, line, col] = match;

  if (file.startsWith('file://')) {
    file = fileURLToPath(file);
  }

  if (file.startsWith('node:')) {
    return null;
  }

  const rel = path.relative(cwd, file);

  return `${rel}:${line}:${col}`;
}

for (const key of ['log', 'warn', 'error'] as const) {
  const original = console[key].bind(console);
  console[key] = (...args: unknown[]) => {
    const loc = getCallSite();

    if (loc) {
      original(...args, `\n  at ${loc}`);
    } else {
      original(...args);
    }
  };
}
