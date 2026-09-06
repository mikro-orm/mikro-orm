/// <reference lib="webworker" />
import type { RunResponse } from './protocol';

const ctx = self as unknown as DedicatedWorkerGlobalScope;

// eslint-disable-next-line no-control-regex
const ansiRegex = /\x1B\[\d+m/g;

function formatArg(arg: unknown): string {
  if (typeof arg === 'string') {
    return arg;
  }

  try {
    return (
      JSON.stringify(arg, (_key, value) => (typeof value === 'bigint' ? value.toString() : value), 2) ?? String(arg)
    );
  } catch {
    return String(arg);
  }
}

// this lives in its own module so it can be imported before the ORM: `Configuration.defaults.logger`
// binds `console.log` when `@mikro-orm/core` is evaluated, so a later patch would never see the queries
for (const level of ['log', 'info', 'warn', 'error', 'debug'] as const) {
  console[level] = (...args: unknown[]) => {
    // the ORM logger emits ANSI colors, which the plain-text output pane cannot render
    const text = args.map(formatArg).join(' ').replaceAll(ansiRegex, '');

    // Drop the dev server's own HMR/webpack chatter that the worker bundle emits, plus the
    // `node:async_hooks` warning the ORM repeats for every context lookup in the browser.
    if (
      text.startsWith('[HMR]') ||
      text.startsWith('[webpack-dev-server]') ||
      text === 'AsyncLocalStorage not available'
    ) {
      return;
    }

    const message: RunResponse = { type: 'console', level, text };
    ctx.postMessage(message);
  };
}
