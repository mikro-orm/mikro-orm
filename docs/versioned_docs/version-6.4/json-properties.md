---
title: Using JSON properties
---

## Defining JSON properties

Each database driver behaves a bit differently when it comes to JSON properties: Some will parse the values for you automatically, while others will return them as JSON strings. MikroORM tries to unify the experience via [JsonType](./custom-types.md#jsontype). This type will be also used if we specify `type: 'json'`.

```ts
@Entity()
export class Book {

  @Property({ type: 'json', nullable: true })
  meta?: { foo: string; bar: number };

}
```

## Querying by JSON object properties

> Support for querying by JSON object properties was added in v4.4.2

We can query by JSON object properties easily:

```ts
const b = await em.findOne(Book, {
  meta: {
    valid: true,
    nested: {
      foo: '123',
      bar: 321,
      deep: {
        baz: 59,
        qux: false,
      },
    },
  },
});
```

Will produce following query (in postgres):

```sql
select "e0".*
from "book" as "e0"
where ("meta"->>'valid')::bool = true
  and "meta"->'nested'->>'foo' = '123'
  and ("meta"->'nested'->>'bar')::float8 = 321
  and ("meta"->'nested'->'deep'->>'baz')::float8 = 59
  and ("meta"->'nested'->'deep'->>'qux')::bool = false
limit 1
```

> All drivers are currently supported (including sqlite and mongo). In postgres we also try to cast the value if we detect number or boolean on the right-hand side.

## Indexes on JSON properties

To create an index on a JSON property, use an entity-level `@Index()` decorator with a dot path:

```ts
@Entity()
@Index({ properties: 'metaData.foo' })
@Index({ properties: ['metaData.foo', 'metaData.bar'] }) // compound index
export class Book {

  @Property({ type: 'json', nullable: true })
  metaData?: { foo: string; bar: number };

}
```

In PostgreSQL, this will generate a query like the following:

```sql
create index "book_meta_data_foo_index" on "book" (("meta_data"->>'foo'));
```

To create a unique index, use the `@Unique()` decorator:

```ts
@Entity()
@Unique({ properties: 'metaData.foo' })
@Unique({ properties: ['metaData.foo', 'metaData.bar'] }) // compound unique index
export class Book {

  @Property({ type: 'json', nullable: true })
  metaData?: { foo: string; bar: number };

}
```

In MySQL, you can also set the type explicitly:

```ts
@Entity()
@Index({ properties: 'metaData.foo', options: { returning: 'char(200)' } })
export class Book {

  @Property({ type: 'json', nullable: true })
  metaData?: { foo: string; bar: number };

}
```

This will generate a query like the following:

```sql
alter table `book`
  add index `book_meta_data_foo_index`((json_value(`meta_data`, '$.foo' returning char(200))));
```

> MariaDB driver does not support this feature.
