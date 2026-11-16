---
title: Usage with YDB
sidebar_label: Usage with YDB (community)
---

[YDB](https://ydb.tech/) can be used through the community-maintained [`@rozenstein/mikro-orm-ydb`](https://github.com/rozenstein94/mikro-orm-ydb) driver. It implements the core `DatabaseDriver`, `Platform`, and `Connection` contracts using the official YDB JavaScript SDK and native YQL Table API. MikroORM continues to manage entities, the Unit of Work, and the Identity Map.

This integration has a smaller feature set than the SQL drivers. It does not extend `@mikro-orm/sql` or provide its QueryBuilder, Kysely integration, or SQL Migrator. It uses neither the YDB Document API nor DynamoDB compatibility. See [Creating a Custom Driver](./custom-driver.md) for the distinction between core and SQL driver contracts.

## Installation and versions

Driver version `0.1.0` targets **MikroORM 7.2.9** and Node.js 22.17 or newer. Install the built release archive; the driver is distributed separately from MikroORM:

```bash
npm install @mikro-orm/core@7.2.9 @ydbjs/auth@6.3.1 https://github.com/rozenstein94/mikro-orm-ydb/releases/download/v0.1.0/rozenstein-mikro-orm-ydb-0.1.0.tgz
```

MikroORM **6.6.14 requires a separate backport**. Its Knex-based SQL driver API differs from the Kysely-based v7 API. Installing this driver does not migrate an application's PostgreSQL queries, migrations, or database-specific services.

## Connection and entity definition

The endpoint and database path are separate settings:

- `clientUrl`: the `grpc://` or `grpcs://` endpoint, without credentials or a query string.
- `dbName`: the absolute database path from the YDB connection details.
- `driverOptions.driverConfig`: options for the official SDK, including its credentials provider.

For a local YDB instance, use `YDB_ENDPOINT=grpc://localhost:2136` and `YDB_DATABASE=/local`. For YDB Serverless, use the secure endpoint and database path supplied by the cloud console. Provision the database before connecting; the schema generator manages mapped tables, not cloud resources.

```ts
import { randomUUID } from 'node:crypto';
import { EntitySchema, MikroORM } from '@mikro-orm/core';
import { EnvironCredentialsProvider } from '@ydbjs/auth/environ';
import { YdbDriver } from '@rozenstein/mikro-orm-ydb';

class Note {
  id!: string;
  title!: string;
}

const NoteSchema = new EntitySchema({
  class: Note,
  tableName: 'note',
  properties: {
    id: { type: 'string', primary: true, autoincrement: false },
    title: { type: 'string' },
  },
});

const credentials = new EnvironCredentialsProvider();
const orm = await MikroORM.init({
  driver: YdbDriver,
  entities: [NoteSchema],
  clientUrl: process.env.YDB_ENDPOINT!,
  dbName: process.env.YDB_DATABASE!,
  driverOptions: {
    driverConfig: {
      credentialsProvider: credentials,
      secureOptions: credentials.secureOptions,
    },
  },
});

// Create tables once during development, outside the request handler.
await orm.schema.create();

const em = orm.em.fork();
const note = em.create(Note, { id: randomUUID(), title: 'First note' });
await em.persist(note).flush();
const loaded = await em.findOneOrFail(Note, note.id);
console.log(loaded === note); // true: the same Identity Map instance

await orm.close();
```

The SDK's environment provider selects metadata authentication with `YDB_METADATA_CREDENTIALS=1`, or an access token from `YDB_ACCESS_TOKEN_CREDENTIALS`. With no authentication variables, it uses anonymous credentials, suitable for the local test database. See the [SDK authentication documentation](https://github.com/ydb-platform/ydb-js-sdk/tree/main/packages/auth) for providers and credential refresh. Configure credentials in the deployment environment rather than in entity definitions or connection URLs.

## Serverless lifecycle and transactions

Initialize MikroORM once per warm process and reuse its connection and SDK clients. Create an `em.fork()` or [RequestContext](./identity-map.md#request-context) for each invocation so requests have separate Identity Maps. Close the ORM when the process shuts down; closing it after each invocation removes connection reuse. Database scale-to-zero and cloud cold-start behavior must be assessed in the target deployment separately from local tests.

Transactions use serializable isolation by default. `em.transactional()` commits on success and rolls back on failure; nested transactions and savepoints are rejected. The driver does not automatically replay a transaction callback: an aborted transaction must be retried at an application boundary with a new EntityManager and safe handling of external side effects. Standalone queries retry confirmed YDB `ABORTED` outcomes or replace rejected expired sessions; uncertain commits are not retried.

## Supported model and schema changes

The driver supports application-assigned scalar or composite primary keys, CRUD through EntityManager, scalar comparison and logical filters, ascending/descending ordering, and limit/offset pagination. Stored types cover text, signed 32-bit and 64-bit integers, double, boolean, timestamp, binary data, and JSON documents. Many-to-one references to single-column keys and inverse one-to-many collections use select-in loading. These mappings do not create foreign-key constraints; applications must maintain referential integrity.

The driver rejects unsupported features, including many-to-many and one-to-one relations, secondary/unique indexes, generated columns, SQL expressions, inheritance, pessimistic locking, cursor pagination, and EntityManager streaming. Consult the driver's [support matrix and examples](https://github.com/rozenstein94/mikro-orm-ydb#readme) before choosing entity mappings.

Its schema generator introspects mapped tables and can create missing tables or add nullable columns. Updates default to `safe: true`; `safe: false` also permits dropping nullable, non-key columns. Primary key, type, and nullability changes require an explicit migration. It does not discover or drop unrelated tables.

Generate and review a schema script before applying it:

```ts
const { up, down } = await orm.schema.getUpdateSchemaMigrationSQL();
// Store and review these scripts using your application's migration process.
await orm.schema.execute(up);
```

DDL statements commit independently. Down scripts restore definitions; they cannot recover data lost by dropping a column or table. The driver's schema API does not provide the SQL Migrator's migration history or locking. For reproducible local YDB startup and integration test commands, use the [driver repository](https://github.com/rozenstein94/mikro-orm-ydb#readme).
