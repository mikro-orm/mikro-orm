---
title: Usage with SQL drivers
---

MikroORM supports several SQL databases out of the box. Install the driver package for your database:

```bash npm2yarn
# for postgresql (works with cockroachdb too)
npm install @mikro-orm/postgresql

# for mysql (works with mariadb too)
npm install @mikro-orm/mysql

# for mariadb (works with mysql too)
npm install @mikro-orm/mariadb

# for sqlite
npm install @mikro-orm/sqlite

# for libsql/turso
npm install @mikro-orm/libsql

# for mssql
npm install @mikro-orm/mssql
```

> The driver package has `@mikro-orm/core` as a peer dependency, which most package managers install automatically. If you plan to use additional packages like `@mikro-orm/cli`, `@mikro-orm/migrations`, or `@mikro-orm/seeder`, install `@mikro-orm/core` explicitly to ensure all packages share the same instance:
>
> ```bash npm2yarn
> npm install @mikro-orm/core @mikro-orm/postgresql @mikro-orm/migrations @mikro-orm/cli
> ```

## Getting started

Create a configuration file and call `MikroORM.init()` to bootstrap the ORM. Import from your driver package to get access to driver-specific features like `QueryBuilder`:

```ts
import { MikroORM } from '@mikro-orm/postgresql'; // or any other SQL driver package

const orm = await MikroORM.init({
  entities: [Author, Book],
  dbName: 'my-db-name',
});
```

You can also use the `defineConfig` helper for type-safe configuration:

```ts
import { defineConfig } from '@mikro-orm/postgresql';

export default defineConfig({
  entities: [Author, Book],
  dbName: 'my-db-name',
});
```

> To access driver-specific methods like `em.createQueryBuilder()`, import `MikroORM`, `EntityManager`, or `EntityRepository` from the driver package rather than `@mikro-orm/core`.

## Schema management

MikroORM provides several tools for managing your database schema:

- **[SchemaGenerator](./schema-generator.md)** — create, update, or drop your schema directly from entity metadata. Useful for prototyping and development.
- **[Migrations](./migrations.md)** — version-controlled schema changes for production workflows.
- **[EntityGenerator](./entity-generator.md)** — introspect an existing database and generate entity files from it.

## QueryBuilder

The `QueryBuilder` provides a fluent, type-safe API for constructing SQL queries. It is metadata-aware and can automatically handle joins, aliasing, and column mapping:

```ts
const qb = em.createQueryBuilder(Author);
qb.select('*')
  .where({ name: { $like: '%test%' } })
  .orderBy({ name: 'asc' })
  .limit(10);

const authors = await qb.getResultList();
```

You can also use it for update and delete operations:

```ts
const qb = em.createQueryBuilder(Author);
await qb.update({ name: 'updated' }).where({ id: 123 }).execute();

await em.createQueryBuilder(Author).delete().where({ id: 456 }).execute();
```

For more details, see the [QueryBuilder documentation](./query-builder.md).

## Transactions

All changes computed during `em.flush()` are executed [inside a database transaction](./unit-of-work.md) by default — you don't need to manage transactions manually for typical operations.

When you need explicit control, use `em.transactional()`:

```ts
await em.transactional(async em => {
  const author = new Author('God', 'hello@heaven.god');
  em.persist(author);
  // if an error occurs, all changes are rolled back
});
```

## ManyToMany relations with pivot tables

SQL drivers use pivot tables for `ManyToMany` relations. MikroORM manages these automatically — you only need to define the relation on your entities:

```ts
@ManyToMany(() => BookTag)
tags = new Collection<BookTag>(this);
```

To customize the pivot table name, use the `pivotTable` option:

```ts
@ManyToMany({ entity: () => BookTag, pivotTable: 'book2tag' })
tags = new Collection<BookTag>(this);
```

## Native queries

When you need to bypass the ORM and execute raw SQL:

```ts
// via QueryBuilder
const qb = em.createQueryBuilder(Author);
qb.select('*').where({ id: { $in: [1, 2, 3] } });
const res = await qb.execute();

// or raw SQL directly
const result = await em.execute('SELECT 1 + 1 as result');
```

For bulk operations that don't need change tracking, use the native methods:

```ts
// insert without creating an entity instance
await em.insert(Author, { name: 'test', email: 'test@example.com' });

// bulk update
await em.nativeUpdate(Author, { active: false }, { active: true });

// bulk delete
await em.nativeDelete(Author, { active: false });
```

These methods execute SQL directly and do not trigger lifecycle hooks.

## Using SQLite extensions

SQLite extensions like [sqlean](https://github.com/nalgeon/sqlean) can add features that are missing by default (e.g., regexp). Load them via `pool.afterCreate`:

```ts
const orm = await MikroORM.init({
  // ...
  pool: {
    afterCreate: (conn: any, done: any) => {
      conn.loadExtension('/path/to/sqlean');
      done(null, conn);
    },
  },
});
```

## Using Turso database

To connect to a remote [Turso](https://docs.turso.tech/introduction) database, use the `@mikro-orm/libsql` driver with the `password` option for the auth token:

```ts
import { defineConfig } from '@mikro-orm/libsql';

export default defineConfig({
  dbName: process.env.LIBSQL_URL,
  password: process.env.LIBSQL_AUTH_TOKEN,
});
```

For embedded replicas with sync, use the `driverOptions`:

```ts
import { defineConfig } from '@mikro-orm/libsql';

export default defineConfig({
  dbName: 'local.db',
  password: process.env.LIBSQL_AUTH_TOKEN,
  driverOptions: {
    syncUrl: process.env.LIBSQL_URL,
    syncPeriod: 0.5, // 500ms
  },
});
```

## Using Cloudflare D1 database

> **Experimental:** D1 support is experimental and has significant limitations. Use with caution.

[Cloudflare D1](https://developers.cloudflare.com/d1/) is a serverless SQLite database. Use MikroORM with D1 by passing a Kysely D1 dialect via `driverOptions`:

```ts
import { MikroORM } from '@mikro-orm/sqlite';
import { D1Dialect } from 'kysely-d1';

export default {
  async fetch(request: Request, env: Env) {
    const orm = await MikroORM.init({
      entities: [...],
      // the `dbName` is not used when a dialect is provided, but it's still required
      dbName: 'd1',
      driverOptions: new D1Dialect({ database: env.DB }),
      // required: D1 does not support explicit transactions
      implicitTransactions: false,
    });

    // ...
  },
};
```

You can also pass a factory function if you need to create the dialect lazily:

```ts
MikroORM.init({
  entities: [...],
  dbName: 'd1',
  driverOptions: () => new D1Dialect({ database: env.DB }),
  implicitTransactions: false,
});
```

### D1 Limitations

D1 has significant limitations compared to regular SQLite:

- **No transaction support:** D1 does not support explicit transaction statements (`BEGIN TRANSACTION`). You must set `implicitTransactions: false` for `em.flush()` to work. This means changes are not applied atomically — if an error occurs mid-flush, some changes may be persisted while others are not.
- **`em.transactional()` will not work:** Since there's no transaction support, wrapping code in `em.transactional()` provides no atomicity guarantees.
- **No query streaming:** Large result sets cannot be streamed and must be fetched entirely into memory.
- **Limited `ALTER TABLE`:** No support for `ALTER COLUMN` or `ADD CONSTRAINT`, which affects schema migrations.

See the [D1 SQL documentation](https://developers.cloudflare.com/d1/sql-api/sql-statements/) for more details on supported SQL statements.

## MS SQL Server limitations

- UUID values are returned in upper case
- Cycles in cascade paths are not supported
- Schema diffing capabilities are limited
- No native support for fulltext search
- Upsert support is limited

## Custom driver

If you need to support a database that is not included, you can implement your own driver. See the [custom driver documentation](./custom-driver.md) for details.

```ts
import { MyCustomDriver } from './MyCustomDriver.ts';

const orm = await MikroORM.init({
  entities: [Author, Book],
  dbName: 'my-db-name',
  driver: MyCustomDriver,
});
```
