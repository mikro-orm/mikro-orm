# @mikro-orm/libsql

[MikroORM](https://mikro-orm.io) driver for [libSQL](https://turso.tech/libsql) and [Turso](https://turso.tech) databases, built on top of [`libsql`](https://www.npmjs.com/package/libsql).

## Installation

```sh
npm install @mikro-orm/core @mikro-orm/libsql
```

## Usage

```typescript
import { MikroORM } from '@mikro-orm/libsql';

// Local file database
const orm = await MikroORM.init({
  entities: [Author, Book],
  dbName: 'my-db.sqlite3',
});

// Or connect to a remote Turso database
const orm = await MikroORM.init({
  entities: [Author, Book],
  dbName: 'libsql://your-db.turso.io',
  password: 'your-auth-token',
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

- Local, remote, and embedded replica support via libSQL
- SQLite-compatible query syntax
- [QueryBuilder](https://mikro-orm.io/docs/query-builder) with SQLite-specific handling
- [Kysely integration](https://mikro-orm.io/docs/kysely) for type-safe raw queries
- [Schema generation](https://mikro-orm.io/docs/schema-generator) and [migrations](https://mikro-orm.io/docs/migrations)

## Documentation

See the [official MikroORM documentation](https://mikro-orm.io/docs) and the [SQLite usage guide](https://mikro-orm.io/docs/usage-with-sqlite).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan). Licensed under the [MIT License](https://github.com/mikro-orm/mikro-orm/blob/master/LICENSE).
