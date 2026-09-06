---
title: Usage with sql.js
sidebar_label: Usage with sql.js
---

MikroORM supports [sql.js](https://sql.js.org) — SQLite compiled to WebAssembly, running entirely in memory in the browser, Node.js, Bun and Deno without any native bindings. The `@mikro-orm/sql-js` driver reuses the same SQLite platform as `@mikro-orm/sqlite`, so feature support matches the regular SQLite driver.

## Installation

```bash npm2yarn
npm install @mikro-orm/core @mikro-orm/sql-js
```

## Configuration

The database always lives in memory, so `dbName` defaults to `:memory:` and you never need to pass it.

```ts
import { defineConfig } from '@mikro-orm/sql-js';

export default defineConfig({
  entities: ['./dist/entities'],
  entitiesTs: ['./src/entities'],
});
```

The data is lost when the connection is closed — `orm.close()` frees the WASM database, and reconnecting starts over from an empty one (or from `driverOptions.data`, if you passed an image), so the schema has to be created again. Use `driverOptions.data` (below) to persist and restore it yourself.

### Driver options

Anything passed under `driverOptions` other than `sqlJs` and `data` is forwarded to [`initSqlJs()`](https://sql.js.org/documentation/global.html#initSqlJs), which is how the WASM binary is located. In Node.js the file is found automatically. Bundlers need `locateFile` to point at the asset URL they emit for `sql.js/dist/sql-wasm.wasm` (the path is part of the package `exports`, and this is the setup sql.js itself documents):

```ts
import { defineConfig } from '@mikro-orm/sql-js';

// webpack/rspack: emits the wasm as an asset and resolves its URL
const wasmUrl = new URL('sql.js/dist/sql-wasm.wasm', import.meta.url);
// vite: import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

export default defineConfig({
  entities: [...],
  driverOptions: {
    locateFile: () => wasmUrl.href,
  },
});
```

Alternatively, pass the compiled binary directly via `wasmBinary`.

Note that sql.js initialises its WASM module only once per process and ignores the config of any later `initSqlJs()` call, so these options take effect for the first ORM instance created in a process. To control the module explicitly, initialise it yourself and pass it via `sqlJs` (below).

### Reusing a pre-initialised sql.js module

Pass the resolved `SqlJsStatic` (or a factory returning it) under `driverOptions.sqlJs` when your app already initialised sql.js — e.g. to share the WASM module with non-ORM code or to control when it is loaded.

```ts
import initSqlJs from 'sql.js';
import { MikroORM } from '@mikro-orm/sql-js';

const SQL = await initSqlJs({ locateFile: file => `/${file}` });

const orm = await MikroORM.init({
  entities: [...],
  driverOptions: { sqlJs: SQL },
});
```

### Opening an existing database image

`driverOptions.data` takes an existing SQLite file image (as `Uint8Array`, `Buffer` or any `ArrayLike<number>`) and opens it instead of an empty database. Together with `db.export()` this is how you persist data across sessions — to `localStorage`, IndexedDB, a file, or a server.

```ts
const orm = await MikroORM.init({
  entities: [...],
  driverOptions: { data: await loadSavedDatabase() },
});
```

### Accessing the sql.js database

[`getNativeClient()`](./configuration.md#accessing-the-native-client) returns the sql.js `Database` instance, which is how you export the current state:

```ts
const db = await orm.em.getConnection().getNativeClient();
const data = db.export(); // Uint8Array, the SQLite file image
```

Its lifecycle stays with the ORM — let `orm.close()` close it rather than calling `close()` on it directly.

## Schema, migrations, and queries

sql.js is a regular SQLite build, so the [Schema Generator](./schema-generator.md), [Migrations](./migrations.md), [QueryBuilder](./query-builder.md), [Kysely integration](./kysely.md) and [streaming](./streaming.md) all work the same way as with `@mikro-orm/sqlite`. [Stored routines](./stored-routines.md) with a `bodyJs` fallback are supported too — the JS implementation is registered as a user-defined function via sql.js' `create_function()`.

## Limitations

- **In-memory only** — there is no filesystem, so `dbName` has no effect and the data is gone once the connection closes. Persist it yourself via `db.export()` and `driverOptions.data`.
- **No attached databases** — the [`attachDatabases`](./multiple-schemas.md) option throws, as there are no database files to attach.
- **No FTS5** — the published sql.js build is compiled without the FTS5 module, so `$fulltext` queries require a custom build.
