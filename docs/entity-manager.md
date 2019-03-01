# Working with EntityManager

## Persisting and cascading

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

### Auto flushing

By default, `EntityManager.persist()` will **flush your changes automatically**. You can use
its second parameter to disable auto-flushing, and use `EntityManager.flush()` manually. 

You can also disable this feature globally via `autoFlush` option when initializing the ORM:

```typescript
const orm = await MikroORM.init({
  autoFlush: false,
  // ...
});
await orm.em.persist(new Entity()); // no auto-flushing now
await orm.em.flush();
await orm.em.persist(new Entity(), true); // you can still use second parameter to auto-flush
```

## Fetching entities with EntityManager

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

## Type of fetched entities

Both `EntityManager.find` and `EntityManager.findOne()` methods have generic return types.
All of following examples are equal and will let typescript correctly infer the entity type:

```typescript
const author1 = await orm.em.findOne<Author>(Author.name, '...id...');
const author2 = await orm.em.findOne<Author>('Author', '...id...');
const author3 = await orm.em.findOne(Author, '...id...');
```

As the last one is the least verbose, it should be preferred. 

## Entity repositories

Although you can use `EntityManager` directly, much more convenient way is to use 
[`EntityRepository` instead](https://b4nan.github.io/mikro-orm/repositories/). You can register
your repositories in dependency injection container like [InversifyJS](http://inversify.io/)
so you do not need to get them from `EntityManager` each time.

For more examples, take a look at
[`tests/EntityManager.mongo.test.ts`](https://github.com/B4nan/mikro-orm/blob/master/tests/EntityManager.mongo.test.ts)
or [`tests/EntityManager.mysql.test.ts`](https://github.com/B4nan/mikro-orm/blob/master/tests/EntityManager.mongo.test.ts).

## EntityManager API

#### `getRepository<T extends IEntity>(entityName: string | EntityClass<T>): EntityRepository<T>`

Returns `EntityRepository` for given entity, respects `customRepository` option of `@Entity`
and `entityRepository` option of `MikroORM.init()`.

#### `find<T extends IEntity>(entityName: string | EntityClass<T>, where?: FilterQuery<T>, options?: FindOptions): Promise<T[]>`

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

#### `find<T extends IEntity>(entityName: string | EntityClass<T>, where?: FilterQuery<T>, populate?: string[], orderBy?: { [k: string]: QueryOrder }, limit?: number, offset?: number): Promise<T[]>`

Same as previous `find` method, just with dedicated parameters for `populate`, `orderBy`, `limit`
and `offset`.

---

#### `findOne<T extends IEntity>(entityName: string | EntityClass<T>, where: FilterQuery<T> | string, populate?: string[]): Promise<T | null>`

Finds an entity by given `where` condition. You can use primary key as `where` value, then
if the entity is already managed, no database call will be made. 

---

#### `merge<T extends IEntity>(entityName: string | EntityClass<T>, data: EntityData<T>): T`

Adds given entity to current Identity Map. After merging, entity becomes managed. 
This is useful when you want to work with cached entities. 

---

#### `getReference<T extends IEntity>(entityName: string | EntityClass<T>, id: string): T`

Gets a reference to the entity identified by the given type and identifier without actually 
loading it, if the entity is not yet loaded.

---

#### `count(entityName: string | EntityClass<T>, where: any): Promise<number>`

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

#### `remove(entityName: string | EntityClass<T>, where: IEntity | any, flush?: boolean): Promise<number>`

When provided entity instance as `where` value, then it calls `removeEntity(entity, flush)`, 
otherwise it fires delete query with given `where` condition. 

This method fires `beforeDelete` and `afterDelete` hooks only if you provide entity instance.  

---

#### `removeEntity(entity: IEntity, flush?: boolean): Promise<number>`

Removes an entity instance. A removed entity will be removed from the database at or before 
transaction commit or as a result of the flush operation. You can control immediate flushing 
via `flush` parameter and via `autoFlush` configuration option.

This method fires `beforeDelete` and `afterDelete` hooks.  

---

#### `removeAndFlush(entity: IEntity): Promise<void>`

Shortcut for `removeEntity` & `flush`.

---

#### `removeLater(entity: IEntity): void`

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

[&larr; Back to table of contents](index.md#table-of-contents)
