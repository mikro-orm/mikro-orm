---
title: Indexes and Unique Constraints
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

MikroORM provides comprehensive support for defining indexes and unique constraints on your entities. This guide covers everything from basic usage to advanced database-specific features.

## Basic Index and Unique Constraint Definition

Indexes can be defined using the `@Index()` decorator, and unique constraints using `@Unique()`. Both can be applied at the entity level (for composite indexes) or property level (for single-column indexes).

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
]
}
>
  <TabItem value="reflect-metadata">

```ts title="./entities/Author.ts"
@Entity()
@Index({ properties: ['name', 'age'] }) // compound index
@Index({ name: 'custom_idx_name', properties: ['name'] }) // named index
@Unique({ properties: ['name', 'email'] }) // compound unique constraint
export class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  @Index() // simple index with generated name
  name!: string;

  @Property()
  @Unique() // simple unique constraint
  email!: string;

  @Property()
  @Index({ name: 'age_idx' }) // named index
  age?: number;

}
```

</TabItem>
<TabItem value="ts-morph">

```ts title="./entities/Author.ts"
@Entity()
@Index({ properties: ['name', 'age'] })
@Index({ name: 'custom_idx_name', properties: ['name'] })
@Unique({ properties: ['name', 'email'] })
export class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  @Index()
  name!: string;

  @Property()
  @Unique()
  email!: string;

  @Property()
  @Index({ name: 'age_idx' })
  age?: number;

}
```

</TabItem>
</Tabs>

## Custom Index Expressions

For complex indexes that require custom SQL, you can use the `expression` option. This allows you to specify the exact `CREATE INDEX` statement.

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
]
}
>
  <TabItem value="reflect-metadata">

```ts title="./entities/Author.ts"
@Entity()
export class Author {

  // Raw SQL expression
  @Index({
    name: 'custom_index_expr',
    expression: 'alter table `author` add index `custom_index_expr`(`title`)'
  })
  @Property()
  title!: string;

  // Expression callback with table and column references
  @Index({
    name: 'custom_index_country',
    expression: (table, columns, indexName) =>
      `create index \`${indexName}\` on \`${table.name}\` (\`${columns.country}\`)`
  })
  @Property()
  country!: string;

}
```

</TabItem>
</Tabs>

## Partial Indexes

Partial indexes (also called filtered indexes) only index the rows that match a predicate. They are useful for enforcing uniqueness on a subset of rows, or for accelerating queries that target a specific slice of data while keeping the index small.

Use the `where` option on `@Index` or `@Unique`. The portable form is a `FilterQuery` object — same operators you'd use in `em.find()` — and it works on every driver. MikroORM renders it to dialect-specific SQL on PostgreSQL / SQLite / MSSQL / MySQL / Oracle, and to `partialFilterExpression` on MongoDB.

<Tabs
  groupId="entity-def"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
]
  }
>
  <TabItem value="define-entity-class">

```ts title="./entities/User.ts"
import { defineEntity, p } from '@mikro-orm/core';

const UserSchema = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    email: p.string(),
    deletedAt: p.datetime().nullable(),
  },
  uniques: [
    { properties: ['email'], where: { deletedAt: null } },
  ],
});

export class User extends UserSchema.class {}
UserSchema.setClass(User);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/User.ts"
import { type InferEntity, defineEntity, p } from '@mikro-orm/core';

export const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    email: p.string(),
    deletedAt: p.datetime().nullable(),
  },
  uniques: [
    { properties: ['email'], where: { deletedAt: null } },
  ],
});

export type IUser = InferEntity<typeof User>;
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts title="./entities/User.ts"
@Entity()
@Unique({ properties: ['email'], where: { deletedAt: null } })
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  email!: string;

  @Property({ nullable: true })
  deletedAt?: Date;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/User.ts"
@Entity()
@Unique({ properties: ['email'], where: { deletedAt: null } })
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  email!: string;

  @Property({ nullable: true })
  deletedAt?: Date;

}
```

  </TabItem>
</Tabs>

SQL drivers also accept a raw SQL fragment as `where` — useful for predicates that don't fit the FilterQuery shape (custom operators, function calls, dialect-specific syntax). Quoting is your responsibility:

<Tabs
  groupId="entity-def"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
]
  }
>
  <TabItem value="define-entity-class">

```ts title="./entities/User.ts"
const UserSchema = defineEntity({
  name: 'User',
  properties: { /* ... */ },
  uniques: [
    { properties: ['email'], where: 'lower("email") <> \'\'' },
  ],
});
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/User.ts"
export const User = defineEntity({
  name: 'User',
  properties: { /* ... */ },
  uniques: [
    { properties: ['email'], where: 'lower("email") <> \'\'' },
  ],
});
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts title="./entities/User.ts"
@Entity()
@Unique({ properties: ['email'], where: 'lower("email") <> \'\'' })
export class User { /* ... */ }
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/User.ts"
@Entity()
@Unique({ properties: ['email'], where: 'lower("email") <> \'\'' })
export class User { /* ... */ }
```

  </TabItem>
</Tabs>

Raw fragments are SQL-only — MongoDB rejects them.

**Generated DDL by dialect** (for `where: '"deleted_at" is null'`):

| Dialect | Output |
|---------|--------|
| PostgreSQL | `create unique index "user_email_uniq" on "user" ("email") where "deleted_at" is null` |
| SQLite | `create unique index \`user_email_uniq\` on \`user\` (\`email\`) where "deleted_at" is null` |
| MSSQL | `create unique index [user_email_uniq] on [user] ([email]) where "deleted_at" is null` |
| MySQL | `alter table \`user\` add unique \`user_email_uniq\` ((case when "deleted_at" is null then \`email\` end))` |
| MariaDB | not supported — see note below |
| Oracle | `create unique index "user_email_uniq" on "user" ((case when "deleted_at" is null then "email" end))` |
| MongoDB | `db.user.createIndex({ email: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } })` |

**How MySQL / Oracle emulate this**: those engines have no native `WHERE` clause for indexes, so MikroORM emits a *function-based index* that wraps each column in `(CASE WHEN <predicate> THEN <col> END)`. Rows where the predicate is false get `NULL` for the indexed expression, and since `NULL`s are treated as distinct in unique indexes, uniqueness is enforced only where the predicate holds. Non-unique partial indexes also work via the same trick (off-predicate rows are still indexed, just under `NULL` keys).

**MariaDB**: inline expression indexes are not supported. If you need a partial index on MariaDB, define a virtual generated column with the predicate baked in and create a regular index on that column. MikroORM throws a clear error if you try to use `where` on MariaDB.

**Database support:**

| Form | Native | Emulated (CASE WHEN) | Not supported |
|------|--------|----------------------|---------------|
| Object `where` (FilterQuery) | PostgreSQL, SQLite, MSSQL, MongoDB | MySQL 8.0.13+, Oracle | MariaDB (use a virtual column instead) |
| Raw SQL string `where` | PostgreSQL, SQLite, MSSQL | MySQL 8.0.13+, Oracle | MariaDB, MongoDB |

The MySQL emulation (functional-key-part indexes) requires MySQL **8.0.13 or newer**. MikroORM does not probe the server version before emitting the DDL — older MySQL servers reject the `CASE WHEN` expression with their own parser error at schema-apply time, not with a MikroORM-specific message.

:::note Schema diffing

Schema diffing for partial indexes compares the WHERE predicate structurally — the same expression normalizer used for check constraints (whitespace / quoting / casing collapse) is applied to both sides. Changing or removing `where` will produce a proper `ALTER`/`DROP`+`CREATE`, and idempotent re-runs of `schema:update` produce no diff.

:::

:::note Combining with `columns`

The advanced `columns` option (sort order, prefix length, collation) is not supported alongside `where` on MySQL / MariaDB / Oracle, because each indexed column is wrapped inside a `CASE WHEN` expression there. Use `properties` (or simple `columnNames`) for partial indexes on those drivers.

:::

:::note Combining with `expression`

The `expression` escape hatch (raw SQL for the whole index body) cannot be combined with `where` — the two ways to spell the predicate are mutually exclusive. If you need both a custom expression and a predicate, inline the `WHERE` clause into `expression` yourself. MikroORM throws a clear error if both are set.

:::

:::note Round-trip via the entity generator

On PostgreSQL, indexes over functional columns (e.g. `lower(email)`, `(data->>'kind')`) are introspected as opaque `expression` strings — the full `CREATE INDEX … WHERE …` survives the round-trip, but a regenerated entity uses `expression` rather than structured `properties` + `where`. Purely column-based partial indexes round-trip as structured `where`.

:::

### Inherited properties via `defineEntity({ extends })`

The `where` predicate is resolved against the entity's full property set, so a child entity can reference a property from its base — useful for reusing a `deletedAt` column or any other discriminator across a hierarchy:

```ts title="./entities/SoftDeleteBase.ts"
import { defineEntity, p } from '@mikro-orm/core';

export const SoftDeleteBase = defineEntity({
  name: 'SoftDeleteBase',
  abstract: true,
  properties: {
    id: p.integer().primary(),
    deletedAt: p.datetime().nullable(),
  },
});
```

```ts title="./entities/User.ts"
import { defineEntity, p } from '@mikro-orm/core';
import { SoftDeleteBase } from './SoftDeleteBase';

export const UserSchema = defineEntity({
  extends: SoftDeleteBase,
  name: 'User',
  properties: {
    email: p.string(),
  },
  uniques: [
    // `deletedAt` is inherited from SoftDeleteBase
    { properties: ['email'], where: { deletedAt: null } },
  ],
});

export class User extends UserSchema.class {}
UserSchema.setClass(User);
```

## Index Types

You can specify the index type using the `type` option. This is particularly useful for fulltext indexes, spatial indexes, or database-specific index types like `hash` or `btree`.

```ts
// Fulltext index (MySQL, PostgreSQL, MongoDB)
@Index({ properties: ['content'], type: 'fulltext' })

// Spatial index
@Index({ properties: ['location'], type: 'spatial' })

// Hash index (PostgreSQL)
@Index({ properties: ['lookup_key'], type: 'hash' })
```

## Column Sort Order and NULLS Ordering

You can specify the sort order (`ASC`/`DESC`) and nulls ordering (`NULLS FIRST`/`NULLS LAST`) for each column in an index using the `columns` option.

```ts
@Entity()
@Index({
  properties: ['createdAt', 'name'],
  columns: [
    { name: 'createdAt', sort: 'DESC', nulls: 'LAST' },
    { name: 'name', sort: 'ASC' },
  ],
})
export class Article {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  createdAt!: Date;

}
```

**Database support:**
- **Sort order**: MySQL, MariaDB, PostgreSQL, MSSQL, SQLite
- **NULLS FIRST/LAST**: PostgreSQL only

## Column Prefix Length

For text columns, you can create an index on just the first N characters using the `length` option. This is useful for indexing large text fields.

```ts
@Entity()
@Index({
  properties: ['content'],
  columns: [{ name: 'content', length: 100 }],
})
export class Article {

  @PrimaryKey()
  id!: number;

  @Property({ type: 'text' })
  content!: string;

}
```

**Database support:** MySQL, MariaDB

## Column Collation

You can specify a collation for index columns, which affects how string comparisons are performed within the index.

```ts
@Entity()
@Index({
  properties: ['name'],
  columns: [{ name: 'name', collation: 'C' }],
})
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}
```

**Database support:** PostgreSQL, SQLite, MySQL, MariaDB

## Covering Indexes (INCLUDE columns)

Covering indexes store additional columns in the index leaf pages, allowing queries to be satisfied entirely from the index without accessing the table data.

```ts
@Entity()
@Index({
  properties: ['email'],
  include: ['name', 'createdAt'], // these columns are stored in the index
})
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  email!: string;

  @Property()
  name!: string;

  @Property()
  createdAt!: Date;

}
```

This generates SQL like:
```sql
-- PostgreSQL
CREATE INDEX user_email_idx ON "user" ("email") INCLUDE ("name", "created_at")

-- MSSQL
CREATE INDEX [user_email_idx] ON [user] ([email]) INCLUDE ([name], [created_at])
```

**Database support:** PostgreSQL, MSSQL

## Fill Factor

Fill factor specifies the percentage of space on each index page to fill with data, leaving the rest as free space for future growth.

```ts
@Entity()
@Index({
  properties: ['email'],
  fillFactor: 70, // 70% fill, 30% free space
})
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  email!: string;

}
```

**Database support:** PostgreSQL, MSSQL

## Invisible/Hidden Indexes

Invisible indexes are maintained by the database (updated on writes) but are not used by the query optimizer. This is useful for testing the impact of removing an index before actually dropping it.

```ts
@Entity()
@Index({
  properties: ['name'],
  invisible: true,
})
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}
```

**Database support:** MySQL 8.0+, MariaDB 10.6+, MongoDB

## Disabled Indexes

Disabled indexes are not used by the query optimizer and are not maintained on writes. This differs from invisible indexes which are still maintained. Disabled indexes can be re-enabled later using `ALTER INDEX ... REBUILD`.

```ts
@Entity()
@Index({
  properties: ['name'],
  disabled: true,
})
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}
```

**Database support:** MSSQL

## Clustered Indexes

A clustered index determines the physical order of data in the table. Only one clustered index can exist per table.

```ts
@Entity()
@Index({
  properties: ['createdAt'],
  clustered: true,
})
export class Event {

  @PrimaryKey()
  id!: number;

  @Property()
  createdAt!: Date;

}
```

**Database support:** MariaDB (Aria storage engine only), MSSQL

:::note MariaDB Limitation

In MariaDB, clustered indexes (`CLUSTERING=YES`) only work with the Aria storage engine. Using this option with InnoDB tables will have no effect (the option is silently ignored).

:::

## Deferrable Unique Constraints (PostgreSQL)

PostgreSQL supports deferrable constraints that can be checked at the end of a transaction rather than immediately.

```ts
@Entity()
@Unique({
  properties: ['email'],
  deferMode: 'INITIALLY_DEFERRED', // or 'INITIALLY_IMMEDIATE'
})
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  email!: string;

}
```

**Database support:** PostgreSQL

## JSON Column Indexes

MikroORM automatically handles indexing of JSON columns. When you specify a property path that includes a JSON column, the appropriate expression index is generated.

```ts
@Entity()
@Index({ properties: ['metadata.email'] }) // indexes a field within JSON
export class User {

  @PrimaryKey()
  id!: number;

  @Property({ type: 'json' })
  metadata!: { email: string; phone: string };

}
```

## Combining Multiple Options

You can combine multiple index options together:

```ts
@Entity()
@Index({
  name: 'user_search_idx',
  properties: ['lastName', 'firstName'],
  columns: [
    { name: 'lastName', sort: 'ASC' },
    { name: 'firstName', sort: 'ASC' },
  ],
  include: ['email', 'phone'],
  fillFactor: 80,
})
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  firstName!: string;

  @Property()
  lastName!: string;

  @Property()
  email!: string;

  @Property()
  phone!: string;

}
```

## Database Support Summary

| Feature | MySQL | MariaDB | PostgreSQL | PGlite | CockroachDB | MSSQL | Oracle | SQLite | libSQL | MongoDB |
|---------|-------|---------|------------|--------|-------------|-------|--------|--------|--------|---------|
| Basic indexes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Unique constraints | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Composite indexes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Index expressions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Partial indexes (`where`) | ✅ (CASE WHEN) | - | ✅ | ✅ | ✅ | ✅ | ✅ (CASE WHEN) | ✅ | ✅ | ✅ (object form → `partialFilterExpression`) |
| Fulltext indexes | ✅ | ✅ | ✅ | ✅ | - | ✅ | - | - | - | ✅ |
| Sort order (ASC/DESC) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| NULLS FIRST/LAST | - | - | ✅ | ✅ | ✅ | - | ✅ | - | - | - |
| Column prefix length | ✅ | ✅ | - | - | - | - | - | - | - | - |
| Collation | ✅ | ✅ | ✅ | ✅ | ✅ | - | ✅ | ✅ | ✅ | - |
| INCLUDE columns | - | - | ✅ | ✅ | ✅ | ✅ | - | - | - | - |
| Fill factor | - | - | ✅ | ✅ | - | ✅ | - | - | - | - |
| Invisible indexes | ✅ | ✅ | - | - | - | - | - | - | - | ✅ |
| Disabled indexes | - | - | - | - | - | ✅ | - | - | - | - |
| Clustered indexes | - | ✅ | - | - | - | ✅ | - | - | - | - |
| Deferrable constraints | - | - | ✅ | ✅ | - | - | ✅ | - | - | - |

## Query-time index hints (`using`)

The `using` option on `FindOptions` lets you tell the database which named index to use for a given query, with validation built in. It is the higher-level companion to the raw [`indexHint`](./entity-manager.md#index-hints) option — instead of writing dialect-specific hint syntax by hand, you pass the **name** of an index declared on the entity, and MikroORM:

1. Validates that the index exists on the entity.
2. Validates that every property used in `where` / `orderBy` is covered by that index.
3. Emits the appropriate SQL hint for the underlying driver.

```ts
const users = await em.find(User, { name: 'foo' }, {
  using: 'idx_user_name',
});

// also accepts an array — where/orderBy may use the union of their properties
em.find(User, { name: 'foo', email: 'bar@x' }, {
  using: ['idx_user_name', 'uniq_user_email'],
});
```

Per-driver behavior:

| Driver           | Emitted hint                          |
|------------------|---------------------------------------|
| MySQL / MariaDB  | `USE INDEX (idx_name[, ...])`         |
| MSSQL            | `WITH (INDEX(idx_name[, ...]))`       |
| MongoDB          | passed as the `hint` option (single index only) |
| PostgreSQL       | validation only — no native hint syntax |
| SQLite / libSQL  | validation only                       |

When both `using` and `indexHint` are set, the raw `indexHint` wins and is emitted verbatim; `using` still validates `where` / `orderBy`.

### Type-safe `using`

To make `using` autocomplete index names and narrow `where` to only the properties covered by the chosen index, the entity has to declare an index map. The mechanism differs between definition styles:

#### `defineEntity` — automatic inference

Named indexes declared via property-level `.index('name')` / `.unique('name')` and the entity-level `indexes` / `uniques` arrays are picked up automatically. No extra declaration is needed:

```ts
import { defineEntity, p } from '@mikro-orm/core';

const Article = defineEntity({
  name: 'Article',
  properties: {
    id: p.integer().primary(),
    title: p.string().index('idx_article_title'),
    slug: p.string().unique('uniq_article_slug'),
    status: p.string(),
    views: p.integer(),
  },
  indexes: [{ name: 'idx_article_status_views', properties: ['status', 'views'] }],
});

em.find(Article, { title: 'foo' }, { using: 'idx_article_title' });
em.find(Article, { slug: 'foo' }, { using: 'uniq_article_slug' });
em.find(Article, { status: 'draft', views: 100 }, { using: 'idx_article_status_views' });

// @ts-expect-error 'views' is not covered by 'idx_article_title'
em.find(Article, { views: 100 }, { using: 'idx_article_title' });
```

#### Decorator entities — `[IndexHints]` symbol

Decorator metadata doesn't carry the index names into the entity type, so you spell the index map out as a phantom property using the `IndexHints` symbol (same pattern as `[PrimaryKeyProp]` or `[OptionalProps]`):

```ts
import { Entity, Index, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { IndexHints, PrimaryKeyProp } from '@mikro-orm/core';

@Entity()
@Index({ name: 'idx_user_name', properties: ['name'] })
@Index({ name: 'idx_user_name_email', properties: ['name', 'email'] })
@Unique({ name: 'uniq_user_email', properties: ['email'] })
class User {

  [PrimaryKeyProp]?: 'id';
  [IndexHints]?: {
    idx_user_name: 'name';
    idx_user_name_email: 'name' | 'email';
    uniq_user_email: 'email';
  };

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  email!: string;

  @Property({ nullable: true })
  age?: number;

}

em.find(User, { name: 'foo' }, { using: 'idx_user_name' });

// @ts-expect-error 'age' is not in idx_user_name
em.find(User, { age: 30 }, { using: 'idx_user_name' });
```

The phantom `[IndexHints]?` declaration is type-only — it does not exist at runtime and is never serialized. Each key is an index name; each value is the union of property names covered by that index. When `[IndexHints]` is not declared, `using` falls back to `string` and accepts any name (runtime validation still applies).

### Runtime validation

Validation runs even when the type system doesn't catch the mistake (e.g. for entities without `[IndexHints]`, or when `where` is cast to `any`):

```ts
// throws: Index 'nonexistent_idx' not found on entity 'User'. Available indexes: ...
em.find(User, { name: 'foo' }, { using: 'nonexistent_idx' });

// throws: Property 'age' in where clause is not covered by index 'idx_user_name'
em.find(User, { age: 30 } as any, { using: 'idx_user_name' });

// throws: Property 'age' in orderBy is not covered by index 'idx_user_name'
em.find(User, { name: 'foo' }, { using: 'idx_user_name', orderBy: { age: 'asc' } });
```

The validator walks `$and` / `$or` / `$not` recursively, so nested conditions are checked too. Non-property operators inside a property value (e.g. `{ name: { $eq: 'foo' } }`) are accepted as long as the surrounding property is covered.

See [Index Hints](./entity-manager.md#index-hints) and [Named Index Hints via `using`](./entity-manager.md#named-index-hints-via-using) on the Entity Manager page for the matching FindOptions reference.

## See Also

- [Defining Entities](./defining-entities.md) - General entity definition guide
- [Schema Generator](./schema-generator.md) - How indexes are created in the database
- [Migrations](./migrations.md) - Managing schema changes including indexes
