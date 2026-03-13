# @mikro-orm/oracledb

[MikroORM](https://mikro-orm.io) driver for Oracle databases, built on top of [`oracledb`](https://www.npmjs.com/package/oracledb).

## Installation

```sh
npm install @mikro-orm/core @mikro-orm/oracledb
```

## Usage

```typescript
import { MikroORM } from '@mikro-orm/oracledb';

const orm = await MikroORM.init({
  entities: [Author, Book],
  dbName: 'my-db',
  host: 'localhost',
  port: 1521,
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

- Full Oracle database support including sequences and Oracle-specific schema handling
- [QueryBuilder](https://mikro-orm.io/docs/query-builder) with Oracle-specific handling
- [Kysely integration](https://mikro-orm.io/docs/kysely) for type-safe raw queries
- [Schema generation](https://mikro-orm.io/docs/schema-generator) and [migrations](https://mikro-orm.io/docs/migrations) with schema diffing
- Connection pooling via `oracledb`

## Documentation

See the [official MikroORM documentation](https://mikro-orm.io/docs) and the [SQL usage guide](https://mikro-orm.io/docs/usage-with-sql).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan). Licensed under the [MIT License](https://github.com/mikro-orm/mikro-orm/blob/master/LICENSE).
