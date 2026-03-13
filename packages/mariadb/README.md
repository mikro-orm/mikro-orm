# @mikro-orm/mariadb

[MikroORM](https://mikro-orm.io) driver for MariaDB databases, built on top of the [`mysql2`](https://www.npmjs.com/package/mysql2) library with MariaDB-specific JSON and schema handling.

## Installation

```sh
npm install @mikro-orm/core @mikro-orm/mariadb
```

## Usage

```typescript
import { defineEntity, p, MikroORM } from '@mikro-orm/mariadb';

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
  dbName: 'my-db',
});

const author = orm.em.create(Author, { name: 'Jon Snow' });
orm.em.create(Book, { title: 'My Life on The Wall', author });
await orm.em.flush();

const authors = await orm.em.find(
  Author,
  { name: { $like: '%Jon%' } },
  {
    populate: ['books'],
  },
);
```

## Features

- Full MariaDB support including JSON columns, sequences, and native enums
- MariaDB-specific JSON column handling and schema introspection
- [QueryBuilder](https://mikro-orm.io/docs/query-builder) with MariaDB-specific operators
- [Kysely integration](https://mikro-orm.io/docs/kysely) for type-safe raw queries
- [Schema generation](https://mikro-orm.io/docs/schema-generator) and [migrations](https://mikro-orm.io/docs/migrations) with schema diffing

## Documentation

See the [official MikroORM documentation](https://mikro-orm.io/docs) and the [SQL usage guide](https://mikro-orm.io/docs/usage-with-sql).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan). Licensed under the [MIT License](https://github.com/mikro-orm/mikro-orm/blob/master/LICENSE).
