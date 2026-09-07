---
title: Usage with Jest
---

When testing your own code that uses [Jest](https://jestjs.io/) for the tests, and MikroORM for the database, there are some things to consider.

## Using fake timers

Jest allows using [timer mocks](https://jestjs.io/docs/timer-mocks), which can be a very useful feature when testing your application's logic for time sensitive tasks. Making sure the data in your database is accurate based on time is also part of this testing.

One caveat to be aware of though is that one of the functions faked by Jest is [`process.nextTick()`](https://nodejs.org/docs/latest/api/process.html#processnexttickcallback-args), and this function is in turn used by some of MikroORM's dependencies.

If you know your code is not sensitive to the passage of the event loop's ticks (and is instead maybe only sensitive to the system's clock), you can safely set Jest to not fake this function by using:

```typescript
jest.useFakeTimers({ doNotFake: ['nextTick'] });
```

This way, you can still use the rest of Jest's timer mock API to control the system's clock, and any timers in use by your code or in MikroORM (most notably, result caches).

If you need better control in your test code in relation to the micro-task queue, keep reading the rest of this section.

### Known usages of `process.nextTick()` by dependencies

- All DB clients that use connection pool do so by an algorithm that lets them obtain the connection they requested at the next tick, or be queued up if no connection is free at the time of the request. Similarly, on release, if there's a request in the queue, it gets scheduled to get the released connection at the next tick, or else the connection is put back in the pool.
- The MongoDB client has no option of not using connection pool. Even if you set a pool of one connection, the client will still reach for that pool, thus needing `process.nextTick()`.
- The MySQL/MariaDB client, in addition to using `process.nextTick()` in pool and pool clusters, also uses it when finalizing results from queries. See [the source of mysql2](https://github.com/sidorares/node-mysql2/blob/1d983fa46031a77c689faea5f69e6e0baa1b3de7/lib/commands/query.js#L84-L92)
- The PostgreSQL client, in addition to using `process.nextTick()` in a connection pool, also uses it when handling errors with its non-native client. Any server errors (including f.e. wrong queries, read timeouts, etc.) or exceptions thrown from user supplied callbacks get (re)thrown in the next tick. If you are not using a connection pool, and are not using raw SQL queries, you should be able to safely use a faked `process.nextTick()` and handle uncaught exceptions only when you manually advance time.
- The SQLite client does not support connection pool, but it does have the concept of cached database instances (see [sqlite3 docs](https://github.com/TryGhost/node-sqlite3/wiki/Caching)), which hands off the cached database instance at the next tick. This feature is not used by MikroORM, which means it is always safe to use MikroORM with SQLite. However, if you get the SQLite3 client directly and try to use a cached instance, you will run into SQLite's only use of `process.nextTick()`.

### Allowing a real `process.nextTick()` only when required

If you do know that you do need a faked `process.nextTick()` because your code is sensitive to the micro-tasks queue, and yet you also have MikroORM in the mix with a connection pool or MySQL, you will need to mock the parts that require `process.nextTick()` so that they use the real function only during that critical operation, and restore back the mock after that critical operation.

So in the end, your application and MikroORM related code (pre-flush hooks, custom types' JS to DB conversion, etc.) can schedule what is needed to for the next tick, but not have those callbacks actually run. Those callbacks would only be executed (and may schedule new `process.nextTick()` callbacks that may or may not get executed) during the query, before the query results are in. After the query results are in, you would once again not have scheduled callbacks executing, until you manually advance time. Notably, this includes also callbacks scheduled during any MikroORM related code (post-flush hooks, custom types' DB to JS conversion, etc.). 

To accomplish this, you can use something like this snippet of code (tested to work with the version of Jest at the time of this writing):

```ts title='nextTickFixer.ts'
export function wrappedSpy<const T extends {}, const M extends jest.FunctionPropertyNames<Required<T>>>(
  object: T,
  method: T[M] extends jest.Func ? M : never,
  hooks: Readonly<{
    beforeOriginal?: (...args: jest.ArgsType<jest.FunctionProperties<Required<T>>[T[M] extends jest.Func ? M : never]>) => void,
    afterOriginal?: (result: ReturnType<T[M] extends jest.Func ? T[M] : never> extends Promise<infer R> ? R : ReturnType<T[M] extends jest.Func ? T[M] : never>) => void,
    errorOriginal?: (error?: unknown) => void,
  }>
) {
  const originalSpy = jest.spyOn(object, method);
  const mockImpl: Parameters<typeof originalSpy.mockImplementationOnce>[0] = (...args) => {
    hooks.beforeOriginal?.(...args);
    try {
      const result = (object[method] as Function).apply(originalSpy.mock.contexts.at(-1), args);
      if (result instanceof Promise) {
        result.then((v) => {
          hooks.afterOriginal?.(v);
          return v;
        }).catch((e) => {
          hooks.errorOriginal?.(e);
        }).finally(() => {
          originalSpy.mockImplementationOnce(mockImpl!);
        });
      } else {
        hooks.afterOriginal?.(result);
        originalSpy.mockImplementationOnce(mockImpl!);
      }
      return result;
    } catch (e) {
      hooks.errorOriginal?.(e);
      originalSpy.mockImplementationOnce(mockImpl!);
      throw e;
    }
  };
  originalSpy.mockImplementationOnce(mockImpl);
  return originalSpy;
}

const finallyHook = () => {
  jest.useFakeTimers({ doNotFake: [], now: jest.now() });
};

export const fakeTimersHooks = {
  beforeOriginal: () => {
    jest.useFakeTimers({ doNotFake: ['nextTick'], now: jest.now() });
  },
  afterOriginal: finallyHook,
  errorOriginal: finallyHook,
} as const satisfies Parameters<typeof wrappedSpy>[2];
```

#### With MySQL/MariaDB

If you're using MySQL or MariaDB, also add this to mock the individual methods that use `process.nextTick()`:

```ts title='fakeTimersFixer.ts'
import { resolve, dirname } from 'node:path';
import { fakeTimersHooks, wrappedSpy } from './nextTickFixer';

export function enableFakeTimersWithMikroOrm() {
  const mysqlDir = dirname(require.resolve('mysql2'));
  return {
    mocks: [
      wrappedSpy(require(resolve(mysqlDir, 'lib/commands/query.js')).prototype, 'done', executeHooks),
      wrappedSpy(require(resolve(mysqlDir, 'lib/commands/ping.js')).prototype, 'pingResponse', executeHooks),
      wrappedSpy(require(resolve(mysqlDir, 'lib/commands/register_slave.js')).prototype, 'registerResponse', executeHooks),
      wrappedSpy(require(resolve(mysqlDir, 'lib/pool.js')).prototype, 'getConnection', executeHooks),
      wrappedSpy(require(resolve(mysqlDir, 'lib/pool.js')).prototype, 'releaseConnection', executeHooks),
      wrappedSpy(require(resolve(mysqlDir, 'lib/pool_cluster.js')).prototype, 'end', executeHooks),
    ],
    mockRestore: function () {
      let mock: jest.SpyInstance | undefined;
      while (mock = this.mocks.pop()) {
        mock.mockRestore();
      }
    }
  };
}
```

#### With PostgreSQL

If you are using PostgreSQL, consider adding `pg-native` as a dependency, to enable error handling without extra mocks. Alternatively, inspect which errors your tests produce, where they get thrown from, and mock the appropriate methods from `pg/client.js`.

Regardless, if you are using connection pools, you will also need to add this:

```ts title='fakeTimersFixer.ts'
import Pool from 'pg-pool';
import { fakeTimersHooks, wrappedSpy } from './nextTickFixer';

export function enableFakeTimersWithMikroOrm() {
  return {
    mocks: [
      wrappedSpy(Pool.prototype, 'connect', executeHooks),
    ],
    mockRestore: function () {
      let mock: jest.SpyInstance | undefined;
      while (mock = this.mocks.pop()) {
        mock.mockRestore();
      }
    }
  };
}
```

#### With MongoDB

If you are using MongoDB, add this to mock all individual methods of the Mongo client that use `process.nextTick()`.

```ts title='fakeTimersFixer.ts'
import { Topology } from 'mongodb/lib/sdam/topology';
import { ConnectionPool } from 'mongodb/lib/cmap/connection_pool';
import { fakeTimersHooks, wrappedSpy } from './nextTickFixer';

function enableFakeTimersWithMikroOrm() {
  return {
    mocks: [
      wrappedSpy(ConnectionPool, 'constructor', fakeTimersHooks),
      wrappedSpy(ConnectionPool.prototype, 'checkIn', fakeTimersHooks),
      wrappedSpy(ConnectionPool.prototype, 'checkOut', fakeTimersHooks),
      wrappedSpy(ConnectionPool.prototype, 'clear', fakeTimersHooks),
      wrappedSpy(ConnectionPool.prototype, 'destroyConnection', fakeTimersHooks),
      wrappedSpy(ConnectionPool.prototype, 'ensureMinPoolSize', fakeTimersHooks),
      wrappedSpy(ConnectionPool.prototype, 'processWaitQueue', fakeTimersHooks),
      wrappedSpy(Topology.prototype, 'serverUpdateHandler', fakeTimersHooks),
      wrappedSpy(Topology.prototype, 'selectServer', fakeTimersHooks),
    ],
    mockRestore: function () {
      let mock: jest.SpyInstance | undefined;
      while (mock = this.mocks.pop()) {
        mock.mockRestore();
      }
    }
  };
}
```

#### Usage of fixed mocks

In your tests, call `enableFakeTimersWithMikroOrm` before you call any queries. You can call `mockRestore()` on the returned object to re-enable real timers use (or ensure that if queries are called, the test would freeze, rather than continue). e.g.

```ts title='example.test.ts'
import { initORM } from './db';// See "Project Setup"
import { enableFakeTimersWithMikroOrm } from './fakeTimersFixer'; // different based on your driver; see above

test(() => {
  const orm = initORM({
    //your test config
  });
  jest.useFakeTimers();
  const ormMock = enableFakeTimersWithMikroOrm();

  // write your tests normally

  ormMock.restoreMock();
  jest.useRealTimers();
});
```
