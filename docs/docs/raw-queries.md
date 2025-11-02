---
title: Using raw SQL query fragments
---

## `raw()` helper

When you want to use a raw SQL fragment as part of your query, you can use the `raw()` helper. It creates a raw SQL query fragment instance that can be assigned to a property or part of a filter. This fragment is represented by `RawQueryFragment` class instance that can be serialized to a string, so it can be used both as an object value and key. When serialized, the fragment key gets cached and only such a cached key will be recognized by the ORM. This adds runtime safety to the raw query fragments.

> **`raw()` helper is required since v6 to use a raw SQL fragment in your query, both through EntityManager and QueryBuilder.**

```ts
// as a value
await em.find(User, { time: raw('now()') });

// as a key
await em.find(User, { [raw('lower(name)')]: name.toLowerCase() });

// with operators
await em.find(User, { [raw('lower(name)')]: { $like: name.toLowerCase() } });

// value can be empty array to skip operator
await em.find(User, { [raw('(select 1 = 1)')]: [] });
```

The `raw` helper supports several signatures, you can pass in a callback that receives the current property alias:

```ts
await em.find(User, { [raw(alias => `lower(${alias}.name)`)]: name.toLowerCase() });
```

### Raw fragments in filters

When using raw query fragment inside a filter, you might have to use a callback signature to create new raw instance for every filter usage - namely when you use the fragment as an object key, which requires its serialization.

```ts
@Filter({ name: 'long', cond: () => ({ [raw('length(perex)')]: { $gt: 10000 } }) })
```

### Raw fragments in indexes and uniques

The `raw` helper can be used within indexes and uniques to write database-agnostic SQL expressions. In that case, you can use `'??'` to tag your database identifiers (table name, column names, index name, ...) inside your expression, and pass those identifiers as a second parameter to the `raw` helper. Internally, those will automatically be quoted according to the database in use:

```ts
// On postgres, will produce: create index "index custom_idx_on_name" on "library.author" ("country")
// On mysql, will produce: create index `index custom_idx_on_name` on `library.author` (`country`)
@Index({ name: 'custom_idx_on_name', expression: (table, columns) => raw(`create index ?? on ?? (??)`, ['custom_idx_on_name', table, columns.name]) })
@Entity({ schema: 'library' })
export class Author { ... }
```

You can also use the `quote` tag function to write database-agnostic SQL expressions. The end-result is the same as using the `raw` function regarding database identifiers quoting, only to have a more elegant expression syntax:

```ts
@Index({ name: 'custom_idx_on_name', expression: (table, columns) => quote`create index ${'custom_idx_on_name'} on ${table} (${columns.name})` })
@Entity({ schema: 'library' })
export class Author { ... }
```

## `raw` queries with `QueryBuilder`

You can use the `raw` helper for `QueryBuilder` or `Knex.QueryBuilder` instances too. Note that this is only available in the `raw` helper exported from SQL drivers, not with the one exported from the `@mikro-orm/core` package.

```ts
import { raw } from '@mikro-orm/postgresql';

const knexRaw = em.getKnex().raw('select 1');

const r = await em.find(User, {
  id: raw(knexRaw),
});
```

## `sql` tagged templates

You can also use the `sql` tagged template function, which works the same, but supports only the simple string signature:

```ts
// as a value
await em.find(User, { time: sql`now()` });

// as a key
await em.find(User, { [sql`lower(name)`]: name.toLowerCase() });

// value can be empty array
await em.find(User, { [sql`(select ${1} = ${1})`]: [] });
```

### `sql.ref()`

When you want to refer to a column, you can use the `sql.ref()` function:

```ts
await em.find(User, { foo: sql.ref('bar') });
```

### `sql.now()`

When you want to define a default value for a datetime column, you can use the `sql.now()` function. It resolves to `current_timestamp` SQL function, and accepts a `length` parameter.

```ts
@Property({ default: sql.now() })
createdAt: Date & Opt;
```

### `sql.lower()` and `sql.upper()`

To convert a key to lowercase or uppercase, you can use the `sql.lower()` and `sql.upper()` functions

```ts
const books = await orm.em.find(Book, {
  [sql.upper('title')]: 'TITLE',
});
```

### Aliasing

To select a raw fragment, we need to alias it. For that, we can use ```sql`(select 1 + 1)`.as('<alias>')```.
