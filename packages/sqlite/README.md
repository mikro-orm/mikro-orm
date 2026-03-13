# @mikro-orm/sqlite

[MikroORM](https://mikro-orm.io) driver for SQLite databases, built on top of [`better-sqlite3`](https://www.npmjs.com/package/better-sqlite3).

## Installation

```sh
npm install @mikro-orm/core @mikro-orm/sqlite
```

## Usage

```typescript
import { MikroORM } from '@mikro-orm/sqlite';

const orm = await MikroORM.init({
  entities: [Author, Book],
  dbName: 'my-db.sqlite3', // or ':memory:' for in-memory database
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

- Synchronous, file-based or in-memory SQLite via `better-sqlite3`
- [QueryBuilder](https://mikro-orm.io/docs/query-builder) with SQLite-specific handling
- [Kysely integration](https://mikro-orm.io/docs/kysely) for type-safe raw queries
- [Schema generation](https://mikro-orm.io/docs/schema-generator) and [migrations](https://mikro-orm.io/docs/migrations)
- Ideal for development, testing, and embedded applications

## Documentation

See the [official MikroORM documentation](https://mikro-orm.io/docs) and the [SQLite usage guide](https://mikro-orm.io/docs/usage-with-sqlite).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan). Licensed under the [MIT License](https://github.com/mikro-orm/mikro-orm/blob/master/LICENSE).
