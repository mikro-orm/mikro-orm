---
title: Usage with MongoDB
---

To use `mikro-orm` with mongo database, do not forget to install `mongodb` dependency. As `MongoDriver`
is the default one, you do not need to provide it.

Then call `MikroORM.init` as part of bootstrapping your app:

```typescript
const orm = await MikroORM.init({
  entitiesDirs: ['entities'], // relative to `baseDir`
  dbName: 'my-db-name',
  clientUrl: '...',
});
```

## Defining entity

When defining entity, do not forget to define primary key like this:

```typescript
@PrimaryKey()
_id: ObjectId;
```

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
