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
const author = orm.em.findOne(Author.name, '...id...');
const books = orm.em.find(Book.name, {});

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

Although you can use `EntityManager` directly, much more convenient way is to use 
[`EntityRepository` instead](https://b4nan.github.io/mikro-orm/repositories/). You can register
your repositories in dependency injection container like [InversifyJS](http://inversify.io/)
so you do not need to get them from `EntityManager` each time.

[&larr; Back to table of contents](https://b4nan.github.io/mikro-orm/#table-of-contents)
