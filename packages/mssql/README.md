# @mikro-orm/mssql

[MikroORM](https://mikro-orm.io) driver for Microsoft SQL Server databases, built on top of [`tedious`](https://www.npmjs.com/package/tedious).

## Installation

```sh
npm install @mikro-orm/core @mikro-orm/mssql
```

## Usage

```typescript
import { MikroORM } from '@mikro-orm/mssql';

const orm = await MikroORM.init({
  entities: [Author, Book],
  dbName: 'my-db',
  host: 'localhost',
  port: 1433,
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

- Full SQL Server support including OUTPUT clause for returning inserted/updated rows
- [QueryBuilder](https://mikro-orm.io/docs/query-builder) with MSSQL-specific handling
- [Kysely integration](https://mikro-orm.io/docs/kysely) for type-safe raw queries
- [Schema generation](https://mikro-orm.io/docs/schema-generator) and [migrations](https://mikro-orm.io/docs/migrations) with schema diffing
- Connection pooling via `tedious`

## Documentation

See the [official MikroORM documentation](https://mikro-orm.io/docs) and the [SQL usage guide](https://mikro-orm.io/docs/usage-with-sql).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan). Licensed under the [MIT License](https://github.com/mikro-orm/mikro-orm/blob/master/LICENSE).
