<h1 align="center">
  <a href="https://mikro-orm.io"><img src="https://raw.githubusercontent.com/mikro-orm/mikro-orm/master/docs/static/img/logo-readme.svg?sanitize=true" alt="MikroORM" /></a>
</h1>

TypeScript ORM for Node.js based on Data Mapper, [Unit of Work](https://mikro-orm.io/docs/unit-of-work/) and [Identity Map](https://mikro-orm.io/docs/identity-map/) patterns. Supports MongoDB, MySQL, MariaDB, PostgreSQL and SQLite (including libSQL) databases. 

> Heavily inspired by [Doctrine](https://www.doctrine-project.org/) and [Hibernate](https://hibernate.org/).

[![NPM version](https://img.shields.io/npm/v/@mikro-orm/core.svg)](https://www.npmjs.com/package/@mikro-orm/core)
[![NPM dev version](https://img.shields.io/npm/v/@mikro-orm/core/next.svg)](https://www.npmjs.com/package/@mikro-orm/core)
[![Chat on discord](https://img.shields.io/discord/1214904142443839538?label=discord&color=blue)](https://discord.gg/w8bjxFHS7X)
[![Downloads](https://img.shields.io/npm/dm/@mikro-orm/core.svg)](https://www.npmjs.com/package/@mikro-orm/core)
[![Coverage Status](https://img.shields.io/coveralls/mikro-orm/mikro-orm.svg)](https://coveralls.io/r/mikro-orm/mikro-orm?branch=master)
[![Maintainability](https://api.codeclimate.com/v1/badges/27999651d3adc47cfa40/maintainability)](https://codeclimate.com/github/mikro-orm/mikro-orm/maintainability)
[![Build Status](https://github.com/mikro-orm/mikro-orm/workflows/tests/badge.svg?branch=master)](https://github.com/mikro-orm/mikro-orm/actions?workflow=tests)

## 🤔 Unit of What?

You might be asking: _What the hell is Unit of Work and why should I care about it?_

> Unit of Work maintains a list of objects (_entities_) affected by a business transaction 
> and coordinates the writing out of changes. [(Martin Fowler)](https://www.martinfowler.com/eaaCatalog/unitOfWork.html)

> Identity Map ensures that each object (_entity_) gets loaded only once by keeping every 
> loaded object in a map. Looks up objects using the map when referring to them. 
> [(Martin Fowler)](https://www.martinfowler.com/eaaCatalog/identityMap.html)

So what benefits does it bring to us?

### Implicit Transactions

First and most important implication of having Unit of Work is that it allows handling transactions automatically. 

When you call `em.flush()`, all computed changes are queried inside a database transaction (if supported by given driver). This means that you can control the boundaries of transactions simply by calling `em.persistLater()` and once all your changes are ready, calling `flush()` will run them inside a transaction. 

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

### ChangeSet based persistence

MikroORM allows you to implement your domain/business logic directly in the entities. To maintain always valid entities, you can use constructors to mark required properties. Let's define the `User` entity used in previous example:

```typescript
@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne(() => Address)
  address?: Address;

  @ManyToMany(() => Car)
  cars = new Collection<Car>(this);

  constructor(name: string) {
    this.name = name;
  }

}
```

Now to create new instance of the `User` entity, we are forced to provide the `name`:

```typescript
const user = new User('John Doe'); // name is required to create new user instance
user.address = new Address('10 Downing Street'); // address is optional
```

Once your entities are loaded, make a number of synchronous actions on your entities,
then call `em.flush()`. This will trigger computing of change sets. Only entities 
(and properties) that were changed will generate database queries, if there are no changes, 
no transaction will be started.

```typescript
const user = await em.findOneOrFail(User, 1, {
  populate: ['cars', 'address.city'],
});
user.title = 'Mr.';
user.address.street = '10 Downing Street'; // address is 1:1 relation of Address entity
user.cars.getItems().forEach(car => car.forSale = true); // cars is 1:m collection of Car entities
const car = new Car('VW');
user.cars.add(car);

// now we can flush all changes done to managed entities
await em.flush();
```

`em.flush()` will then execute these queries from the example above:

```sql
begin;
update "user" set "title" = 'Mr.' where "id" = 1;
update "user_address" set "street" = '10 Downing Street' where "id" = 123;
update "car"
  set "for_sale" = case
    when ("id" = 1) then true
    when ("id" = 2) then true
    when ("id" = 3) then true
    else "for_sale" end
  where "id" in (1, 2, 3)
insert into "car" ("brand", "owner") values ('VW', 1);
commit;
```

### Identity Map

Thanks to Identity Map, you will always have only one instance of given entity in one context. This allows for some optimizations (skipping loading of already loaded entities), as well as comparison by identity (`ent1 === ent2`). 

## 📖 Documentation

MikroORM documentation, included in this repo in the root directory, is built with [Docusaurus](https://docusaurus.io) and publicly hosted on GitHub Pages at https://mikro-orm.io.

There is also auto-generated [CHANGELOG.md](CHANGELOG.md) file based on commit messages (via `semantic-release`). 

## ✨ Core Features

- [Clean and Simple Entity Definition](https://mikro-orm.io/docs/defining-entities)
- [Identity Map](https://mikro-orm.io/docs/identity-map)
- [Entity References](https://mikro-orm.io/docs/entity-references)
- [Using Entity Constructors](https://mikro-orm.io/docs/entity-constructors)
- [Modelling Relationships](https://mikro-orm.io/docs/relationships)
- [Collections](https://mikro-orm.io/docs/collections)
- [Unit of Work](https://mikro-orm.io/docs/unit-of-work)
- [Transactions](https://mikro-orm.io/docs/transactions)
- [Cascading persist and remove](https://mikro-orm.io/docs/cascading)
- [Composite and Foreign Keys as Primary Key](https://mikro-orm.io/docs/composite-keys)
- [Filters](https://mikro-orm.io/docs/filters)
- [Using `QueryBuilder`](https://mikro-orm.io/docs/query-builder)
- [Preloading Deeply Nested Structures via populate](https://mikro-orm.io/docs/nested-populate)
- [Property Validation](https://mikro-orm.io/docs/property-validation)
- [Lifecycle Hooks](https://mikro-orm.io/docs/events#hooks)
- [Vanilla JS Support](https://mikro-orm.io/docs/usage-with-js)
- [Schema Generator](https://mikro-orm.io/docs/schema-generator)
- [Entity Generator](https://mikro-orm.io/docs/entity-generator)

## 📦 Example Integrations

You can find example integrations for some popular frameworks in the [`mikro-orm-examples` repository](https://github.com/mikro-orm/mikro-orm-examples): 

### TypeScript Examples

- [Express + MongoDB](https://github.com/mikro-orm/express-ts-example-app)
- [Nest + MySQL](https://github.com/mikro-orm/nestjs-example-app)
- [RealWorld example app (Nest + MySQL)](https://github.com/mikro-orm/nestjs-realworld-example-app)
- [Koa + SQLite](https://github.com/mikro-orm/koa-ts-example-app)
- [GraphQL + PostgreSQL](https://github.com/driescroons/mikro-orm-graphql-example)
- [Inversify + PostgreSQL](https://github.com/PodaruDragos/inversify-example-app)
- [NextJS + MySQL](https://github.com/jonahallibone/mikro-orm-nextjs)
- [Accounts.js REST and GraphQL authentication + SQLite](https://github.com/darkbasic/mikro-orm-accounts-example)
- [Nest + Shopify + PostgreSQL + GraphQL](https://github.com/Cloudshelf/Shopify_CSConnector)
- [Elysia.js + libSQL + Bun](https://github.com/mikro-orm/elysia-bun-example-app)
- [Electron.js + PostgreSQL](https://github.com/adnanlah/electron-mikro-orm-example-app)

### JavaScript Examples 

- [Express + SQLite](https://github.com/mikro-orm/express-js-example-app)

## 🚀 Quick Start

First install the module via `yarn` or `npm` and do not forget to install the database driver as well:

> Since v4, you should install the driver package, but not the db connector itself, e.g. install `@mikro-orm/sqlite`, but not `sqlite3` as that is already included in the driver package.

```sh
yarn add @mikro-orm/core @mikro-orm/mongodb       # for mongo
yarn add @mikro-orm/core @mikro-orm/mysql         # for mysql/mariadb
yarn add @mikro-orm/core @mikro-orm/mariadb       # for mysql/mariadb
yarn add @mikro-orm/core @mikro-orm/postgresql    # for postgresql
yarn add @mikro-orm/core @mikro-orm/mssql         # for mssql
yarn add @mikro-orm/core @mikro-orm/sqlite        # for sqlite
yarn add @mikro-orm/core @mikro-orm/better-sqlite # for better-sqlite
yarn add @mikro-orm/core @mikro-orm/libsql        # for libsql
```

or

```sh
npm i -s @mikro-orm/core @mikro-orm/mongodb       # for mongo
npm i -s @mikro-orm/core @mikro-orm/mysql         # for mysql/mariadb
npm i -s @mikro-orm/core @mikro-orm/mariadb       # for mysql/mariadb
npm i -s @mikro-orm/core @mikro-orm/postgresql    # for postgresql
npm i -s @mikro-orm/core @mikro-orm/mssql         # for mssql
npm i -s @mikro-orm/core @mikro-orm/sqlite        # for sqlite
npm i -s @mikro-orm/core @mikro-orm/better-sqlite # for better-sqlite
npm i -s @mikro-orm/core @mikro-orm/libsql        # for libsql
```

Next, if you want to use decorators for your entity definition, you will need to enable support for [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) as well as `esModuleInterop` in `tsconfig.json` via:

```json
"experimentalDecorators": true,
"emitDecoratorMetadata": true,
"esModuleInterop": true,
```

Alternatively, you can use [`EntitySchema`](https://mikro-orm.io/docs/entity-schema).

Then call `MikroORM.init` as part of bootstrapping your app:

> To access driver specific methods like `em.createQueryBuilder()` we need to specify the driver type when calling `MikroORM.init()`. Alternatively we can cast the `orm.em` to `EntityManager` exported from the driver package:
> 
> ```ts
> import { EntityManager } from '@mikro-orm/postgresql';
> const em = orm.em as EntityManager;
> const qb = em.createQueryBuilder(...);
> ```

```typescript
import type { PostgreSqlDriver } from '@mikro-orm/postgresql'; // or any other SQL driver package

const orm = await MikroORM.init<PostgreSqlDriver>({
  entities: ['./dist/entities'], // path to your JS entities (dist), relative to `baseDir`
  dbName: 'my-db-name',
  type: 'postgresql',
});
console.log(orm.em); // access EntityManager via `em` property
```

There are more ways to configure your entities, take a look at [installation page](https://mikro-orm.io/docs/installation/).

> Read more about all the possible configuration options in [Advanced Configuration](https://mikro-orm.io/docs/configuration) section.

Then you will need to fork entity manager for each request so their [identity maps](https://mikro-orm.io/docs/identity-map/) will not collide. To do so, use the `RequestContext` helper:

```typescript
const app = express();

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});
```

> You should register this middleware as the last one just before request handlers and before any of your custom middleware that is using the ORM. There might be issues when you register it before request processing middleware like `queryParser` or `bodyParser`, so definitely register the context after them. 

More info about `RequestContext` is described [here](https://mikro-orm.io/docs/identity-map/#request-context).

Now you can start defining your entities (in one of the `entities` folders). This is how simple entity can look like in mongo driver:

**`./entities/MongoBook.ts`**

```typescript
@Entity()
export class MongoBook {

  @PrimaryKey()
  _id: ObjectID;

  @SerializedPrimaryKey()
  id: string;

  @Property()
  title: string;

  @ManyToOne(() => Author)
  author: Author;

  @ManyToMany(() => BookTag)
  tags = new Collection<BookTag>(this);

  constructor(title: string, author: Author) {
    this.title = title;
    this.author = author;
  }

}
```

For SQL drivers, you can use `id: number` PK:

**`./entities/SqlBook.ts`**

```typescript
@Entity()
export class SqlBook {

  @PrimaryKey()
  id: number;

}
```

Or if you want to use UUID primary keys:

**`./entities/UuidBook.ts`**

```typescript
import { randomUUID } from 'node:crypto';

@Entity()
export class UuidBook {

  @PrimaryKey()
  uuid = randomUUID();

}
```

More information can be found in [defining entities section](https://mikro-orm.io/docs/defining-entities/) in docs.

When you have your entities defined, you can start using ORM either via `EntityManager` or via `EntityRepository`s.

To save entity state to database, you need to persist it. Persist takes care or deciding whether to use `insert` or `update` and computes appropriate change-set. Entity references that are not persisted yet (does not have identifier) will be cascade persisted automatically. 

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
await em.persistAndFlush([book1, book2, book3]);
```

To fetch entities from database you can use `find()` and `findOne()` of `EntityManager`: 

```typescript
const authors = em.find(Author, {}, { populate: ['books'] });

for (const author of authors) {
  console.log(author); // instance of Author entity
  console.log(author.name); // Jon Snow

  for (const book of author.books) { // iterating books collection
    console.log(book); // instance of Book entity
    console.log(book.title); // My Life on The Wall, part 1/2/3
  }
}
```

More convenient way of fetching entities from database is by using `EntityRepository`, that carries the entity name, so you do not have to pass it to every `find` and `findOne` calls:

```typescript
const booksRepository = em.getRepository(Book);

const books = await booksRepository.find({ author: '...' }, { 
  populate: ['author'],
  limit: 1,
  offset: 2,
  orderBy: { title: QueryOrder.DESC },
});

console.log(books); // Loaded<Book, 'author'>[]
```

Take a look at docs about [working with `EntityManager`](https://mikro-orm.io/docs/entity-manager/) or [using `EntityRepository` instead](https://mikro-orm.io/docs/repositories/).

## 🤝 Contributing

Contributions, issues and feature requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on the process for submitting pull requests to us.

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
