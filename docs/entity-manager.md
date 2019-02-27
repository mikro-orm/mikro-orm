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
await orm.em.persist([book1, book2, book3]);

// or one by one
await orm.em.persist(book1, false);
await orm.em.persist(book2, false);
await orm.em.persist(book3); // flush everything to database at once
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

API:

```typescript
EntityManager.getRepository<T extends IEntity>(entityName: string): EntityRepository<T>;
EntityManager.find<T extends IEntity>(entityName: string, where?: FilterQuery<T>, populate?: string[], orderBy?: { [k: string]: 1 | -1; }, limit?: number, offset?: number): Promise<T[]>;
EntityManager.findOne<T extends IEntity>(entityName: string, where: FilterQuery<T> | string, populate?: string[]): Promise<T>;
EntityManager.merge<T extends IEntity>(entityName: string, data: any): T;
EntityManager.getReference<T extends IEntity>(entityName: string, id: string): T;
EntityManager.remove(entityName: string, where: IEntity | any): Promise<number>;
EntityManager.removeEntity(entity: IEntity): Promise<number>;
EntityManager.count(entityName: string, where: any): Promise<number>;
EntityManager.persist(entity: IEntity | IEntity[], flush?: boolean): Promise<void>;
EntityManager.flush(): Promise<void>;
EntityManager.clear(): void;
EntityManager.canPopulate(entityName: string, property: string): boolean;
```

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

[&larr; Back to table of contents](index.md#table-of-contents)
