---
title: Streaming
---

If you want to process large amount of entities without loading them all into memory at once, you can use `em.stream()` method. It returns an async iterable, so you can use it in `for await ... of` loop.

```ts
const stream = em.stream(Book, {
  populate: ['author'],
  where: { price: { $gt: 100 } },
  orderBy: { id: 'ASC' },
});

for await (const book of stream) {
  console.log(book.title);
  console.log(book.author.name);
}
```

There are several constraints when using streaming:

- Returned entities are not managed. Identity holds only for the returned entity graph.
- Joined strategy is enforced for all populated relations.
- When populating to-many relations, only fully hydrated entities will be returned.
- You should provide an `orderBy` clause to ensure consistent ordering.
- With mongodb driver, only root entities can be streamed, `populate` option is ignored.

## Streaming row-by-row

When populating to-many relations, the ORM streams fully merged entities instead of yielding every row. You can opt out of this behavior by specifying `mergeResults: false`. This will yield every row from the SQL result, but still mapped to entities, meaning that to-many collections will contain at most one item, and you will get duplicate root entities when they have multiple items in the populated collection.

```ts
const stream = em.stream(Book, {
  populate: ['author'],
  where: { price: { $gt: 100 } },
  orderBy: { id: 'ASC' },
  mergeResults: false,
});
```

## Streaming raw results

To stream raw results instead of entities, you can use the `QueryBuilder` with `mapResults: true` option:

```ts
const stream = em.createQueryBuilder(Author, 'a')
  .leftJoinAndSelect('books', 'b')
  .orderBy({ id: 'desc', books: { title: 'asc' } })
  .stream({ mapResults: true });
```

This will disable mapping to entities, returning POJOs instead, but still convert the column names to entity property names.

Alternatively, you can use `rawResults: true` to stream the raw values without any mapping:

```ts
const stream = em.createQueryBuilder(Author, 'a')
  .leftJoinAndSelect('books', 'b')
  .orderBy({ id: 'desc', books: { title: 'asc' } })
  .stream({ rawResults: true });
```

## Virtual entities

Streaming works with virtual entities as well, the `expression` can be either a `QueryBuilder` or a raw SQL query:

```ts
const BookWithAuthor = defineEntity({
  name: 'BookWithAuthor',
  expression: (em: EntityManager) => {
    return em.createQueryBuilder(Book, 'b')
      .select([sql`min(b.title)`.as('title'), sql`min(a.name)`.as('author_name')])
      .join('b.author', 'a')
      .groupBy('b.id');
  },
  // or `expression: 'select min(b.title) as title, min(a.name) as author_name from books...'`
  properties: {
    title: p.string(),
    authorName: p.string(),
  },
});

const stream = em.stream(BookWithAuthor);
```

## MongoDB limitations

When using MongoDB driver, only root entities can be streamed. The `populate` option is ignored and no relations are populated. If you need to access relations, use `em.populate` on the streamed results explicitly. Note that you should either clear the EntityManager afterward, or use a temporary fork.

```ts
const stream = em.stream(Book, {
  where: { price: { $gt: 100 } },
  orderBy: { id: 'ASC' },
});

for await (const book of stream) {
  console.log(book.title);
  const fork = em.fork();
  await fork.populate(book, ['author']);
  console.log(book.author.name);
}
```

For virtual entities that are backed by aggregation pipelines, you can stream them as well, but your `expression` needs to return a stream. To do that, you can use `em.streamAggregate()` method (as opposed to `em.aggregate()` which returns all the results directly). To be able to have a single virtual entity definition that works both with `em.find` and `em.stream`, use the 4th parameter of the `expression` callback to detect whether streaming is requested:

```ts
const BookWithAuthor = defineEntity({
  name: 'BookWithAuthor',
  expression: (em: EntityManager, where, options, stream) => {
    const pipeline = [
      { $match: { /* ... */ } },
      { $lookup: { /* ... */ } },
      // ...
    ];

    if (stream) {
      return em.streamAggregate(Book, pipeline);
    }

    return em.aggregate(Book, pipeline);
  },
  properties: {
    title: p.string(),
    authorName: p.string(),
  },
});
```
