---
title: Configuration
---

## Entity Discovery

You can either provide array of entity instances via `entities`, or let the ORM look up your entities in selected folders.

```ts
MikroORM.init({
  entities: [Author, Book, Publisher, BookTag],
});
```

We can also use folder based discovery by providing list of paths to the entities we want to discover (globs are supported as well). This way we also need to specify `entitiesTs`, where we point the paths to the TS source files instead of the JS compiled files (see more at [Metadata Providers](./metadata-providers.md)).

> The `entitiesTs` option is used when running the app via `ts-node`, as the ORM needs to discover the TS files. Always specify this option if you use folder/file based discovery.

```ts
MikroORM.init({
  entities: ['./dist/modules/users/entities', './dist/modules/projects/entities'],
  entitiesTs: ['./src/modules/users/entities', './src/modules/projects/entities'],
  // optionally you can override the base directory (defaults to `process.cwd()`)
  baseDir: process.cwd(),
});
```

> Be careful when overriding the `baseDir` with dynamic values like `__dirname`, as you can end up with valid paths from `ts-node`, but invalid paths from `node`. Ideally you should keep the default of `process.cwd()` there to always have the same base path regardless of how you run the app.

By default, `ReflectMetadataProvider` is used that leverages the `reflect-metadata`. You can also use `TsMorphMetadataProvider` by installing `@mikro-orm/reflection`. This provider will analyse your entity source files (or `.d.ts` type definition files). If you aim to use plain JavaScript instead of TypeScript, use `EntitySchema`.

> You can also implement your own metadata provider and use it instead. To do so, extend the `MetadataProvider` class.

```ts
import { MikroORM } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

MikroORM.init({
  metadataProvider: TsMorphMetadataProvider,
});
```

There are also some additional options how you can adjust the discovery process:

```ts
MikroORM.init({
  discovery: {
    warnWhenNoEntities: false, // by default, discovery throws when no entity is processed
    requireEntitiesArray: true, // force usage of class references in `entities` instead of paths
    alwaysAnalyseProperties: false, // do not analyse properties when not needed (with ts-morph)
  },
});
```

> If you disable `discovery.alwaysAnalyseProperties` option, you will need to explicitly provide `nullable` and `ref` parameters (where applicable).

Read more about this in [Metadata Providers](./metadata-providers.md) sections.

### Adjusting default type mapping

Since v5.2 we can alter how the ORM picks the default mapped type representation based on the inferred type of a property. One example is a mapping of `foo: string` to `varchar(255)`. If we wanted to change this default to a `text` type in postgres, we can use the `discover.getMappedType` callback:

```ts
import { MikroORM, Platform, Type } from '@mikro-orm/core';

const orm = await MikroORM.init({
  discovery: {
    getMappedType(type: string, platform: Platform) {
      // override the mapping for string properties only
      if (type === 'string') {
        return Type.getType(TextType);
      }

      return platform.getDefaultMappedType(type);
    },
  },
});
```

### `onMetadata` hook

Sometimes you might want to alter some behavior of the ORM on metadata level. You can use the `onMetadata` hook to modify the metadata. Let's say you want to use your entities with different drivers, and you want to use some driver specific feature. Using the `onMetadata` hook, you can modify the metadata dynamically to fit the drivers requirements.

The hook will be executed before the internal process of filling defaults, so you can think of it as modifying the property options in your entity definitions, they will be respected e.g. when inferring the column type.

> The hook can be async, but it will be awaited only if you use the async `MikroORM.init()` method, not with the `MikroORM.initSync()`.

```ts
import { EntityMetadata, MikroORM, Platform } from '@mikro-orm/sqlite';

const orm = await MikroORM.init({
  // ...
  discovery: {
    onMetadata(meta: EntityMetadata, platform: Platform) {
      // sqlite driver does not support schemas
      delete meta.schema;
    },
  },
});
```

Alternatively, you can also use the `afterDiscovered` hook, which is fired after the discovery process ends. You can access all the metadata there, and add or remove them as you wish.

```ts
import { EntityMetadata, MikroORM, Platform } from '@mikro-orm/sqlite';

const orm = await MikroORM.init({
  // ...
  discovery: {
    afterDiscovered(storage: MetadataStorage) {
      // ignore FooBar entity in schema generator
      storage.reset('FooBar');
    },
  },
});
```

## Extensions

Since v5.6, the ORM extensions like `SchemaGenerator`, `Migrator` or `EntityGenerator` can be registered via the `extensions` config option. This will be the only supported way to have the shortcuts like `orm.migrator` available in v6, so we no longer need to dynamically require those dependencies or specify them as optional peer dependencies (both of those things cause issues with various bundling tools like Webpack, or those used in Remix or Next.js).

```ts
import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { SeedManager } from '@mikro-orm/seeder';

export default defineConfig({
  dbName: 'test',
  extensions: [Migrator, EntityGenerator, SeedManager],
});
```

> The `SchemaGenerator` (as well as `MongoSchemaGenerator`) is registered automatically as it does not require any 3rd party dependencies to be installed.

Since v6.3, the extensions are again checked dynamically if not explicitly registered, so it should be enough to have the given package (e.g. `@mikro-orm/seeder`) installed as in v5.

## Driver

To select driver, you can either use `type` option, or provide the driver class reference.

| type         | driver name        | dependency       | note                        |
|--------------|--------------------|------------------|-----------------------------|
| `mongo`      | `MongoDriver`      | `mongodb`        | -                           |
| `mysql`      | `MySqlDriver`      | `mysql2`         | compatible with MariaDB     |
| `mariadb`    | `MariaDbDriver`    | `mariadb`        | compatible with MySQL       |
| `postgresql` | `PostgreSqlDriver` | `pg`             | compatible with CockroachDB |
| `mssql`      | `MsSqlDriver`      | `tedious`        | -                           |
| `sqlite`     | `SqliteDriver`     | `better-sqlite3` | -                           |
| `libsql`     | `LibSqlDriver`     | `libsql`         | -                           |

> Driver and connection implementations are not directly exported from `@mikro-orm/core` module. You can import them from the driver packages (e.g. `import { PostgreSqlDriver } from '@mikro-orm/postgresql'`).

> You can pass additional options to the underlying driver (e.g. `mysql2`) via `driverOptions`. The object will be deeply merged, overriding all internally used options.

```ts
import { MySqlDriver } from '@mikro-orm/mysql';

MikroORM.init({
  driver: MySqlDriver,
  driverOptions: { timezone: '+02:00' },
});
```

> From v3.5.1 you can also set the timezone directly in the ORM configuration:
>
> ```ts
> MikroORM.init({
>   timezone: '+02:00',
> });
> ```

## Connection

Each platform (driver) provides default connection string, you can override it as a whole through `clientUrl`, or partially through one of following options:

```ts
export interface ConnectionOptions {
  dbName?: string;
  name?: string; // for logging only (when replicas are used)
  clientUrl?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string | (() => string | Promise<string>);
  charset?: string;
  multipleStatements?: boolean; // for mysql driver
  pool?: PoolConfig;
}
```

Following table shows default client connection strings:

| type         | default connection url                 |
| ------------ | -------------------------------------- |
| `mongo`      | `mongodb://127.0.0.1:27017`            |
| `mysql`      | `mysql://root@127.0.0.1:3306`          |
| `mariadb`    | `mysql://root@127.0.0.1:3306`          |
| `postgresql` | `postgresql://postgres@127.0.0.1:5432` |

### Read Replicas

To set up read replicas, you can use `replicas` option. You can provide only those parts of the `ConnectionOptions` interface, they will be used to override the `master` connection options.

```ts
MikroORM.init({
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

Read more about this in [Installation](./quick-start.md) and [Read Connections](./read-connections.md) sections.

### Using short-lived tokens

Many cloud providers include alternative methods for connecting to database instances using short-lived authentication tokens. MikroORM supports dynamic passwords via a callback function, either synchronous or asynchronous. The callback function must resolve to a string.

```ts
MikroORM.init({
  dbName: 'my_db_name',
  password: async () => someCallToGetTheToken(),
});
```

The password callback value will be cached, to invalidate this cache we can specify `expirationChecker` callback:

```ts
MikroORM.init({
  dbName: 'my_db_name',
  password: async () => {
    const { token, tokenExpiration } = await someCallToGetTheToken();
    return { password: token, expirationChecker: () => tokenExpiration <= Date.now() }
  },
});
```

### `onQuery` hook and observability

Sometimes you might want to alter the generated queries. One use case for that might be adding contextual query hints to allow observability. Before a more native approach is added to the ORM, you can use the `onQuery` hook to modify all the queries by hand. The hook will be fired for every query before its execution.

```ts
import { AsyncLocalStorage } from 'node:async_hooks';

const ctx = new AsyncLocalStorage();

// provide the necessary data to the store in some middleware
app.use((req, res, next) => {
  const store = { endpoint: req.url };
  ctx.run(store, next);
});

MikroORM.init({
  onQuery: (sql: string, params: unknown[]) => {
    const store = ctx.getStore();

    if (!store) {
      return sql;
    }

    // your function that generates the necessary query hint
    const hint = createQueryHint(store);

    return sql + hint;
  },
});
```

## Naming Strategy

When mapping your entities to database tables and columns, their names will be defined by naming strategy. There are 3 basic naming strategies you can choose from:

- `UnderscoreNamingStrategy` - default of all SQL drivers
- `MongoNamingStrategy` - default of `MongoDriver`
- `EntityCaseNamingStrategy` - uses unchanged entity and property names

> You can also define your own custom `NamingStrategy` implementation.

```ts
MikroORM.init({
  namingStrategy: EntityCaseNamingStrategy,
});
```

Read more about this in [Naming Strategy](./naming-strategy.md) section.

## Auto-join of 1:1 owners

By default, owning side of 1:1 relation will be auto-joined when you select the inverse side so we can have the reference to it. You can disable this behaviour via `autoJoinOneToOneOwner` configuration toggle.

```ts
MikroORM.init({
  autoJoinOneToOneOwner: false,
});
```

## Auto-join of M:1 and 1:1 relations with filters

Since v6, filters are applied to the relations too, as part of `JOIN ON` condition. If a filter exists on a M:1 or 1:1 relation target, such an entity will be automatically joined, and when the foreign key is defined as `NOT NULL`, it will result in an `INNER JOIN` rather than `LEFT JOIN`. This is especially important for implementing soft deletes via filters, as the foreign key might point to a soft-deleted entity. When this happens, the automatic `INNER JOIN` will result in such a record not being returned at all. You can disable this behavior via `autoJoinRefsForFilters` ORM option.

```ts
MikroORM.init({
  autoJoinRefsForFilters: false,
});
```

## Forcing UTC Timezone

Use `forceUtcTimezone` option to force the `Date`s to be saved in UTC in datetime columns without timezone. It works for MySQL (`datetime` type) and PostgreSQL (`timestamp` type). SQLite does this by default.

```ts
MikroORM.init({
  forceUtcTimezone: true,
});
```

## Mapping `null` values to `undefined`

By default `null` values from nullable database columns are hydrated as `null`. Using `forceUndefined` we can tell the ORM to convert those `null` values to `undefined` instead.

```ts
MikroORM.init({
  forceUndefined: true,
});
```

## Ignoring `undefined` values in Find Queries

The ORM will treat explicitly defined `undefined` values in your `em.find()` queries as `null`s. If you want to ignore them instead, use `ignoreUndefinedInQuery` option:

```ts
MikroORM.init({
  ignoreUndefinedInQuery: true,
});

// resolves to `em.find(User, {})`
await em.find(User, { email: undefined, { profiles: { foo: undefined } } });
```

## Serialization of new entities

After flushing a new entity, all relations are marked as populated, just like if the entity was loaded from the db. This aligns the serialized output of `e.toJSON()` of a loaded entity and just-inserted one.

In v4 this behaviour was disabled by default, so even after the new entity was flushed, the serialized form contained only FKs for its relations. We can opt in to this old behaviour via `populateAfterFlush: false`.

```ts
MikroORM.init({
  populateAfterFlush: false,
});
```

## Population where condition

> This applies only to SELECT_IN strategy, as JOINED strategy implies the inference.

In v4, when we used populate hints in `em.find()` and similar methods, the query for our entity would be analysed and parts of it extracted and used for the population. Following example would find all authors that have books with given IDs, and populate their books collection, again using this PK condition, resulting in only such books being in those collections.

```ts
// this would end up with `Author.books` collections having only books of PK 1, 2, 3
const a = await em.find(Author, { books: [1, 2, 3] }, { populate: ['books'] });
```

Following this example, if we wanted to load all books, we would need a separate `em.populate()` call:

```ts
const a = await em.find(Author, { books: [1, 2, 3] });
await em.populate(a, ['books']);
```

This behaviour changed and is now configurable both globally and locally, via `populateWhere` option. Globally we can specify one of `PopulateHint.ALL` and `PopulateHint.INFER`, the former being the default in v5, the latter being the default behaviour in v4. Locally (via `FindOptions`) we can also specify custom where condition that will be passed to `em.populate()` call.

```ts
MikroORM.init({
  // defaults to PopulateHint.ALL in v5
  populateWhere: PopulateHint.INFER, // revert to v4 behaviour
});
```

## Custom Hydrator

Hydrator is responsible for assigning values from the database to entities. You can implement your custom `Hydrator` (by extending the abstract `Hydrator` class):

```ts
MikroORM.init({
  hydrator: MyCustomHydrator,
});
```

## Custom Repository

You can also register custom base repository (for all entities where you do not specify `repository` option) globally:

> You can still use entity specific repositories in combination with global base repository.

```ts
MikroORM.init({
  entityRepository: CustomBaseRepository,
});
```

Read more about this in [Repositories](./repositories.md) section.

## Strict Mode and property validation

> Since v4.0.3 the validation needs to be explicitly enabled via `validate: true`. It has performance implications and usually should not be needed, as long as you don't modify your entities via `Object.assign()`.

`MikroORM` will validate your properties before actual persisting happens. It will try to fix wrong data types for you automatically. If automatic conversion fails, it will throw an error. You can enable strict mode to disable this feature and let ORM throw errors instead. Validation is triggered when persisting the entity.

```ts
MikroORM.init({
  validate: true,
  strict: true,
});
```

Read more about this in [Property Validation](property-validation.md) section.

## Required properties validation

Since v5, new entities are validated on runtime (just before executing insert queries), based on the entity metadata. This means that mongo users now need to use `nullable: true` on their optional properties too).

This behaviour can be disabled globally via `validateRequired: false` in the ORM config.

```ts
MikroORM.init({
  validateRequired: false,
});
```

## Debugging & Logging

You can enable logging with `debug` option. Either set it to `true` to log everything, or provide array of `'query' | 'query-params' | 'discovery' | 'info'` namespaces.

```ts
MikroORM.init({
  logger: (message: string) => myLogger.info(message), // defaults to `console.log()`
  debug: true, // or provide array like `['query', 'query-params']`
  highlight: false, // defaults to true
  highlightTheme: { ... }, // you can also provide custom highlight there
});
```

Read more about this in [Debugging](./logging.md) section.

## Custom Fail Handler

When no entity is found during `em.findOneOrFail()` call, a `NotFoundError` will be thrown. You can customize how the `Error` instance is created via `findOneOrFailHandler` (or `findExactlyOneOrFailHandler` if [strict mode](#strict-mode-and-property-validation) is enabled):

```ts
MikroORM.init({
  findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => {
    return new NotFoundException(`${entityName} not found!`);
  },
});
```

Read more about this in [Entity Manager](./entity-manager.md#handling-not-found-entities) docs.

## Schema Generator

Following example shows all possible options and their defaults:

```ts
MikroORM.init({
  schemaGenerator: {
    disableForeignKeys: true, // try to disable foreign_key_checks (or equivalent)
    createForeignKeyConstraints: true, // do not generate FK constraints
  },
});
```

## Migrations

Under the `migrations` namespace, you can adjust how the integrated migrations support works. Following example shows all possible options and their defaults:

```ts
MikroORM.init({
  migrations: {
    tableName: 'mikro_orm_migrations', // migrations table name
    path: process.cwd() + '/migrations', // path to folder with migration files
    glob: '!(*.d).{js,ts}', // how to match migration files (all .js and .ts files, but not .d.ts)
    transactional: true, // run each migration inside transaction
    disableForeignKeys: true, // try to disable foreign_key_checks (or equivalent)
    allOrNothing: true, // run all migrations in current batch in master transaction
    emit: 'ts', // migration generation mode
  },
});
```

Read more about this in [Migrations](./migrations.md) section.

## Seeder

Following example shows all possible options and their defaults:

```ts
MikroORM.init({
  seeder: {
    path: './seeders',
    defaultSeeder: 'DatabaseSeeder',
  },
});
```

Read more about this in [seeding docs](seeding.md).

## Caching

By default, metadata discovery results are cached. You can either disable caching, or adjust how it works. Following example shows all possible options and their defaults:

```ts
MikroORM.init({
  metadataCache: {
    enabled: true,
    pretty: false, // allows to pretty print the JSON cache
    adapter: FileCacheAdapter, // you can provide your own implementation here, e.g. with redis
    options: { cacheDir: process.cwd() + '/temp' }, // options will be passed to the constructor of `adapter` class
  },
});
```

Read more about this in [Metadata Cache](./metadata-cache.md) section.

## Importing database dump files (MySQL and PostgreSQL)

Using the `mikro-orm database:import db-file.sql` you can import a database dump file. This can be useful when kickstarting an application or could be used in tests to reset the database. Database dumps often have queries spread over multiple lines, and therefore you need the following configuration.

```ts
MikroORM.init({
  ...
  multipleStatements: true,
  ...
});
```

> This should be disabled in production environments for added security.

## Using native private properties

If we want to use native private properties inside entities, the default approach of how MikroORM creates entity instances via `Object.create()` is not viable (more about this in the [issue](https://github.com/mikro-orm/mikro-orm/issues/1226)). To force usage of entity constructors, we can use `forceEntityConstructor` toggle:

```ts
MikroORM.init({
  forceEntityConstructor: true, // or specify just some entities via `[Author, 'Book', ...]`
});
```

## Persist created entities automatically

When you create new entity instance via `em.create()`, it will be automatically marked for future persistence (`em.persist()` will be called on it before its returned to you). In case you want to disable this behavior, you can set `persistOnCreate: false` globally or override this locally via `em.create(Type, data, { persist: false })`.

> This flag affects only `em.create()`, entities created manually via constructor still need an explicit `em.persist()` call, or they need to be part of the entity graph of some already managed entity.

```ts
MikroORM.init({
  persistOnCreate: false, // defaults to true since v5.5
});
```

## Using global Identity Map

In v5, it is no longer possible to use the global identity map. This was a common issue that led to weird bugs, as using the global EM without request context is almost always wrong, we always need to have a dedicated context for each request, so they do not interfere.

We still can disable this check via `allowGlobalContext` configuration, or a connected environment variable `MIKRO_ORM_ALLOW_GLOBAL_CONTEXT` - this can be handy especially in unit tests.

```ts
MikroORM.init({
  allowGlobalContext: true,
});
```

## Deprecation warnings

By default, doing something that is deprecated will result in a deprecation warning being logged. The default logger will in turn show it on the console.

You can ignore all or only specific deprecation warnings. See [Logging's section on deprecation warnings](./logging.md#deprecation-warnings) for details.

The full list of deprecation warnings:

| label | message                                                                                                                                                                                                                                                                            |
|-------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| D0001 | Path for config file was inferred from the command line arguments. Instead, you should set the `MIKRO_ORM_CLI_CONFIG` environment variable to specify the path, or if you really must use the command line arguments, import the config manually based on them, and pass it to init. |

## Using environment variables

Since v4.5 it is possible to set most of the ORM options via environment variables. By default `.env` file from the root directory is loaded - it is also possible to set full path to the env file you want to use via `MIKRO_ORM_ENV` environment variable.

> Only env vars with `MIKRO_ORM_` prefix are be loaded this way, all the others will be ignored. If you want to access all your env vars defined in the `.env` file, call `dotenv.register()` yourself in your app (or possibly in your ORM config file).

> Environment variables always have precedence over the ORM config.

Example `.env` file:

```dotenv
MIKRO_ORM_TYPE = sqlite
MIKRO_ORM_ENTITIES = ./dist/foo/*.entity.js, ./dist/bar/*.entity.js
MIKRO_ORM_ENTITIES_TS = ./src/foo/*.entity.ts, ./src/bar/*.entity.ts
MIKRO_ORM_DB_NAME = test.db
MIKRO_ORM_MIGRATIONS_PATH = ./dist/migrations
MIKRO_ORM_MIGRATIONS_PATH_TS = ./src/migrations
MIKRO_ORM_POPULATE_AFTER_FLUSH = true
MIKRO_ORM_FORCE_ENTITY_CONSTRUCTOR = true
MIKRO_ORM_FORCE_UNDEFINED = true
```

Full list of supported options:

| env variable                                                | config key                               |
|-------------------------------------------------------------|------------------------------------------|
| `MIKRO_ORM_CONTEXT_NAME`                                    | `contextName`                            |
| `MIKRO_ORM_BASE_DIR`                                        | `baseDir`                                |
| `MIKRO_ORM_TYPE`                                            | `type`                                   |
| `MIKRO_ORM_ENTITIES`                                        | `entities`                               |
| `MIKRO_ORM_ENTITIES_TS`                                     | `entitiesTs`                             |
| `MIKRO_ORM_CLIENT_URL`                                      | `clientUrl`                              |
| `MIKRO_ORM_HOST`                                            | `host`                                   |
| `MIKRO_ORM_PORT`                                            | `port`                                   |
| `MIKRO_ORM_USER`                                            | `user`                                   |
| `MIKRO_ORM_PASSWORD`                                        | `password`                               |
| `MIKRO_ORM_DB_NAME`                                         | `dbName`                                 |
| `MIKRO_ORM_SCHEMA`                                          | `schema`                                 |
| `MIKRO_ORM_LOAD_STRATEGY`                                   | `loadStrategy`                           |
| `MIKRO_ORM_BATCH_SIZE`                                      | `batchSize`                              |
| `MIKRO_ORM_USE_BATCH_INSERTS`                               | `useBatchInserts`                        |
| `MIKRO_ORM_USE_BATCH_UPDATES`                               | `useBatchUpdates`                        |
| `MIKRO_ORM_STRICT`                                          | `strict`                                 |
| `MIKRO_ORM_VALIDATE`                                        | `validate`                               |
| `MIKRO_ORM_AUTO_JOIN_ONE_TO_ONE_OWNER`                      | `autoJoinOneToOneOwner`                  |
| `MIKRO_ORM_PROPAGATE_TO_ONE_OWNER`                          | `propagateToOneOwner`                    |
| `MIKRO_ORM_POPULATE_AFTER_FLUSH`                            | `populateAfterFlush`                     |
| `MIKRO_ORM_FORCE_ENTITY_CONSTRUCTOR`                        | `forceEntityConstructor`                 |
| `MIKRO_ORM_FORCE_UNDEFINED`                                 | `forceUndefined`                         |
| `MIKRO_ORM_FORCE_UTC_TIMEZONE`                              | `forceUtcTimezone`                       |
| `MIKRO_ORM_TIMEZONE`                                        | `timezone`                               |
| `MIKRO_ORM_ENSURE_INDEXES`                                  | `ensureIndexes`                          |
| `MIKRO_ORM_IMPLICIT_TRANSACTIONS`                           | `implicitTransactions`                   |
| `MIKRO_ORM_DEBUG`                                           | `debug`                                  |
| `MIKRO_ORM_COLORS`                                          | `colors`                                 |
| `MIKRO_ORM_DISCOVERY_WARN_WHEN_NO_ENTITIES`                 | `discovery.warnWhenNoEntities`           |
| `MIKRO_ORM_DISCOVERY_REQUIRE_ENTITIES_ARRAY`                | `discovery.requireEntitiesArray`         |
| `MIKRO_ORM_DISCOVERY_ALWAYS_ANALYSE_PROPERTIES`             | `discovery.alwaysAnalyseProperties`      |
| `MIKRO_ORM_DISCOVERY_DISABLE_DYNAMIC_FILE_ACCESS`           | `discovery.disableDynamicFileAccess`     |
| `MIKRO_ORM_MIGRATIONS_TABLE_NAME`                           | `migrations.tableName`                   |
| `MIKRO_ORM_MIGRATIONS_PATH`                                 | `migrations.path`                        |
| `MIKRO_ORM_MIGRATIONS_PATH_TS`                              | `migrations.pathTs`                      |
| `MIKRO_ORM_MIGRATIONS_GLOB`                                 | `migrations.glob`                        |
| `MIKRO_ORM_MIGRATIONS_TRANSACTIONAL`                        | `migrations.transactional`               |
| `MIKRO_ORM_MIGRATIONS_DISABLE_FOREIGN_KEYS`                 | `migrations.disableForeignKeys`          |
| `MIKRO_ORM_MIGRATIONS_ALL_OR_NOTHING`                       | `migrations.allOrNothing`                |
| `MIKRO_ORM_MIGRATIONS_DROP_TABLES`                          | `migrations.dropTables`                  |
| `MIKRO_ORM_MIGRATIONS_SAFE`                                 | `migrations.safe`                        |
| `MIKRO_ORM_MIGRATIONS_EMIT`                                 | `migrations.emit`                        |
| `MIKRO_ORM_SCHEMA_GENERATOR_DISABLE_FOREIGN_KEYS`           | `migrations.disableForeignKeys`          |
| `MIKRO_ORM_SCHEMA_GENERATOR_CREATE_FOREIGN_KEY_CONSTRAINTS` | `migrations.createForeignKeyConstraints` |
| `MIKRO_ORM_SEEDER_PATH`                                     | `seeder.path`                            |
| `MIKRO_ORM_SEEDER_PATH_TS`                                  | `seeder.pathTs`                          |
| `MIKRO_ORM_SEEDER_GLOB`                                     | `seeder.glob`                            |
| `MIKRO_ORM_SEEDER_EMIT`                                     | `seeder.emit`                            |
| `MIKRO_ORM_SEEDER_DEFAULT_SEEDER`                           | `seeder.defaultSeeder`                   |

Note that setting `MIKRO_ORM_CONTEXT_NAME` without also setting another configuration environment variable from the table above has a slightly different effect. When combined with other environment variables, the final configuration object is considered to have this `contextName`. Without other environment variables, it is a value of `contextName` to search within the config file. The final config object is picked based on this value.

For example, assume no `.env` file is present (or is present, but sets nothing from the table above) and you run:

```sh
$ MIKRO_ORM_CONTEXT_NAME=example1 \
  node ./dist/index.js
```

This will look for a config file in the standard paths, and will expect the config file to be able to provide a config with `contextName` set to "example1".

If you also set other environment variables, MikroORM will still search for a config file and try to a find a config with this `contextName`, but if it can't find one, it will create a config based on this `contextName` and the rest of the environment variables.

There are also env vars you can use to control the CLI settings (those you can set in your `package.json`):

| env variable                    | config key |
|---------------------------------|------------|
| `MIKRO_ORM_CLI_CONFIG`          | (CLI only) |
| `MIKRO_ORM_CLI_TS_CONFIG_PATH`  | (CLI only) |
| `MIKRO_ORM_CLI_ALWAYS_ALLOW_TS` | (CLI only) |
| `MIKRO_ORM_CLI_USE_TS_NODE`     | (CLI only) |
| `MIKRO_ORM_CLI_VERBOSE`         | (CLI only) |
