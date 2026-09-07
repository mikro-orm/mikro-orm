---
title: View Entities
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

View entities represent actual database views that are created and managed by MikroORM's schema generator. Unlike [virtual entities](./virtual-entities.md) which evaluate expressions at query time, view entities create persistent `CREATE VIEW` statements in your database.

## Virtual Entities vs View Entities

| Feature | Virtual Entities | View Entities |
|---------|-----------------|---------------|
| Database object | None (expression evaluated at query time) | Actual database view |
| Primary key | Not allowed | Allowed |
| Schema generation | Ignored | `CREATE VIEW` / `DROP VIEW` generated |
| Migrations | Not tracked | Tracked and diffed |
| Read-only | Yes | Yes |
| Use case | Dynamic queries, aggregations | Reusable views, complex queries, legacy views |

## Defining View Entities

To define a view entity, set both `view: true` and provide an `expression`. The expression defines the SQL query that backs the view. Without `view: true`, an entity with only `expression` becomes a virtual entity (the expression is evaluated at query time with no database object created).

### Using String Expression

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

```ts title="./entities/AuthorStats.ts"
import { defineEntity, p } from '@mikro-orm/core';

const AuthorStatsSchema = defineEntity({
  name: 'AuthorStats',
  tableName: 'author_stats_view',
  view: true,
  expression: `
    select a.name, count(b.id) as book_count
    from author a
    left join book b on b.author_id = a.id
    group by a.id, a.name
  `,
  properties: {
    name: p.string().primary(),
    bookCount: p.integer(),
  },
});

export class AuthorStats extends AuthorStatsSchema.class {}
AuthorStatsSchema.setClass(AuthorStats);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/AuthorStats.ts"
import { defineEntity, p } from '@mikro-orm/core';

export const AuthorStats = defineEntity({
  name: 'AuthorStats',
  tableName: 'author_stats_view',
  view: true,
  expression: `
    select a.name, count(b.id) as book_count
    from author a
    left join book b on b.author_id = a.id
    group by a.id, a.name
  `,
  properties: {
    name: p.string().primary(),
    bookCount: p.integer(),
  },
});
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts title="./entities/AuthorStats.ts"
@Entity({
  tableName: 'author_stats_view',
  view: true,
  expression: `
    select a.name, count(b.id) as book_count
    from author a
    left join book b on b.author_id = a.id
    group by a.id, a.name
  `,
})
export class AuthorStats {

  @PrimaryKey()
  name!: string;

  @Property()
  bookCount!: number;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/AuthorStats.ts"
@Entity({
  tableName: 'author_stats_view',
  view: true,
  expression: `
    select a.name, count(b.id) as book_count
    from author a
    left join book b on b.author_id = a.id
    group by a.id, a.name
  `,
})
export class AuthorStats {

  @PrimaryKey()
  name!: string;

  @Property()
  bookCount!: number;

}
```

  </TabItem>
</Tabs>

### Using QueryBuilder Expression

You can also use a callback that returns a QueryBuilder for type-safe view definitions:

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

```ts title="./entities/BookSummary.ts"
import { defineEntity, p } from '@mikro-orm/core';

const BookSummarySchema = defineEntity({
  name: 'BookSummary',
  tableName: 'book_summary_view',
  view: true,
  expression: (em: EntityManager) => {
    return em.createQueryBuilder(Book, 'b')
      .select(['b.title', 'a.name as author_name'])
      .join('b.author', 'a');
  },
  properties: {
    title: p.string().primary(),
    authorName: p.string(),
  },
});

export class BookSummary extends BookSummarySchema.class {}
BookSummarySchema.setClass(BookSummary);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/BookSummary.ts"
import { defineEntity, p } from '@mikro-orm/core';

export const BookSummary = defineEntity({
  name: 'BookSummary',
  tableName: 'book_summary_view',
  view: true,
  expression: (em: EntityManager) => {
    return em.createQueryBuilder(Book, 'b')
      .select(['b.title', 'a.name as author_name'])
      .join('b.author', 'a');
  },
  properties: {
    title: p.string().primary(),
    authorName: p.string(),
  },
});
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts title="./entities/BookSummary.ts"
@Entity({
  tableName: 'book_summary_view',
  view: true,
  expression: (em: EntityManager) => {
    return em.createQueryBuilder(Book, 'b')
      .select(['b.title', 'a.name as author_name'])
      .join('b.author', 'a');
  },
})
export class BookSummary {

  @PrimaryKey()
  title!: string;

  @Property()
  authorName!: string;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/BookSummary.ts"
@Entity({
  tableName: 'book_summary_view',
  view: true,
  expression: (em: EntityManager) => {
    return em.createQueryBuilder(Book, 'b')
      .select(['b.title', 'a.name as author_name'])
      .join('b.author', 'a');
  },
})
export class BookSummary {

  @PrimaryKey()
  title!: string;

  @Property()
  authorName!: string;

}
```

  </TabItem>
</Tabs>

## Querying View Entities

View entities can be queried like any other entity:

```ts
// Find all
const stats = await em.find(AuthorStats, {});

// Find with conditions
const prolificAuthors = await em.find(AuthorStats, {
  bookCount: { $gte: 5 },
});

// Using QueryBuilder
const topAuthors = await em.createQueryBuilder(AuthorStats, 'a')
  .where({ bookCount: { $gt: 0 } })
  .orderBy({ bookCount: 'desc' })
  .limit(10)
  .getResult();
```

## Read-Only Behavior

View entities are automatically marked as read-only. Attempting to persist changes to a view entity will have no effect:

```ts
const stat = await em.findOne(AuthorStats, { name: 'John' });
stat.bookCount = 100; // This change won't be persisted
await em.flush(); // No INSERT/UPDATE generated for view entities
```

## Primary Keys

Unlike virtual entities, view entities can (and should) have primary keys. This allows for:

- Proper identity map tracking within a request
- Using `findOne` with primary key lookups
- Referencing view entities in relations (if needed)

```ts
@Entity({ tableName: 'my_view', view: true, expression: '...' })
export class MyView {
  @PrimaryKey()
  id!: number; // Primary key is allowed

  @Property()
  value!: string;
}
```

## Use Cases

View entities are ideal for:

1. **Reporting queries**: Pre-aggregate data for dashboards
2. **Legacy database views**: Map existing database views to entities
3. **Complex joins**: Simplify access to frequently-joined data
4. **Denormalized data**: Provide a flattened view of normalized tables
5. **Access control**: Expose limited data through views

## Supported Databases

View entities are supported in all SQL databases:

- PostgreSQL
- MySQL / MariaDB
- SQLite
- Microsoft SQL Server

> Note: MongoDB does not support view entities as it doesn't have the concept of database views. Use [virtual entities](./virtual-entities.md) instead for MongoDB.

## Materialized Views

Materialized views are a database feature that allows you to pre-compute and store query results in a table.

MikroORM supports materialized views in PostgreSQL through view entities by setting `view: { materialized: true }`:

```ts
@Entity({
  tableName: 'author_stats_mat_view',
  view: { materialized: true },
  expression: `
    select a.name, count(b.id) as book_count
    from author a
    left join book b on b.author_id = a.id
    group by a.id, a.name
  `,
})
export class AuthorStatsMatView {
  @PrimaryKey()
  name!: string;

  @Property()
  bookCount!: number;
}
```

Read more about materialized views [in their own section](./materialized-views.md). 

## Limitations

- View entities are read-only and cannot be persisted.
- Some databases may have limitations on updatable views.
