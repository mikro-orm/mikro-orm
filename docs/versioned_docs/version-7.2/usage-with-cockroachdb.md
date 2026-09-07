---
title: Usage with CockroachDB
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

MikroORM supports [CockroachDB](https://www.cockroachlabs.com/) through the `@mikro-orm/postgresql` driver. CockroachDB is PostgreSQL wire-compatible, so most MikroORM features work out of the box. This guide covers configuration and the key differences you need to be aware of.

## Installation

Install the PostgreSQL driver - no separate CockroachDB package is needed:

```bash npm2yarn
npm install @mikro-orm/core @mikro-orm/postgresql
```

## Configuration

A minimal CockroachDB configuration:

```ts
import { defineConfig } from '@mikro-orm/postgresql';

export default defineConfig({
  entities: ['./dist/entities'],
  entitiesTs: ['./src/entities'],
  dbName: 'my_database',
  host: 'localhost',
  port: 26257,
  user: 'root',
  password: '',
});
```

CockroachDB uses port `26257` by default instead of PostgreSQL's `5432`.

### CockroachDB Cloud (SSL)

CockroachDB Cloud requires SSL. Pass the CA certificate via `driverOptions`, which maps directly to `pg.Pool` options:

```ts
import { defineConfig } from '@mikro-orm/postgresql';
import { readFileSync } from 'node:fs';

export default defineConfig({
  dbName: 'my_database',
  host: 'your-cluster.cockroachlabs.cloud',
  port: 26257,
  user: 'your-user',
  password: 'your-password',
  driverOptions: {
    ssl: {
      ca: readFileSync('./path/to/ca-cert.crt', 'utf8'),
    },
  },
});
```

## Primary Keys

CockroachDB's `serial` type uses `unique_rowid()` which generates 64-bit integers. Unlike PostgreSQL's `serial` (which is `int4` with a sequence), these are `int8` values that exceed JavaScript's `Number.MAX_SAFE_INTEGER`. The `pg` driver returns them as strings, so you need to type your PKs accordingly.

### Option 1: UUID primary keys (recommended)

CockroachDB recommends UUID primary keys for optimal data distribution across nodes. Using `serial`/auto-increment keys can lead to write hotspots.

<Tabs
  groupId="entity-def"
  defaultValue="define-entity"
  values={[
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'Decorators', value: 'decorators'},
  ]
  }>
  <TabItem value="define-entity">

```ts
const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.uuid().primary(),
    name: p.string(),
  },
});
```

  </TabItem>
  <TabItem value="decorators">

```ts
@Entity()
class Author {

  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @Property()
  name!: string;

}
```

  </TabItem>
</Tabs>

### Option 2: Serial with `BigIntType`

If you prefer auto-increment style keys, use `BigIntType` to map the `serial` value to `string` or `bigint`:

<Tabs
  groupId="entity-def"
  defaultValue="define-entity"
  values={[
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'Decorators', value: 'decorators'},
  ]
  }>
  <TabItem value="define-entity">

```ts
const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.bigint('string').primary(),
    name: p.string(),
  },
});
```

Or as native `bigint`:

```ts
const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.bigint().primary(),
    name: p.string(),
  },
});
```

  </TabItem>
  <TabItem value="decorators">

```ts
@Entity()
class Author {

  @PrimaryKey({ type: new BigIntType('string') })
  id!: string;

}
```

Or as native `bigint`:

```ts
@Entity()
class Author {

  @PrimaryKey()
  id!: bigint;

}
```

  </TabItem>
</Tabs>

> The only thing that does **not** work is `@PrimaryKey() id!: number` / `p.integer().primary()` - CockroachDB's `serial` values are too large for JavaScript's `number` type.

## Integer Columns

CockroachDB maps all integer types (`int2`, `int4`, `int8`) to 64-bit integers internally. The `pg` driver returns values exceeding `Number.MAX_SAFE_INTEGER` as strings. For typical integer columns like `age` or `count`, values will stay within safe range and work fine as `number` types.

## Schema Generator

The schema generator works with CockroachDB. You can use `orm.schema.create()`, `orm.schema.update()`, and `orm.schema.drop()` as usual.

### Clearing the Database

CockroachDB doesn't support `TRUNCATE ... RESTART IDENTITY`. To use `orm.schema.clear()`, pass `truncate: false` to fall back to ordered `DELETE` statements:

```ts
await orm.schema.clear({ truncate: false });
```

### Schema Diffing

Schema introspection may report minor differences compared to PostgreSQL due to CockroachDB's catalog implementation. If you see unexpected diffs in `orm.schema.getUpdateSchemaSQL()`, review them carefully before applying.

## Supported Features

The following features have been tested and work with CockroachDB:

- CRUD operations (create, read, update, delete)
- Relations: ManyToOne, OneToMany, ManyToMany, OneToOne
- Self-referencing relations
- Populate hints and loading strategies (SELECT_IN, JOINED)
- QueryBuilder with conditions, ordering, and pagination
- `findAndCount` with limit/offset
- Transactions and transaction rollback
- Batch inserts
- Upserts (`em.upsert()`)
- JSONB columns
- Array columns (e.g. `text[]`)
- UUID primary keys
- Serial primary keys (with `BigIntType` or `bigint`)
- Schema generator (create, update, drop)
- Migrations

## Known Limitations

| Feature | Status | Notes |
|---------|--------|-------|
| `serial`/`bigserial` PKs | Use `BigIntType` or UUID | CockroachDB's `unique_rowid()` returns `int8`; `number` type won't work |
| Integer types | All mapped to `int8` | Small values work as `number`; large values need `bigint` or `string` |
| `TRUNCATE ... RESTART IDENTITY` | Not supported | Use `orm.schema.clear({ truncate: false })` instead |
| `polygon`, `line`, `path` types | Not supported | CockroachDB doesn't support PostgreSQL geometric types |
| Full-text search (`tsvector`) | Not supported | CockroachDB has its own [full-text search](https://www.cockroachlabs.com/docs/stable/full-text-search) |
| Native PostgreSQL enums | Limited | Use check constraints instead |
| Materialized views | Not supported | CockroachDB doesn't support `CREATE MATERIALIZED VIEW` |
| Deferrable constraints | Not supported | CockroachDB doesn't support `INITIALLY DEFERRED` |

## Full Example

<Tabs
  groupId="entity-def"
  defaultValue="define-entity"
  values={[
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'Decorators', value: 'decorators'},
  ]
  }>
  <TabItem value="define-entity">

```ts
const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.uuid().primary(),
    name: p.string(),
    email: p.string(),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
});

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.uuid().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author),
  },
});

const orm = await MikroORM.init({
  entities: [Author, Book],
  dbName: 'my_database',
  host: 'localhost',
  port: 26257,
  user: 'root',
  password: '',
});

await orm.schema.update();

const em = orm.em.fork();
const author = em.create(Author, { name: 'John', email: 'john@example.com' });
em.create(Book, { title: 'My Book', author });
await em.flush();

const books = await em.find(Book, {}, { populate: ['author'] });
console.log(books[0].author.name); // 'John'

await orm.close();
```

  </TabItem>
  <TabItem value="decorators">

```ts
@Entity()
class Author {

  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @Property()
  name!: string;

  @Property()
  email!: string;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

}

@Entity()
class Book {

  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;

}

const orm = await MikroORM.init({
  entities: [Author, Book],
  driver: PostgreSqlDriver,
  metadataProvider: ReflectMetadataProvider,
  dbName: 'my_database',
  host: 'localhost',
  port: 26257,
  user: 'root',
  password: '',
});

await orm.schema.update();

const em = orm.em.fork();
const author = em.create(Author, { name: 'John', email: 'john@example.com' });
em.create(Book, { title: 'My Book', author });
await em.flush();

const books = await em.find(Book, {}, { populate: ['author'] });
console.log(books[0].author.name); // 'John'

await orm.close();
```

  </TabItem>
</Tabs>
