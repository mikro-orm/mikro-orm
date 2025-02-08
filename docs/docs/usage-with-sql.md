---
title: Usage with MySQL, MariaDB, PostgreSQL or SQLite
sidebar_label: Usage with SQL Drivers
---

To use `mikro-orm` with MySQL database, install the `@mikro-orm/mysql` dependency and set the type option to `mysql` when initializing ORM. Since v4 it is no longer needed to install the `mysql2` package manually.

```bash npm2yarn
# for mongodb
npm install @mikro-orm/core @mikro-orm/mongodb

# for mysql (works with mariadb too)
npm install @mikro-orm/core @mikro-orm/mysql

# for mariadb (works with mysql too)
npm install @mikro-orm/core @mikro-orm/mariadb

# for postgresql (works with cockroachdb too)
npm install @mikro-orm/core @mikro-orm/postgresql

# for sqlite
npm install @mikro-orm/core @mikro-orm/sqlite

# for libsql/turso
npm install @mikro-orm/core @mikro-orm/libsql

# for mssql
npm install @mikro-orm/core @mikro-orm/mssql
```

Then call `MikroORM.init` as part of bootstrapping your app:

> To access driver specific methods like `em.createQueryBuilder()` you need to import the `MikroORM`/`EntityManager`/`EntityRepository` class from the driver package. Alternatively you can cast the `orm.em` to `EntityManager` exported from the driver package:
>
> ```ts
> import { EntityManager } from '@mikro-orm/postgresql';
> const em = orm.em as EntityManager;
> const qb = em.createQueryBuilder(...);
> ```

```ts
import { MikroORM } from '@mikro-orm/postgresql'; // or any other SQL driver package

const orm = await MikroORM.init({
  entities: ['./dist/entities'], // path to your JS entities (dist), relative to `baseDir`
  dbName: 'my-db-name',
});
console.log(orm.em); // access EntityManager via `em` property
```

## Custom driver

If you want to use database that is not currently supported, you can implement your own driver. More information about how to create one can be [found here](./custom-driver.md). Then provide the driver class via `driver` configuration option:

```ts
import { MyCustomDriver } from './MyCustomDriver.ts';

const orm = await MikroORM.init({
  entities: [Author, Book, ...],
  dbName: 'my-db-name',
  driver: MyCustomDriver, // provide the class, not just its name
});
```

## Schema

Currently, you will need to maintain the database schema yourself. For initial dump, you can use [`SchemaGenerator` helper](schema-generator.md).

## ManyToMany collections with pivot tables

As opposed to `MongoDriver`, in MySQL we use pivot tables to handle `ManyToMany` relations:

```sql
CREATE TABLE `publisher_to_test` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `publisher_id` int(11) DEFAULT NULL,
  `test_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

You can adjust the name of pivot table via `pivotTable` option in `@ManyToMany` decorator defined on owning side:

```ts
// for unidirectional
@ManyToMany({ entity: () => Test, owner: true, pivotTable: 'publisher2test' })
tests = new Collection<Test>(this);

// for bidirectional
@ManyToMany({ entity: () => BookTag, inversedBy: 'books', pivotTable: 'book2tag' })
tags = new Collection<BookTag>(this);
```

## Using QueryBuilder to execute native SQL queries

When you need to execute some SQL query without all the ORM stuff involved, you can either compose the query yourself, or use the `QueryBuilder` helper to construct the query for you:

```ts
const qb = orm.em.createQueryBuilder(Author);
qb.update({ name: 'test 123', type: PublisherType.GLOBAL }).where({ id: 123, type: PublisherType.LOCAL });

console.log(qb.getQuery());
// 'UPDATE `publisher2` SET `name` = ?, `type` = ? WHERE `id` = ? AND `type` = ?'

console.log(qb.getParams());
// ['test 123', PublisherType.GLOBAL, 123, PublisherType.LOCAL]

// run the query
const res1 = await qb.execute();

// or run query without using QueryBuilder
const driver = orm.em.getDriver();
const res2 = await driver.execute('SELECT ? + ?', [1, 2]);
```

`QueryBuilder` provides fluent interface with these methods:

```ts
QueryBuilder.select(fields: string | string[], distinct?: boolean): QueryBuilder;
QueryBuilder.insert(data: any): QueryBuilder;
QueryBuilder.update(data: any): QueryBuilder;
QueryBuilder.delete(cond: any): QueryBuilder;
QueryBuilder.count(fields: string | string[], distinct?: boolean): QueryBuilder;
QueryBuilder.join(field: string, alias?: string): QueryBuilder;
QueryBuilder.leftJoin(field: string, alias?: string): QueryBuilder;
QueryBuilder.where(cond: any, operator: '$and' | '$or'): QueryBuilder;
QueryBuilder.andWhere(cond: any): QueryBuilder;
QueryBuilder.orWhere(cond: any): QueryBuilder;
QueryBuilder.groupBy(fields: string | string[]): QueryBuilder;
QueryBuilder.having(cond: any): QueryBuilder;
QueryBuilder.populate(populate: string[]): QueryBuilder;
QueryBuilder.limit(limit: number, offset?: number): QueryBuilder;
QueryBuilder.offset(offset: number): QueryBuilder;
QueryBuilder.getQuery(): string;
QueryBuilder.getParams(): any;
QueryBuilder.clone(): QueryBuilder;
```

For more examples of how to work with `QueryBuilder`, take a look at `QueryBuilder` tests in [`tests/QueryBuilder.test.ts`](https://github.com/mikro-orm/mikro-orm/blob/master/tests/QueryBuilder.test.ts).

## Transactions

When you call `em.flush()`, all computed changes are queried [inside a database transaction](./unit-of-work.md) by default, so you do not have to handle transactions manually.

When you need to explicitly handle the transaction, you can use `em.transactional(cb)` to run callback in transaction. It will provide forked `EntityManager` as a parameter with clear isolated identity map - please use that to make changes.

```ts
// if an error occurs inside the callback, all db queries from inside the callback will be rolled back
await orm.em.transactional(async (em: EntityManager) => {
  const god = new Author('God', 'hello@heaven.god');
  await em.persist(god).flush();
});
```

## LIKE Queries

SQL supports LIKE queries via native JS regular expressions:

```ts
const author1 = new Author2('Author 1', 'a1@example.com');
const author2 = new Author2('Author 2', 'a2@example.com');
const author3 = new Author2('Author 3', 'a3@example.com');

await orm.em.persist([author1, author2, author3]).flush();

// finds authors with email like '%exa%le.c_m'
const authors = await orm.em.find(Author2, { email: /exa.*le\.c.m$/ });
console.log(authors); // all 3 authors found
```

## Native Collection Methods

Sometimes you need to perform some bulk operation, or you just want to populate your database with initial fixtures. Using ORM for such operations can bring unnecessary boilerplate code. In this case, you can use one of `insert/nativeUpdate/nativeDelete` methods:

```ts
em.insert<T extends AnyEntity>(entityName: string, data: any): Promise<IPrimaryKey>;
em.nativeUpdate<T extends AnyEntity>(entityName: string, where: FilterQuery<T>, data: any): Promise<number>;
em.nativeDelete<T extends AnyEntity>(entityName: string, where: FilterQuery<T> | any): Promise<number>;
```

Those methods execute native SQL queries generated via `QueryBuilder` based on entity metadata. Keep in mind that they do not hydrate results to entities, and they do not trigger lifecycle hooks.

They are also available as `EntityRepository` shortcuts:

```ts
EntityRepository.insert(data: any): Promise<IPrimaryKey>;
EntityRepository.nativeUpdate(where: FilterQuery<T>, data: any): Promise<number>;
EntityRepository.nativeDelete(where: FilterQuery<T> | any): Promise<number>;
```

Additionally, there is `execute()` method that supports executing raw SQL queries or `QueryBuilder` instances. To create `QueryBuilder`, you can use `createQueryBuilder()` factory method on both `EntityManager` and `EntityRepository` classes:

```ts
const qb = em.createQueryBuilder('Author');
qb.select('*').where({ id: { $in: [...] } });
const res = await em.getDriver().execute(qb);
console.log(res); // unprocessed result of underlying database driver
```

## Using SQLite extensions

SQLite extensions like [sqlean](https://github.com/nalgeon/sqlean) can add many useful features that are notably missing by default (e.g. regexp).

Once you've downloaded the binaries for the extensions you wish to use, they can be added by providing a `pool.afterCreate` handler in the SQLite initialization options. The handler should call `loadExtension` on the underlying database connection, passing the path to the extension binary:

```ts
const orm = await MikroORM.init({
  // ...
  pool: {
    afterCreate: (conn: any, done: any) => {
      conn.loadExtension('/.../sqlean-macos-arm64/sqlean');
      done(null, conn);
    },
  },
});
```

## Using Turso database

To be able to connect to a remote [Turso](https://docs.turso.tech/introduction) database, you need to use the `@mikro-orm/libsql` driver. Use the `password` option to set the `authToken`.

```ts
import { defineConfig } from '@mikro-orm/libsql';

export default defineConfig({
  dbName: process.env.LIBSQL_URL,
  password: process.env.LIBSQL_AUTH_TOKEN,
});
```

To set the additional options like `syncUrl` or `syncPeriod`, use the `driverOptions`:

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

## MS SQL Server limitations

- UUID values are returned in upper case
- cycles in cascade paths are not supported
- schema diffing capabilities are limited
- no native support for fulltext search
- upsert support is limited
