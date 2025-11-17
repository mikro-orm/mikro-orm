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

TypeScript support was previously provided by `ts-node`, which is now replaced with `@swc-node`.

```diff
-npm install ts-node
+npm install @swc-node/register
```

Other relevant changes:
- `tsNode` config option removed in favor of `preferTs`
- `useTsNode` is renamed to `preferTs`

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

## `MIKRO_ORM_TYPE` env var only works in CLI

This env var is needed only for the CLI, it used to be respected in the async `init` method too, which was no longer necessary with the driver-specific exports of the `MikroORM` object, that infer the `driver` option automatically. The env var will still work in the CLI.

## `--config` support removed

The command line argument `--config` is no longer supported outside the CLI. Use `MIKRO_ORM_CLI_CONFIG` env var instead.

## `connect` option is removed

Database connection is now always established lazily.

## Auto `flushMode` change detection detection

Change detection is no longer automatic on scalar properties, an explicit `em.persist` call is required now to detect such change. The `trackChanges` property option is now removed.
