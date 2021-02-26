---
title: Configuration
---

## Entity Discovery

You can either provide array of entity instances via `entities`, or let the ORM look up your 
entities in selected folders. 

```typescript
MikroORM.init({
  entities: [Author, Book, Publisher, BookTag],
});
```

We can also use folder based discovery by providing list of paths to the entities
we want to discover (globs are supported as well). This way we also need to specify
`entitiesTs`, where we point the paths to the TS source files instead of the JS 
compiled files (see more at [Metadata Providers](metadata-providers.md)).

> The `entitiesTs` option is used when running the app via `ts-node`, as the ORM 
> needs to discover the TS files. Always specify this option if you use folder/file
> based discovery. 

```typescript
MikroORM.init({
  entities: ['./dist/modules/users/entities', './dist/modules/projects/entities'],
  entitiesTs: ['./src/modules/users/entities', './src/modules/projects/entities'],
  // optionally you can override the base directory (defaults to `process.cwd()`)
  baseDir: process.cwd(),
});
```

> Be careful when overriding the `baseDir` with dynamic values like `__dirname`, 
> as you can end up with valid paths from `ts-node`, but invalid paths from `node`.
> Ideally you should keep the default of `process.cwd()` there to always have the 
> same base path regardless of how you run the app.

By default, `ReflectMetadataProvider` is used that leverages the `reflect-metadata`. 
You can also use `TsMorphMetadataProvider` by installing `@mikro-orm/reflection`. 
This provider will analyse your entity source files (or `.d.ts` type definition files). 
If you aim to use plain JavaScript instead of TypeScript, use `EntitySchema` or 
the `JavaScriptMetadataProvider`.

> You can also implement your own metadata provider and use it instead. To do so, extend the 
> `MetadataProvider` class.

```typescript
import { MikroORM } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

MikroORM.init({
  metadataProvider: TsMorphMetadataProvider,
});
```

There are also some additional options how you can adjust the discovery process:

```typescript
MikroORM.init({
  discovery: {
    warnWhenNoEntities: false, // by default, discovery throws when no entity is processed
    requireEntitiesArray: true, // force usage of class refrences in `entities` instead of paths
    alwaysAnalyseProperties: false, // do not analyse properties when not needed (with ts-morph)
  },
});
```

> If you disable `discovery.alwaysAnalyseProperties` option, you will need to explicitly 
> provide `nullable` and `wrappedReference` parameters (where applicable).

Read more about this in [Metadata Providers](metadata-providers.md) sections.

## Driver

To select driver, you can either use `type` option, or provide the driver class reference.

| type | driver name | dependency | note |
|------|-------------|------------|------|
| `mongo` | `MongoDriver` | `mongodb^3.3.4` | - |
| `mysql` | `MySqlDriver` | `mysql2^2.0.0` | compatible with MariaDB |
| `mariadb` | `MariaDbDriver` | `mariadb^2.0.0` | compatible with MySQL |
| `postgresql` | `PostgreSqlDriver` | `pg^7.0.0` | - |
| `sqlite` | `SqliteDriver` | `sqlite3^4.0.0` | - |

> Driver and connection implementations are not directly exported from `@mikro-orm/core` module. 
> You can import them from the driver packages (e.g. `import { PostgreSqlDriver } from '@mikro-orm/postgresql'`).

> You can pass additional options to the underlying driver (e.g. `mysql2`) via `driverOptions`. 
> The object will be deeply merged, overriding all internally used options.

```typescript
import { MySqlDriver } from '@mikro-orm/mysql';

MikroORM.init({
  driver: MySqlDriver,
  driverOptions: { connection: { timezone: '+02:00' } },
});
```

> From v3.5.1 you can also set the timezone directly in the ORM configuration:
>
> ```typescript
> MikroORM.init({
>   type: 'mysql',
>   timezone: '+02:00',
> });
> ```

## Connection

Each platform (driver) provides default connection string, you can override it as a whole
through `clientUrl`, or partially through one of following options:

```typescript
export interface ConnectionOptions {
  dbName?: string;
  name?: string; // for logging only (when replicas are used)
  clientUrl?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  charset?: string;
  multipleStatements?: boolean; // for mysql driver
  pool?: PoolConfig; // provided by `knex`
}
```

Following table shows default client connection strings:

| type | default connection url |
|------|------------------------|
| `mongo` | `mongodb://127.0.0.1:27017` |
| `mysql` | `mysql://root@127.0.0.1:3306` |
| `mariadb` | `mysql://root@127.0.0.1:3306` |
| `postgresql` | `postgresql://postgres@127.0.0.1:5432` |

To set up read replicas, you can use `replicas` option. You can provide only those parts of the 
`ConnectionOptions` interface, they will be used to override the `master` connection options.

```typescript
MikroORM.init({
  type: 'mysql',
  dbName: 'my_db_name',
  user: 'write-user',
  host: 'master.db.example.com',
  port: 3306,
  replicas: [
    { user: 'read-user-1', host: 'read-1.db.example.com', port: 3307 },
    { user: 'read-user-2', host: 'read-2.db.example.com', port: 3308 },
    { user: 'read-user-3', host: 'read-3.db.example.com', port: 3309 },
  ],
});
```

Read more about this in [Installation](installation.md) and [Read Connections](read-connections.md) sections.

## Naming Strategy

When mapping your entities to database tables and columns, their names will be defined by naming 
strategy. There are 3 basic naming strategies you can choose from:

- `UnderscoreNamingStrategy` - default of all SQL drivers
- `MongoNamingStrategy` - default of `MongoDriver`
- `EntityCaseNamingStrategy` - uses unchanged entity and property names

> You can also define your own custom `NamingStrategy` implementation.

```typescript
MikroORM.init({
  namingStrategy: EntityCaseNamingStrategy,
});
```

Read more about this in [Naming Strategy](naming-strategy.md) section.

## Auto-join of 1:1 owners

By default, owning side of 1:1 relation will be auto-joined when you select the inverse side 
so we can have the reference to it. You can disable this behaviour via `autoJoinOneToOneOwner` 
configuration toggle.

```typescript
MikroORM.init({
  autoJoinOneToOneOwner: false,
});
```

## Propagation of 1:1 and m:1 owners

MikroORM defines getter and setter for every owning side of m:1 and 1:1 relation. This is 
then used for propagation of changes to the inverse side of bi-directional relations.

```typescript
const author = new Author('n', 'e');
const book = new Book('t');
book.author = author;
console.log(author.books.contains(book)); // true
```

You can disable this behaviour via `propagateToOneOwner` option.

```typescript
MikroORM.init({
  propagateToOneOwner: false,
});
```

## Forcing UTC Timezone

Use `forceUtcTimezone` option to force the `Date`s to be saved in UTC in datetime columns 
without timezone. It works for MySQL (`datetime` type) and PostgreSQL (`timestamp` type). 
SQLite does this by default. 

```typescript
MikroORM.init({
  forceUtcTimezone: true,
});
```

## Mapping `null` values to `undefined`

By default `null` values from nullable database columns are hydrated as `null`. 
Using `forceUndefined` we can tell the ORM to convert those `null` values to
`undefined` instead. 

```typescript
MikroORM.init({
  forceUndefined: true,
});
```

## Custom Hydrator

Hydrator is responsible for assigning values from the database to entities. 
You can implement your custom `Hydrator` (by extending the abstract `Hydrator` class):

```typescript
MikroORM.init({
  hydrator: MyCustomHydrator,
});
```

## Custom Repository

You can also register custom base repository (for all entities where you do not specify 
`customRepository`) globally:

> You can still use entity specific repositories in combination with global base repository.

```typescript
MikroORM.init({
  entityRepository: CustomBaseRepository,
});
```

Read more about this in [Repositories](repositories.md) section.

## Strict Mode and property validation

> Since v4.0.3 the validation needs to be explicitly enabled via `validate: true`.
> It has performance implications and usually should not be needed, as long as
> you don't modify your entities via `Object.assign()`.

`MirkoORM` will validate your properties before actual persisting happens. It will try to fix wrong 
data types for you automatically. If automatic conversion fails, it will throw an error. You can 
enable strict mode to disable this feature and let ORM throw errors instead. Validation is triggered 
when persisting the entity. 

```typescript
MikroORM.init({
  validate: true,
  strict: true,
});
```

Read more about this in [Property Validation](property-validation.md) section.

## Debugging & Logging

You can enable logging with `debug` option. Either set it to `true` to log everything, or 
provide array of `'query' | 'query-params' | 'discovery' | 'info'` namespaces.

```typescript
MikroORM.init({
  logger: (message: string) => myLogger.info(message), // defaults to `console.log()`
  debug: true, // or provide array like `['query', 'query-params']`
  highlight: false, // defaults to true
  highlightTheme: { ... }, // you can also provide custom highlight there
});
```

Read more about this in [Debugging](debugging.md) section.

## Custom Fail Handler

When no entity is found during `em.findOneOrFail()` call, `new Error()` will be thrown. 
You can customize how the `Error` instance is created via `findOneOrFailHandler`:

```typescript
MikroORM.init({
  findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => {
    return new NotFoundException(`${entityName} not found!`);
  },
});
```

Read more about this in [Entity Manager](entity-manager.md#handling-not-found-entities) docs.

## Migrations

Under the `migrations` namespace, you can adjust how the integrated migrations support works.
Following example shows all possible options and their defaults:

```typescript
MikroORM.init({
  migrations: {
    tableName: 'mikro_orm_migrations', // migrations table name
    path: process.cwd() + '/migrations', // path to folder with migration files
    pattern: /^[\w-]+\d+\.ts$/, // how to match migration files
    transactional: true, // run each migration inside transaction
    disableForeignKeys: true, // try to disable foreign_key_checks (or equivalent)
    allOrNothing: true, // run all migrations in current batch in master transaction
    emit: 'ts', // migration generation mode
  },
});
```

Read more about this in [Migrations](migrations.md) section.

## Caching

By default, metadata discovery results are cached. You can either disable caching, or adjust 
how it works. Following example shows all possible options and their defaults:

```typescript
MikroORM.init({
  cache: {
    enabled: true,
    pretty: false, // allows to pretty print the JSON cache
    adapter: FileCacheAdapter, // you can provide your own implementation here, e.g. with redis
    options: { cacheDir: process.cwd() + '/temp' }, // options will be passed to the constructor of `adapter` class
  },
});
```

Read more about this in [Metadata Cache](metadata-cache.md) section.

## Importing database dump files (MySQL and PostgreSQL)

Using the `mikro-orm database:import db-file.sql` you can import a database dump file. This can be useful when kickstarting an application or could be used in tests to reset the database. Database dumps often have queries spread over multiple lines and therefore you need the following configuration.

```typescript
MikroORM.init({
  ...
  multipleStatements: true,
  ...
});
```
 > This should be disabled in production environments for added security.

## Using native private properties

If we want to use native private properties inside entities, the default approach of 
how MikroORM creates entity instances via `Object.create()` is not viable (more about this
in the [issue](https://github.com/mikro-orm/mikro-orm/issues/1226)). To force usage of entity
constructors, we can use `forceEntityConstructor` toggle:

```ts
MikroORM.init({
  ...
  forceEntityConstructor: true, // or specify just some entities via `[Author, 'Book', ...]` 
  ...
});
```

## Using environment variables

Since v4.5 it is possible to set most of the ORM options via environment variables.
By default `.env` file from the root directory is loaded - it is also possible to
set full path to the env file you want to use via `MIKRO_ORM_ENV` environment variable.

> Environment variables always have precedence.

Example `.env` file:

```dotenv
MIKRO_ORM_TYPE = sqlite
MIKRO_ORM_ENTITIES = ./dist/foo/*.entity.js, ./dist/bar/*.entity.js
MIKRO_ORM_ENTITIES_TS = ./src/foo/*.entity.ts, ./src/bar/*.entity.ts
MIKRO_ORM_DB_NAME = test.db
MIKRO_ORM_MIGRATIONS_PATH = ./dist/migrations
MIKRO_ORM_MIGRATIONS_PATTERN = ^[\w-]+\d+\.js$
MIKRO_ORM_POPULATE_AFTER_FLUSH = true
MIKRO_ORM_FORCE_ENTITY_CONSTRUCTOR = true
MIKRO_ORM_FORCE_UNDEFINED = true
```

Full list of supported options:

| env variable | config key |
|--------------|------------|
| `MIKRO_ORM_BASE_DIR` | `baseDir` |
| `MIKRO_ORM_TYPE` | `type` |
| `MIKRO_ORM_ENTITIES` | `entities` |
| `MIKRO_ORM_ENTITIES_TS` | `entitiesTs` |
| `MIKRO_ORM_CLIENT_URL` | `clientUrl` |
| `MIKRO_ORM_HOST` | `host` |
| `MIKRO_ORM_PORT` | `port` |
| `MIKRO_ORM_USER` | `user` |
| `MIKRO_ORM_PASSWORD` | `password` |
| `MIKRO_ORM_DB_NAME` | `dbName` |
| `MIKRO_ORM_LOAD_STRATEGY` | `loadStrategy` |
| `MIKRO_ORM_BATCH_SIZE` | `batchSize` |
| `MIKRO_ORM_USE_BATCH_INSERTS` | `useBatchInserts` |
| `MIKRO_ORM_USE_BATCH_UPDATES` | `useBatchUpdates` |
| `MIKRO_ORM_STRICT` | `strict` |
| `MIKRO_ORM_VALIDATE` | `validate` |
| `MIKRO_ORM_AUTO_JOIN_ONE_TO_ONE_OWNER` | `autoJoinOneToOneOwner` |
| `MIKRO_ORM_PROPAGATE_TO_ONE_OWNER` | `propagateToOneOwner` |
| `MIKRO_ORM_POPULATE_AFTER_FLUSH` | `populateAfterFlush` |
| `MIKRO_ORM_FORCE_ENTITY_CONSTRUCTOR` | `forceEntityConstructor` |
| `MIKRO_ORM_FORCE_UNDEFINED` | `forceUndefined` |
| `MIKRO_ORM_FORCE_UTC_TIMEZONE` | `forceUtcTimezone` |
| `MIKRO_ORM_TIMEZONE` | `timezone` |
| `MIKRO_ORM_ENSURE_INDEXES` | `ensureIndexes` |
| `MIKRO_ORM_IMPLICIT_TRANSACTIONS` | `implicitTransactions` |
| `MIKRO_ORM_DEBUG` | `debug` |
| `MIKRO_ORM_VERBOSE` | `verbose` |
| `MIKRO_ORM_DISCOVERY_WARN_WHEN_NO_ENTITIES` | `discovery.warnWhenNoEntities` |
| `MIKRO_ORM_DISCOVERY_REQUIRE_ENTITIES_ARRAY` | `discovery.requireEntitiesArray` |
| `MIKRO_ORM_DISCOVERY_ALWAYS_ANALYSE_PROPERTIES` | `discovery.alwaysAnalyseProperties` |
| `MIKRO_ORM_DISCOVERY_DISABLE_DYNAMIC_FILE_ACCESS` | `discovery.disableDynamicFileAccess` |
| `MIKRO_ORM_MIGRATIONS_TABLE_NAME` | `migrations.tableName` |
| `MIKRO_ORM_MIGRATIONS_PATH` | `migrations.path` |
| `MIKRO_ORM_MIGRATIONS_PATTERN` | `migrations.pattern` |
| `MIKRO_ORM_MIGRATIONS_TRANSACTIONAL` | `migrations.transactional` |
| `MIKRO_ORM_MIGRATIONS_DISABLE_FOREIGN_KEYS` | `migrations.disableForeignKeys` |
| `MIKRO_ORM_MIGRATIONS_ALL_OR_NOTHING` | `migrations.allOrNothing` |
| `MIKRO_ORM_MIGRATIONS_DROP_TABLES` | `migrations.dropTables` |
| `MIKRO_ORM_MIGRATIONS_SAFE` | `migrations.safe` |
| `MIKRO_ORM_MIGRATIONS_EMIT` | `migrations.emit` |
