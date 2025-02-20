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

## `@CreateRequestContext` requires async function

The decorator converts the function to be async, now it will trigger a validation error if the function it is applied to is not async, since it could result in an ignored promise.
