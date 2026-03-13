# @mikro-orm/mysql

[MikroORM](https://mikro-orm.io) driver for MySQL databases, built on top of the [`mysql2`](https://www.npmjs.com/package/mysql2) library.

## Installation

```sh
npm install @mikro-orm/core @mikro-orm/mysql
```

## Usage

```typescript
import { MikroORM } from '@mikro-orm/mysql';

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

- Full MySQL support including JSON columns, spatial types, and native enums
- [QueryBuilder](https://mikro-orm.io/docs/query-builder) with MySQL-specific operators
- [Kysely integration](https://mikro-orm.io/docs/kysely) for type-safe raw queries
- [Schema generation](https://mikro-orm.io/docs/schema-generator) and [migrations](https://mikro-orm.io/docs/migrations) with schema diffing
- Connection pooling via `mysql2`

## Documentation

See the [official MikroORM documentation](https://mikro-orm.io/docs) and the [SQL usage guide](https://mikro-orm.io/docs/usage-with-sql).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan). Licensed under the [MIT License](https://github.com/mikro-orm/mikro-orm/blob/master/LICENSE).
