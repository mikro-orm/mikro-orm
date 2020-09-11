---
slug: introducing-mikroorm-typescript-data-mapper-orm-with-identity-map
title: 'Introducing MikroORM, TypeScript data-mapper ORM with Identity Map'
author: Martin Adámek
authorTitle: Author of MikroORM
authorURL: https://github.com/B4nan
authorImageURL: https://avatars1.githubusercontent.com/u/615580?s=460&v=4
authorTwitter: B4nan
tags: [typescript, javascript, node, oop]
---

This might be the ORM you’ve been looking for…

<!--truncate-->

## Motivation

During my early days at university, I remember how quickly I fell in love with object oriented programming and the concepts of [Object-relational mapping](http://hibernate.org/orm/what-is-an-orm/) and [Domain Driven Design](https://stackoverflow.com/questions/1222392/can-someone-explain-domain-driven-design-ddd-in-plain-english-please/1222488#1222488). Back then, I was mainly a PHP programmer (_while we did a lot of Java/Hibernate at school_), so a natural choice for me was to start using [Doctrine](https://www.doctrine-project.org/).

A few years ago, when I switched from PHP to Node.js (_and later to TypeScript_), I was really confused. How come there is nothing similar to Hibernate or Doctrine in the JavaScript world? About a year ago, I finally came across [TypeORM](https://typeorm.io/), and when I read this line in the readme I thought I found what I was looking for:

> TypeORM is highly influenced by other ORMs, such as [Hibernate](http://hibernate.org/orm/), [Doctrine](http://www.doctrine-project.org/) and [Entity Framework](https://www.asp.net/entity-framework).

![](https://cdn-images-1.medium.com/max/800/1*gWvTBke0c8BFLGR8u_5zSg.jpeg)

I started playing with it immediately, but I got disappointed very quickly. No Identity Map that would keep track of all loaded entities. No Unit of Work that would handle transaction isolation. No unified API for references with very strange support for [accessing just the identifier without populating the entity](https://typeorm.io/#/relations-faq/how-to-use-relation-id-without-joining-relation), MongoDB driver (_which I was aiming to use_) was experimental and I had a lot problems setting it up. After a few days of struggle, I went away from it.

By that time, I started to think about writing something myself. And that is how [**MikroORM**](https://github.com/mikro-orm/mikro-orm) started!

![](https://cdn-images-1.medium.com/max/800/1*f8phoYPnVRkwuV1wynXz_A.png)

> [MikroORM](https://github.com/mikro-orm/mikro-orm) is TypeScript ORM for Node.js based on Data Mapper, Unit of Work and Identity Map patterns.

Currently it supports **MongoDB**, **MySQL, PostgreSQL** and **SQLite** databases, but more can be supported via [custom drivers right now](https://b4nan.github.io/mikro-orm/custom-driver/). It has first class TypeScript support, while staying back compatible with [Vanilla JavaScript](https://b4nan.github.io/mikro-orm/usage-with-js/).

## Installation

First install the module via `yarn` or `npm` and do not forget to install the database driver as well. Next you will need to enable support for [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)  
in `tsconfig.json` via `experimentalDecorators` flag. Then call `MikroORM.init` as part of bootstrapping your application.

Last step is to provide forked `EntityManager` for each request, so it will have its own unique [Identity Map](https://b4nan.github.io/mikro-orm/identity-map/). To do so, you can use `EntityManager.fork()` method. Another way, that is more [DI](https://medium.freecodecamp.org/a-quick-intro-to-dependency-injection-what-it-is-and-when-to-use-it-7578c84fa88f) friendly, is to create new [request context](https://b4nan.github.io/mikro-orm/identity-map/#request-context) for each request, which will use some [dark magic](https://github.com/nodejs/node/blob/master/doc/api/async_hooks.md) in the background to always pick the right `EntityManager` for you.

```sh
# using yarn
$ yarn add mikro-orm mongodb # for mongo
$ yarn add mikro-orm mysql2  # for mysql
$ yarn add mikro-orm pg      # for postgresql
$ yarn add mikro-orm sqlite  # for sqlite

# or npm
$ npm i -s mikro-orm mongodb # for mongo
$ npm i -s mikro-orm mysql2  # for mysql
$ npm i -s mikro-orm pg      # for postgresql
$ npm i -s mikro-orm sqlite  # for sqlite
```

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es2017",
    "moduleResolution": "node",
    "declaration": true,
    "strict": true,
    "strictPropertyInitialization": false,
    "experimentalDecorators": true
  }
}
```

```typescript
const orm = await MikroORM.init({
  entities: [Author, Book, BookTag],
  dbName: 'my-db-name',
  clientUrl: '...', // defaults to 'mongodb://127.0.0.1:27017' for mongodb driver
  type: 'mongo', // one of 'mysql', 'postgresql', 'sqlite', defaults to 'mongo'
  autoFlush: false, // read more here: https://b4nan.github.io/mikro-orm/unit-of-work/
});

console.log(orm.em); // access EntityManager via `em` property
```

```typescript
const app = express();

app.use((req, res, next) => {
  req.em = orm.em.fork(); // save the fork to `req` object
});

app.get('/books', async (req, res) => {
  const books = await req.em.find(Book); // use the fork via `req.em`
});
```

```typescript
const app = express();

// by providing request context, creating forked EntityManager will be handled automatically
app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});
```

## Defining entities

To [define an entity](https://b4nan.github.io/mikro-orm/defining-entities/), simply create a class and decorate it. Here is an example of `Book` entity defined for MongoDB driver:

```typescript

import { ObjectID } from 'mongodb';
import { Collection, Entity, IEntity, ManyToMany, ManyToOne, PrimaryKey, Property } from 'mikro-orm';
import { Author, BookTag, Publisher } from '.';

@Entity()
export class Book {

  @PrimaryKey()
  _id: ObjectID;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

  @Property()
  title: string;

  @ManyToOne()
  author: Author;

  @ManyToOne()
  publisher: Publisher;

  @ManyToMany({ entity: () => BookTag, inversedBy: 'books' })
  tags = new Collection<BookTag>(this);

  constructor(title: string, author: Author) {
    this.title = title;
    this.author = author;
  }

}

export interface Book extends IEntity<string> { }
```

As you can see, it’s pretty simple and straightforward. Entities are simple JavaScript objects (_so called POJO_), decorated with `@Entity` decorator (_for TypeScript_), or accompanied with [schema definition object](https://b4nan.github.io/mikro-orm/usage-with-js/) (_for vanilla JavaScript_). No real restrictions are made, you do not have to extend any base class, you are more than welcome to [use entity constructors](https://b4nan.github.io/mikro-orm/entity-constructors/) for specifying required parameters to always keep the entity in valid state. The only requirement is to define the primary key property.

![](https://cdn-images-1.medium.com/max/800/1*NlsF497deWAYi5FSijW9NQ.jpeg)

You might be curious about the last line with `Book` as an interface. This is called [interface merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#merging-interfaces) and it is there to let TypeScript know the entity will have some extra API methods (like `init()` or `isInitialized()`) available as it will be monkey-patched during discovery process. More about this can be found [in the docs](https://b4nan.github.io/mikro-orm/defining-entities/).

## Persisting entities with EntityManager

To save entity state to database, you need to [persist it](https://b4nan.github.io/mikro-orm/entity-manager/). Persist takes care or deciding whether to use `insert` or `update` and computes appropriate change-set. As a result, only changed fields will be updated in database.

[MikroORM](https://b4nan.github.io/mikro-orm/) comes with support for [cascading persist and remove operations](https://b4nan.github.io/mikro-orm/cascading/). Cascade persist is enabled by default, which means that by persisting an entity, all referenced entities will be automatically persisted too.

```typescript
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

![](https://cdn-images-1.medium.com/max/800/1*x6Oqsg8I4y4Z3FiWtn1ORA.gif)

## Fetching entities

To fetch entities from database you can use `find()` and `findOne()` methods of `EntityManager`:

```typescript
// find all authors with name matching 'Jon', and populate all of their books
const authors = await orm.em.find(Author, { name: /Jon/ }, ['books']); 

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

More convenient way of fetching entities from database is by using `EntityRepository`, that carries the entity name so you do not have to pass it to every `find` and `findOne` calls:

```typescript
import { QueryOrder } from 'mikro-orm';

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

## Working with references

Entity associations are mapped to entity references. Reference is an entity that has at least the identifier (_primary key_). This reference is stored in the Identity Map so you will get the same object reference when fetching the same document from database.

Thanks to this concept, MikroORM offers unified API for accessing entity references, regardless of whether the entity is initialized or not. Even if you do not populate an association, there will be its reference with primary key set. You can call `await entity.init()` to initialize the entity. This will trigger database call and populate itself, keeping the same reference to entity object in identity map.

```typescript
const book = orm.em.findOne(Book, '...');
console.log(book.author); // reference with ID only, instance of Author entity

// this will get the same reference as we already have in `book.author`
const author = orm.em.getReference(Author, book.author.id);
console.log(author.id); // accessing the id will not trigger any db call
console.log(author.isInitialized()); // false
console.log(author.name); // undefined
console.log(author === book.author); // true

// this will trigger db call, we could also use `orm.em.findOne(Author, author.id)` to do the same
await author.init(); 
console.log(author.isInitialized()); // true
console.log(author.name); // defined
```

![](https://cdn-images-1.medium.com/max/800/1*PY1hb2ufRhbevdIFt9jR1g.jpeg)

## Identity Map and Unit of Work

[MikroORM](https://b4nan.github.io/mikro-orm/) uses the Identity Map in background to track objects. This means that whenever you fetch entity via `EntityManager`, MikroORM will keep a reference to it inside its `UnitOfWork`, and will always return the same instance of it, even if you query one entity via different properties. This also means you can compare entities via strict equality operators (`===` and `!==`):

```typescript
const authorRepository = orm.em.getRepository(Author);
const jon = await authorRepository.findOne({ name: 'Jon Snow' }, ['books']);
const jon2 = await authorRepository.findOne({ email: 'snow@wall.st' });
const authors = await authorRepository.findAll(['books']);

// identity map in action
console.log(jon === authors[0]); // true
console.log(jon === jon2); // true

// as we always have one instance, books will be populated also here
console.log(jon2.books);
```

Another benefit of Identity Map is that this allows us to skip some database calls. When you try to load an already managed entity by its identifier, the one from Identity Map will be returned, without querying the database.

The power of Unit of Work is in running all queries inside a batch and wrapped inside a transaction (_if supported by given driver_). This approach is usually more performant as opposed to firing queries from various places.

## Collections

`OneToMany` and `ManyToMany` collections are stored in a `Collection` wrapper. It implements iterator so you can use `for of` loop to iterate through it.

Another way to access collection items is to use bracket syntax like when you access array items. Keep in mind that this approach will not check if the collection is initialized, while using `get` method will throw error in this case.

```typescript
// find author and populate his books collection
const author = orm.em.findOne(Author, '...', ['books']);

for (const book of author.books) {
  console.log(book); // instance of Book
}

author.books.add(book);
console.log(author.books.contains(book)); // true
author.books.remove(book);
console.log(author.books.contains(book)); // false
author.books.add(book);
console.log(author.books.count()); // 1
console.log(author.books.getItems()); // Book[]
console.log(author.books.getIdentifiers()); // array of primary keys of all items
author.books.removeAll();
```

More informations about collections can be found [in the docs](https://b4nan.github.io/mikro-orm/collections/).

## What’s next?

So you read through the whole article, got here and still not satisfied? There are more articles to come (beginning with integration manual for popular frameworks like [Express](https://expressjs.com/) or [NestJS](https://nestjs.com/)), but you can take a look at some advanced features covered in docs right now:

*   [Smart nested populate](https://b4nan.github.io/mikro-orm/nested-populate/)
*   [Smart query conditions](https://b4nan.github.io/mikro-orm/query-conditions/)
*   [Updating entity values with `IEntity.assign()`](https://b4nan.github.io/mikro-orm/entity-helper/) 
*   [Property validation](https://b4nan.github.io/mikro-orm/property-validation/)
*   [Lifecycle hooks](https://b4nan.github.io/mikro-orm/lifecycle-hooks/)
*   [Naming strategy](https://b4nan.github.io/mikro-orm/naming-strategy/)
*   [Usage with NestJS](https://b4nan.github.io/mikro-orm/usage-with-nestjs/)
*   [Usage with JavaScript](https://b4nan.github.io/mikro-orm/usage-with-js/)

![](https://cdn-images-1.medium.com/max/800/1*4877k4Hq9dPdtmvg9hnGFA.jpeg)

To start playing with [MikroORM](https://github.com/mikro-orm/mikro-orm), go through [quick start](https://github.com/mikro-orm/mikro-orm#quick-start) and [read the docs](https://b4nan.github.io/mikro-orm/). You can also take a look at [example integrations with some popular frameworks](http://github.com/mikro-orm/mikro-orm-examples).

> _Like_ [_MikroORM_](https://b4nan.github.io/mikro-orm/)_? ⭐️_ [_Star it_](https://github.com/mikro-orm/mikro-orm) _on GitHub and share this article with your friends._

_This article was originally published on Medium: https://medium.com/dailyjs/introducing-mikro-orm-typescript-data-mapper-orm-with-identity-map-9ba58d049e02_
