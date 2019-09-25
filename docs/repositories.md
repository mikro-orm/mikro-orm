---
---

# Using EntityRepository instead of EntityManager

More convenient way of fetching entities from database is by using `EntityRepository`, that
carries the entity name so you do not have to pass it to every `find` and `findOne` calls:

Example:

```typescript
const booksRepository = orm.em.getRepository(Book);

// with sorting, limit and offset parameters, populating author references
const books = await booksRepository.find({ author: '...' }, ['author'], { title: QueryOrder.DESC }, 2, 1);

// or with options object
const books = await booksRepository.find({ author: '...' }, { 
  populate: ['author'],
  limit: 1,
  offset: 2,
  sort: { title: QueryOrder.DESC },
});

console.log(books); // Book[]
```

## Custom Repository

To use custom repository, just extend `EntityRepository<T>` class:

```typescript
export class CustomAuthorRepository extends EntityRepository<Author> {

  // your custom methods...
  public findAndUpdate(...) {
    // ...
  }

}
```

And register your repository as `@Entity` decorator:

```typescript
@Entity({ customRepository: () => CustomAuthorRepository })
export class Publisher {
  // ...
}
```

Note that we need to pass that repository reference inside a callback so we will not run
into circular dependency issues when using entity references inside that repository.

Now you can access your custom repository via `EntityManager.getRepository()` method.

> You can also register custom base repository (for all entities where you do not specify 
`customRepository`) globally, via `MikroORM.init({ entityRepository: CustomBaseRepository })`

For more examples, take a look at
[`tests/EntityManager.mongo.test.ts`](https://github.com/mikro-orm/mikro-orm/blob/master/tests/EntityManager.mongo.test.ts)
or [`tests/EntityManager.mysql.test.ts`](https://github.com/mikro-orm/mikro-orm/blob/master/tests/EntityManager.mongo.test.ts).

## EntityRepository\<T\> API

#### `find(where: FilterQuery<T>, options?: FindOptions): Promise<T[]>`

Returns array of entities found for given condition. You can specify `FindOptions` to request
population of referenced entities or control the pagination:

```typescript
export interface FindOptions {
  populate?: string[];
  orderBy?: { [k: string]: QueryOrder };
  limit?: number;
  offset?: number;
}
```

---

#### `find(where: FilterQuery<T>, populate?: string[], orderBy?: { [k: string]: QueryOrder }, limit?: number, offset?: number): Promise<T[]>`

Same as previous `find` method, just with dedicated parameters for `populate`, `orderBy`, `limit`
and `offset`.

---

#### `findAndCount(where: FilterQuery<T>, populate?: string[], orderBy?: { [k: string]: QueryOrder }, limit?: number, offset?: number): Promise<T[]>`

Combination of `find` and `count` methods. 

---

#### `findAll(options?: FindOptions): Promise<T[]>`

Returns all entities for given type. 

---

#### `findAll(populate?: string[], orderBy?: { [k: string]: QueryOrder }, limit?: number, offset?: number): Promise<T[]>`

Same as previous `findAll` method, just with dedicated parameters for `populate`, `orderBy`, `limit`
and `offset`.

---

#### `findOne(where: FilterQuery<T> | string, populate?: string[]): Promise<T | null>`

Finds an entity by given `where` condition. You can use primary key as `where` value, then
if the entity is already managed, no database call will be made. 

---

#### `findOneOrFail(where: FilterQuery<T> | string, populate?: string[]): Promise<T>`

Just like `findOne`, but throws when entity not found, so it always resolves to given entity. 
You can customize the error either globally via `findOneOrFailHandler` option, or locally via 
`failHandler` option in `findOneOrFail` call.

---

#### `merge(data: EntityData<T>): T`

Adds given entity to current Identity Map. After merging, entity becomes managed. 
This is useful when you want to work with cached entities. 

---

#### `getReference(id: string): T`

Gets a reference to the entity identified by the given type and identifier without actually 
loading it, if the entity is not yet loaded.

---

#### `count(where?: FilterQuery<T>): Promise<number>`

Gets count of entities matching the `where` condition. 

---

#### `persist(entity: IEntity | IEntity[], flush?: boolean): Promise<void>`

Tells the EntityManager to make an instance managed and persistent. The entity will be 
entered into the database at or before transaction commit or as a result of the flush 
operation. You can control immediate flushing via `flush` parameter and via `autoFlush`
configuration option. 

---

#### `persistAndFlush(entity: IEntity | IEntity[]): Promise<void>`

Shortcut for `persist` & `flush`.

---

#### `persistLater(entity: IEntity | IEntity[]): void`

Shortcut for just `persist`, without flushing. 

---

#### `flush(): Promise<void>`

Flushes all changes to objects that have been queued up to now to the database.

---

#### `remove(where: IEntity | FilterQuery<T>, flush?: boolean): Promise<number>`

When provided entity instance as `where` value, then it calls `removeEntity(entity, flush)`, 
otherwise it fires delete query with given `where` condition. 

This method fires `beforeDelete` and `afterDelete` hooks only if you provide entity instance.  

---

#### `removeAndFlush(entity: IEntity): Promise<void>`

Shortcut for `removeEntity` & `flush`.

This method fires `beforeDelete` and `afterDelete` hooks. 

---

#### `removeLater(entity: IEntity): void`

Shortcut for `removeEntity` without flushing. 

This method fires `beforeDelete` and `afterDelete` hooks. 

---

#### `canPopulate(property: string): boolean`

Returns whether given entity has given property which can be populated (is reference or
collection).

---

[&larr; Back to table of contents](index.md#table-of-contents)
