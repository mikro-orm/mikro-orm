---
title: Usage with PGlite
sidebar_label: Usage with PGlite
---

MikroORM supports [PGlite](https://pglite.dev) — a WASM build of PostgreSQL that runs in Node.js, the browser, Bun and Deno without a separate database server. The `@mikro-orm/pglite` driver reuses the full `@mikro-orm/postgresql` SQL/schema/migrations stack via `@mikro-orm/sql`, so feature support matches the regular PostgreSQL driver.

## Installation

```bash npm2yarn
npm install @mikro-orm/core @mikro-orm/pglite
```

## Configuration

PGlite defaults to in-memory storage; pass a `dbName` only when you want to persist the database.

```ts
import { defineConfig } from '@mikro-orm/pglite';

export default defineConfig({
  entities: ['./dist/entities'],
  entitiesTs: ['./src/entities'],
});
```

### Storage backends

The `dbName` option selects the PGlite storage backend:

```ts
// in-memory (default)
await MikroORM.init({ entities: [...] });

// persisted to a Node.js directory
await MikroORM.init({ entities: [...], dbName: './my-db' });

// persisted to IndexedDB (browser)
await MikroORM.init({ entities: [...], dbName: 'idb://my-db' });
```

See the [PGlite documentation](https://pglite.dev/docs/about#how-it-works) for the full list of supported `dataDir` schemes.

### Driver options

Anything passed under `driverOptions` is forwarded to [`PGlite.create()`](https://pglite.dev/docs/api), so you can register extensions, custom type parsers, etc.

```ts
import { defineConfig } from '@mikro-orm/pglite';
import { vector } from '@electric-sql/pglite/vector';

export default defineConfig({
  entities: [...],
  dbName: './my-db',
  driverOptions: {
    extensions: { vector },
  },
});
```

### Reusing an existing PGlite instance

Pass an existing `PGlite` instance (or async factory) under `driverOptions.pglite` if you need to share it with non-ORM code, run multiple ORMs against the same database, or pre-load the WASM module yourself. MikroORM will not own the lifecycle — closing the ORM leaves your instance untouched, and the default type parsers are not applied (configure them on your own instance).

```ts
import { PGlite } from '@electric-sql/pglite';
import { MikroORM } from '@mikro-orm/pglite';

const pglite = await PGlite.create({ dataDir: './my-db' });

const orm = await MikroORM.init({
  entities: [...],
  driverOptions: { pglite },
});
```

## Schema, migrations, and queries

PGlite implements standard PostgreSQL features, so the [Schema Generator](./schema-generator.md), [Migrations](./migrations.md), [QueryBuilder](./query-builder.md), and [Kysely integration](./kysely.md) all work the same way as with `@mikro-orm/postgresql`.

## Limitations

- **Streaming is not supported** — PGlite does not expose cursor-based streaming. Use `@mikro-orm/postgresql` against a real PostgreSQL server if you need `em.findStream()` or `qb.stream()`.
