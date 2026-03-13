# @mikro-orm/core

TypeScript ORM for Node.js based on Data Mapper, Unit of Work and Identity Map patterns. Supports MongoDB, MySQL, MariaDB, PostgreSQL, SQLite, libSQL, MSSQL, and Oracle databases.

This is the core package of [MikroORM](https://mikro-orm.io), providing the `EntityManager`, metadata system, unit of work, identity map, and entity lifecycle management.

## Installation

Install `@mikro-orm/core` together with a [driver package](https://mikro-orm.io/docs/quick-start) for your database:

```sh
npm install @mikro-orm/core @mikro-orm/postgresql    # PostgreSQL
npm install @mikro-orm/core @mikro-orm/mysql          # MySQL
npm install @mikro-orm/core @mikro-orm/mariadb        # MariaDB
npm install @mikro-orm/core @mikro-orm/sqlite         # SQLite
npm install @mikro-orm/core @mikro-orm/libsql         # libSQL / Turso
npm install @mikro-orm/core @mikro-orm/mongodb        # MongoDB
npm install @mikro-orm/core @mikro-orm/mssql          # MS SQL Server
npm install @mikro-orm/core @mikro-orm/oracledb       # Oracle
```

## Quick Start

Define entities using [decorators](https://mikro-orm.io/docs/defining-entities), [`EntitySchema`](https://mikro-orm.io/docs/entity-schema), or the [`defineEntity` helper](https://mikro-orm.io/docs/define-entity):

```typescript
import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ManyToOne, Collection, ManyToMany } from '@mikro-orm/core';

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Book)
  books = new Collection<Book>(this);
}

// Initialize the ORM
const orm = await MikroORM.init({
  entities: [Author],
  dbName: 'my-db',
});

// Create and persist entities
const author = orm.em.create(Author, { name: 'John' });
await orm.em.flush();

// Query entities
const authors = await orm.em.findAll(Author, {
  where: { name: { $like: '%John%' } },
  populate: ['books'],
});
```

## Key Features

- [Clean and Simple Entity Definition](https://mikro-orm.io/docs/defining-entities) — decorators, `EntitySchema`, or `defineEntity`
- [Identity Map](https://mikro-orm.io/docs/identity-map) and [Unit of Work](https://mikro-orm.io/docs/unit-of-work) — automatic change tracking and transactional writes
- [QueryBuilder](https://mikro-orm.io/docs/query-builder) — type-safe SQL query building
- [Automatic Transactions](https://mikro-orm.io/docs/transactions) — flush computes change sets and wraps them in a transaction
- [Cascading](https://mikro-orm.io/docs/cascading) — persist and remove cascading through relations
- [Filters](https://mikro-orm.io/docs/filters) — global and scoped query filters
- [Schema Generator](https://mikro-orm.io/docs/schema-generator) and [Migrations](https://mikro-orm.io/docs/migrations)
- [Seeding](https://mikro-orm.io/docs/seeding) and [Entity Generator](https://mikro-orm.io/docs/entity-generator)
- [Embeddables](https://mikro-orm.io/docs/embeddables), [Custom Types](https://mikro-orm.io/docs/custom-types), and [Serialization](https://mikro-orm.io/docs/serializing)

## Documentation

See the [official MikroORM documentation](https://mikro-orm.io/docs) and the [quick start guide](https://mikro-orm.io/docs/quick-start).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan). Licensed under the [MIT License](https://github.com/mikro-orm/mikro-orm/blob/master/LICENSE).
