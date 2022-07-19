---
title: Smart Query Conditions
---

When you want to make complex queries, we can easily end up with a lot of boilerplate code
full of curly brackets:

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

There is also shortcut for `$in` - simply provide array as value and it 
will be converted automatically:

```ts
const res = await orm.em.find(Author, { favouriteBook: [1, 2, 7] });
```

For primary key lookup, we can provide the array directly to `em.find()`:

```ts
const res = await orm.em.find(Author, [1, 2, 7]);
```

## List of supported operators

### Comparison

| operator | name               | description |
|----------|--------------------|-------------|
| `$eq`	   | equals             | Matches values that are equal to a specified value. |
| `$gt`	   | greater            | Matches values that are greater than a specified value. |
| `$gte`   | greater or equal   | Matches values that are greater than or equal to a specified value. |
| `$in`	   | contains           | Matches any of the values specified in an array. |
| `$lt`	   | lower              | Matches values that are less than a specified value. |
| `$lte`   | lower or equal     | Matches values that are less than or equal to a specified value. |
| `$ne`	   | not equal          | Matches all values that are not equal to a specified value. |
| `$nin`   | not contains       | Matches none of the values specified in an array. |
| `$like`  | like               | Uses LIKE operator |
| `$re`    | regexp             | Uses REGEXP operator |
| `$fulltext` | full text | A driver specific full text search function. Requires an FTS5 table for SQLITE and an index with type 'fulltext' for other drivers.
| `$ilike` | ilike              | (postgres only) |
| `$overlap` | &&               | (postgres only) |
| `$contains` | @>              | (postgres only) |
| `$contained` | <@             | (postgres only) |

### Logical

| operator | description |
|----------|-------------|
| `$and`   | Joins query clauses with a logical AND returns all documents that match the conditions of both clauses. |
| `$not`   | Inverts the effect of a query expression and returns documents that do not match the query expression. |
| `$or`    | Joins query clauses with a logical OR returns all documents that match the conditions of either clause. |
