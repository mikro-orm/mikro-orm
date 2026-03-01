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

| Feature | MySQL | MariaDB | PostgreSQL | MSSQL | SQLite | MongoDB |
|---------|-------|---------|------------|-------|--------|---------|
| Basic indexes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Unique constraints | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Composite indexes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Index expressions | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Fulltext indexes | ✅ | ✅ | ✅ | ✅ | - | ✅ |
| Sort order (ASC/DESC) | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| NULLS FIRST/LAST | - | - | ✅ | - | - | - |
| Column prefix length | ✅ | ✅ | - | - | - | - |
| Collation | ✅ | ✅ | ✅ | - | ✅ | - |
| INCLUDE columns | - | - | ✅ | ✅ | - | - |
| Fill factor | - | - | ✅ | ✅ | - | - |
| Invisible indexes | ✅ | ✅ | - | - | - | ✅ |
| Disabled indexes | - | - | - | ✅ | - | - |
| Clustered indexes | - | ✅ | - | ✅ | - | - |
| Deferrable constraints | - | - | ✅ | - | - | - |

## See Also

- [Defining Entities](./defining-entities.md) - General entity definition guide
- [Schema Generator](./schema-generator.md) - How indexes are created in the database
- [Migrations](./migrations.md) - Managing schema changes including indexes
