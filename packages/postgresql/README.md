# @mikro-orm/postgresql

[MikroORM](https://mikro-orm.io) driver for PostgreSQL databases, built on top of the [`pg`](https://www.npmjs.com/package/pg) library.

## Installation

```sh
npm install @mikro-orm/core @mikro-orm/postgresql
```

## Usage

```typescript
import { MikroORM } from '@mikro-orm/postgresql';

const orm = await MikroORM.init({
  entities: [Author, Book],
  dbName: 'my-db',
});

// Create and persist entities
const author = orm.em.create(Author, { name: 'Jon Snow', email: 'snow@wall.st' });
orm.em.create(Book, { title: 'My Life on The Wall', author });
await orm.em.flush();

// Find entities with relations
const authors = await orm.em.find(
  Author,
  { name: { $like: '%Jon%' } },
  {
    populate: ['books'],
  },
);
```

## Features

- Full PostgreSQL support including JSONB, arrays, enums, and custom types
- [QueryBuilder](https://mikro-orm.io/docs/query-builder) with PostgreSQL-specific operators
- [Kysely integration](https://mikro-orm.io/docs/kysely) for type-safe raw queries
- [Schema generation](https://mikro-orm.io/docs/schema-generator) and [migrations](https://mikro-orm.io/docs/migrations) with schema diffing
- Connection pooling via `pg`

## Documentation

See the [official MikroORM documentation](https://mikro-orm.io/docs) and the [SQL usage guide](https://mikro-orm.io/docs/usage-with-sql).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan). Licensed under the [MIT License](https://github.com/mikro-orm/mikro-orm/blob/master/LICENSE).
