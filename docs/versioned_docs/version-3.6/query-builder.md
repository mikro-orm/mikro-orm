---
title: Using Query Builder
---

When you need to execute some SQL query without all the ORM stuff involved, you can either compose the query yourself, or use the `QueryBuilder` helper to construct the query for you:

```typescript
const qb = orm.em.createQueryBuilder(Author);
qb.update({ name: 'test 123', type: PublisherType.GLOBAL }).where({ id: 123, type: PublisherType.LOCAL });

console.log(qb.getQuery());
// update `publisher2` set `name` = ?, `type` = ? where `id` = ? and `type` = ?

console.log(qb.getParams());
// ['test 123', PublisherType.GLOBAL, 123, PublisherType.LOCAL]

// run the query
const res1 = await qb.execute();
```

`QueryBuilder` also supports [smart query conditions](query-conditions.md).

## Using Knex.js

Under the hood, `QueryBuilder` uses [`Knex.js`](https://knexjs.org) to compose and run queries. You can access configured `knex` instance via `qb.getKnexQuery()` method:

```typescript
const qb = orm.em.createQueryBuilder(Author);
qb.update({ name: 'test 123', type: PublisherType.GLOBAL }).where({ id: 123, type: PublisherType.LOCAL });
const knex = qb.getKnexQuery(); // instance of Knex' QueryBuilder

// do what ever you need with `knex`

const res = await orm.em.getConnection().execute(knex);
const entities = res.map(a => orm.em.map(Author, a));
console.log(entities); // Author[]
```

You can also get clear and configured knex instance from the connection via `getKnex()` method. As this method is not available on the base `Connection` class, you will need to either manually type cast the connection to `AbstractSqlConnection` (or the actual implementation you are using, e.g. `MySqlConnection`), or provide correct driver type hint to your `EntityManager` instance, which will be then automatically inferred in `em.getConnection()` method.

> Driver and connection implementations are not directly exported from `mikro-orm` module. You can import them from `mikro-orm/dist` (e.g. `import { PostgreSqlDriver } from 'mikro-orm/dist/drivers/PostgreSqlDriver'`).

```typescript
const conn = orm.em.getConnection() as AbstractSqlConnection;
// you can make sure the `em` is correctly typed to `EntityManager<AbstractSqlDriver>`
// or one of its implementations:
// const em: EntityManager<AbstractSqlDriver> = orm.em;

const knex = conn.getKnex();

// do what ever you need with `knex`

const res = await knex;
```

## Running Native SQL Query

You can run native SQL via underlying connection

```typescript
const connection = orm.em.getConnection();
const res = await connection.execute('select 1 as count');
console.log(res); // res is array of objects: `[ { count: 1 } ]`
```

## Executing the Query

You can use `execute(method = 'all', mapResults = true)`'s parameters to control form of result:

```typescript
const res1 = await qb.execute('all'); // returns array of objects, default behavior
const res2 = await qb.execute('get'); // returns single object
const res3 = await qb.execute('run'); // returns object like `{ affectedRows: number, insertId: number, row: any }`
```

Second argument can be used to disable mapping of database columns to property names (which is enabled by default). In following example, `Book` entity has `createdAt` property defined with implicit underscored field name `created_at`:

```typescript
const res4 = await orm.em.createQueryBuilder(Book).select('*').execute('get', true);
console.log(res4); // `createdAt` will be defined, while `created_at` will be missing
const res5 = await orm.em.createQueryBuilder(Book).select('*').execute('get', false);
console.log(res5); // `created_at` will be defined, while `createdAt` will be missing
```

To get entity instances from the QueryBuilder result, you can use `getResult()` and `getSingleResult()` methods:

```typescript
const book = await orm.em.createQueryBuilder(Book).select('*').where({ id: 1 }).getSingleResult();
console.log(book instanceof Book); // true
const books = await orm.em.createQueryBuilder(Book).select('*').getResult();
console.log(books[0] instanceof Book); // true
```

## Mapping Raw Results to Entities

Another way to create entity from raw results (that are not necessarily mapped to entity properties) is to use `map()` method of `EntityManager`, that is basically a shortcut for mapping results via `IDatabaseDriver.mapResult()` (which converts field names to property names - e.g. `created_at` to `createdAt`) and `merge()` which converts the data to entity instance and makes it managed.

This method comes handy when you want to use 3rd party query builders, where the result is not mapped to entity properties automatically:

```typescript
const results = await knex.select('*').from('users').where(knex.raw('id = ?', [id]));
const users = results.map(user => orm.em.map(User, user));

// or use EntityRepository.map()
const repo = orm.em.getRepository(User);
const users = results.map(user => repo.map(user));
```

## Implicit Joining

`QueryBuilder` supports automatic joining based on entity metadata:

```typescript
const qb = orm.em.createQueryBuilder(BookTag, 't');
qb.select('*').where({ books: 123 });

console.log(qb.getQuery());
// select `t`.*, `e1`.`book_tag_id`, `e1`.`book_uuid_pk`
// from `book_tag` as `t`
// left join `book_to_book_tag` as `e1` ON `t`.`id` = `e1`.`book_tag_id`
// where `e1`.`book_uuid_pk` = ?
```

This also works for multiple levels of nesting:

```typescript
const qb = orm.em.createQueryBuilder(Author);
qb.select('*')
  .where({ books: { tags: { name: 'Cool' } } })
  .orderBy({ books: { tags: { createdBy: QueryOrder.DESC } } });

console.log(qb.getQuery());
// select `e0`.*
// from `author` as `e0`
// left join `book2` as `e1` on `e0`.`id` = `e1`.`author_id`
// left join `book2_to_book_tag2` as `e3` on `e1`.`uuid_pk` = `e3`.`book2_uuid_pk`
// left join `book_tag2` as `e2` on `e3`.`book_tag2_id` = `e2`.`id`
// where `e2`.`name` = ?
// order by `e1`.`tags` asc
```

This is currently available only for filtering (`where`) and sorting (`orderBy`), only the root entity will be selected. To populate its relationships, you can use [EntityLoader](nested-populate.md).

## Explicit Joining

Another way is to manually specify join property via `join()`/`leftJoin()` methods:

```typescript
const qb = orm.em.createQueryBuilder(BookTag, 't');
qb.select(['b.uuid', 'b.*', 't.*'], true)
  .join('t.books', 'b')
  .where({ 'b.title': 'test 123' })
  .limit(2, 1);

console.log(qb.getQuery());
// select distinct `b`.`uuid_pk`, `b`.*, `t`.*, `e1`.`book_tag_id`, `e1`.`book_uuid_pk` from `book_tag` as `t`
// join `book_to_book_tag` as `e1` ON `t`.`id` = `e1`.`book_tag_id`
// join `book` as `b` ON `e1`.`book_uuid_pk` = `b`.`uuid_pk`
// where `b`.`title` = ?
// limit ? offset ?
```

## Complex Where Conditions

There are multiple ways to construct complex query conditions. You can either write parts of SQL manually, use `andWhere()`/`orWhere()`, or provide condition object:

### Custom SQL in where

```typescript
const qb = orm.em.createQueryBuilder(BookTag, 't');
qb.select(['b.*', 't.*'])
  .leftJoin('t.books', 'b')
  .where('b.title = ? or b.title = ?', ['test 123', 'lol 321'])
  .andWhere('1 = 1')
  .orWhere('1 = 2')
  .limit(2, 1);

console.log(qb.getQuery());
// select `b`.*, `t`.*, `e1`.`book_tag_id`, `e1`.`book_uuid_pk` from `book_tag` as `t`
// left join `book_to_book_tag` as `e1` ON `t`.`id` = `e1`.`book_tag_id`
// left join `book` as `b` ON `e1`.`book_uuid_pk` = `b`.`uuid_pk`
// where (((b.title = ? or b.title = ?) and (1 = 1)) or (1 = 2))
// limit ? offset ?
```

### andWhere() and orWhere()

```typescript
const qb = orm.em.createQueryBuilder(BookTag, 't');
qb.select(['b.*', 't.*'])
  .leftJoin('t.books', 'b')
  .where('b.title = ? or b.title = ?', ['test 123', 'lol 321'])
  .andWhere('1 = 1')
  .orWhere('1 = 2')
  .limit(2, 1);

console.log(qb.getQuery());
// select `b`.*, `t`.*, `e1`.`book_tag_id`, `e1`.`book_uuid_pk` from `book_tag` as `t`
// left join `book_to_book_tag` as `e1` ON `t`.`id` = `e1`.`book_tag_id`
// left join `book` as `b` ON `e1`.`book_uuid_pk` = `b`.`uuid_pk`
// where (((b.title = ? or b.title = ?) and (1 = 1)) or (1 = 2))
// limit ? offset ?
```

### Conditions Object

```typescript
const qb = orm.em.createQueryBuilder(Test);
qb.select('*').where({ $and: [{ id: { $nin: [3, 4] } }, { id: { $gt: 2 } }] });

console.log(qb.getQuery());
// select `e0`.* from `test` as `e0` where (`e0`.`id` not in (?, ?) and `e0`.`id` > ?)
```

## Locking support

```typescript
const qb = orm.em.createQueryBuilder(Test);
qb.select('*').where({ name: 'Lol 321' }).setLockMode(LockMode.PESSIMISTIC_READ);

console.log(qb.getQuery()); // for MySQL
// select `e0`.* from `test` as `e0` where `e0`.`name` = ? lock in share mode
```

## QueryBuilder API

`QueryBuilder` provides fluent interface with these methods:

```typescript
qb.select(fields: string | string[], distinct?: boolean): QueryBuilder;
qb.addSelect(fields: string | string[]): QueryBuilder;
qb.insert(data: Record<string, any>): QueryBuilder;
qb.update(data: Record<string, any>): QueryBuilder;
qb.delete(cond: Record<string, any>): QueryBuilder;
qb.count(fields: string | string[], distinct?: boolean): QueryBuilder;
qb.join(field: string, alias?: string): QueryBuilder;
qb.leftJoin(field: string, alias?: string): QueryBuilder;
qb.where(cond: Record<string, any>, operator?: '$and' | '$or'): QueryBuilder;
qb.andWhere(cond: Record<string, any>): QueryBuilder;
qb.orWhere(cond: Record<string, any>): QueryBuilder;
qb.groupBy(fields: string | string[]): QueryBuilder;
qb.having(cond: Record<string, any>): QueryBuilder;
qb.limit(limit: number, offset?: number): QueryBuilder;
qb.offset(offset: number): QueryBuilder;
qb.withSchema(schema?: string): QueryBuilder;
qb.execute<T>(method: 'all' | 'get' | 'run' = 'all', mapResults = true): T;
qb.getResult<T>(): T[];
qb.getSingleResult<T>(): T;
qb.setLockMode(mode: LockMode): QueryBuilder;
qb.getQuery(): string;
qb.getParams(): any[];
qb.clone(): QueryBuilder;
```
