export interface AsyncContext<T> {
  getStore(): T | undefined;
  run<R>(store: T, callback: () => R): R;
  enterWith(store: T): void;
}

function getNodeAsyncContext<T>(): AsyncContext<T> {
  const mod = globalThis.process?.getBuiltinModule?.('node:async_hooks');

  /* v8 ignore next */
  if (!mod?.AsyncLocalStorage) {
    throw new Error('AsyncLocalStorage not available');
  }

  return new mod.AsyncLocalStorage<T>();
}

/* v8 ignore next */
function createFallbackAsyncContext<T>(): AsyncContext<T> {
  let store: T | undefined;
  // eslint-disable-next-line no-console
  console.warn('AsyncLocalStorage not available');

  return {
    getStore: () => store,
    enterWith: value => (store = value),
    run: (value, cb) => {
      const prev = store;
      store = value;
      try {
        return cb();
      } finally {
        store = prev;
      }
    },
  };
}

export function createAsyncContext<T>(): AsyncContext<T> {
  /* v8 ignore next */
  const ALS = (globalThis as any).AsyncLocalStorage;

  /* v8 ignore next */
  if (typeof ALS === 'function' && ALS.prototype?.run) {
    return new ALS();
  }

  /* v8 ignore else */
  if (globalThis.process?.versions?.node) {
    return getNodeAsyncContext<T>();
  }

  /* v8 ignore next */
  return createFallbackAsyncContext<T>();
}
