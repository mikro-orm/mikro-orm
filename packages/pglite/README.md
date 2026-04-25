# @mikro-orm/pglite

[MikroORM](https://mikro-orm.io) driver for [PGlite](https://pglite.dev) — a WASM build of PostgreSQL that runs in Node.js, the browser, Bun and Deno without a separate database server.

## Installation

```sh
npm install @mikro-orm/core @mikro-orm/pglite
```

## Usage

```typescript
import { defineEntity, p, MikroORM } from '@mikro-orm/pglite';

const AuthorSchema = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
});
export class Author extends AuthorSchema.class {}
AuthorSchema.setClass(Author);

const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author).inversedBy('books'),
  },
});
export class Book extends BookSchema.class {}
BookSchema.setClass(Book);

// In-memory (default)
const orm = await MikroORM.init({
  entities: [Author, Book],
});

// Persisted to a Node.js directory
const orm = await MikroORM.init({
  entities: [Author, Book],
  dbName: './my-db',
});

// Browser, persisted in IndexedDB
const orm = await MikroORM.init({
  entities: [Author, Book],
  dbName: 'idb://my-db',
});

const author = orm.em.create(Author, { name: 'Jon Snow' });
orm.em.create(Book, { title: 'My Life on The Wall', author });
await orm.em.flush();
```

## Features

- Embedded PostgreSQL — no server, no Docker, no network round-trips
- Reuses the full `@mikro-orm/postgresql` SQL/schema/migrations stack via `@mikro-orm/sql`
- [QueryBuilder](https://mikro-orm.io/docs/query-builder) with PostgreSQL semantics
- [Kysely integration](https://mikro-orm.io/docs/kysely) for type-safe raw queries
- [Schema generation](https://mikro-orm.io/docs/schema-generator) and [migrations](https://mikro-orm.io/docs/migrations)

## Limitations

- **Streaming is not supported** by PGlite. Use `@mikro-orm/postgresql` if you need cursor-based streaming.

## Documentation

See the [official MikroORM documentation](https://mikro-orm.io/docs) and the [PostgreSQL usage guide](https://mikro-orm.io/docs/usage-with-postgresql).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan). Licensed under the [MIT License](https://github.com/mikro-orm/mikro-orm/blob/master/LICENSE).
