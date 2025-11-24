---
title: Upgrading from v6 to v7
---

> Following sections describe (hopefully) all breaking changes, most of them might be not valid for you, like if you do not use custom `NamingStrategy` implementation, you do not care about the interface being changed.

## ECMAScript modules

MikroORM v7 is a native ESM package now. It can be still consumed from a CJS project, as long as you use TypeScript and Node.js version that supports `require(esm)`.

## Node 22.11+ required

Support for older node versions was dropped.

## TypeScript 5.8+ required

Support for older TypeScript versions was dropped. Older versions might work too, but only if your project is also ESM.

## `knex` replaced with `kysely` as query runner

- `@mikro-orm/better-sqlite` driver is removed
- `@mikro-orm/sqlite` driver uses `better-sqlite3` internally
- `@mikro-orm/mariadb` driver uses `mysql2` internally (but still comes with MariaDB specific JSON and schema handling)
- `em.getKnex()` is replaced with `em.getKysely()`
- support for `qb.getKnexQuery()` is removed completely, the ORM now builds queries internally

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
