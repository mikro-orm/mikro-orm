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
import { Author } from './entities/Author';
import { Published } from './entities/Published';
import { Book } from './entities/Book';

const orm = await MikroORM.init({
  entitiesDirs: ['entities'], // relative to `baseDir`
  dbName: 'my-db-name',
  baseDir: __dirname,
});

// use constructors in your entities
const author = new Author('Jon Snow', 'snow@wall.st');
author.born = new Date();

const publisher = new Publisher('7K publisher');

const book1 = new Book('My Life on The Wall, part 1', author);
book1.publisher = publisher;
const book2 = new Book('My Life on The Wall, part 2', author);
book2.publisher = publisher;
const book3 = new Book('My Life on The Wall, part 3', author);
book3.publisher = publisher;

await orm.em.persist(book1, false);
await orm.em.persist(book2, false);
await orm.em.persist(book3); // flush everything to database

const authorRepository = orm.em.getRepository<Author>(Author.name);
const jon = await authorRepository.findOne({ name: 'Jon Snow' }, ['books']);
const authors = await authorRepository.findAll(['books']);

// identity map in action
console.log(jon === authors[0]); // true

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

// filtering and pagination
const booksRepository = orm.em.getRepository<Author>(Author.name);
const books = await booksRepository.find({ author: jon.id }, [], { title: -1 }, 2, 1);
console.log(books);
```

## TODO

- cascade persist in collections
- immediate flush issue when persisting new entities with references
- aggregate support?
- improve populating in EM#find() method
- rehydrate and populate missing references when fetching already loaded entities from db
- support for string id (now we require object id) in EM/repositories
- add query logging
- add nativeUpdate and nativeDelete (without hooks support), allow only entities in EM#remove
- remove references on other entities when deleting entity (e.g. from M:N collection)

## TODO docs

- 1:M / M:1 collections
- many to many collections
- custom repository
- cascading
- identity map
- lifecycle hooks
