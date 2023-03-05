---
title: Quick Start
---

First install the module via `yarn` or `npm` and do not forget to install the database driver as well:

```sh
yarn add @mikro-orm/core @mikro-orm/mongodb     # for mongo
yarn add @mikro-orm/core @mikro-orm/mysql       # for mysql/mariadb
yarn add @mikro-orm/core @mikro-orm/mariadb     # for mysql/mariadb
yarn add @mikro-orm/core @mikro-orm/postgresql  # for postgresql
yarn add @mikro-orm/core @mikro-orm/sqlite      # for sqlite
```

or

```sh
npm i -s @mikro-orm/core @mikro-orm/mongodb     # for mongo
npm i -s @mikro-orm/core @mikro-orm/mysql       # for mysql/mariadb
npm i -s @mikro-orm/core @mikro-orm/mariadb     # for mysql/mariadb
npm i -s @mikro-orm/core @mikro-orm/postgresql  # for postgresql
npm i -s @mikro-orm/core @mikro-orm/sqlite      # for sqlite
```

Next you will need to enable support for [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) as well as `esModuleInterop` in `tsconfig.json` via:

```json
"experimentalDecorators": true,
"emitDecoratorMetadata": true,
"esModuleInterop": true
```

Then call `MikroORM.init` as part of bootstrapping your app:

> To access driver specific methods like `em.createQueryBuilder()` we need to specify the driver type when calling `MikroORM.init<D>()`. Alternatively we can cast the `orm.em` to `EntityManager` exported from the driver package:
>
> ```ts
> import { EntityManager } from '@mikro-orm/postgresql';
> const em = orm.em as EntityManager;
> const qb = em.createQueryBuilder(...);
> ```

```ts
import type { PostgreSqlDriver } from '@mikro-orm/postgresql'; // or any other driver package

const orm = await MikroORM.init<PostgreSqlDriver>({
  entities: ['./dist/entities'], // path to your JS entities (dist), relative to `baseDir`
  dbName: 'my-db-name',
  type: 'postgresql',
});
console.log(orm.em); // access EntityManager via `em` property
```

There are more ways to configure your entities, take a look at [installation page](https://mikro-orm.io/installation/).

> Read more about all the possible configuration options in [Advanced Configuration](https://mikro-orm.io/docs/configuration) section.

Then you will need to fork entity manager for each request so their [identity maps](https://mikro-orm.io/identity-map/) will not collide. To do so, use the `RequestContext` helper:

```ts
const app = express();

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});
```

> You should register this middleware as the last one just before request handlers and before any of your custom middleware that is using the ORM. There might be issues when you register it before request processing middleware like `queryParser` or `bodyParser`, so definitely register the context after them.

More info about `RequestContext` is described [here](https://mikro-orm.io/identity-map/#request-context).

Now you can start defining your entities (in one of the `entities` folders). This is how simple entity can look like in mongo driver:

```ts title="./entities/MongoBook.ts"
@Entity()
export class MongoBook {

  @PrimaryKey()
  _id: ObjectID;

  @SerializedPrimaryKey()
  id: string;

  @Property()
  title: string;

  @ManyToOne()
  author: Author;

  @ManyToMany()
  tags = new Collection<BookTag>(this);

  constructor(title: string, author: Author) {
    this.title = title;
    this.author = author;
  }

}
```

For SQL drivers, you can use `id: number` PK:

```ts title="./entities/SqlBook.ts"
@Entity()
export class SqlBook {

  @PrimaryKey()
  id: number;

}
```

Or if you want to use UUID primary keys:

```ts title="./entities/UuidBook.ts"
import { v4 } from 'uuid';

@Entity()
export class UuidBook {

  @PrimaryKey()
  uuid = v4();

}
```

More information can be found in [defining entities section](https://mikro-orm.io/defining-entities/) in docs.

When you have your entities defined, you can start using ORM either via `EntityManager` or via `EntityRepository`s.

To save entity state to database, you need to persist it. Persist determines whether to use `insert` or `update` and computes appropriate change-set. Entity references that are not persisted yet (does not have identifier) will be cascade persisted automatically.

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

More convenient way of fetching entities from database is by using `EntityRepository`, that carries the entity name so you do not have to pass it to every `find` and `findOne` calls:

```ts
const booksRepository = em.getRepository(Book);

const books = await booksRepository.find({ author: '...' }, {
  populate: ['author'],
  limit: 1,
  offset: 2,
  orderBy: { title: QueryOrder.DESC },
});

console.log(books); // Book[]
```

Take a look at docs about [working with `EntityManager`](https://mikro-orm.io/entity-manager/) or [using `EntityRepository` instead](https://mikro-orm.io/repositories/).
