# @mikro-orm/sql-js

[MikroORM](https://mikro-orm.io) driver for in-memory SQLite via [`sql.js`](https://sql.js.org) (SQLite compiled to WebAssembly), usable both in the browser and in Node.js.

## Installation

```sh
npm install @mikro-orm/core @mikro-orm/sql-js
```

## Usage

```typescript
import { defineEntity, p, MikroORM } from '@mikro-orm/sql-js';

const AuthorSchema = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
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

const orm = await MikroORM.init({
  entities: [Author, Book],
});
await orm.schema.create();

const author = orm.em.create(Author, { name: 'Jon Snow' });
orm.em.create(Book, { title: 'My Life on The Wall', author });
await orm.em.flush();
```

The database lives in memory only, `dbName` defaults to `:memory:` and the data is lost on `orm.close()`. Use `driverOptions.data` together with `db.export()` to persist and restore it yourself.

## Features

- Runs in the browser as well as in Node.js, with no native bindings
- SQLite-compatible query syntax
- [QueryBuilder](https://mikro-orm.io/docs/query-builder) with SQLite-specific handling
- [Kysely integration](https://mikro-orm.io/docs/kysely) for type-safe raw queries
- [Schema generation](https://mikro-orm.io/docs/schema-generator) and [migrations](https://mikro-orm.io/docs/migrations)

## Documentation

See the [official MikroORM documentation](https://mikro-orm.io/docs) and the [sql.js usage guide](https://mikro-orm.io/docs/usage-with-sql-js).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan). Licensed under the [MIT License](https://github.com/mikro-orm/mikro-orm/blob/master/LICENSE).
