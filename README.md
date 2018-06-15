# mikro-orm

Simple typescript mongo ORM for node.js based on data-mapper, unit-of-work and identity-map patterns.

Heavily inspired by [doctrine](https://www.doctrine-project.org/).

[![](https://img.shields.io/npm/v/mikro-orm.svg)](https://www.npmjs.com/package/mikro-orm)
[![](https://img.shields.io/npm/dm/mikro-orm.svg)](https://www.npmjs.com/package/mikro-orm)
[![Dependency Status](https://david-dm.org/B4nan/mikro-orm.svg)](https://david-dm.org/B4nan/mikro-orm)
[![Build Status](https://travis-ci.org/B4nan/mikro-orm.svg?branch=master)](https://travis-ci.org/B4nan/mikro-orm)
[![Coverage Status](https://img.shields.io/coveralls/B4nan/mikro-orm.svg)](https://coveralls.io/r/B4nan/mikro-orm?branch=master)

## Installation & Usage

Fist install the module via `yarn` or `npm`:

`$ yarn add mikro-orm`

or

`$ npm install mikro-orm --save`

Then call `MikroORM.init` as part of bootstrapping your app:

```typescript
import { MikroORM, Collection } from 'mikro-orm';

const orm = await MikroORM.init({
  entitiesDirs: ['entities'], // relative to `baseDir`
  dbName: 'my-db-name',
  clientUrl: 'mongodb://localhost:27017',
  baseDir: __dirname,
});
console.log(orm.em); // EntityManager
```

And do not forget to clear entity manager before each request if you do not want
to store all loaded entities in memory:

```typescript
const app = express();

app.use(function (req, res, next) {
  orm.em.clear();
  next();
});
```

Now you can define your entities (in one of the `entitiesDirs` folders):

### Defining entity

```typescript
import { BaseEntity, Entity, ManyToOne, Property } from 'mikro-orm';
import { Publisher } from './Publisher';
import { Author } from './Author';
import { BookRepository } from './BookRepository';

@Entity({ collection: 'books-table', customRepository: BookRepository })
export class Book extends BaseEntity {

  @Property()
  title: string;

  @ManyToOne({ entity: () => Author.name })
  author: Author;

  @ManyToOne({ entity: () => Publisher.name })
  publisher: Publisher;

  @Property()
  metaObject: object;

  @Property()
  metaArray: any[];

  @Property()
  metaArrayOfStrings: string[];

  constructor(title: string, author: Author) {
    super();
    this.title = title;
    this.author = author;
    this.metaObject = {};
    this.metaArray = [{test: 123, lol: true}];
    this.metaArrayOfStrings = ['test'];
  }

}
```

Now you can start using entity manager and repositories as described in following section. 
For more examples, take a look at `tests/EntityManager.test.ts`.

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

## Fetching entities with `EntityManager`

To fetch entities from database you can use `find()` and `findOne()` of `EntityManager`: 

API:

```typescript
EntityManager.getCollection(entityName: string): Collection; // returns mongodb Collection for given entity
EntityManager.getRepository<T extends BaseEntity>(entityName: string): EntityRepository<T>;
EntityManager.find<T extends BaseEntity>(entityName: string, where?: FilterQuery<T>, populate?: string[], orderBy?: { [k: string]: 1 | -1; }, limit?: number, offset?: number): Promise<T[]>;
EntityManager.findOne<T extends BaseEntity>(entityName: string, where: FilterQuery<T> | string, populate?: string[]): Promise<T>;
EntityManager.merge<T extends BaseEntity>(entityName: string, data: any): T;
EntityManager.getReference<T extends BaseEntity>(entityName: string, id: string): T;
EntityManager.remove(entityName: string, where: BaseEntity | any): Promise<number>;
EntityManager.removeEntity(entity: BaseEntity): Promise<number>;
EntityManager.count(entityName: string, where: any): Promise<number>;
EntityManager.persist(entity: BaseEntity | BaseEntity[], flush?: boolean): Promise<void>;
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

## Using `EntityRepository` instead of `EntityManager`

More convenient way of fetching entities from database is by using `EntityRepository`, that
carries the entity name so you do not have to pass it to every `find` and `findOne` calls:

API:

```typescript
EntityRepository.persist(entity: BaseEntity, flush?: boolean): Promise<void>;
EntityRepository.findOne(where: FilterQuery<BaseEntity> | string, populate?: string[]): Promise<BaseEntity>;
EntityRepository.find(where: FilterQuery<BaseEntity>, populate?: string[], orderBy?: { [k: string]: 1 | -1; }, limit?: number, offset?: number): Promise<BaseEntity[]>;
EntityRepository.findAll(populate?: string[], orderBy?: { [k: string]: 1 | -1; }, limit?: number, offset?: number): Promise<BaseEntity[]>;
EntityRepository.remove(where: BaseEntity | any): Promise<number>;
EntityRepository.flush(): Promise<void>;
EntityRepository.canPopulate(property: string): boolean;
EntityRepository.count(where?: any): Promise<number>;
```

Example:

```typescript
const booksRepository = orm.em.getRepository<Book>(Book.name);

// with sorting, limit and offset parameters, populating author references
const books = await booksRepository.find({ author: '...' }, ['author'], { title: -1 }, 2, 1);
console.log(books); // Book[]
```

### Custom repository

TODO

## Core features

### Identity Map

`MikroORM` uses identity map in background so you will always get the same instance of 
one entity.

```typescript
const authorRepository = orm.em.getRepository<Author>(Author.name);
const jon = await authorRepository.findOne({ name: 'Jon Snow' }, ['books']);
const authors = await authorRepository.findAll(['books']);

// identity map in action
console.log(jon === authors[0]); // true
```

If you want to clear this identity map cache, you can do so via `EntityManager.clear()` method:

```typescript
orm.em.clear();
```

### Entity references

Every single entity relation is mapped to an entity reference. Reference is an entity that has
only its identifier. This reference is stored in identity map so you will get the same object 
reference when fetching the same document from database.

You can call `await entity.init()` to initialize the entity. This will trigger database call 
and populate itself, keeping the same reference in identity map. 

```typescript
const author = await orm.em.getReference('...id...');
console.log(author.id); // accessing the id will not trigger any db call
console.log(author.isInitialized()); // false
console.log(author.name); // undefined

await author.init(); // this will trigger db call
console.log(author.isInitialized()); // true
console.log(author.name); // defined
```

### Using entity constructors

Internally, `MikroORM` never calls entity constructor, so you are free to use it as you wish.
The constructor will be called only when you instantiate the class yourself via `new` operator,
so it is a handy place to require your data when creating new entity.

For example following `Book` entity definition will always require to set `title` and `author`, 
but `publisher` will be optional:

```typescript
import { BaseEntity, Collection, Entity, ManyToMany, ManyToOne, Property } from 'mikro-orm';
import { Author } from './Author';
import { BookTag } from './BookTag';
import { Publisher } from './Publisher';

@Entity()
export class Book extends BaseEntity {

  @Property()
  title: string;

  @ManyToOne({ entity: () => Author.name })
  author: Author;

  @ManyToOne({ entity: () => Publisher.name })
  publisher: Publisher;

  @ManyToMany({ entity: () => BookTag.name, inversedBy: 'books' })
  tags: Collection<BookTag>;

  constructor(title: string, author: Author) {
    super();
    this.title = title;
    this.author = author;
  }

}
```

### `ObjectID` and `string` duality

Every entity has both `ObjectID` and `string` id available, also all methods of `EntityManager` 
and `EntityRepository` supports querying by both of them. 

```typescript
const author = await orm.em.getReference('...id...');
console.log(author.id);  // returns '...id...'
console.log(author._id); // returns ObjectID('...id...')

// all of those will return the same results
const article = '...article id...'; // string id
const book = '...book id...'; // string id
const repo = orm.em.getRepository<Author>(Author.name);
const foo1 = await repo.find({ id: { $in: [article] }, favouriteBook: book });
const bar1 = await repo.find({ id: { $in: [new ObjectID(article)] }, favouriteBook: new ObjectID(book) });
const foo2 = await repo.find({ _id: { $in: [article] }, favouriteBook: book });
const bar2 = await repo.find({ _id: { $in: [new ObjectID(article)] }, favouriteBook: new ObjectID(book) });
```

### Collections

`OneToMany` and `ManyToMany` collections are stored in a `Collection` wrapper. It implements
iterator so you can use `for of` loop to iterate through it. 

```typescript
const author = orm.em.findOne(Author.name, '...');

console.log(author.name); // Jon Snow

await author.books.init(); // init all books

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

// collection needs to be initialized before you can work with it
author.books.add(book);
console.log(author.books.contains(book)); // true
author.books.remove(book);
console.log(author.books.contains(book)); // false
author.books.add(book);
console.log(author.books.count()); // 1
author.books.removeAll();
console.log(author.books.contains(book)); // false
console.log(author.books.count()); // 0
console.log(author.books.getItems()); // 0
console.log(author.books.getIdentifiers()); // array of ObjectID
console.log(author.books.getIdentifiers('id')); // array of string
```

### Updating entity values with `BaseEntity.assign()`

When you want to update entity based on user input, you will usually have just plain
string ids of entity relations as user input. Normally you would need to use 
`EntityManager.getReference()` to create references from each id first, and then
use those references to update entity relations:

```typescript
const jon = new Author('Jon Snow', 'snow@wall.st');
const book = new Book('Book', jon);
book.assign({ 
  title: 'Better Book 1', 
  author: '...id...',
});
console.log(book.title); // 'Better Book 1'
console.log(book.author); // instnace of Author with id: '...id...'
console.log(book.author.id); // '...id...'
```

## TODO

- cascade persist in collections
- aggregate support?
- improve populating of collections in EM#find() method
- add nativeUpdate and nativeDelete (without hooks support), allow only entities in EM#remove
- cascade remove references on other entities when deleting entity (e.g. from M:N collection)

## TODO docs

- 1:M / M:1 collections
- many to many collections
- custom repository
- lifecycle hooks
