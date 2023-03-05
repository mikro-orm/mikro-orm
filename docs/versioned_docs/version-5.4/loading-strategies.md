---
title: Relationship Loading Strategies
sidebar_label: Loading Strategies
---

> `JOINED` loading strategy is SQL only feature.

Controls how relationships get loaded when querying. By default, populated relationships are loaded via the `select-in` strategy. This strategy issues one additional `SELECT` statement per relation being loaded.

The loading strategy can be specified both at mapping time and when loading entities.

For example, given the following entities:

```ts
import { Entity, LoadStrategy, OneToMany, ManyToOne } from '@mikro-orm/core';

@Entity()
export class Author {
  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);
}

@Entity()
export class Book {
  @ManyToOne()
  author: Author;
}
```

The following will issue two SQL statements. One to load the author and another to load all the books belonging to that author:

```ts
const author = await orm.em.findOne(Author, 1, { populate: ['books'] });
```

If we update the `Author.books` mapping to the following:

```ts
import { Entity, LoadStrategy, OneToMany } from '@mikro-orm/core';

@Entity()
export class Author {
  @OneToMany({
    entity: () => Book,
    mappedBy: b => b.author,
    strategy: LoadStrategy.JOINED,
  })
  books = new Collection<Book>(this);
}
```

The following will issue **one** SQL statement:

```ts
const author = await orm.em.findOne(Author, 1, { populate: ['books'] });
```

You can also specify the load strategy as needed. This will override whatever strategy is declared in the mapping. This also works for nested populates:

```ts
const author = await orm.em.findOne(Author, 1, {
  populate: ['books.publisher'],
  strategy: LoadStrategy.JOINED
});
```

## Changing the loading strategy globally

You can use `loadStrategy` option in the ORM config:

```ts
MikroORM.init({
  loadStrategy: LoadStrategy.JOINED,
});
```

This value will be used as the default, specifying the loading strategy on property level has precedence, as well as specifying it in the `FindOptions`.

## Population where condition

> This applies only to SELECT_IN strategy, as JOINED strategy implies the inference.

In v4, when we used populate hints in `em.find()` and similar methods, the query for our entity would be analysed and parts of it extracted and used for the population. Following example would find all authors that have books with given IDs, and populate their books collection, again using this PK condition, resulting in only such books being in those collections.

```ts
// this would end up with `Author.books` collections having only books of PK 1, 2, 3
const a = await em.find(Author, { books: [1, 2, 3] }, { populate: ['books'] });
```

Following this example, if we wanted to load all books, we would need a separate `em.populate()` call:

```ts
const a = await em.find(Author, { books: [1, 2, 3] });
await em.populate(a, ['books']);
```

This behaviour changed and is now configurable both globally and locally, via `populateWhere` option. Globally we can specify one of `PopulateHint.ALL` and `PopulateHint.INFER`, the former being the default in v5, the latter being the default behaviour in v4. Locally (via `FindOptions`) we can also specify custom where condition that will be passed to `em.populate()` call.

```ts
await em.find(Author, { ... }, {
  // defaults to PopulateHint.ALL in v5
  populateWhere: PopulateHint.INFER, // revert to v4 behaviour

  // or we can specify custom condition for the population:
  // populateWhere: { ... },
});
```
