# mikro-orm

Simple typescript mongo ORM for node.js based on data-mapper, unit-of-work and identity-map patterns.

Heavily inspired by [doctrine](https://www.doctrine-project.org/).

[![](https://img.shields.io/npm/v/mikro-orm.svg)](https://www.npmjs.com/package/mikro-orm)
[![](https://img.shields.io/npm/dm/mikro-orm.svg)](https://www.npmjs.com/package/mikro-orm)
[![Dependency Status](https://david-dm.org/B4nan/mikro-orm.svg)](https://david-dm.org/B4nan/mikro-orm)
[![Build Status](https://travis-ci.org/B4nan/mikro-orm.svg?branch=master)](https://travis-ci.org/B4nan/mikro-orm)
[![Coverage Status](https://img.shields.io/coveralls/B4nan/mikro-orm.svg)](https://coveralls.io/r/B4nan/mikro-orm?branch=master)


## Defining entity

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

## Installation

`$ yarn add mikro-orm`

or

`$ npm install mikro-orm`

## Usage

For more examples, take a look at `tests/EntityManager.test.ts`.

```typescript
import { MikroORM, Collection } from 'mikro-orm';

const orm = await MikroORM.init({
  entitiesDirs: ['entities'], // relative to `baseDir`
  dbName: 'my-db-name',
  baseDir: __dirname,
});
console.log(orm.em); // EntityManager
```

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

To fetch entities from database you can use `find()` and `findOne()` of `EntityManager`. 

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

More convenient way of fetching entities from database is by using `EntityRepository`:

```typescript
const booksRepository = orm.em.getRepository<Book>(Book.name);

// with sorting, limit and offset parameters, populating author references
const books = await booksRepository.find({ author: '...' }, ['author'], { title: -1 }, 2, 1);
console.log(books); // Book[]
```

### Custom repository

TODO

## Identity Map

`MikroORM` uses identity map in background so you will always get the same instance of 
one entity.

```typescript
const authorRepository = orm.em.getRepository<Author>(Author.name);
const jon = await authorRepository.findOne({ name: 'Jon Snow' }, ['books']);
const authors = await authorRepository.findAll(['books']);

// identity map in action
console.log(jon === authors[0]); // true
```

## Using references

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

## Collections

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

## Using entity constructors

Internally, `MikroORM` never calls entity constructor, so you are free to use it as you wish.
The constructor will be called only when you instantiate the class yourself via `new` operator.

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
