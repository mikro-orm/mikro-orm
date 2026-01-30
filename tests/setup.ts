/* eslint-disable no-console */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { MetadataStorage } from '@mikro-orm/core';

process.env.MIKRO_ORM_ALLOW_GLOBAL_CONTEXT = '1';
process.env.MIKRO_ORM_ALLOW_GLOBAL_CLI = '1';
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

  // Find the first stack frame that's not in setup.ts
  for (let i = 1; i < lines.length; i++) {
    const callerLine = lines[i];

    if (!callerLine || callerLine.includes('tests/setup.ts')) {
      continue;
    }

    const match = callerLine.match(/\((.*):(\d+):(\d+)\)/) || callerLine.match(/at (.*):(\d+):(\d+)/);

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
