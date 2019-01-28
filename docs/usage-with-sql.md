# Usage with MySQL and SQLite

To use `mikro-orm` with MySQL database, do not forget to install `mysql2` dependency and provide
`MySqlDriver` class when initializing ORM.

Similarly for SQLite install `sqlite` dependency and provide `SqliteDriver`.

Then call `MikroORM.init` as part of bootstrapping your app:

```typescript
const orm = await MikroORM.init({
  entitiesDirs: ['entities'], // relative to `baseDir`
  dbName: 'my-db-name',
  driver: MySqlDriver,
});
```

Currently you will need to maintain the database schema yourself. 

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

You can adjust the name of pivot table via `pivotTable` option in `@ManyToMany` decorator
defined on owning side: 

```typescript
// for unidirectional
@ManyToMany({ entity: () => Test.name, owner: true, pivotTable: 'publisher2test' })
tests = new Collection<Test>(this);

// for bidirectional
@ManyToMany({ entity: () => BookTag, inversedBy: 'books', pivotTable: 'book2tag' })
tags = new Collection<BookTag>(this);
```

## Using QueryBuilder to execute native SQL queries

When you need to execute some SQL query without all the ORM stuff involved, you can either
compose the query yourself, or use the `QueryBuilder` helper to construct the query for you:

```typescript
const qb = orm.em.createQueryBuilder(Author.name);
qb.update({ name: 'test 123', type: PublisherType.GLOBAL }).where({ id: 123, type: PublisherType.LOCAL });

console.log(qb.getQuery());
// 'UPDATE `publisher2` SET `name` = ?, `type` = ? WHERE `id` = ? AND `type` = ?'

console.log(qb.getParams());
// ['test 123', PublisherType.GLOBAL, 123, PublisherType.LOCAL]

// run the query
const driver = orm.em.getDriver<MySqlDriver>();
const res1 = await driver.execute(qb);

// or run query without using QueryBuilder
const res2 = await driver.execute('SELECT ? + ?', [1, 2]);
```

`QueryBuilder` provides fluent interface with these methods:

```typescript
QueryBuilder.select(fields: string | string[]): QueryBuilder;
QueryBuilder.insert(data: any): QueryBuilder;
QueryBuilder.update(data: any): QueryBuilder;
QueryBuilder.delete(cond: any): QueryBuilder;
QueryBuilder.count(fields: string | string[]): QueryBuilder;
QueryBuilder.where(cond: any): QueryBuilder;
QueryBuilder.populate(populate: string[]): QueryBuilder;
QueryBuilder.limit(limit: number, offset?: number): QueryBuilder;
QueryBuilder.offset(offset: number): QueryBuilder;
QueryBuilder.getQuery(): string;
QueryBuilder.getParams(): any;
```

For more examples of how to work with `QueryBuilder`, take a look at `QueryBuilder` tests in 
[`tests/QueryBuilder.test.ts`](https://github.com/B4nan/mikro-orm/blob/master/tests/QueryBuilder.test.ts).

## Transactions

MySQL driver provides basic support for transactions via `begin/commit/rollback` methods on both 
`MySqlDriver` and their shortcuts on `EntityManager` as well. 

You can also use `EntityManager.transactional(cb)` helper to run callback in transaction. It will
provide forked `EntityManager` as a parameter with clear clear isolated identity map - please use that
to make changes. 

```typescript
// if an error occurs inside the callback, all db queries from inside the callback will be rolled back
await orm.em.transactional(async (em: EntityManager) => {
  const god = new Author('God', 'hello@heaven.god');
  await em.persist(god);
});
```

```typescript
EntityManager.begin(): Promise<void>;
EntityManager.commit(): Promise<void>;
EntityManager.rollback(): Promise<void>;
EntityManager.transactional(cb: (em: EntityManager) => Promise<any>): Promise<any>;
```

Keep in mind transactions are supported only in MySQL driver currently. 

## Native collection methods

Sometimes you need to perform some bulk operation, or you just want to populate your
database with initial fixtures. Using ORM for such operations can bring unnecessary
boilerplate code. In this case, you can use one of `nativeInsert/nativeUpdate/nativeDelete`
methods:

```typescript
EntityManager.nativeInsert<T extends IEntity>(entityName: string, data: any): Promise<IPrimaryKey>;
EntityManager.nativeUpdate<T extends IEntity>(entityName: string, where: FilterQuery<T>, data: any): Promise<number>;
EntityManager.nativeDelete<T extends IEntity>(entityName: string, where: FilterQuery<T> | any): Promise<number>;
```

Those methods execute native SQL queries generated via `QueryBuilder` based on entity 
metadata. Keep in mind that they do not hydrate results to entities, and they do not 
trigger lifecycle hooks. 

They are also available as `EntityRepository` shortcuts:

```typescript
EntityRepository.nativeInsert(data: any): Promise<IPrimaryKey>;
EntityRepository.nativeUpdate(where: FilterQuery<T>, data: any): Promise<number>;
EntityRepository.nativeDelete(where: FilterQuery<T> | any): Promise<number>;
```

Additionally there is `execute()` method that supports executing raw SQL queries or `QueryBuilder`
instances. To create `QueryBuilder`, you can use `createQueryBuilder()` factory method on both 
`EntityManager` and `EntityRepository` classes: 

```typescript
const qb = em.createQueryBuilder('Author');
qb.select('*').where({ id: { $in: [...] } });
const res = await em.getDriver<MySqlDriver>().execute(qb);
console.log(res); // unprocessed result of underlying database driver
```

[&larr; Back to table of contents](index.md#table-of-contents)
