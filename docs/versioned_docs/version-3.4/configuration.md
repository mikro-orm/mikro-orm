---
title: Advanced Configuration
---

## Entity Discovery

You can either provide array of entity instances via `entities`, or let the ORM look up your 
entities in selected folders. 

```typescript
MikroORM.init({
  entities: [Author, Book, Publisher, BookTag],
});
```

When using `entitiesDirs`, you can optionally provide also set of directories with TS source files, 
that will be used to look up missing types (see more at [Metadata Providers](metadata-providers.md)).

> The `entitiesDirsTs` option is used only with the default `TsMorphMetadataProvider`. By default, all your 
> source files will be scanned, based on your `tsconfig.json`. 

```typescript
MikroORM.init({
  entitiesDirs: ['./dist/modules/users/entities', './dist/modules/projects/entities'],
  // optional, more specific paths will speed up the discovery
  entitiesDirsTs: ['./src/modules/users/entities', './src/modules/projects/entities'],
  // optionally you can override the base directory (defaults to `process.cwd()`)
  baseDir: process.cwd(),
});
```

By default, `TsMorphMetadataProvider` is used that analyses your entity source files. You can
use `ReflectMetadataProvider` if you do not want the source file analyses to happen. 
If you aim to use plain JavaScript instead of TypeScript, use the `JavaScriptMetadataProvider`.

> You can also implement your own metadata provider and use it instead. To do so, extend the 
> `MetadataProvider` class.

```typescript
MikroORM.init({
  metadataProvider: ReflectMetadataProvider,
});
```

There are also some additional options how you can adjust the discovery process:

```typescript
MikroORM.init({
  discovery: {
    warnWhenNoEntities: false, // by default, discovery throws when no entity is processed
    requireEntitiesArray: true, // force usage of `entities` instead of `entitiesDirs`
    alwaysAnalyseProperties: false, // do not analyse properties when not needed (with ts-morph)

    // you can explicitly specify the path to your tsconfig.json (used only when `entitiesDirsTs` is not provided)
    tsConfigPath: string,
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
| `mongo` | `MongoDriver` | `mongodb^3.3.4` | default driver |
| `mysql` | `MySqlDriver` | `mysql2^2.0.0` | compatible with MariaDB |
| `mariadb` | `MariaDbDriver` | `mariadb^2.0.0` | compatible with MySQL |
| `postgresql` | `PostgreSqlDriver` | `pg^7.0.0` | - |
| `sqlite` | `SqliteDriver` | `sqlite3^4.0.0` | - |

> Driver and connection implementations are not directly exported from `mikro-orm` module. 
> You can import them from `mikro-orm/dist/drivers`.

> You can pass additional options to the underlying driver (e.g. `mysql2`) via `driverOptions`. 
> The object will be deeply merged, overriding all internally used options.

```typescript
import { MySqlDriver } from 'mikro-orm/dist/drivers/MySqlDriver';

MikroORM.init({
  driver: MySqlDriver,
  driverOptions: { connection: { timezone: '+02:00' } },
});
```

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

## Auto-flush

Since MikroORM v3, default value for `autoFlush` is `false`. That means you need to call 
`em.flush()` yourself to persist changes into database. You can still change this via ORM's 
options to ease the transition but generally it is not recommended as it can cause unwanted 
small transactions being created around each `persist`. 

```typescript
MikroORM.init({
  autoFlush: true,
});

await orm.em.persist(new Entity()); // flushed
orm.em.persist(new Entity(), false); // you can still use second parameter to disable auto-flushing
```

Read more about this in [Entity Manager](entity-manager.md#auto-flushing) docs.

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

## Strict Mode

`MirkoORM` will validate your properties before actual persisting happens. It will try to fix wrong 
data types for you automatically. If automatic conversion fails, it will throw an error. You can 
enable strict mode to disable this feature and let ORM throw errors instead. Validation is triggered 
when persisting the entity. 

```typescript
MikroORM.init({
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
