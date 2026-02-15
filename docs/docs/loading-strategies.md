---
title: Relationship Loading Strategies
sidebar_label: Loading Strategies
---

MikroORM supports three loading strategies:

- `select-in` which uses separate queries for each relation - it you populate two relations, you will get three queries - one for the root entity, and one for each populated relation.
- `joined` which uses a single query and joins the relations instead.
- `balanced` which joins `to-one` relations and uses `select-in` for `to-many` relations.

> `joined` strategy is supported **only in SQL drivers** and is the **default** for those since v6.

> `combined` strategy will be the default in v7.

## Configuring the strategy

The loading strategy can be specified both at mapping time and when loading entities, as well as globally in your ORM config.

Given the following entities:

```ts
import { Entity, LoadStrategy, OneToMany, ManyToOne, PrimaryKey } from '@mikro-orm/core';

@Entity()
export class Author {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);

}

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @ManyToOne()
  author: Author;

  @ManyToOne(() => Book, { nullable: true })
  inspiredBy?: Book;

}
```

With the default `joined` strategy, this will issue a single query, loading the `Author` entity and its `books` and `books.inspiredBy` relations.

```ts
const author = await orm.em.findOne(Author, 1, {
  populate: ['books.inspiredBy'],
});
```

To override the strategy, you can use the `strategy` option:

```ts
const author = await orm.em.findOne(Author, 1, {
  populate: ['books.inspiredBy'],
  strategy: 'select-in',
});
```

This will issue three SQL statements, one to load the author, another to load all the books belonging to that author, and a third one fetching the `Book.inspiredBy` relation.

With the `balanced` strategy, this example would use two queries, one for the `Author` entities, the other for their books, including the `inspiredBy` relation:

```ts
const author = await orm.em.findOne(Author, 1, {
  populate: ['books.inspiredBy'],
  strategy: 'balanced',
});
```

Alternatively, you can control the strategy in your entity definition.

```ts
import { Entity, LoadStrategy, OneToMany } from '@mikro-orm/core';

@Entity()
export class Author {

  // ...

  @OneToMany({
    entity: () => Book,
    mappedBy: b => b.author,
    strategy: 'select-in', // force select-in strategy for this relation
  })
  books = new Collection<Book>(this);

}
```

The strategy defined on property level will always take a precedence.

## Changing the loading strategy globally

You can use `loadStrategy` option in the ORM config:

```ts
MikroORM.init({
  // ...
  populate: ['books'],
  loadStrategy: 'select-in', // 'joined' is the default for SQL drivers
});
```

This value will be used as the default, specifying the loading strategy on property level has precedence, as well as specifying it in the `FindOptions`.

## Per-relation populate overrides

While the `strategy` option applies to all populated relations, you can use `populateHints` to override the loading strategy or join type for individual relations. The keys are the same dot-separated paths used in the `populate` option, and they support autocomplete.

```ts
const author = await orm.em.findOne(Author, 1, {
  populate: ['books.inspiredBy'],
  strategy: 'joined',
  populateHints: {
    'books.inspiredBy': { strategy: 'select-in' },
  },
});
```

This will load books via a join, but use a separate `select-in` query for the `inspiredBy` relation.

You can also override the join type. For example, a non-nullable `ManyToOne` relation defaults to `inner join` with the `joined` strategy. You can force a `left join` instead:

```ts
const books = await orm.em.find(Book, {}, {
  populate: ['author'],
  strategy: 'joined',
  populateHints: {
    author: { joinType: 'left join' },
  },
});
```

Both `strategy` and `joinType` can be combined in a single hint, and you can provide hints for multiple relations at once:

```ts
const author = await orm.em.findOne(Author, 1, {
  populate: ['books.inspiredBy', 'favouriteBook'],
  strategy: 'joined',
  populateHints: {
    books: { joinType: 'inner join' },
    'books.inspiredBy': { strategy: 'select-in' },
    favouriteBook: { joinType: 'left join' },
  },
});
```

Hints for paths that don't match any populate entry are silently ignored.

## Population `where` condition

The where condition is by default applied only to the root entity. This can be controlled via `populateWhere` option. It accepts one of `all` (default), `infer` (use same condition as the `where` query) or an explicit filter query.

```ts
await em.find(Author, { ... }, {
  populate: ['books'],
  populateWhere: 'infer', // defaults to `all`

  // or specify custom query, will be used via `join on` conditions
  // populateWhere: { age: { $gte: 18 } },
});
```

> `populateWhere` can be also set globally, the default is `all`.

## Population `order by` clause

Similarly to the `populateWhere`, you can also control the `order by` clause used for the populate queries. The default behaviour is to use the same ordering as for the root entity, and you can use `populateOrderBy` option to add a different ordering:

```ts
await em.find(Author, { ... }, {
  populate: ['books'],
  populateOrderBy: { books: { publishedAt: 'desc' } },
});
```
