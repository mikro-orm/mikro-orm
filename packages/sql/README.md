# @mikro-orm/sql

Shared SQL driver base for [MikroORM](https://mikro-orm.io), built on top of [Kysely](https://kysely.dev). Provides the `QueryBuilder`, SQL connection management, and schema generation used by all SQL driver packages.

## Installation

This package is automatically installed as a dependency of SQL driver packages (`@mikro-orm/postgresql`, `@mikro-orm/mysql`, etc.). You typically don't need to install it directly.

```sh
npm install @mikro-orm/core @mikro-orm/postgresql  # installs @mikro-orm/sql automatically
```

## Usage

### QueryBuilder

```typescript
import { MikroORM } from '@mikro-orm/postgresql';

const orm = await MikroORM.init({ ... });
const em = orm.em;

// Type-safe query builder
const qb = em.createQueryBuilder(Author);
const authors = await qb
  .select('*')
  .where({ books: { title: { $like: '%ORM%' } } })
  .orderBy({ name: 'asc' })
  .limit(10)
  .getResult();
```

### Kysely Integration

Access the type-safe Kysely query builder directly for advanced queries:

```typescript
const result = await em
  .getKysely()
  .selectFrom('author')
  .innerJoin('book', 'book.author_id', 'author.id')
  .select(['author.name', 'book.title'])
  .execute();
```

## Features

- [QueryBuilder](https://mikro-orm.io/docs/query-builder) — type-safe SQL query building with automatic joins and aliasing
- [Kysely integration](https://mikro-orm.io/docs/kysely) — direct access to type-safe Kysely query builder
- [Schema generation](https://mikro-orm.io/docs/schema-generator) — create, update, and drop database schemas
- [Raw queries](https://mikro-orm.io/docs/raw-queries) — `raw()` and `sql` tagged template helpers
- Connection pooling and transaction management

## Documentation

See the [official MikroORM documentation](https://mikro-orm.io/docs/query-builder) and the [Kysely integration guide](https://mikro-orm.io/docs/kysely).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan). Licensed under the [MIT License](https://github.com/mikro-orm/mikro-orm/blob/master/LICENSE).
