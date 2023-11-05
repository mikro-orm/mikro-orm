---
title: Quick Start
---

In this guide, you will learn how to quickly bootstrap a simple project using MikroORM. For a deeper dive, check out
the [Getting Started guide](./guide) which follows.

## Installation

First install the module via package manager of your choice. Do not forget to install the database driver as well:

```bash npm2yarn
# for mongodb
npm install @mikro-orm/core @mikro-orm/mongodb;

# for mysql (works with mariadb too)
npm install @mikro-orm/core @mikro-orm/mysql;  

# for mariadb (works with mysql too)
npm install @mikro-orm/core @mikro-orm/mariadb;

# for postgresql (works with cockroachdb too)
npm install @mikro-orm/core @mikro-orm/postgresql;  

# for sqlite
npm install @mikro-orm/core @mikro-orm/sqlite; 

# for better-sqlite
npm install @mikro-orm/core @mikro-orm/better-sqlite; 
```

Next you will need to enable support for [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) as
well as `esModuleInterop` in `tsconfig.json` via:

> The decorators are opt-in, if you use a different way to define your entity metadata like `EntitySchema`, you don't
> need to enable them.

```json
"experimentalDecorators": true,
"emitDecoratorMetadata": true,
"esModuleInterop": true
```

Then call `MikroORM.init` as part of bootstrapping your app:

> To access driver specific methods like `em.createQueryBuilder()` you need to import
> the `MikroORM`/`EntityManager`/`EntityRepository` class from the driver package. Alternatively you can cast the `orm.em`
> to `EntityManager` exported from the driver package:
>
> ```ts
> import { EntityManager } from '@mikro-orm/postgresql';
> const em = orm.em as EntityManager;
> const qb = em.createQueryBuilder(...);
> ```

```ts
import { MikroORM } from '@mikro-orm/postgresql'; // or any other driver package

const orm = await MikroORM.init({
  entities: ['./dist/entities'], // path to your JS entities (dist), relative to `baseDir`
  dbName: 'my-db-name',
});
console.log(orm.em); // access EntityManager via `em` property
```

You can read more about all the possible configuration options in [Advanced Configuration](./configuration.md) section.

## Folder-based discovery

You can also provide paths where we store our entities via `entities` array. Internally it
uses [`globby`](https://github.com/sindresorhus/globby) so we can
use [globbing patterns](https://github.com/sindresorhus/globby#globbing-patterns), including negative globs.

```ts
const orm = await MikroORM.init({
  entities: ['./dist/app/**/*.entity.js'],
  entitiesTs: ['./src/app/**/*.entity.ts'],
  // ...
});
```

If you are experiencing problems with folder based discovery, try using `mikro-orm debug` CLI command to check what
paths are actually being used.

## Synchronous initialization

As opposed to the async `MikroORM.init` method, you can prefer to use synchronous variant `initSync`. This method has
some limitations:

- database connection will be established when you first interact with the database (or you can use `orm.connect()`
  explicitly)
- no loading of the `config` file, `options` parameter is mandatory
- no support for folder based discovery
- no check for mismatched package versions

## RequestContext helper

Now you will need to fork entity manager for each request so their [identity maps](https://mikro-orm.io/identity-map/)
will not collide. To do so, use the `RequestContext` helper:

```ts
const app = express();

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});
```

> You should register this middleware as the last one just before request handlers and before any of your custom
> middleware that is using the ORM. There might be issues when you register it before request processing middleware
> like `queryParser` or `bodyParser`, so definitely register the context after them.

More info about `RequestContext` is described [here](./identity-map.md#request-context).

## Entity definition

Now you can start defining your entities (in one of the `entities` folders). This is how a simple entity can look like:

```ts title="./entities/Book.ts"
@Entity()
export class Book {

  @PrimaryKey()
  id: bigint;

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

Or if you want to use UUID primary key:

```ts title="./entities/Book.ts"
import { v4 } from 'uuid';

@Entity()
export class Book {

  @PrimaryKey({ type: 'uuid' })
  uuid = v4();

  // ...

}
```

More information can be found in [defining entities section](https://mikro-orm.io/defining-entities/) in docs.

## EntityManager

When you have your entities defined, you can start using ORM either via `EntityManager`.

To save entity state to database, you need to persist it. Persist determines whether to use `insert` or `update` and
computes appropriate change-set. Entity references that are not persisted yet (does not have identifier) will be cascade
persisted automatically.

```ts
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

```ts
const authors = em.find(Author, {});

for (const author of authors) {
  console.log(author); // instance of Author entity
  console.log(author.name); // Jon Snow

  for (const book of author.books) { // iterating books collection
    console.log(book); // instance of Book entity
    console.log(book.title); // My Life on The Wall, part 1/2/3
  }
}
```

Take a look at docs about [working with `EntityManager`](./entity-manager.md).
