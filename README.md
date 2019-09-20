<h1 align="center">
  <a href="https://mikro-orm.io"><img src="https://raw.githubusercontent.com/mikro-orm/mikro-orm/master/docs/assets/img/logo-readme.svg?sanitize=true" alt="MikroORM"></a>
</h1>

Simple TypeScript ORM for Node.js based on Data Mapper, Unit of Work and Identity Map patterns. Supports MongoDB,
MySQL, PostgreSQL and SQLite databases. 

> Heavily inspired by [Doctrine](https://www.doctrine-project.org/) and [Nextras Orm](https://nextras.org/orm/).

[![NPM version](https://img.shields.io/npm/v/mikro-orm.svg)](https://www.npmjs.com/package/mikro-orm)
[![Chat on slack](https://img.shields.io/badge/chat-on%20slack-blue.svg)](https://join.slack.com/t/mikroorm/shared_invite/enQtNTM1ODYzMzM4MDk3LTBmZDNlODBhYjcxNGZlMTkyYzJmODAwMDhjODc0ZTM2MzQ2Y2VkOGM0ODYzYTJjMDRiZDdjMmIxYjI2OTY0Y2U)
[![Downloads](https://img.shields.io/npm/dm/mikro-orm.svg)](https://www.npmjs.com/package/mikro-orm)
[![Dependency Status](https://david-dm.org/mikro-orm/mikro-orm.svg)](https://david-dm.org/mikro-orm/mikro-orm)
[![Build Status](https://travis-ci.com/mikro-orm/mikro-orm.svg?branch=master)](https://travis-ci.com/mikro-orm/mikro-orm)
[![Coverage Status](https://img.shields.io/coveralls/mikro-orm/mikro-orm.svg)](https://coveralls.io/r/mikro-orm/mikro-orm?branch=master)
[![Maintainability](https://api.codeclimate.com/v1/badges/27999651d3adc47cfa40/maintainability)](https://codeclimate.com/github/mikro-orm/mikro-orm/maintainability)

## 📖 Documentation

MikroORM's documentation, included in this repo in the root directory, is built with 
[Jekyll](https://jekyllrb.com/) and publicly hosted on GitHub Pages at https://mikro-orm.io.

There is also auto-generated [CHANGELOG.md](CHANGELOG.md) file based on commit messages 
(via `semantic-release`). 

## ✨ Core Features

- [Clean and Simple Entity Definition](https://mikro-orm.io/defining-entities/)
- [Identity Map](https://mikro-orm.io/identity-map/)
- [Entity References](https://mikro-orm.io/entity-references/)
- [Using Entity Constructors](https://mikro-orm.io/using-entity-constructors/)
- [Collections](https://mikro-orm.io/collections/)
- [Unit of Work](https://mikro-orm.io/unit-of-work/)
- [Transactions](https://mikro-orm.io/transactions/)
- [Cascading persist and remove](https://mikro-orm.io/cascading/)
- [Using `QueryBuilder`](https://mikro-orm.io/query-builder/)
- [Preloading Deeply Nested Structures via populate](https://mikro-orm.io/nested-populate/)
- [Property Validation](https://mikro-orm.io/property-validation/)
- [Lifecycle Hooks](https://mikro-orm.io/lifecycle-hooks/)
- [Vanilla JS Support](https://mikro-orm.io/usage-with-js/)
- [Schema Generator](https://mikro-orm.io/schema-generator/)
- [Entity Generator](https://mikro-orm.io/entity-generator/)

## 📦 Example Integrations

You can find example integrations for some popular frameworks in the [`mikro-orm-examples` repository](https://github.com/mikro-orm/mikro-orm-examples): 

### TypeScript Examples

- [Express + MongoDB](https://github.com/mikro-orm/mikro-orm-examples/tree/master/express-ts)
- [Nest + MySQL](https://github.com/mikro-orm/mikro-orm-examples/tree/master/nest)
- [`nestjs-mikro-orm` module](https://github.com/dario1985/nestjs-mikro-orm)

### JavaScript Examples 
- [Express + MongoDB](https://github.com/mikro-orm/mikro-orm-examples/tree/master/express-js)

## Articles

- Introducing MikroORM, TypeScript data-mapper ORM with Identity Map
  - on [medium.com](https://medium.com/dailyjs/introducing-mikro-orm-typescript-data-mapper-orm-with-identity-map-9ba58d049e02)
  - on [dev.to](https://dev.to/b4nan/introducing-mikroorm-typescript-data-mapper-orm-with-identity-map-pc8)
- Handling transactions and concurrency in MikroORM
  - on [medium.com](https://medium.com/dailyjs/handling-transactions-and-concurrency-in-mikro-orm-ba80d0a65805)
  - on [dev.to](https://dev.to/b4nan/handling-transactions-and-concurrency-in-mikroorm-2cfj)

## 🚀 Quick Start

First install the module via `yarn` or `npm` and do not forget to install the database driver as well:

```
$ yarn add mikro-orm mongodb # for mongo
$ yarn add mikro-orm mysql2  # for mysql/mariadb
$ yarn add mikro-orm mariadb # for mysql/mariadb
$ yarn add mikro-orm pg      # for postgresql
$ yarn add mikro-orm sqlite  # for sqlite
```

or

```
$ npm i -s mikro-orm mongodb # for mongo
$ npm i -s mikro-orm mysql2  # for mysql/mariadb
$ npm i -s mikro-orm mariadb # for mysql/mariadb
$ npm i -s mikro-orm pg      # for postgresql
$ npm i -s mikro-orm sqlite  # for sqlite
```

Next you will need to enable support for [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
in `tsconfig.json` via:

```json
"experimentalDecorators": true
```

Then call `MikroORM.init` as part of bootstrapping your app:

```typescript
const orm = await MikroORM.init({
  entitiesDirs: ['./dist/entities'], // path to your JS entities (dist), relative to `baseDir`
  dbName: 'my-db-name',
  clientUrl: '...', // defaults to 'mongodb://localhost:27017' for mongodb driver
});
console.log(orm.em); // access EntityManager via `em` property
```

There are more ways to configure your entities, take a look at 
[installation page](https://mikro-orm.io/installation/).

Then you will need to fork entity manager for each request so their 
[identity maps](https://mikro-orm.io/identity-map/) will not collide. 
To do so, use the `RequestContext` helper:

```typescript
const app = express();

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});
```

> You should register this middleware as the last one just before request handlers and before
> any of your custom middleware that is using the ORM. There might be issues when you register 
> it before request processing middleware like `queryParser` or `bodyParser`, so definitely 
> register the context after them. 

More info about `RequestContext` is described [here](https://mikro-orm.io/identity-map/#request-context).

Now you can start defining your entities (in one of the `entitiesDirs` folders):

**`./entities/Book.ts`**

```typescript
@Entity()
export class Book {

  @PrimaryKey()
  _id: ObjectID;

  @Property()
  title: string;

  @ManyToOne()
  author: Author;

  @ManyToMany({ entity: () => BookTag, inversedBy: 'books' })
  tags = new Collection<BookTag>(this);

  constructor(title: string, author: Author) {
    this.title = title;
    this.author = author;
  }

}

export interface Book extends IEntity { }
```

More information can be found in
[defining entities section](https://mikro-orm.io/defining-entities/) in docs.

When you have your entities defined, you can start using ORM either via `EntityManager`
or via `EntityRepository`s.

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
```

To fetch entities from database you can use `find()` and `findOne()` of `EntityManager`: 

```typescript
const authors = orm.em.find(Author, {});

for (const author of authors) {
  console.log(author); // instance of Author entity
  console.log(author.name); // Jon Snow

  for (const book of author.books) { // iterating books collection
    console.log(book); // instance of Book entity
    console.log(book.title); // My Life on The Wall, part 1/2/3
  }
}
```

More convenient way of fetching entities from database is by using `EntityRepository`, that
carries the entity name so you do not have to pass it to every `find` and `findOne` calls:

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

Take a look at docs about [working with `EntityManager`](https://mikro-orm.io/entity-manager/)
or [using `EntityRepository` instead](https://mikro-orm.io/repositories/).

## 🤝 Contributing

Contributions, issues and feature requests are welcome. Please read 
[CONTRIBUTING.md](CONTRIBUTING.md) 
for details on the process for submitting pull requests to us.

## Authors

👤 **Martin Adámek**

- Twitter: [@B4nan](https://twitter.com/B4nan)
- Github: [@b4nan](https://github.com/b4nan)

See also the list of contributors who [participated](https://github.com/mikro-orm/mikro-orm/contributors) in this project.

## Show Your Support

Please ⭐️ this repository if this project helped you!

## 📝 License

Copyright © 2018 [Martin Adámek](https://github.com/b4nan).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
