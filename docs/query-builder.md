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
QueryBuilder.getQuery(): string;
QueryBuilder.getParams(): any;
QueryBuilder.clone(): QueryBuilder;
```

