---
title: Upgrading from v6 to v7
---

> Following sections describe (hopefully) all breaking changes, most of them might be not valid for you, like if you do not use custom `NamingStrategy` implementation, you do not care about the interface being changed.

## ECMAScript modules

MikroORM v7 is a native ESM package now. It can be still consumed from a CJS project, as long as you use TypeScript and Node.js version that supports `require(esm)`.

## Node 22.17+ required

Support for older node versions was dropped.

## TypeScript 5.8+ required

Support for older TypeScript versions was dropped. Older versions might work too, but only if your project is also ESM.

## Decorators moved to `@mikro-orm/decorators` package

The decorators are now available in the `@mikro-orm/decorators` package, so you need to install it explicitly:

```bash npm2yarn
npm install @mikro-orm/decorators
```

Moreover, there are now both legacy and ES spec decorator definitions available.

To use legacy decorators, import them from `@mikro-orm/decorators/legacy`:

```diff
- import { Entity, PrimaryKey, Property, MikroORM } from '@mikro-orm/sqlite';
+ import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
+ import { MikroORM } from '@mikro-orm/sqlite';
```

To use ES spec decorators, import them from `@mikro-orm/decorators/es`:

```ts
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';
```

## `ReflectMetadataProvider` no longer the default

The `ReflectMetadataProvider` has been moved to the `@mikro-orm/decorators/legacy` package, just like all the legacy decorators. It is no longer the default, you need to use it explicitly if you want to keep using legacy decorators with metadata reflection. You also need to install the reflect-metadata package for that.

```ts
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { defineConfig } from '@mikro-orm/sqlite';

export default defineConfig({
  metadataProvider: ReflectMetadataProvider,
  // ...
});
```

## `knex` replaced with `kysely` as query runner

- `@mikro-orm/knex` package is renamed to `@mikro-orm/sql`
- `@mikro-orm/knex-compat` package is introduced, with a `raw` helper version which supports knex queries
- `@mikro-orm/better-sqlite` driver is removed
- `@mikro-orm/sqlite` driver uses `better-sqlite3` internally
- `@mikro-orm/mariadb` driver uses `mysql2` internally (but still comes with MariaDB specific JSON and schema handling)
- `em.getKnex()` is replaced with `em.getKysely()`
- support for `qb.getKnexQuery()` is removed completely, the ORM now builds queries internally

## `persistAndFlush` and `removeAndFlush` methods removed

Use `em.persist(entity).flush()` and `em.remove(entity).flush()` instead.

## String references are no longer supported

Previously, it was possible to use string references in many places, e.g. when calling `em.find('User')`. This is no longer supported, use class reference, or EntitySchema reference.

```diff
-em.find('User');
+em.find(User);
```

This applies to entity definition too.

```diff
-@ManyToOne('User')
+@ManyToOne(() => User)
```

Also, the `checkDuplicateEntities` discovery option is removed, since it is no longer relevant. As long as your entities have unique table names, they are valid.

## TypeScript support in CLI

TypeScript support was previously provided by `ts-node`. In v7, the CLI supports various TS loaders:

- `swc` via `@swc-node/register`, supports metadata reflection
- `tsx`
- `jiti`
- `tsimp`

The default is `auto`, which means it goes through all those options sequentially and picks the first one available in the project dependencies.

To pick a loader explicitly, use the `tsLoader` setting in your `package.json`:

```json
"mikro-orm": {
  "tsLoader": "jiti"
}
```

Or override it via `MIKRO_ORM_CLI_TS_LOADER` env var.

```diff
-npm install ts-node
+npm install @swc-node/register
```

Other relevant changes:
- `tsNode` config option removed in favor of `preferTs`
- `useTsNode` is renamed to `preferTs`
- `alwaysAllowTs` option and `MIKRO_ORM_CLI_ALWAYS_ALLOW_TS` env var are removed
- `MIKRO_ORM_CLI_USE_TS_NODE` env var is renamed to `MIKRO_ORM_CLI_PREFER_TS`

## `mikro-orm-esm` CLI script is removed

Thanks to the switch to SWC this is no longer needed, use the standard `mikro-orm` CLI script.

## QueryBuilder is no longer awaitable

Use `qb.execute()` or `qb.getResult()` instead of awaiting it directly.

## Default loading strategy is `balanced`

This strategy should provide a good compromise between query and hydration performance. It uses joins for to-one relations, while issuing separate queries for to-many relations.

## Mixed `orderBy` with string and raw keys no longer allowed

The implementation of raw SQL fragments changed, they are now represented by a symbol instance rather than a string. This means the previous limitations around reusing of raw fragments are no longer valid. On the other hand, this means mixing of raw and regular string keys is no longer allowed, because there is no way for the ORM to preserve the order of object keys.

```diff
-em.findAll(User, { orderBy: { email: 'asc', [raw('...')]: 'asc' } });
+em.findAll(User, { orderBy: [{ email: 'asc' }, { [raw('...')]: 'asc' }] });
```

## `@CreateRequestContext` requires async function

The decorator converts the function to be async, now it will trigger a validation error if the function it is applied to is not async, since it could result in an ignored promise.

## Transaction events are fired for nested transactions

All transaction events are now invoked for child transactions, too. You can distinguish them based on the `args.transaction.savepointName`, or for the `beforeTransactionStart` based on the presence of `args.transaction` which is the parent transaction (so `undefined` means a root transaction).

## Embedded properties use `relative` prefix mode by default

The `prefixMode` added in v6.4 allows controlling the strategy for computing column names of nested embedded properties. Its default was based on the previous behavior, which was ignoring the parent embedded property `prefix` if the child embedded property had an explicit `prefix` option provided. The default has changed to `relative` now.

You can read more about this option [here](https://mikro-orm.io/docs/embeddables#column-prefixing).

## Array properties in object embeddables are considered as JSON by default

Previously, array properties inside object embeddables were not automatically considered as JSON properties—instead, they mapped to the `ArrayType` as a regular top level property would have. This means that the value in the database was stored as a comma separated list (or an array literal in postgres). In v7, such properties are considered as JSON arrays automatically.

If you want to preserve the previous behavior, set the type explicitly:

```diff
-@Property()
+@Property({ type: ArrayType })
 array!: string[];
```

## `MikroORM.initSync` removed

Use the constructor directly:

```diff
-const orm = MikroORM.initSync({ ... });
+const orm = new MikroORM({ ... });
```

## `MikroORM.init` requires options parameter

Previously, the `init` method was allowed without any parameters, resulting in loading the CLI config automatically.

```diff
+import config from './mikro-orm.config.js';

-const orm = await MikroORM.init();
+const orm = await MikroORM.init(config);
```

## ORM extensions are registered before discovery

ORM extensions are now registered before the metadata discovery process. If you used them to modify the metadata, use `afterDiscovered` hook instead (which you can set up as part of your extension `register` method).

## `MIKRO_ORM_TYPE` env var only works in CLI

This env var is needed only for the CLI, it used to be respected in the async `init` method too, which was no longer necessary with the driver-specific exports of the `MikroORM` object, that infer the `driver` option automatically. The env var will still work in the CLI.

## `--config` support removed

The command line argument `--config` is no longer supported outside the CLI. Use `MIKRO_ORM_CLI_CONFIG` env var instead.

## `connect` option is removed

Database connection is now always established lazily.

## Auto `flushMode` change detection detection

Change detection is no longer automatic on scalar properties, an explicit `em.persist` call is required now to detect such change. The `trackChanges` property option is now removed.

## `em.addFilter` signature

The signature of `em.addFilter` changed, this method now accepts a single options object.

```diff
-em.addFilter('accounts', () => ({ account: { id: { $in: [1] } } }), Tag);
+em.addFilter({
+  name: 'accounts',
+  cond: () => ({ account: { id: { $in: [1] } } }),
+  entity: Tag,
+});
```

## `raw` fragments aliasing

When aliasing a raw fragment via `raw(...).as('alias')`, the alias is now automatically quoted. Previously, we tried to detect if it was quoted or not, now the ORM will always quote the alias.

```diff
-raw('...').as('"alias"');
+raw('...').as('alias');
```

## Defaults in `EntityGenerator`

The `EntityGenerator` now emits entity definitions with the new `defineEntity` helper by default, and uses JS dictionaries for enums. Also, bidirectional relations are always defined and owning sides use the `Ref` wrapper.

Changed defaults:

- `entityDefinition`: `defineEntity` (used to be `decorators`)
- `enumMode`: `dictionary` (used to be `ts-enum`)
- `bidirectionalRelations`: `true` (used to be false)
- `identifiedReferences`: `true` (used to be false)

The `entitySchema` option is now removed in favor of `entityDefinition: 'entitySchema'`.

## Property nullability defaults

The nullability used to be inferred based on the value of `cascade` option for to-one relations. This inference is now removed, use `nullable` option explicitly to control the nullability of such properties.

## `MikroORMOptions` type removed

Previously, `MikroORMOptions` defined keys with defaults as mandatory, and we inferred the `Options` type out of it. This is now swapped, the `Options` type is defined as interface with optional keys, and a new `RequiredOptions` type is introduced that defines all keys with default value as mandatory.

## Changes in serialized primary keys (MongoDB)

The mechanism for processing serialized primary keys in MongoDB driver has changed. There might be some side effects, one known difference in behavior is serialization of entities that do not define a serialized primary key. Those used to emit the `id` field regardless of not having it declared. In v7, such entity would emit `_id` instead, unless the serialized primary key is declared.

## Default propagation in `@Transactional` is `REQUIRED`

The default propagation mode of the `@Transactional` decorator is now `REQUIRED`, which means that if there is an ongoing transaction, the decorated method will join it; otherwise, a new transaction will be started. The previous default was `REQUIRES_NEW`, which always started a new transaction. `REQUIRES_NEW` remains the default for the `em.transactional` method.

## `dataloader` dependency

The dependency on `dataloader` package is now defined as optional peer dependency. You need to install it explicitly.

```bash npm2yarn
npm install dataloader
```

## Native Node.js glob

The ORM now uses native Node.js glob implementation for file discovery instead of the `globby` package. This means that some features provided by the `globby` package are no longer available, the main one being support for brace expansion patterns (e.g. `src/{entities,modules}/*.ts`). If you rely on those, use `tinyglobby` directly:

```diff
-entities: ['src/{entities,modules}/*.ts'],
+entities: await tinyglobby(['src/{entities,modules}/*.ts']),
```

> Migrations and seeders still support brace expansion in their `glob` option.

## Dotenv file support removed

If you want to use a `.env` file, you need to use the `dotenv` package directly (and install it explicitly):

```ts
import 'dotenv/config';
import { defineConfig } from '@mikro-orm/sqlite';

export default defineConfig({
  // ...
});
```

## Some discovery options removed

The following discovery options were removed:

- `disableDynamicFileAccess` only swapped the metadata provider to `ReflectMetadataProvider` (which is no longer the default) and disabled metadata cache (which is disabled by default).
- `requireEntitiesArray` only triggered a validation error when `entities` option contained string paths.
- `alwaysAnalyseProperties` is no longer supported, the `TsMorphMetadataProvider` always analyzes properties.

They were relevant back in the day when ts-morph was the default metadata provider.

## `ArrayCollection` class removed

The `ArrayCollection` class was merged to the `Collection` class, use it instead.

## `MikroORM` extension getters removed

The following methods were removed from the `MikroORM` class:

- `orm.getSchemaGenerator()` in favor of `orm.schema` getter
- `orm.getMigrator()` in favor of `orm.migrator` getter
- `orm.getSeeder()` in favor of `orm.seeder` getter
- `orm.getEntityGenerator()` in favor of `orm.entityGenerator` getter

## `SchemaGenerator` methods renamed

The following methods were renamed:

- `orm.schema.createSchema()` renamed to `orm.schema.create()`
- `orm.schema.updateSchema()` renamed to `orm.schema.update()`
- `orm.schema.dropSchema()` renamed to `orm.schema.drop()`
- `orm.schema.clearDatabase()` renamed to `orm.schema.clear()`
- `orm.schema.refreshDatabase()` renamed to `orm.schema.refresh()`
- `orm.seeder.createSeeder()` renamed to `orm.seeder.create()`
- `orm.migrator.createMigration()` renamed to `orm.migrator.create()`
- `orm.migrator.createInitialMigration()` renamed to `orm.migrator.createInitial()`
- `orm.migrator.getExecutedMigration()` renamed to `orm.migrator.getExecuted()`
- `orm.migrator.getPendingMigration()` renamed to `orm.migrator.getPending()`
- `orm.migrator.checkMigrationNeeded()` renamed to `orm.migrator.checkSchema()`

## Change hashing algorithm

Previously, we used `md5` hash algorithm in various places, mainly to compute a stable hash for a string value, e.g. for long index names. This was made configurable and sha256 was also allowed via `hashAlgorithm` option. The algorithm is now replaced with FNV-1a 64-bit, so we don't have to depend on `node:crypto`. The option `hashAlgorithm` is removed.

## `processOnCreateHooksEarly` enabled by default

The `processOnCreateHooksEarly` option is now enabled by default. `onCreate` hooks are now executed inside `em.create` method if used explicitly.

## `validate` and `strict` options removed

Both are now enabled by default, and the auto-fixing mechanism is removed. This means that if you try to map a raw result from the database, it needs to be correctly typed. One example where this can happen is when you use some aggregation function like `sum`, in some dialects like postgres, it produces strings by default, which are no longer mappable to a `number` property by default.

## `Connection.loadFile` method removed

A new method is introduced to execute a schema dump called `Connection.executeDump`. Loading of the dump from a file is now the user's responsibility.

```diff
-await orm.driver.getConnection().loadFile('schema.sql');
+import { readFile } from 'node:fs/promises';
+const buf = await readFile('schema.sql');
+await orm.driver.getConnection().executeDump(buf.toString());`
```

## `em.findByCursor` signature changed

The `where` parameter is now moved to the options object.

```diff
-const cursor = await em.findByCursor(User, { email: '...' }, { first: 3 });
+const cursor = await em.findByCursor(User, { first: 3, where: { email: '...' } });
```

## `qb.as()` signature changed

Previosly, it was possible to prefix the alias with target entity name. This is now done via two parameter signature instead:

```diff
-qb.as('User.fullName');
+qb.as(User, 'fullName');
```
