# @mikro-orm/mysql

[MikroORM](https://mikro-orm.io) driver for MySQL databases, built on top of the [`mysql2`](https://www.npmjs.com/package/mysql2) library.

## Installation

```sh
npm install @mikro-orm/core @mikro-orm/mysql
```

## Usage

```typescript
import { MikroORM, EntityManager } from '@mikro-orm/mysql';

const orm = await MikroORM.init({
  entities: [Author, Book],
  dbName: 'my-db',
});

// EntityManager is typed to the MySQL driver
const em: EntityManager = orm.em;

// Use the QueryBuilder for type-safe queries
const qb = em.createQueryBuilder(Author);
const authors = await qb.select('*').where({ name: { $like: '%John%' } }).getResult();
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
