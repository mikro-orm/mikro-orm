---
title: Working with Entity Manager
sidebar_label: Entity Manager
---

## Persist and Flush

There are 2 methods we should first describe to understand how persisting works in MikroORM: 
`em.persist()` and `em.flush()`.

`em.persist(entity, flush?: boolean)` is used to mark new entities for future persisting. 
It will make the entity managed by given `EntityManager` and once `flush` will be called, it 
will be written to the database. Second boolean parameter can be used to invoke `flush` 
immediately. Its default value is configurable via `autoFlush` option.

To understand `flush`, lets first define what managed entity is: An entity is managed if 
it’s fetched from the database (via `em.find()`, `em.findOne()` or via other managed entity) 
or registered as new through `em.persist()`.

`em.flush()` will go through all managed entities, compute appropriate change sets and 
perform according database queries. As an entity loaded from database becomes managed 
automatically, you do not have to call persist on those, and flush is enough to update 
them.

```typescript
const book = await orm.em.findOne(Book, 1);
book.title = 'How to persist things...';

// no need to persist `book` as its already managed by the EM
await orm.em.flush();
```

## Persisting and Cascading

To save entity state to database, you need to persist it. Persist takes care or deciding 
whether to use `insert` or `update` and computes appropriate change-set. Entity references
that are not persisted yet (does not have identifier) will be cascade persisted automatically. 

```typescript
// use constructors in your entities for required parameters
const author = new Author('Jon Snow', 'snow@wall.st');
author.born = new Date();

const publisher = new Publisher('7K publisher');

const book1 = new Book('My Life on The Wall, part 1', author);
book1.publisher = publisher;
const book2 = new Book('My Life on The Wall, part 2', author);
book2.publisher = publisher;
const book3 = new Book('My Life on The Wall, part 3', author);
book3.publisher = publisher;

// just persist books, author and publisher will be automatically cascade persisted
await orm.em.persistAndFlush([book1, book2, book3]);

// or one by one
orm.em.persistLater(book1);
orm.em.persistLater(book2);
orm.em.persistLater(book3); 
await orm.em.flush(); // flush everything to database at once
```

### Auto-flushing

Since MikroORM v3, default value for `autoFlush` is `false`. That means you need to call 
`em.flush()` yourself to persist changes into database. You can still change this via ORM's
options to ease the transition but generally it is not recommended as it can cause unwanted
small transactions being created around each `persist`. 

```typescript
orm.em.persist(new Entity()); // no auto-flushing by default
await orm.em.flush();
await orm.em.persist(new Entity(), true); // you can still use second parameter to auto-flush
```

## Fetching Entities with EntityManager

To fetch entities from database you can use `find()` and `findOne()` of `EntityManager`: 

Example:

```typescript
const author = await orm.em.findOne(Author, '...id...');
const books = await orm.em.find(Book, {});

for (const author of authors) {
  console.log(author.name); // Jon Snow

  for (const book of author.books) {
    console.log(book.title); // initialized
    console.log(book.author.isInitialized()); // true
    console.log(book.author.id);
    console.log(book.author.name); // Jon Snow
    console.log(book.publisher); // just reference
    console.log(book.publisher.isInitialized()); // false
    console.log(book.publisher.id);
    console.log(book.publisher.name); // undefined
  }
}
```

### Conditions Object (`FilterQuery<T>`)

Querying entities via conditions object (`where` in `em.find(Entity, where: FilterQuery<T>)`) 
supports many different ways:

```typescript
// search by entity properties
const users = await orm.em.find(User, { firstName: 'John' });

// for searching by reference you can use primary key directly
const id = 1;
const users = await orm.em.find(User, { organization: id });

// or pass unpopulated reference (including `Reference` wrapper)
const ref = await orm.em.getReference(Organization, id);
const users = await orm.em.find(User, { organization: ref });

// fully populated entities as also supported
const ent = await orm.em.findOne(Organization, id);
const users = await orm.em.find(User, { organization: ent });

// complex queries with operators
const users = await orm.em.find(User, { $and: [{ id: { $nin: [3, 4] } }, { id: { $gt: 2 } }] });

// you can also search for array of primary keys directly
const users = await orm.em.find(User, [1, 2, 3, 4, 5]);

// and in findOne all of this works, plus you can search by single primary key
const user1 = await orm.em.findOne(User, 1);
```

As you can see in the fifth example, one can also use operators like `$and`, `$or`, `$gte`, 
`$gt`, `$lte`, `$lt`, `$in`, `$nin`, `$eq`, `$ne`. More about that can be found in 
[Query Conditions](query-conditions.md) section. 

#### Mitigating `Type instantiation is excessively deep and possibly infinite.ts(2589)` error

Sometimes you might be facing TypeScript errors caused by too complex query for it to 
properly infer all types. Usually it can be solved by providing the type argument 
explicitly.

You can also opt in to use repository instead, as there the type inference should not be
problematic. 

> As a last resort, you can always type cast the query to `any`.

```typescript
const books = await orm.em.find<Book>(Book, { ... your complex query ... });
// or
const books = await orm.em.getRepository(Book).find({ ... your complex query ... });
// or
const books = await orm.em.find<any>(Book, { ... your complex query ... }) as Book[];
```

Another problem you might be facing is `RangeError: Maximum call stack size exceeded` error 
thrown during TypeScript compilation (usually from file `node_modules/typescript/lib/typescript.js`).
The solution to this is the same, just provide the type argument explicitly.

### Searching by referenced entity fields

You can also search by referenced entity properties. Simply pass nested where condition like 
this and all requested relationships will be automatically joined. Currently it will only join 
them so you can search and sort by those. To populate entities, do not forget to pass the populate 
parameter as well. 

```typescript
// find author of a book that has tag specified by name
const author = await orm.em.findOne(Author, { books: { tags: { name: 'Tag name' } } });
console.log(author.books.isInitialized()); // false, as it only works for query and sort

const author = await orm.em.findOne(Author, { books: { tags: { name: 'Tag name' } } }, ['books.tags']);
console.log(author.books.isInitialized()); // true, because it was populated
console.log(author.books[0].tags.isInitialized()); // true, because it was populated
console.log(author.books[0].tags[0].isInitialized()); // true, because it was populated
```

### Fetching Partial Entities

When fetching single entity, you can choose to select only parts of an entity via `options.fields`:

```typescript
const author = await orm.em.findOne(Author, '...', { fields: ['name', 'born'] });
console.log(author.id); // PK is always selected
console.log(author.name); // Jon Snow
console.log(author.email); // undefined
```

### Fetching Paginated Results

If you are going to paginate your results, you can use `em.findAndCount()` that will return
total count of entities before applying limit and offset.

```typescript
const [authors, count] = await orm.em.findAndCount(Author, { ... }, { limit: 10, offset: 50 });
console.log(authors.length); // based on limit parameter, e.g. 10
console.log(count); // total count, e.g. 1327
```

### Handling Not Found Entities

When you call `em.findOne()` and no entity is found based on your criteria, `null` will be 
returned. If you rather have an `Error` instance thrown, you can use `em.findOneOrFail()`:

```typescript
const author = await orm.em.findOne(Author, { name: 'does-not-exist' });
console.log(author === null); // true

try {
  const author = await orm.em.findOneOrFail(Author, { name: 'does-not-exist' });
  // author will be always found here
} catch (e) {
  console.error('Not found', e);
}
```

You can customize the error either globally via `findOneOrFailHandler` option, or locally via 
`failHandler` option in `findOneOrFail` call.

```typescript
try {
  const author = await orm.em.findOneOrFail(Author, { name: 'does-not-exist' }, {
    failHandler: (entityName: string, where: Record<string, any> | IPrimaryKey) => new Error(`Failed: ${entityName} in ${util.inspect(where)}`)
  });
} catch (e) {
  console.error(e); // your custom error
}
```

## Type of Fetched Entities

Both `em.find` and `em.findOne()` methods have generic return types.
All of following examples are equal and will let typescript correctly infer the entity type:

```typescript
const author1 = await orm.em.findOne<Author>(Author.name, '...id...');
const author2 = await orm.em.findOne<Author>('Author', '...id...');
const author3 = await orm.em.findOne(Author, '...id...');
```

As the last one is the least verbose, it should be preferred. 

## Entity Repositories

Although you can use `EntityManager` directly, much more convenient way is to use 
[`EntityRepository` instead](https://mikro-orm.io/repositories/). You can register
your repositories in dependency injection container like [InversifyJS](http://inversify.io/)
so you do not need to get them from `EntityManager` each time.

For more examples, take a look at
[`tests/EntityManager.mongo.test.ts`](https://github.com/mikro-orm/mikro-orm/blob/master/tests/EntityManager.mongo.test.ts)
or [`tests/EntityManager.mysql.test.ts`](https://github.com/mikro-orm/mikro-orm/blob/master/tests/EntityManager.mysql.test.ts).

## EntityManager API

#### `getRepository<T extends AnyEntity>(entityName: string | EntityClass<T>): EntityRepository<T>`

Returns `EntityRepository` for given entity, respects `customRepository` option of `@Entity`
and `entityRepository` option of `MikroORM.init()`.

#### `find<T extends AnyEntity>(entityName: string | EntityClass<T>, where: FilterQuery<T>, options?: FindOptions): Promise<T[]>`

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

#### `find<T extends AnyEntity>(entityName: string | EntityClass<T>, where: FilterQuery<T>, populate?: string[], orderBy?: { [k: string]: QueryOrder }, limit?: number, offset?: number): Promise<T[]>`

Same as previous `find` method, just with dedicated parameters for `populate`, `orderBy`, `limit`
and `offset`.

---

#### `findAndCount<T extends AnyEntity>(entityName: string | EntityClass<T>, where: FilterQuery<T>, populate?: string[], orderBy?: { [k: string]: QueryOrder }, limit?: number, offset?: number): Promise<[T[], number]>`

Combination of `find` and `count` methods. 

---

#### `findOne<T extends AnyEntity>(entityName: string | EntityClass<T>, where: FilterQuery<T> | IPrimaryKey, populate?: string[]): Promise<T | null>`

Finds an entity by given `where` condition. You can use primary key as `where` value, then
if the entity is already managed, no database call will be made. 

---

#### `findOneOrFail<T extends AnyEntity>(entityName: string | EntityClass<T>, where: FilterQuery<T> | IPrimaryKey, populate?: string[]): Promise<T>`

Just like `findOne`, but throws when entity not found, so it always resolves to given entity. 
You can customize the error either globally via `findOneOrFailHandler` option, or locally via 
`failHandler` option in `findOneOrFail` call.

---

#### `merge<T extends AnyEntity>(entityName: string | EntityClass<T>, data: EntityData<T>): T`

Adds given entity to current Identity Map. After merging, entity becomes managed. 
This is useful when you want to work with cached entities. 

---

#### `map<T extends AnyEntity>(entityName: string | EntityClass<T>, data: EntityData<T>): T`

Maps raw DB result to entity, adding it to current Identity Map. Equivalent to 
`IDatabaseDriver.mapResult()` followed by `em.merge()`.

---

#### `getReference<T extends AnyEntity>(entityName: string | EntityClass<T>, id: string): T`

Gets a reference to the entity identified by the given type and identifier without actually 
loading it, if the entity is not yet loaded.

---

#### `count(entityName: string | EntityClass<T>, where?: FilterQuery<T>): Promise<number>`

Gets count of entities matching the `where` condition. 

---

#### `persist(entity: AnyEntity | AnyEntity[], flush?: boolean): void | Promise<void>`

Tells the EntityManager to make an instance managed and persistent. The entity will be 
entered into the database at or before transaction commit or as a result of the flush 
operation. You can control immediate flushing via `flush` parameter and via `autoFlush`
configuration option. 

---

#### `persistAndFlush(entity: AnyEntity | AnyEntity[]): Promise<void>`

Shortcut for `persist` & `flush`.

---

#### `persistLater(entity: AnyEntity | AnyEntity[]): void`

Shortcut for just `persist`, without flushing. 

---

#### `flush(): Promise<void>`

Flushes all changes to objects that have been queued up to now to the database.

---

#### `remove(entityName: string | EntityClass<T>, where: AnyEntity | FilterQuery<T> | IPrimaryKey, flush?: boolean): Promise<number>`

When provided entity instance as `where` value, then it calls `removeEntity(entity, flush)`, 
otherwise it fires delete query with given `where` condition. 

This method fires `beforeDelete` and `afterDelete` hooks only if you provide entity instance.  

---

#### `removeEntity(entity: AnyEntity, flush?: boolean): Promise<number>`

Removes an entity instance. A removed entity will be removed from the database at or before 
transaction commit or as a result of the flush operation. You can control immediate flushing 
via `flush` parameter and via `autoFlush` configuration option.

This method fires `beforeDelete` and `afterDelete` hooks.  

---

#### `removeAndFlush(entity: AnyEntity): Promise<void>`

Shortcut for `removeEntity` & `flush`.

---

#### `removeLater(entity: AnyEntity): void`

Shortcut for `removeEntity` without flushing. 

---

#### `clear(): void`

Clears the EntityManager. All entities that are currently managed by this EntityManager 
become detached.

---

#### `canPopulate(entityName: string | EntityClass<T>, property: string): boolean`

Returns whether given entity has given property which can be populated (is reference or
collection).

---
