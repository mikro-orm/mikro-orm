<h1 align="center">
  <a href="https://mikro-orm.io"><img src="https://raw.githubusercontent.com/mikro-orm/mikro-orm/master/docs/assets/img/logo-readme.svg?sanitize=true" alt="MikroORM"></a>
</h1>

TypeScript ORM for Node.js based on Data Mapper, [Unit of Work](https://mikro-orm.io/unit-of-work/) 
and [Identity Map](https://mikro-orm.io/identity-map/) patterns. Supports MongoDB, MySQL, 
MariaDB, PostgreSQL and SQLite databases. 

> Heavily inspired by [Doctrine](https://www.doctrine-project.org/) and [Nextras Orm](https://nextras.org/orm/).

[![NPM version](https://img.shields.io/npm/v/mikro-orm.svg)](https://www.npmjs.com/package/mikro-orm)
[![Chat on slack](https://img.shields.io/badge/chat-on%20slack-blue.svg)](https://join.slack.com/t/mikroorm/shared_invite/enQtNTM1ODYzMzM4MDk3LWM4ZDExMjU5ZDhmNjA2MmM3MWMwZmExNjhhNDdiYTMwNWM0MGY5ZTE3ZjkyZTMzOWExNDgyYmMzNDE1NDI5NjA)
[![Downloads](https://img.shields.io/npm/dm/mikro-orm.svg)](https://www.npmjs.com/package/mikro-orm)
[![Dependency Status](https://david-dm.org/mikro-orm/mikro-orm.svg)](https://david-dm.org/mikro-orm/mikro-orm)
[![Build Status](https://travis-ci.com/mikro-orm/mikro-orm.svg?branch=master)](https://travis-ci.com/mikro-orm/mikro-orm)
[![Coverage Status](https://img.shields.io/coveralls/mikro-orm/mikro-orm.svg)](https://coveralls.io/r/mikro-orm/mikro-orm?branch=master)
[![Maintainability](https://api.codeclimate.com/v1/badges/27999651d3adc47cfa40/maintainability)](https://codeclimate.com/github/mikro-orm/mikro-orm/maintainability)

## 🤔 Unit of What?

You might be asking: _What the hell is Unit of Work and why should I care about it?_

> Unit of Work maintains a list of objects (_entities_) affected by a business transaction 
> and coordinates the writing out of changes. [(Martin Fowler)](https://www.martinfowler.com/eaaCatalog/unitOfWork.html)

> Identity Map ensures that each object (_entity_) gets loaded only once by keeping every 
> loaded object in a map. Looks up objects using the map when referring to them. 
> [(Martin Fowler)](https://www.martinfowler.com/eaaCatalog/identityMap.html)

So what benefits does it bring to us?

### Implicit Transactions

First and most important implication of having Unit of Work is that it allows handling
transactions automatically. 

When you call `em.flush()`, all computed changes are queried inside a database
transaction (if supported by given driver). This means that you can control the boundaries 
of transactions simply by calling `em.persistLater()` and once all your changes 
are ready, calling `flush()` will run them inside a transaction. 

> You can also control the transaction boundaries manually via `em.transactional(cb)`.

```typescript
const user = await em.findOneOrFail(User, 1);
user.email = 'foo@bar.com';
const car = new Car();
user.cars.add(car);

// thanks to bi-directional cascading we only need to persist user entity
// flushing will create a transaction, insert new car and update user with new email
// as user entity is managed, calling flush() is enough
await em.flush();
```

### Separation of Domain Logic and Persistence Layer

MikroORM allows you to implement your domain/business logic directly in your entities. To 
maintain always valid entities, you can use constructors to mark required properties. 

Once your entities are loaded, you can just work with them and forget about persistence. 
As you do not have to care about persistence, most of entity interactions can be synchronous. 
When you have done all changes, you call `em.flush()`. It will trigger computing of change 
sets. Only entities that were changed will generate database queries, if there are no changes, 
no transaction will be started. 

This increases maintainability, flexibility and testability.

```typescript
const user = await em.findOneOrFail(User, 1, ['cars', 'address']);
user.title = 'Mr.';
user.address.street = '10 Downing Street'; // address is 1:1 relation of Address entity
user.cars.getItems().forEach(car => car.forSale = true); // cars is 1:m collection of Car entities
const car = new Car('VW');
user.cars.add(car);

// now we can flush all changes done to managed entities
await em.flush();
```

In this example, `em.flush()` call will execute those queries:

```sql
begin;
update user set title = 'Mr.' where id = 1;
update user_address set street = '10 Downing Street' where id = 123;
update car set for_sale = true where id = 1;
update car set for_sale = true where id = 2;
update car set for_sale = true where id = 3;
inser into car (brand, owner) values ('VW', 1);
commit;
```

### Only One Instance of Entity

Thanks to Identity Map, you will always have only one instance of given entity in one context. 
This allows for some optimizations (skipping loading of already loaded entities), as well as 
comparison by identity (`ent1 === ent2`). 

## 📖 Documentation

MikroORM's documentation, included in this repo in the root directory, is built with 
[Jekyll](https://jekyllrb.com/) and publicly hosted on GitHub Pages at https://mikro-orm.io.

There is also auto-generated [CHANGELOG.md](CHANGELOG.md) file based on commit messages 
(via `semantic-release`). 

## ✨ Core features

- [Clean and simple entity definition](https://mikro-orm.io/defining-entities/)
- [Identity Map](https://mikro-orm.io/identity-map/)
- [Entity references](https://mikro-orm.io/entity-references/)
- [Using entity constructors](https://mikro-orm.io/using-entity-constructors/)
- [Collections](https://mikro-orm.io/collections/)
- [Unit of Work](https://mikro-orm.io/unit-of-work/)
- [Transactions](https://mikro-orm.io/transactions/)
- [Cascading persist and remove](https://mikro-orm.io/cascading/)
- [Using `QueryBuilder`](https://mikro-orm.io/query-builder/)
- [Preloading deeply nested structures via populate](https://mikro-orm.io/nested-populate/)
- [Property validation](https://mikro-orm.io/property-validation/)
- [Lifecycle hooks](https://mikro-orm.io/lifecycle-hooks/)
- [Vanilla JS support](https://mikro-orm.io/usage-with-js/)

## 📦 Example integrations

You can find example integrations for some popular frameworks in the [`mikro-orm-examples` repository](https://github.com/mikro-orm/mikro-orm-examples): 

### TypeScript examples

- [Express + MongoDB](https://github.com/mikro-orm/mikro-orm-examples/tree/master/express-ts)
- [Nest + MySQL](https://github.com/mikro-orm/mikro-orm-examples/tree/master/nest)
- [`nestjs-mikro-orm` module](https://github.com/dario1985/nestjs-mikro-orm)

### JavaScript examples 
- [Express + MongoDB](https://github.com/mikro-orm/mikro-orm-examples/tree/master/express-js)

## 🚀 Quick start

First install the module via `yarn` or `npm` and do not forget to install the database driver as well:

```
$ yarn add mikro-orm mongodb # for mongo
$ yarn add mikro-orm mysql2  # for mysql
$ yarn add mikro-orm pg      # for postgresql
$ yarn add mikro-orm sqlite  # for sqlite
```

or

```
$ npm i -s mikro-orm mongodb # for mongo
$ npm i -s mikro-orm mysql2  # for mysql
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
  autoFlush: false, // read more here: https://mikro-orm.io/unit-of-work/
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

## Show your support

Please ⭐️ this repository if this project helped you!

## 📝 License

Copyright © 2018 [Martin Adámek](https://github.com/b4nan).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
