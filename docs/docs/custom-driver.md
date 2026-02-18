---
title: Creating Custom Driver
---

If you want to use a database that is not currently supported, you can implement your own driver. The driver architecture is split into several classes, each handling a different concern.

## Architecture Overview

MikroORM drivers are composed of 3 main classes:

- **Platform** — describes database features and capabilities
- **Connection** — handles the actual database communication
- **Driver** — orchestrates the connection and platform to persist changes

For SQL databases, all three have specialized base classes in the `@mikro-orm/sql` package that handle most of the work, so you only need to fill in the database-specific details.

```
@mikro-orm/core                    @mikro-orm/sql
┌──────────────────┐               ┌───────────────────────┐
│ Platform         │──extends──▸   │ AbstractSqlPlatform   │
│ Connection       │──extends──▸   │ AbstractSqlConnection │
│ DatabaseDriver   │──extends──▸   │ AbstractSqlDriver     │
└──────────────────┘               └───────────────────────┘
```

## Creating a SQL Driver

Most custom drivers will target an SQL database. In that case, extend the abstract classes from `@mikro-orm/sql`. The SQL layer uses [Kysely](https://kysely.dev/) under the hood, so your connection only needs to provide a Kysely dialect for the target database.

### Connection

The connection is responsible for establishing the database link and providing a Kysely dialect. Extend `AbstractSqlConnection` and implement the `createKyselyDialect()` method:

```ts
import { AbstractSqlConnection } from '@mikro-orm/sql';
import type { Dialect, Dictionary } from 'kysely';

export class MyConnection extends AbstractSqlConnection {

  createKyselyDialect(overrides: Dictionary): Dialect {
    // Return a Kysely dialect for your database.
    // `overrides` contains driver options from the MikroORM config.
    return new MyKyselyDialect({ ... });
  }

}
```

The base class handles connection lifecycle, transactions, savepoints, query execution, and streaming — all via Kysely.

### Platform

The platform describes your database's features. Extend `AbstractSqlPlatform` and override methods as needed:

```ts
import { AbstractSqlPlatform } from '@mikro-orm/sql';

export class MyPlatform extends AbstractSqlPlatform {

  // Override methods to describe your database's capabilities, e.g.:
  supportsTransactions(): boolean { return true; }
  usesReturningStatement(): boolean { return false; }
  getDefaultSchemaName(): string | undefined { return undefined; }

}
```

`AbstractSqlPlatform` extends the core `Platform` and provides sensible SQL defaults. Common methods you might override:

| Method | Purpose |
|---|---|
| `supportsTransactions()` | Does the database support transactions? |
| `usesReturningStatement()` | Support for `INSERT ... RETURNING`? |
| `supportsSchemas()` | Support for named schemas (e.g. PostgreSQL)? |
| `getDefaultSchemaName()` | Default schema name if schemas are supported |
| `quoteIdentifier(id)` | How to quote identifiers (default: `"id"`) |
| `quoteValue(value)` | How to quote literal values |
| `getCurrentTimestampSQL(length)` | SQL expression for current timestamp |
| `getSearchJsonPropertySQL(path, type, aliased)` | JSON property access syntax |
| `escape(value)` | Escape a literal value for SQL |

For schema generation support, you can also provide a custom `SchemaHelper` — see the existing drivers for reference (e.g. `PostgreSqlSchemaHelper`, `MySqlSchemaHelper`).

### Driver

The driver ties everything together. Extend `AbstractSqlDriver`, provide your connection class and platform, and specify the native dependencies your driver needs:

```ts
import { type Configuration, EntityManagerType } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/sql';
import { MyConnection } from './MyConnection.js';
import { MyPlatform } from './MyPlatform.js';

export class MyDriver extends AbstractSqlDriver<MyConnection> {

  constructor(config: Configuration) {
    super(config, new MyPlatform(), MyConnection, ['kysely', 'my-native-driver']);
  }

}
```

The last argument to `super()` is an array of npm package names that must be installed — MikroORM will check for them at startup and provide a helpful error message if any are missing.

`AbstractSqlDriver` handles all the heavy lifting: `find`, `findOne`, `nativeInsert`, `nativeUpdate`, `nativeDelete`, `count`, query building, joined loading strategy, and more.

### Using the custom driver

Provide the driver class to MikroORM via the `driver` config option:

```ts
const orm = await MikroORM.init({
  driver: MyDriver,
  dbName: 'my-database',
  entities: [Author, Book],
});
```

## Creating a Non-SQL Driver

For non-SQL databases (like document stores or key-value databases), extend the core classes from `@mikro-orm/core` directly. You will need to implement more methods yourself, since there is no SQL query builder to lean on.

### Connection

Extend `Connection` and implement the abstract methods:

```ts
import { Connection } from '@mikro-orm/core';

export class MyConnection extends Connection {

  async connect(): Promise<void> {
    // establish connection to the database
  }

  async isConnected(): Promise<boolean> {
    // return true if connected
  }

  async checkConnection(): Promise<{ ok: true } | { ok: false; reason: string; error?: Error }> {
    // verify the connection is alive
  }

  async close(force?: boolean): Promise<void> {
    // close the connection
  }

  // Add your own query methods specific to your database.

}
```

### Platform

Extend `Platform` and override methods to describe your database's capabilities:

```ts
import { Platform } from '@mikro-orm/core';

export class MyPlatform extends Platform {

  // Override feature flags as needed, e.g.:
  usesPivotTable(): boolean { return false; }
  supportsTransactions(): boolean { return false; }
  getNamingStrategy(): { new (): NamingStrategy } { return MyNamingStrategy; }
  normalizePrimaryKey<T = number | string>(data: IPrimaryKey): T { ... }
  denormalizePrimaryKey(data: IPrimaryKey): IPrimaryKey { ... }

}
```

### Driver

Extend `DatabaseDriver` and implement the abstract methods for CRUD operations:

```ts
import { DatabaseDriver, type Configuration, EntityManagerType } from '@mikro-orm/core';
import { MyConnection } from './MyConnection.js';
import { MyPlatform } from './MyPlatform.js';

export class MyDriver extends DatabaseDriver<MyConnection> {

  protected override readonly connection = new MyConnection(this.config);
  protected override readonly platform = new MyPlatform();

  constructor(config: Configuration) {
    super(config, ['my-native-driver']);
  }

  // Implement abstract CRUD methods:
  async find<T extends object>(/* ... */): Promise<EntityData<T>[]> { ... }
  async findOne<T extends object>(/* ... */): Promise<EntityData<T> | null> { ... }
  async nativeInsert<T extends object>(/* ... */): Promise<QueryResult<T>> { ... }
  async nativeInsertMany<T extends object>(/* ... */): Promise<QueryResult<T>> { ... }
  async nativeUpdate<T extends object>(/* ... */): Promise<QueryResult<T>> { ... }
  async nativeDelete<T extends object>(/* ... */): Promise<QueryResult<T>> { ... }
  async count<T extends object>(/* ... */): Promise<number> { ... }

}
```

See the [MongoDB driver source](https://github.com/mikro-orm/mikro-orm/tree/master/packages/mongodb/src) for a complete real-world example of a non-SQL driver.

## Custom SQLite driver

For SQLite-based databases, the `@mikro-orm/sql` package provides a generic `SqliteDriver` that works with any SQLite library via Kysely dialects. See the [SQLite guide](./usage-with-sqlite.md#custom-sqlite-dialect) for details.

## Reference Implementations

The best way to understand the full picture is to look at the existing driver packages:

- **PostgreSQL** (`@mikro-orm/postgresql`) — full-featured SQL driver with schema support, JSON operators, arrays, and more
- **MySQL** (`@mikro-orm/mysql`) — SQL driver with MySQL-specific platform features
- **SQLite** (`@mikro-orm/sqlite`) — minimal SQL driver, good starting point
- **MongoDB** (`@mikro-orm/mongodb`) — non-SQL driver extending `DatabaseDriver` directly

All driver packages live in the [`packages/`](https://github.com/mikro-orm/mikro-orm/tree/master/packages) directory of the MikroORM repository.
