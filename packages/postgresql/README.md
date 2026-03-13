# @mikro-orm/postgresql

[MikroORM](https://mikro-orm.io) driver for PostgreSQL databases, built on top of the [`pg`](https://www.npmjs.com/package/pg) library.

## Installation

```sh
npm install @mikro-orm/core @mikro-orm/postgresql
```

## Usage

```typescript
import { MikroORM, EntityManager } from '@mikro-orm/postgresql';

const orm = await MikroORM.init({
  entities: [Author, Book],
  dbName: 'my-db',
});

// EntityManager is typed to the PostgreSQL driver
const em: EntityManager = orm.em;

// Use the QueryBuilder for type-safe queries
const qb = em.createQueryBuilder(Author);
const authors = await qb
  .select('*')
  .where({ name: { $like: '%John%' } })
  .getResult();

// Use Kysely for raw query building
const result = await em.getKysely().selectFrom('author').selectAll().execute();
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
