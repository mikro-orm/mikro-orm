---
title: Usage with MongoDB
---

To use MikroORM with mongo database, do not forget to install `@mikro-orm/mongodb`
dependency. Then call `MikroORM.init()` as part of bootstrapping your app:

> We need to use `clientUrl` to setup hosts, using `host` or `port` is not supported.

```typescript
const orm = await MikroORM.init({
  entities: [Author, Book, ...],
  dbName: 'my-db-name',
  clientUrl: '...',
  type: 'mongo',
});
```

## Defining entity

When defining entity, do not forget to define primary key like this:

```typescript
@PrimaryKey()
_id: ObjectId;

@SerializedPrimaryKey()
id!: string; // won't be saved in the database
```

> Only `_id: ObjectId` will be saved in the database. `id: string` is virtual and is 
> also optional. 

## ObjectId and string id duality

Every entity has both `ObjectId` and `string` id available, also all methods of `EntityManager` 
and `EntityRepository` supports querying by both of them. 

```typescript
const author = orm.em.getReference('...id...');
console.log(author.id);  // returns '...id...'
console.log(author._id); // returns ObjectId('...id...')

// all of those will return the same results
const article = '...article id...'; // string id
const book = '...book id...'; // string id
const repo = orm.em.getRepository(Author);
const foo1 = await repo.find({ id: { $in: [article] }, favouriteBook: book });
const bar1 = await repo.find({ id: { $in: [new ObjectId(article)] }, favouriteBook: new ObjectId(book) });
const foo2 = await repo.find({ _id: { $in: [article] }, favouriteBook: book });
const bar2 = await repo.find({ _id: { $in: [new ObjectId(article)] }, favouriteBook: new ObjectId(book) });
```

## ManyToMany collections with inlined pivot array

As opposed to SQL drivers that use pivot tables, in mongo we can leverage available array type
to store array of collection items (identifiers). This approach has two main benefits:

1. Collection is stored on owning side entity, so we know how many items are there even before
initializing the collection.
2. As there are no pivot tables, resulting database queries are much simpler.

## Transactions

Starting with v3.4, MongoDB driver supports transactions. To use transactions, there
are several things you need to respect:

- you need to use replica set (see [run-rs](https://github.com/vkarpov15/run-rs))
- implicit transactions are disabled by default
    - use `implicitTransactions: true` to enable them globally
    - or use explicit transaction demarcation via `em.transactional()`
- you need to explicitly create all collections before working with them
    - use `em.getDriver().createCollections()` method to do so

```sh
# first create replica set
$ run-rs -v 4.2.3
```

```typescript
import { MikroORM } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';

// make sure to provide the MongoDriver type hint
const orm = await MikroORM.init<MongoDriver>({
  entities: [Author, Book, ...],
  clientUrl: 'mongodb://localhost:27017,localhost:27018,localhost:27019/my-db-name?replicaSet=rs0',
  type: 'mongo',
  implicitTransactions: true, // defaults to false
});

await orm.em.getDriver().createCollections();
```

> The `createCollections` method is present on the `MongoDriver` class only. You need 
> to have the entity manager correctly typed (as `EntityManager<MongoDriver>`).

## Indexes

Starting with v3.4, MongoDB driver supports indexes and unique constraints. You can 
use `@Index()` and `@Unique()` as described in [Defining Entities section](defining-entities.md#indexes).
To automatically create new indexes when initializing the ORM, you need to enable
`ensureIndexes` option. 

```typescript
const orm = await MikroORM.init({
  entities: [Author, Book, ...],
  dbName: 'my-db-name',
  type: 'mongo',
  ensureIndexes: true, // defaults to false
});
``` 

Alternatively you can call `ensureIndexes()` method on the `MongoDriver`:

```typescript
await orm.em.getDriver().ensureIndexes();
```

> You can pass additional index/unique options via `options` parameter:
> 
> `@Unique({ options: { partialFilterExpression: { name: { $exists: true } } }})`

> You can also create text indexes by passing `type` parameter:
> 
> `@Index({ properties: ['name', 'caption'], type: 'text' })`

> If you provide only `options` in the index definition, it will be used as is, 
> this allows to define any kind of index:
>
> `@Index({ options: { point: '2dsphere', title: -1 } })` 

## Native collection methods

Sometimes you need to perform some bulk operation, or you just want to populate your
database with initial fixtures. Using ORM for such operations can bring unnecessary
boilerplate code. In this case, you can use one of `nativeInsert/nativeUpdate/nativeDelete`
methods:

```typescript
em.nativeInsert<T extends AnyEntity>(entityName: string, data: any): Promise<IPrimaryKey>;
em.nativeUpdate<T extends AnyEntity>(entityName: string, where: FilterQuery<T>, data: any): Promise<number>;
em.nativeDelete<T extends AnyEntity>(entityName: string, where: FilterQuery<T> | any): Promise<number>;
```

Those methods execute native driver methods like Mongo's `insertOne/updateMany/deleteMany` collection methods respectively. 
This is common interface for all drivers, so for MySQL driver, it will fire native SQL queries. 
Keep in mind that they do not hydrate results to entities, and they do not trigger lifecycle hooks. 

They are also available as `EntityRepository` shortcuts:

```typescript
EntityRepository.nativeInsert(data: any): Promise<IPrimaryKey>;
EntityRepository.nativeUpdate(where: FilterQuery<T>, data: any): Promise<number>;
EntityRepository.nativeDelete(where: FilterQuery<T> | any): Promise<number>;
```

There is also shortcut for calling `aggregate` method:

```typescript
em.aggregate(entityName: string, pipeline: any[]): Promise<any[]>;
EntityRepository.aggregate(pipeline: any[]): Promise<any[]>;
```
