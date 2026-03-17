<h1 align="center">
  <a href="https://mikro-orm.io"><img src="https://raw.githubusercontent.com/mikro-orm/mikro-orm/master/docs/static/img/logo-readme.svg?sanitize=true" alt="MikroORM" /></a>
</h1>

TypeScript ORM for Node.js based on Data Mapper, [Unit of Work](https://mikro-orm.io/docs/unit-of-work/) and [Identity Map](https://mikro-orm.io/docs/identity-map/) patterns. Supports MongoDB, MySQL, MariaDB, PostgreSQL, SQLite (including libSQL), MSSQL and Oracle databases.

> Heavily inspired by [Doctrine](https://www.doctrine-project.org/) and [Hibernate](https://hibernate.org/).

[![NPM version](https://img.shields.io/npm/v/@mikro-orm/core.svg)](https://npmx.dev/package/@mikro-orm/core)
[![NPM dev version](https://img.shields.io/npm/v/@mikro-orm/core/next.svg)](https://npmx.dev/package/@mikro-orm/core)
[![Chat on discord](https://img.shields.io/discord/1214904142443839538?label=discord&color=blue)](https://discord.gg/w8bjxFHS7X)
[![Downloads](https://img.shields.io/npm/dm/@mikro-orm/core.svg)](https://npmx.dev/package/@mikro-orm/core)
[![Coverage Status](https://img.shields.io/coveralls/mikro-orm/mikro-orm.svg)](https://coveralls.io/r/mikro-orm/mikro-orm?branch=master)
[![Build Status](https://github.com/mikro-orm/mikro-orm/workflows/tests/badge.svg?branch=master)](https://github.com/mikro-orm/mikro-orm/actions?workflow=tests)

## Quick Start

Install a driver package for your database:

```sh
npm install @mikro-orm/postgresql   # PostgreSQL
npm install @mikro-orm/mysql        # MySQL
npm install @mikro-orm/mariadb      # MariaDB
npm install @mikro-orm/sqlite       # SQLite
npm install @mikro-orm/libsql       # libSQL / Turso
npm install @mikro-orm/mongodb      # MongoDB
npm install @mikro-orm/mssql        # MS SQL Server
npm install @mikro-orm/oracledb     # Oracle
```

> If you use additional packages like `@mikro-orm/cli`, `@mikro-orm/migrations`, or `@mikro-orm/entity-generator`, install `@mikro-orm/core` explicitly as well. See the [quick start guide](https://mikro-orm.io/docs/quick-start) for details.

### Define Entities

The recommended way to define entities is using [`defineEntity`](https://mikro-orm.io/docs/define-entity) with `setClass`:

```typescript
import { defineEntity, p, MikroORM } from '@mikro-orm/postgresql';

const AuthorSchema = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string(),
    born: p.datetime().nullable(),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
});

export class Author extends AuthorSchema.class {}
AuthorSchema.setClass(Author);

const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author).inversedBy('books'),
  },
});

export class Book extends BookSchema.class {}
BookSchema.setClass(Book);
```

You can also define entities using [decorators](https://mikro-orm.io/docs/using-decorators) or [`EntitySchema`](https://mikro-orm.io/docs/define-entity#entityschema-low-level-api). See the [defining entities guide](https://mikro-orm.io/docs/defining-entities) for all options.

### Initialize and Use

```typescript
import { MikroORM, RequestContext } from '@mikro-orm/postgresql';

const orm = await MikroORM.init({
  entities: [Author, Book],
  dbName: 'my-db',
});

// Create new entities
const author = orm.em.create(Author, {
  name: 'Jon Snow',
  email: 'snow@wall.st',
});
const book = orm.em.create(Book, {
  title: 'My Life on The Wall',
  author,
});

// Flush persists all tracked changes in a single transaction
await orm.em.flush();
```

### Querying

```typescript
// Find with relations
const authors = await orm.em.findAll(Author, {
  populate: ['books'],
  orderBy: { name: 'asc' },
});

// Type-safe QueryBuilder
const qb = orm.em.createQueryBuilder(Author);
const result = await qb
  .select('*')
  .where({ books: { title: { $like: '%Wall%' } } })
  .getResult();
```

### Request Context

In web applications, use `RequestContext` to isolate the identity map per request:

```typescript
const app = express();

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});
```

More info about `RequestContext` is described [here](https://mikro-orm.io/docs/identity-map/#request-context).

## Unit of Work

> Unit of Work maintains a list of objects (_entities_) affected by a business transaction
> and coordinates the writing out of changes. [(Martin Fowler)](https://www.martinfowler.com/eaaCatalog/unitOfWork.html)

When you call `em.flush()`, all computed changes are queried inside a database transaction. This means you can control transaction boundaries simply by making changes to your entities and calling `flush()` when ready.

```typescript
const author = await em.findOneOrFail(Author, 1, {
  populate: ['books'],
});
author.name = 'Jon Snow II';
author.books.getItems().forEach(book => book.title += ' (2nd ed.)');
author.books.add(orm.em.create(Book, { title: 'New Book', author }));

// Flush computes change sets and executes them in a single transaction
await em.flush();
```

The above flush will execute:

```sql
begin;
update "author" set "name" = 'Jon Snow II' where "id" = 1;
update "book"
  set "title" = case
    when ("id" = 1) then 'My Life on The Wall (2nd ed.)'
    when ("id" = 2) then 'Another Book (2nd ed.)'
    else "title" end
  where "id" in (1, 2);
insert into "book" ("title", "author_id") values ('New Book', 1);
commit;
```

## Core Features

- [Clean and Simple Entity Definition](https://mikro-orm.io/docs/defining-entities) — decorators, `EntitySchema`, or `defineEntity`
- [Identity Map](https://mikro-orm.io/docs/identity-map) and [Unit of Work](https://mikro-orm.io/docs/unit-of-work) — automatic change tracking
- [Entity References](https://mikro-orm.io/docs/entity-references) and [Collections](https://mikro-orm.io/docs/collections)
- [QueryBuilder](https://mikro-orm.io/docs/query-builder) and [Kysely Integration](https://mikro-orm.io/docs/kysely)
- [Transactions](https://mikro-orm.io/docs/transactions) and [Cascading](https://mikro-orm.io/docs/cascading)
- [Populating Relations](https://mikro-orm.io/docs/populating-relations) and [Loading Strategies](https://mikro-orm.io/docs/loading-strategies)
- [Filters](https://mikro-orm.io/docs/filters) and [Lifecycle Hooks](https://mikro-orm.io/docs/events#hooks)
- [Schema Generator](https://mikro-orm.io/docs/schema-generator) and [Migrations](https://mikro-orm.io/docs/migrations)
- [Entity Generator](https://mikro-orm.io/docs/entity-generator) and [Seeding](https://mikro-orm.io/docs/seeding)
- [Embeddables](https://mikro-orm.io/docs/embeddables), [Custom Types](https://mikro-orm.io/docs/custom-types), and [Serialization](https://mikro-orm.io/docs/serializing)
- [Composite and Foreign Keys as Primary Key](https://mikro-orm.io/docs/composite-keys)
- [Entity Constructors](https://mikro-orm.io/docs/entity-constructors) and [Property Validation](https://mikro-orm.io/docs/property-validation)
- [Modelling Relationships](https://mikro-orm.io/docs/relationships) and [Vanilla JS Support](https://mikro-orm.io/docs/usage-with-js)

## Documentation

MikroORM documentation, included in this repo in the root directory, is built with [Docusaurus](https://docusaurus.io) and publicly hosted on GitHub Pages at https://mikro-orm.io.

There is also auto-generated [CHANGELOG.md](CHANGELOG.md) file based on commit messages (via `semantic-release`).

## Example Integrations

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

## Contributing

Contributions, issues and feature requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on the process for submitting pull requests to us.

## Authors

**Martin Adámek**

- Twitter: [@B4nan](https://twitter.com/B4nan)
- Github: [@b4nan](https://github.com/b4nan)

See also the list of contributors who [participated](https://github.com/mikro-orm/mikro-orm/contributors) in this project.

## Show Your Support

Please star this repository if this project helped you!

> If you'd like to support my open-source work, consider sponsoring me directly at [github.com/sponsors/b4nan](https://github.com/sponsors/b4nan).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
