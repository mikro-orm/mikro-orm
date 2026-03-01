---
title: Using Query Builder
sidebar_label: Query Builder
---

:::info

To have access to `createQueryBuilder()` method, you need to import `EntityManager` from your driver package.

```ts
import { EntityManager } from '@mikro-orm/mysql'; // or any other SQL driver package
```

:::

When you need to execute some SQL query without all the ORM stuff involved, you can either compose the query yourself, or use the `QueryBuilder` helper to construct the query for you:

```ts
const qb = em.createQueryBuilder(Author);
// or use the `em.qb()` shortcut
// const qb = em.qb(Author);
qb.update({ name: 'test 123', type: PublisherType.GLOBAL }).where({ id: 123, type: PublisherType.LOCAL });

console.log(qb.getQuery());
// update `publisher2` set `name` = ?, `type` = ? where `id` = ? and `type` = ?

console.log(qb.getParams());
// ['test 123', PublisherType.GLOBAL, 123, PublisherType.LOCAL]

// run the query
const res1 = await qb.execute();
```

`QueryBuilder` also supports [smart query conditions](./query-conditions.md).

## Executing the Query

The `execute()` method runs the query and returns raw results (plain objects). The first parameter controls the result format:

```ts
const res1 = await qb.execute('all'); // returns array of objects (default)
const res2 = await qb.execute('get'); // returns single object
const res3 = await qb.execute('run'); // returns { affectedRows: number, insertId: number, row: any }
```

### Execute Options

The second parameter is an options object that controls how results are processed:

```ts
interface ExecuteOptions {
  mapResults?: boolean;   // map column names to property names (default: true)
  mergeResults?: boolean; // merge results into existing entity instances in identity map (default: true)
  rawResults?: boolean;   // return raw database values without transformation (default: false)
}
```

**`mapResults`** - Controls mapping of database column names to entity property names:

```ts
// Book entity has `createdAt` property with database column `created_at`
const res1 = await qb.execute('get', { mapResults: true });
console.log(res1); // { createdAt: ... } - property name

const res2 = await qb.execute('get', { mapResults: false });
console.log(res2); // { created_at: ... } - column name
```

**`mergeResults`** - When using joined results with `joinAndSelect`, controls whether rows are merged into complete entity graphs:

```ts
// With mergeResults: true (default) - rows are combined into entity graph
const authors = await em.createQueryBuilder(Author, 'a')
  .select('*')
  .leftJoinAndSelect('a.books', 'b')
  .execute('all', { mergeResults: true });
// Returns array of authors with books array populated

// With mergeResults: false - each row returned separately
const rows = await em.createQueryBuilder(Author, 'a')
  .select('*')
  .leftJoinAndSelect('a.books', 'b')
  .execute('all', { mergeResults: false });
// Returns flat array with duplicated author data per book
```

### Typed Raw Results

The return type of `execute()` is based on `EntityDTO` — plain objects with Collections unwrapped to arrays and References unwrapped to their target types. When you use `select()` or `joinAndSelect()`, the return type automatically reflects which fields and relations were selected:

```ts
// Without joins: Pick<EntityDTO<Author>, 'id' | 'email'>[]
const result1 = await em.createQueryBuilder(Author, 'a')
  .select(['a.id', 'a.email'])
  .execute();

// With joins: EntityDTO<Loaded<Author, 'books', 'id' | 'email' | 'books.title'>>[]
const result2 = await em.createQueryBuilder(Author, 'a')
  .select(['a.id', 'a.email'])
  .leftJoinAndSelect('a.books', 'b', {}, ['title'])
  .execute();
```

If you need to opt out of the inferred type (e.g. when using `mapResults: false` which returns raw column names instead of property names), you can provide an explicit type parameter:

```ts
const result = await qb.execute<Dictionary[]>('all', false);
```

### Getting Entity Instances

To get fully hydrated entity instances (tracked by the identity map), use `getResult()` or `getSingleResult()`:

```ts
const book = await em.createQueryBuilder(Book).select('*').where({ id: 1 }).getSingleResult();
console.log(book instanceof Book); // true

const books = await em.createQueryBuilder(Book).select('*').getResult();
console.log(books[0] instanceof Book); // true
```

> `qb.getResultList()` is an alias for `qb.getResult()`.

## Mapping Raw Results to Entities

Another way to create entity from raw results (that are not necessarily mapped to entity properties) is to use `map()` method of `EntityManager`, that is basically a shortcut for mapping results via `IDatabaseDriver.mapResult()` (which converts field names to property names - e.g. `created_at` to `createdAt`) and `merge()` which converts the data to entity instance and makes it managed.

This method comes handy when you want to use 3rd party query builders (like Kysely), where the result is not mapped to entity properties automatically:

```ts
const results = await em.execute<User[]>('select * from users where id = ?', [id]);
const users = results.map(user => em.map(User, user));

// or use EntityRepository.map()
const repo = em.getRepository(User);
const users = results.map(user => repo.map(user));
```

## Implicit Joining

`QueryBuilder` supports automatic joining based on entity metadata:

```ts
const qb = em.createQueryBuilder(BookTag, 't');
qb.select('*').where({ books: 123 });

console.log(qb.getQuery());
// select `t`.*, `e1`.`book_tag_id`, `e1`.`book_uuid_pk`
// from `book_tag` as `t`
// left join `book_to_book_tag` as `e1` ON `t`.`id` = `e1`.`book_tag_id`
// where `e1`.`book_uuid_pk` = ?
```

This also works for multiple levels of nesting:

```ts
const qb = em.createQueryBuilder(Author);
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

This is currently available only for filtering (`where`) and sorting (`orderBy`), only the root entity will be selected. To populate its relationships, you can use [`em.populate()`](populating-relations.md).

## Explicit Joining

Another way is to manually specify join property via `join()`/`leftJoin()` methods:

```ts
const qb = em.createQueryBuilder(BookTag, 't');
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

## Mapping Joined Results

When you use `join()` or `leftJoin()` alone, the joined data is available for filtering and sorting, but it won't be mapped to entity relations. To properly hydrate joined relations into your entities, use `joinAndSelect()` or `leftJoinAndSelect()`:

```ts
// Using just leftJoin - books are NOT populated on the result
const authors1 = await em.createQueryBuilder(Author, 'a')
  .select('*')
  .leftJoin('a.books', 'b')
  .where({ 'b.title': { $like: '%TypeScript%' } })
  .getResultList();

console.log(authors1[0].books.isInitialized()); // false - not populated!

// Using leftJoinAndSelect - books ARE populated on the result
const authors2 = await em.createQueryBuilder(Author, 'a')
  .select('*')
  .leftJoinAndSelect('a.books', 'b')
  .where({ 'b.title': { $like: '%TypeScript%' } })
  .getResultList();

console.log(authors2[0].books.isInitialized()); // true - populated!
console.log(authors2[0].books[0].title); // accessible
```

You can chain multiple `leftJoinAndSelect` calls to populate nested relations:

```ts
// Populates authors with their books and each book's tags
const authors = await em.createQueryBuilder(Author, 'a')
  .select('*')
  .leftJoinAndSelect('a.books', 'b')
  .leftJoinAndSelect('b.tags', 't')
  .where({ 't.name': ['sick', 'sexy'] })
  .getResultList();
```

The key differences:
- `join()`/`leftJoin()`: Joins the table for filtering/sorting only. Result contains only root entity data.
- `joinAndSelect()`/`leftJoinAndSelect()`: Joins and selects columns with special aliases (e.g., `b__id`, `b__title`) that the hydrator uses to map the data back to entity relations.

### Type-safe Populated Relations

The `joinAndSelect` and `leftJoinAndSelect` methods enhance the return type to include the correct `Loaded` type hint. This means TypeScript knows which relations are populated:

```ts
// Type is `Loaded<Author, 'books' | 'books.tags'>[]`
const authors = await em.createQueryBuilder(Author, 'a')
  .select('*')
  .leftJoinAndSelect('a.books', 'b')
  .leftJoinAndSelect('b.tags', 't')
  .getResultList();

// TypeScript knows these are populated and allows access
authors[0].books[0].tags[0].name; // OK

// Without joinAndSelect, you'd get type errors trying to access relations
```

Always use the fluent API (chaining methods) rather than storing the QueryBuilder in a variable first - this ensures the types are correctly enhanced at each step.

## Joining sub-queries

Sometimes you might want to join a relation, but want to have more control over the query. The ORM allows you to override the join target with a sub-query, while keeping the original metadata for hydration:

```ts
const subquery = em.createQueryBuilder(Book, 'b')
  .where({ ... })
  .orderBy({ title: 'asc' }).limit(1);

const authors = await em.createQueryBuilder(Author, 'a')
  .select('*')
  // pass in both the property path and the subquery into the first argument as a tuple
  .leftJoinAndSelect(['a.books', subquery], 'b')
  // you can join more relations on top of the subquery join
  .leftJoinAndSelect('b.tags', 't')
  .getResultList();
```

This will produce query similar to the following:

```sql
select `a`.*,
  `b`.`id` as `b__id`, `b`.`title` as `b__title`, `b`.`author_id` as `b__author_id`, `b`.`publisher_id` as `b__publisher_id`,
  `t`.`id` as `t__id`, `t`.`name` as `t__name`
  from `author` as `a`
  left join (
    select `b`.*, `b`.price * 1.19 as `price_taxed`
    from `book` as `b`
    order by `b`.`title` asc
    limit 1
  ) as `b` on `b`.`author_id` = `a`.`id`
  left join `book_tags` as `e1` on `b`.`uuid_pk` = `e1`.`book_uuid_pk`
  left join `book_tag` as `t` on `e1`.`book_tag_id` = `t`.`id`
```

## Complex Where Conditions

There are multiple ways to construct complex query conditions. You can either write parts of SQL manually, use `andWhere()`/`orWhere()`, or provide condition object:

### Using custom SQL fragments

Any SQL fragment in your `WHERE` query or `ORDER BY` clause need to be wrapped with `raw()` or `sql`:

```ts
const users = em.createQueryBuilder(User)
  .select('*')
  .where({ [sql`lower(email)`]: 'foo@bar.baz' }) // sql tagged template function
  .orderBy({ [raw(`(point(loc_latitude, loc_longitude) <@> point(0, 0))`)]: 'ASC' }) // raw helper
  .getResultList();
```

This will produce following query:

```sql
select `e0`.*
from `user` as `e0`
where lower(email) = 'foo@bar.baz'
order by (point(loc_latitude, loc_longitude) <@> point(0, 0)) asc
```

Read more about this in [Using raw SQL query fragments](./raw-queries.md) section.

### Custom SQL in where

```ts
const qb = em.createQueryBuilder(BookTag, 't');
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

```ts
const qb = em.createQueryBuilder(BookTag, 't');
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

```ts
const qb = em.createQueryBuilder(Test);
qb.select('*').where({ $and: [{ id: { $nin: [3, 4] } }, { id: { $gt: 2 } }] });

console.log(qb.getQuery());
// select `e0`.* from `test` as `e0` where (`e0`.`id` not in (?, ?) and `e0`.`id` > ?)
```

## Count queries

To create a count query, you can use `qb.count()`, which will initialize a select clause with `count()` function. By default, it will use the primary key.

```ts
const qb = em.createQueryBuilder(Test);
qb.count().where({ $and: [{ id: { $nin: [3, 4] } }, { id: { $gt: 2 } }] });

console.log(qb.getQuery());
// select count(`e0`.`id`) from `test` as `e0` where (`e0`.`id` not in (?, ?) and `e0`.`id` > ?)

// to get the count, we can use `qb.execute()`
const res = await qb.execute('get');
const count = res ? +res.count : 0;
```

To simplify this process, you can use `qb.getCount()` method. Following code is equivalent:

```ts
const qb = em.createQueryBuilder(Test);
qb.select('*').limit(10, 20).where({ $and: [{ id: { $nin: [3, 4] } }, { id: { $gt: 2 } }] });

const count = await qb.getCount();
```

This will also remove any existing limit and offset from the query (the QB will be cloned under the hood, so calling `getCount()` does not mutate the original QB state).

## Pagination

If you want to paginate the results of a QueryBuilder, you can use `qb.getResultAndCount()` method. It returns an ordered tuple, the first item being an array of results, and the second one being the total count of items, discarding the limit and offset clause.

```ts
const qb = em.createQueryBuilder(User);
qb.select('*')
  .where({ age: 18 })
  .limit(10);
const [results, count] = await qb.getResultAndCount();

console.log(results.length); // max 10, as we used the limit clause
console.log(count); // total count regardless limit and offset, e.g. 1327
```

### Extracting a Page from a Joined Result

When you join a to-many relation and apply `limit`, SQL limits the total rows returned, not the number of root entities. This can cause fewer results than expected due to cartesian product explosion.

MikroORM automatically detects to-many joins combined with `limit`/`offset` and applies pagination logic. This wraps the root entity selection in a subquery with the limit applied, then joins the full data:

```ts
const authors = await em.createQueryBuilder(Author, 'a')
  .select('*')
  .leftJoinAndSelect('a.books', 'b')
  .limit(10)
  .offset(20)
  .getResultList();
```

This produces a query with a subquery:

```sql
select `a`.*, `b`.*
  from (
    select `a`.*
    from `author` as `a`
    group by `a`.`id`
    limit 10 offset 20
  ) as `a`
  left join `book` as `b` on `a`.`id` = `b`.`author_id`
```

The inner subquery groups by primary key and applies `limit`/`offset` to get the correct number of root entities. Order by clauses are wrapped in `min()` aggregates to work with the grouping.

**Note:** If you use explicit `groupBy()`, automatic pagination is disabled. The ORM assumes you want full control over the grouping logic and applies the limit directly:

```ts
const authors = await em.createQueryBuilder(Author, 'a')
  .select(['a.*', raw('count(b.id) as book_count')])
  .leftJoin('a.books', 'b')
  .groupBy('a.id')
  .limit(10)
  .getResultList();

// No subquery wrapping - your groupBy is respected:
// select `a`.*, count(b.id) as book_count
//   from `author` as `a`
//   left join `book` as `b` on `a`.`id` = `b`.`author_id`
//   group by `a`.`id`
//   limit 10
```

If you want to explicitly disable the automatic pagination and apply the limit directly to the joined result, use the `DISABLE_PAGINATE` flag:

```ts
const authors = await em.createQueryBuilder(Author, 'a')
  .select('*')
  .leftJoinAndSelect('a.books', 'b')
  .limit(10)
  .setFlag(QueryFlag.DISABLE_PAGINATE) // limit applies to rows, not authors
  .getResultList();
```

## Using `having()` with aggregates

When using `groupBy()`, you can filter the grouped results with `having()`. The `having()` method accepts either a string with parameters or an object condition:

```ts
// String-based having
const qb1 = em.createQueryBuilder(BookTag, 't')
  .select(['t.*', sql`count(t.id)`.as('book_count')])
  .leftJoin('t.books', 'b')
  .groupBy('t.id')
  .having('count(t.id) > ?', [5]);
```

```sql
select `t`.*, count(t.id) as `book_count`
from `book_tag` as `t`
left join `book_tags` as `e1` on `t`.`id` = `e1`.`book_tag_id`
group by `t`.`id`
having count(t.id) > 5
```

### Type-safe `having()` with raw aliases

When you use `sql`...`.as('alias')` to create an aliased aggregate in your select, the alias becomes available as a type-safe key in `having()`:

```ts
const qb = em.createQueryBuilder(BookTag, 't')
  .leftJoin('t.books', 'b')
  .select(['t.*', 'b.*', sql`count(t.id)`.as('tag_count')])
  .groupBy(['b.uuid', 't.id'])
  .having({ tag_count: { $gt: 0, $lt: 100 } }); // 'tag_count' is type-checked!
```

```sql
select `t`.*, `b`.*, count(t.id) as `tag_count`
from `book_tag` as `t`
left join `book_tags` as `e1` on `t`.`id` = `e1`.`book_tag_id`
left join `book` as `b` on `e1`.`book_uuid` = `b`.`uuid`
group by `b`.`uuid`, `t`.`id`
having `tag_count` > 0 and `tag_count` < 100
```

You can also use joined table aliases in `having()`:

```ts
const qb = em.createQueryBuilder(BookTag, 't')
  .leftJoin('t.books', 'b')
  .select(['t.*', sql`count(t.id)`.as('tags')])
  .groupBy(['b.uuid', 't.id'])
  .having({ 'b.title': { $like: '%test%' }, 't.name': { $ne: null } });
```

The `andHaving()` and `orHaving()` methods are also available for combining multiple having conditions.

### Aliasing fields with `as`

You can alias any selected field — including `@Formula` properties — using the `as` syntax:

```ts
// String 'as' syntax
const qb = em.createQueryBuilder(Book, 'b')
  .select(['b.title', 'b.priceTaxed as tax'])
  .where({ title: 'test' });
```

```sql
select `b`.`title`, `b`.`price` * 1.19 as `tax`
from `book` as `b`
where `b`.`title` = 'test'
```

You can also use `sql.ref().as()` for formula properties:

```ts
const qb = em.createQueryBuilder(Book, 'b')
  .select(['b.title', sql.ref('b.priceTaxed').as('tax')])
  .where({ title: 'test' });
```

Aliases created via either mechanism feed into `having()` and `orderBy()`, so you can type-check aggregated aliases:

```ts
const qb = em.createQueryBuilder(FooBar, 'fb')
  .select(['fb.id', 'random as rnd'])
  .groupBy('fb.id')
  .having({ rnd: { $gt: 0 } }) // 'rnd' is type-checked!
  .orderBy({ rnd: 'desc' });
```

> **Note:** Field aliasing is only supported in QueryBuilder. Custom aliases break entity hydration, so they are not available in `em.find()`.

## Overriding FROM clause

You can specify the table used in the `FROM` clause, replacing the current table name if one has already been specified. This is typically used to specify a sub-query expression in SQL.

```ts
const qb = em.createQueryBuilder(Book2);
qb.select('*').from(Author2).where({ id: { $gt: 2 } });

console.log(qb.getQuery());
// select `e0`.* from `author2` as `e0` where `e0`.`id` > 2;
```

You can also use sub-queries in the `FROM` like this:

```ts
const qb1 = em.createQueryBuilder(Book2).where({ id: { $lte: new Date() } }).orderBy({ id: 'DESC' }).limit(10);
const qb2 = em.createQueryBuilder(qb1.clone())
qb2.select('*').orderBy({ id: 'ASC' });

console.log(qb2.getQuery());
// select `e1`.* from (select `e0`.* from `book2` as `e0` where `e0`.`id` <= ? order by `e0`.`id` desc limit ?) as `e1` order by `e1`.`id`;
```

To set up an alias to refer to a table in a `SELECT` statement, pass the second argument as follows:

```ts
const qb1 = em.createQueryBuilder(Book2, 'b1').where({ id: { $lte: new Date() } }).orderBy({ id: 'DESC' }).limit(10);
const qb2 = em.createQueryBuilder(qb1.clone(), 'b2')
qb2.select('*').orderBy({ id: 'ASC' });

console.log(qb2.getQuery());
// select `b2`.* from (select `b1`.* from `book2` as `b1` where `b1`.`id` <= ? order by `b1`.`id` desc limit ?) as `b2` order by `b2`.`id`;
```

## Using sub-queries

You can filter using sub-queries in where conditions:

```ts
const qb1 = em.createQueryBuilder(Book2, 'b').select('b.author').where({ price: { $gt: 100 } });
const qb2 = em.createQueryBuilder(Author2, 'a').select('*').where({ id: { $in: qb1 } });

console.log(qb2.getQuery());
// select `a`.* from `author2` as `a` where `a`.`id` in (select `b`.`author_id` from `book2` as `b` where `b`.`price` > ?)
```

For sub-queries in selects, use the `qb.as(alias)` method:

> The dynamic property (`booksTotal`) needs to be defined at the entity level (as `persist: false`).

```ts
import { sql } from '@mikro-orm/core';

const qb1 = em.createQueryBuilder(Book2, 'b').count('b.uuid', true).where({ author: sql.ref('a.id') }).as('Author2.booksTotal');
const qb2 = em.createQueryBuilder(Author2, 'a');
qb2.select(['*', qb1]).orderBy({ booksTotal: 'desc' });

console.log(qb2.getQuery());
// select `a`.*, (select count(distinct `b`.`uuid_pk`) as `count` from `book2` as `b` where `b`.`author_id` = `a`.`id`) as `books_total` from `author2` as `a` order by `books_total` desc
```

```ts
const qb3 = em.createQueryBuilder(Book2, 'b').count('b.uuid', true).where({ author: sql.ref('a.id') }).as('books_total');
const qb4 = em.createQueryBuilder(Author2, 'a');
qb4.select(['*', qb3]).orderBy({ booksTotal: 'desc' });

console.log(qb4.getQuery());
// select `a`.*, (select count(distinct `b`.`uuid_pk`) as `count` from `book2` as `b` where `b`.`author_id` = `a`.`id`) as `books_total` from `author2` as `a` order by `books_total` desc
```

When you want to filter by sub-query on the left-hand side of a predicate, you will need to register it first via `qb.withSubquery()`:

> The dynamic property (`booksTotal`) needs to be defined at the entity level (as `persist: false`). You always need to use prefix in the `qb.withSubQuery()` (so `a.booksTotal`).

```ts
const qb1 = em.createQueryBuilder(Book2, 'b').count('b.uuid', true).where({ author: sql.ref('a.id') });
const qb2 = em.createQueryBuilder(Author2, 'a');
qb2.select('*').withSubQuery(qb1, 'a.booksTotal').where({ 'a.booksTotal': { $in: [1, 2, 3] } });

console.log(qb2.getQuery());
// select `a`.* from `author2` as `a` where (select count(distinct `b`.`uuid_pk`) as `count` from `book2` as `b` where `b`.`author_id` = `a`.`id`) in (?, ?, ?)
```

```ts
const qb3 = em.createQueryBuilder(Book2, 'b').count('b.uuid', true).where({ author: sql.ref('a.id') });
const qb4 = em.createQueryBuilder(Author2, 'a');
qb4.select('*').withSubQuery(qb3, 'a.booksTotal').where({ 'a.booksTotal': 1 });

console.log(qb4.getQuery());
// select `a`.* from `author2` as `a` where (select count(distinct `b`.`uuid_pk`) as `count` from `book2` as `b` where `b`.`author_id` = `a`.`id`) = ?
```

## Using UNION queries

You can combine multiple queries using `qb.union()` and `qb.unionAll()`. Both methods return a `QueryBuilder` that can be used with `$in`, passed to `qb.from()`, or converted via `.getQuery()`, `.getParams()`, `.toQuery()`, `.toRaw()`, etc.

`unionAll` keeps all rows (including duplicates), while `union` deduplicates:

```ts
const qb1 = em.createQueryBuilder(Employee).select('id').where({ department: 'engineering' });
const qb2 = em.createQueryBuilder(Employee).select('id').where({ salary: { $gt: 100_000 } });

// UNION ALL (keeps duplicates)
const subquery = qb1.unionAll(qb2);
const qb = em.createQueryBuilder(Employee).select('*').where({ id: { $in: subquery } });

// UNION (deduplicates)
const subquery2 = qb1.union(qb2);
const qb2b = em.createQueryBuilder(Employee).select('*').where({ id: { $in: subquery2 } });
```

You can also chain more than two queries:

```ts
const qb3 = em.createQueryBuilder(Employee).select('id').where({ title: 'Manager' });
const combined = qb1.unionAll(qb2, qb3);
```

## Referring to column in update queries

You can use static `raw()` helper to insert raw SQL snippets like this:

```ts
const qb = em.createQueryBuilder(Book);
qb.update({ price: raw('price + 1') }).where({ uuid: '123' });

console.log(qb.getQuery());
// update `book` set `price` = price + 1 where `uuid_pk` = ?
```

## Locking support

You can set the `LockMode` via `qb.setLockMode()`.

```ts
const qb = em.createQueryBuilder(Test);
qb.select('*').where({ name: 'Lol 321' }).setLockMode(LockMode.PESSIMISTIC_READ);

console.log(qb.getQuery()); // for MySQL
// select `e0`.* from `test` as `e0` where `e0`.`name` = ? lock in share mode
```

Available lock modes:

| Mode                                 | Postgres                 | MySQL                            |
| ------------------------------------ | ------------------------ | -------------------------------- |
| `LockMode.PESSIMISTIC_READ`          | `for share`              | `lock in share mode`             |
| `LockMode.PESSIMISTIC_WRITE`         | `for update`             | `for update`                     |
| `LockMode.PESSIMISTIC_PARTIAL_WRITE` | `for update skip locked` | `for update skip locked`         |
| `LockMode.PESSIMISTIC_WRITE_OR_FAIL` | `for update nowait`      | `for update nowait`              |
| `LockMode.PESSIMISTIC_PARTIAL_READ`  | `for share skip locked`  | `lock in share mode skip locked` |
| `LockMode.PESSIMISTIC_READ_OR_FAIL`  | `for share nowait`       | `lock in share mode nowait`      |

Optionally you can also pass list of table aliases you want to lock via second parameter:

```ts
const qb = em.createQueryBuilder(User, 'u');
qb.select('*')
  .leftJoinAndSelect('u.identities', 'i')
  .where({ name: 'Jon' })
  .setLockMode(LockMode.PESSIMISTIC_READ, ['u']);

console.log(qb.getQuery()); // for Postgres
// select ...
//   from "user" as "u"
//   left join "identity" as "i" on "u"."id" = "i"."user_id"
//   where "u"."name" = 'Jon'
//   for update of "u" skip locked
```

## Collation

You can set a collation for `ORDER BY` expressions using the `collation()` method. This appends `COLLATE <collation>` to **every** column in the `ORDER BY` clause:

```ts
const qb = em.createQueryBuilder(User);
qb.select('*')
  .collation('utf8mb4_general_ci')
  .orderBy({ name: 'asc' });

console.log(qb.getQuery());
// select `e0`.* from `user` as `e0`
//   order by `e0`.`name` collate `utf8mb4_general_ci` asc
```

To use collation in `WHERE` conditions, use raw SQL fragments:

```ts
const qb = em.createQueryBuilder(User);
qb.select('*')
  .where({ [sql`name collate utf8mb4_general_ci`]: 'john' });

console.log(qb.getQuery());
// select `e0`.* from `user` as `e0`
//   where name collate `utf8mb4_general_ci` = ?
```

## Using Kysely

MikroORM builds SQL queries natively and executes them via [Kysely](https://kysely.dev/). You can access the configured Kysely instance via `em.getKysely()` method and use it to run your own queries:

```ts
const kysely = em.getKysely();

const results = await kysely
  .selectFrom('author')
  .selectAll()
  .where('id', '>', 100)
  .execute();

// map raw results to entities
const entities = results.map(row => em.map(Author, row));
```

You can also use Kysely query builders as raw fragments in MikroORM queries via the `raw()` helper:

```ts
import { raw } from '@mikro-orm/postgresql'; // or your driver package

const kysely = em.getKysely();
const kyselyQuery = kysely.selectFrom('author').select('id').where('active', '=', true);

const books = await em.find(Book, {
  author: { $in: raw(kyselyQuery) },
});
```

See [Kysely](./kysely.md) for more details on the Kysely integration.

### Migrating from Knex

If you are migrating from an older version that used Knex, you can use the `@mikro-orm/knex-compat` package which provides a `raw()` helper to convert Knex query builder instances to ORM raw fragments:

```ts
import { raw } from '@mikro-orm/knex-compat';

const knexQuery = knex.select('*').from('users');
const users = await em.find(User, { id: { $in: raw(knexQuery) } });
```

## Running Native SQL Query

You can run native SQL via `em.execute()`:

```ts
const res = await em.execute('select 1 as count');
console.log(res); // res is array of objects: `[ { count: 1 } ]`
```

This method handles logging, mapping of exceptions, and respects the current transaction context.
