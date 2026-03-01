---
title: Materialized Views
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Materialized views store the results of a query physically, providing faster read performance at the cost of data freshness. Unlike regular views, materialized views must be explicitly refreshed to reflect changes in the underlying data.

## Defining a Materialized View Entity

To create a materialized view entity, use `view: { materialized: true }` in your entity options:

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
import { defineEntity, p } from '@mikro-orm/postgresql';

const AuthorStatsSchema = defineEntity({
  name: 'AuthorStats',
  tableName: 'author_stats_matview',
  view: { materialized: true },
  expression: `
    select
      a.id,
      a.name,
      count(b.id)::int as book_count
    from author a
    left join book b on b.author_id = a.id
    group by a.id
  `,
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    bookCount: p.integer(),
  },
});

export class AuthorStats extends AuthorStatsSchema.class {}
AuthorStatsSchema.setClass(AuthorStats);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/AuthorStats.ts"
import { defineEntity, p } from '@mikro-orm/postgresql';

export const AuthorStats = defineEntity({
  name: 'AuthorStats',
  tableName: 'author_stats_matview',
  view: { materialized: true },
  expression: `
    select
      a.id,
      a.name,
      count(b.id)::int as book_count
    from author a
    left join book b on b.author_id = a.id
    group by a.id
  `,
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    bookCount: p.integer(),
  },
});
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts title="./entities/AuthorStats.ts"
import { Entity, Property, PrimaryKey } from '@mikro-orm/postgresql';

@Entity({
  tableName: 'author_stats_matview',
  view: { materialized: true },
  expression: `
    select
      a.id,
      a.name,
      count(b.id)::int as book_count
    from author a
    left join book b on b.author_id = a.id
    group by a.id
  `,
})
export class AuthorStats {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  bookCount!: number;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/AuthorStats.ts"
import { Entity, Property, PrimaryKey } from '@mikro-orm/postgresql';

@Entity({
  tableName: 'author_stats_matview',
  view: { materialized: true },
  expression: `
    select
      a.id,
      a.name,
      count(b.id)::int as book_count
    from author a
    left join book b on b.author_id = a.id
    group by a.id
  `,
})
export class AuthorStats {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  bookCount!: number;

}
```

  </TabItem>
</Tabs>

## Creating Materialized Views Without Data

By default, materialized views are created with data populated immediately (`WITH DATA`). If you want to create an empty materialized view that will be populated later, set `withData: false`:

```typescript
const AuthorStats = defineEntity({
  name: 'AuthorStats',
  tableName: 'author_stats_matview',
  view: { materialized: true, withData: false }, // Creates with "WITH NO DATA"
  expression: `select ...`,
  properties: { ... },
});
```

This is useful when the underlying tables are empty during schema creation, or when you want to control exactly when the initial data population occurs.

## Refreshing Materialized Views

Since materialized views cache query results, you need to refresh them to see updated data. Use the `refreshMaterializedView` method on `PostgreSqlEntityManager`:

```typescript
import { MikroORM, EntityManager } from '@mikro-orm/postgresql';

const orm = await MikroORM.init({ ... });
const em = orm.em;

// Refresh the materialized view
await em.refreshMaterializedView(AuthorStats);

// Now queries will return the updated data
const stats = await em.find(AuthorStats, {});
```

### Concurrent Refresh

PostgreSQL supports refreshing materialized views concurrently, which allows reads to continue during the refresh. This requires a unique index on the materialized view:

```typescript
// Refresh concurrently (requires unique index on the view)
await em.refreshMaterializedView(AuthorStats, { concurrently: true });
```

> **Note:** Concurrent refresh requires at least one unique index on the materialized view. Without it, PostgreSQL will throw an error.

## Querying Materialized Views

Materialized views are queried like any other entity:

```typescript
// Find all
const allStats = await em.find(AuthorStats, {});

// Find with conditions
const prolificAuthors = await em.find(AuthorStats, {
  bookCount: { $gte: 5 },
});

// Find one
const authorStats = await em.findOne(AuthorStats, { name: 'Jon Snow' });
```

## Read-Only Behavior

Materialized view entities are automatically marked as read-only (`readonly: true`). Attempting to persist changes to a materialized view entity will result in an error:

```typescript
const stats = await em.findOne(AuthorStats, { id: 1 });
stats.bookCount = 100; // This change won't be persisted
await em.flush(); // No UPDATE will be generated for this entity
```

## Schema Generation

The schema generator handles materialized views automatically:

```typescript
// Create schema (includes CREATE MATERIALIZED VIEW statements)
await orm.schema.createSchema();

// Drop schema (includes DROP MATERIALIZED VIEW statements)
await orm.schema.dropSchema();

// Update schema (detects changes to materialized views)
await orm.schema.updateSchema();
```

### Generated SQL

Creating a materialized view generates:

```sql
create materialized view "author_stats_matview" as
  select a.id, a.name, count(b.id)::int as book_count
  from author a
  left join book b on b.author_id = a.id
  group by a.id
with data;
```

With `withData: false`:

```sql
create materialized view "author_stats_matview" as
  select ...
with no data;
```

## Limitations

- **PostgreSQL only:** Materialized views are only supported on PostgreSQL. Other databases will throw an error if you try to use `view: { materialized: true }`.
- **No automatic refresh:** MikroORM does not automatically refresh materialized views. You must call `refreshMaterializedView()` manually or set up a database-level refresh mechanism (triggers, cron jobs, etc.).

## Best Practices

1. **Choose appropriate refresh strategies:** For frequently changing data, consider regular views instead. Use materialized views for data that changes infrequently or where stale data is acceptable.

2. **Add indexes:** Materialized views support indexes. Add them for columns you frequently query:
   ```sql
   CREATE UNIQUE INDEX author_stats_id_idx ON author_stats_matview (id);
   CREATE INDEX author_stats_book_count_idx ON author_stats_matview (book_count);
   ```

3. **Schedule refreshes:** Use database schedulers (pg_cron) or application-level scheduling to refresh materialized views during low-traffic periods.

4. **Use concurrent refresh in production:** If your application needs to read from the view while refreshing, always use `{ concurrently: true }` (requires a unique index).

5. **Monitor view size:** Materialized views consume disk space. Monitor their size and consider partitioning strategies for large datasets.
