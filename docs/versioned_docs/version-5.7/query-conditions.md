---
title: Smart Query Conditions
---

When you want to make complex queries, we can easily end up with a lot of boilerplate code full of curly brackets:

```ts
const res = await orm.em.find(Author, { $and: [
  { id: { $in: [1, 2, 7] }, },
  { id: { $nin: [3, 4] }, },
  { id: { $gt: 5 }, },
  { id: { $lt: 10 }, },
  { id: { $gte: 7 }, },
  { id: { $lte: 8 }, },
  { id: { $ne: 9 }, },
] });
```

For AND condition with single field, we can also do this:

```ts
const res = await orm.em.find(Author, {
  id: {
    $in: [1, 2, 7],
    $nin: [3, 4],
    $gt: 5,
    $lt: 10,
    $gte: 7,
    $lte: 8,
    $ne: 9,
  },
});
```

There is also shortcut for `$in` - simply provide array as value and it will be converted automatically:

```ts
const res = await orm.em.find(Author, { favouriteBook: [1, 2, 7] });
```

For primary key lookup, we can provide the array directly to `em.find()`:

```ts
const res = await orm.em.find(Author, [1, 2, 7]);
```

## List of supported operators

### Comparison

| operator     | name             | description                                                                                 |
| ------------ | ---------------- | ------------------------------------------------------------------------------------------- |
| `$eq`        | equals           | Matches values that are equal to a specified value.                                         |
| `$gt`        | greater          | Matches values that are greater than a specified value.                                     |
| `$gte`       | greater or equal | Matches values that are greater than or equal to a specified value.                         |
| `$in`        | contains         | Matches any of the values specified in an array.                                            |
| `$lt`        | lower            | Matches values that are less than a specified value.                                        |
| `$lte`       | lower or equal   | Matches values that are less than or equal to a specified value.                            |
| `$ne`        | not equal        | Matches all values that are not equal to a specified value.                                 |
| `$nin`       | not contains     | Matches none of the values specified in an array.                                           |
| `$like`      | like             | Uses LIKE operator                                                                          |
| `$re`        | regexp           | Uses REGEXP operator. See info [below](#regular-expressions)                                |
| `$fulltext`  | full text        | A driver specific full text search function. See requirements [below](#full-text-searching) |
| `$ilike`     | ilike            | (postgres only)                                                                             |
| `$overlap`   | &&               | (postgres only)                                                                             |
| `$contains`  | @>               | (postgres only)                                                                             |
| `$contained` | <@               | (postgres only)                                                                             |

### Logical

| operator | description                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------- |
| `$and`   | Joins query clauses with a logical AND returns all documents that match the conditions of both clauses. |
| `$not`   | Inverts the effect of a query expression and returns documents that do not match the query expression.  |
| `$or`    | Joins query clauses with a logical OR returns all documents that match the conditions of either clause. |

## Regular Expressions

The `$re` operator takes a string as input value, and by default uses the case-sensitive operator. If you would like to use a `RegExp` object, i.e. to be able to set flags, then search directly on the field name without using the operator:

```ts
const res = await em.find(Painter, {
  lastName: /m[oa]net/i, // or `new RegExp('m[oa]net', 'i')`
});
```

## Full text searching

Full-text search refers to searching some text inside extensive text data stored and returning results that contain some or all of the words from the query. In contrast, traditional search would return exact matches.

The implementation and requirements differs per driver so it's important that fields are setup correctly.

### PostgreSQL

PosgreSQL allows to execute queries (pg-query) on the type pg-vector. The pg-vector type can be a column (more performant) or be created in the query (no excess columns in the database).

Refer to the [PostgreSQL documentation](https://www.postgresql.org/docs/current/functions-textsearch.html) for possible queries.

<Tabs
groupId="entity-def"
defaultValue="as-column"
values={[
{label: 'reflect-metadata', value: 'as-column'},
{label: 'ts-morph', value: 'in-query'},
]
}>
<TabItem value="as-column">

```ts title="./entities/Book.ts"
import { FullTextType } from '@mikro-orm/postgresql';

@Entity()
export class Book {

  @Property()
  title!: string;

  @Index({ type: 'fulltext' })
  @Property({ type: FullTextType, onUpdate: (book) => book.title })
  searchableTitle!: string;

}
```

And to find results: `repository.findOne({ searchableTitle: { $fulltext: 'query' } })`

  </TabItem>
  <TabItem value="in-query">

```ts title="./entities/Book.ts"
@Entity()
export class Book {

  @Index({ type: 'fulltext' })
  @Property()
  title!: string;

}
```

And to find results: `repository.findOne({ title: { $fulltext: 'query' } })`

  </TabItem>
</Tabs>

### MySQL, MariaDB

MySQL and MariaDB allow full text searches on all columns with a fulltext index.

Refer to the [MySQL documentation](https://dev.mysql.com/doc/refman/8.0/en/fulltext-boolean.html) or [MariaDB documentation](https://mariadb.com/kb/en/full-text-index-overview/#in-boolean-mode) for possible queries.

```ts title="./entities/Book.ts"
@Entity()
export class Book {

  @Index({ type: 'fulltext' })
  @Property()
  title!: string;

}
```

And to find results: `repository.findOne({ title: { $fulltext: 'query' } })`

### MongoDB

MongoDB allows full text searches on all columns with a text index. However, when executing a full text search, it selects matches based on all fields with a text index: it's only possible to add one query and only on the top-level of the query object. Refer to the [MongoDB documentation](https://www.mongodb.com/docs/manual/reference/operator/query/text/#behavior) for more information on this behavior.

Refer to the [MongoDB documentation](https://www.mongodb.com/docs/manual/reference/operator/query/text/#definition) for possible queries.

```ts title="./entities/Book.ts"
@Entity()
export class Book {

  @Index({ type: 'fulltext' })
  @Property()
  title!: string;

}
```

### SQLite

In SQLite, full text searches can only be executed on [FTS5 virtual tables](https://www.sqlite.org/fts5.html#overview_of_fts5). MikroORM can't create this table, and has to be done [manually](https://www.sqlite.org/fts5.html#fts5_table_creation_and_initialization). Simple tables can be created with this query:

`CREATE VIRTUAL TABLE <table name> USING fts5(<colum1>, <column2>, ...);`

Afterwards an entity can created normally for the structure of this table. The `@Index` is not necessary for full text searches in SQLite.

Refer to the [SQLite documentation](https://www.sqlite.org/fts5.html#full_text_query_syntax) for possible queries.

```ts title="./entities/Book.ts"
@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

}
```

And to find results: `repository.findOne({ title: { $fulltext: 'query' } })`
