---
---

# Using QueryBuilder

When you need to execute some SQL query without all the ORM stuff involved, you can either
compose the query yourself, or use the `QueryBuilder` helper to construct the query for you:

```typescript
const qb = orm.em.createQueryBuilder(Author);
qb.update({ name: 'test 123', type: PublisherType.GLOBAL }).where({ id: 123, type: PublisherType.LOCAL });

console.log(qb.getQuery());
// UPDATE `publisher2` SET `name` = ?, `type` = ? WHERE `id` = ? AND `type` = ?

console.log(qb.getParams());
// ['test 123', PublisherType.GLOBAL, 123, PublisherType.LOCAL]

// run the query
const res1 = await qb.execute();
```

`QueryBuilder` also supports [smart query conditions](query-conditions.md).

## Running native SQL query

You can run native SQL via underlying connection

```typescript
const connection = orm.em.getConnection();
const res = await connection.execute('SELECT 1 as count');
console.log(res); // res is array of objects: `[ { count: 1 } ]`
```

## Executing the query

You can use `execute(method = 'all', mapResults = true)`'s parameters to control form of result:

```typescript
const res1 = await qb.execute('all'); // returns array of objects, default behavior
const res2 = await qb.execute('get'); // returns single object
const res3 = await qb.execute('run'); // returns object like `{ affectedRows: number, insertId: number, row: any }`
```

Second argument can be used to disable mapping of database columns to property names (which 
is enabled by default). In following example, `Book` entity has `createdAt` property defined 
with implicit underscored field name `created_at`:

```typescript
const res4 = await orm.em.createQueryBuilder(Book).select('*').execute('get', true);
console.log(res4); // `createdAt` will be defined, while `created_at` will be missing
const res5 = await orm.em.createQueryBuilder(Book).select('*').execute('get', false);
console.log(res5); // `created_at` will be defined, while `createdAt` will be missing
```

To create entities from query builder result, you can use `merge()` method of `EntityManager`:

```typescript
const res6 = await orm.em.createQueryBuilder(Book).select('*').execute();
const entities = res6.map(data => orm.em.merge(Book, data));
console.log(entities); // array of Book entities
```

## Implicit joining

`QueryBuilder` supports automatic joining based on entity metadata:

```typescript
const qb = orm.em.createQueryBuilder(BookTag, 't');
qb.select('*').where({ books: 123 });

console.log(qb.getQuery());
// SELECT `t`.*, `e1`.`book_tag_id`, `e1`.`book_uuid_pk`
// FROM `book_tag` AS `t`
// LEFT JOIN `book_to_book_tag` AS `e1` ON `t`.`id` = `e1`.`book_tag_id`
// WHERE `e1`.`book_uuid_pk` = ?
```

## Explicit joining

Another way is to manually specify join property via `join()`/`leftJoin()` methods:

```typescript
const qb = orm.em.createQueryBuilder(BookTag, 't');
qb.select(['b.uuid', 'b.*', 't.*'], true)
  .join('t.books', 'b')
  .where({ 'b.title': 'test 123' })
  .limit(2, 1);

console.log(qb.getQuery());
// SELECT DISTINCT `b`.`uuid_pk`, `b`.*, `t`.*, `e1`.`book_tag_id`, `e1`.`book_uuid_pk` FROM `book_tag` AS `t`
// JOIN `book_to_book_tag` AS `e1` ON `t`.`id` = `e1`.`book_tag_id`
// JOIN `book` AS `b` ON `e1`.`book_uuid_pk` = `b`.`uuid_pk`
// WHERE `b`.`title` = ?
// LIMIT ? OFFSET ?
```

## Complex where conditions

There are multiple ways to construct complex query conditions. You can either write parts of SQL
manually, use `andWhere()`/`orWhere()`, or provide condition object:

### Custom SQL in where

```typescript
const qb = orm.em.createQueryBuilder(BookTag, 't');
qb.select(['b.*', 't.*'])
  .leftJoin('t.books', 'b')
  .where('b.title = ? OR b.title = ?', ['test 123', 'lol 321'])
  .andWhere('1 = 1')
  .orWhere('1 = 2')
  .limit(2, 1);

console.log(qb.getQuery());
// SELECT `b`.*, `t`.*, `e1`.`book_tag_id`, `e1`.`book_uuid_pk` FROM `book_tag` AS `t`
// LEFT JOIN `book_to_book_tag` AS `e1` ON `t`.`id` = `e1`.`book_tag_id`
// LEFT JOIN `book` AS `b` ON `e1`.`book_uuid_pk` = `b`.`uuid_pk`
// WHERE (((b.title = ? OR b.title = ?) AND (1 = 1)) OR (1 = 2))
// LIMIT ? OFFSET ?
```

### andWhere() and orWhere()

```typescript
const qb = orm.em.createQueryBuilder(BookTag, 't');
qb.select(['b.*', 't.*'])
  .leftJoin('t.books', 'b')
  .where('b.title = ? OR b.title = ?', ['test 123', 'lol 321'])
  .andWhere('1 = 1')
  .orWhere('1 = 2')
  .limit(2, 1);

console.log(qb.getQuery());
// SELECT `b`.*, `t`.*, `e1`.`book_tag_id`, `e1`.`book_uuid_pk` FROM `book_tag` AS `t`
// LEFT JOIN `book_to_book_tag` AS `e1` ON `t`.`id` = `e1`.`book_tag_id`
// LEFT JOIN `book` AS `b` ON `e1`.`book_uuid_pk` = `b`.`uuid_pk`
// WHERE (((b.title = ? OR b.title = ?) AND (1 = 1)) OR (1 = 2))
// LIMIT ? OFFSET ?
```

### Condition object

```typescript
const qb = orm.em.createQueryBuilder(Test);
qb.select('*').where({ $and: [{ id: { $nin: [3, 4] } }, { id: { $gt: 2 } }] });

console.log(qb.getQuery());
// SELECT `e0`.* FROM `test` AS `e0` WHERE (`e0`.`id` NOT IN (?, ?) AND `e0`.`id` > ?)
```

## Locking support

```typescript
const qb = orm.em.createQueryBuilder(Test);
qb.select('*').where({ name: 'Lol 321' }).setLockMode(LockMode.PESSIMISTIC_READ);

console.log(qb.getQuery()); // for MySQL
// SELECT `e0`.* FROM `test` AS `e0` WHERE `e0`.`name` = ? LOCK IN SHARE MODE
```

## QueryBuilder API

`QueryBuilder` provides fluent interface with these methods:

```typescript
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
QueryBuilder.setLockMode(mode: LockMode): QueryBuilder;
QueryBuilder.getQuery(): string;
QueryBuilder.getParams(): any;
QueryBuilder.clone(): QueryBuilder;
```

