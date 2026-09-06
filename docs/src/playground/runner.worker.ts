/// <reference lib="webworker" />
// must come first, see the module for why
import './runner-console';
// eslint-disable-next-line unicorn/prefer-node-protocol -- this is the `buffer` browser polyfill, not Node's builtin
import { Buffer } from 'buffer';
import * as core from '@mikro-orm/core';
import initSqlJs from 'sql.js';
import { transform } from 'sucrase';
import * as sqlJs from '@mikro-orm/sql-js';
import type { RunRequest, RunResponse } from './protocol';

// @mikro-orm/core touches the Node `Buffer` global only at runtime (e.g. clone/serialization paths), so assigning it after the imports is enough.
(globalThis as { Buffer?: typeof Buffer }).Buffer ??= Buffer;

const ctx = self as unknown as DedicatedWorkerGlobalScope;

// sql.js resolves its wasm relative to the worker bundle; webpack emits it as an asset.
const wasmUrl = new URL('sql.js/dist/sql-wasm.wasm', import.meta.url);
const sqlJsPromise = initSqlJs({ locateFile: () => wasmUrl.href });

type Options = Record<string, unknown>;

// the guide code calls `MikroORM.init(config)` verbatim, so the playground has to inject
// the WASM location behind its back - hand the driver the module we already loaded here
function withSqlJs(options: Options): Options {
  return { ...options, driverOptions: { ...(options.driverOptions as Options), sqlJs: () => sqlJsPromise } };
}

class PlaygroundMikroORM extends sqlJs.MikroORM {
  static override async init(options: Options): Promise<any> {
    return super.init(withSqlJs(options) as any);
  }

  constructor(options: Options) {
    super(withSqlJs(options) as any);
  }
}

const sqlite: Record<string, unknown> = {
  ...sqlJs,
  MikroORM: PlaygroundMikroORM,
  defineConfig: (options: Options) => sqlJs.defineConfig(withSqlJs(options) as any),
};

const externals: Record<string, unknown> = {
  '@mikro-orm/core': core,
  '@mikro-orm/sqlite': sqlite,
};

const AsyncFunction = Object.getPrototypeOf(async () => undefined).constructor as new (
  ...args: string[]
) => (...args: unknown[]) => Promise<unknown>;

function transpile(source: string, filePath: string): string {
  return transform(source, {
    transforms: ['typescript', 'imports'],
    filePath,
  }).code;
}

/** Resolves a relative import (with or without `.js`/`.ts`) against the project file map. */
function resolvePath(fromPath: string, spec: string, files: Record<string, string>): string {
  const base = fromPath.slice(0, fromPath.lastIndexOf('/') + 1);
  const segments = (base + spec).split('/');
  const stack: string[] = [];

  for (const segment of segments) {
    if (segment === '.' || segment === '') {
      continue;
    }
    if (segment === '..') {
      stack.pop();
      continue;
    }
    stack.push(segment);
  }

  const resolved = stack.join('/').replace(/\.(js|ts)$/, '');
  for (const candidate of [`${resolved}.ts`, `${resolved}.js`, resolved]) {
    if (candidate in files) {
      return candidate;
    }
  }

  throw new Error(`Cannot resolve module '${spec}' from '${fromPath}'.`);
}

async function runProject(files: Record<string, string>, entry: string): Promise<void> {
  const cache = new Map<string, unknown>();
  const compiled = new Map<string, string>();

  for (const [path, source] of Object.entries(files)) {
    compiled.set(path, transpile(source, path));
  }

  async function loadModule(path: string): Promise<unknown> {
    if (cache.has(path)) {
      return cache.get(path);
    }

    const module = { exports: {} as Record<string, unknown> };
    cache.set(path, module.exports);

    const require = (spec: string): unknown => {
      if (spec in externals) {
        return externals[spec];
      }
      const resolved = resolvePath(path, spec, files);
      // Non-entry project files have no top-level await, so their AsyncFunction
      // body runs to completion synchronously and exports are populated here.
      void loadModule(resolved);
      return cache.get(resolved);
    };

    const factory = new AsyncFunction('exports', 'require', 'module', compiled.get(path)!);
    await factory(module.exports, require, module);
    cache.set(path, module.exports);
    return module.exports;
  }

  await loadModule(entry);
}

function post(message: RunResponse): void {
  ctx.postMessage(message);
}

ctx.addEventListener('message', async (event: MessageEvent<RunRequest>) => {
  const { files, entry } = event.data;

  try {
    await runProject(files, entry);
    post({ type: 'done' });
  } catch (error) {
    post({ type: 'error', text: error instanceof Error ? (error.stack ?? error.message) : String(error) });
  }
});
