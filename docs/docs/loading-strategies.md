---
title: Relationship Loading Strategies
sidebar_label: Loading Strategies
---

> SQL only feature

Controls how relationships get loaded when querying. By default, populated relationships
are loaded via the `select-in` strategy. This strategy issues one additional `SELECT`
statement per relation being loaded.

The loading strategy can be specified both at mapping time and when loading entities.

For example, given the following entities:

```typescript
import { Entity, LoadStrategy, OneToMany, ManyToOne } from 'mikro-orm';

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

The following will issue two SQL statements.
One to load the author and another to load all the books belonging to that author:

```typescript
const author = await orm.em.findOne(Author, 1, ['books']);
```

If we update the `Author.books` mapping to the following:

```typescript
import { Entity, LoadStrategy, OneToMany } from 'mikro-orm';

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

```typescript
const author = await orm.em.findOne(Author, 1, ['books']);
```

You can also specify the load strategy as needed. This will override whatever strategy is declared in the mapping.
This also works for nested populates:

```typescript
// one level
const author = await orm.em.findOne(Author, 1, { populate: { books: LoadStrategy.JOINED } });

// two levels
const author = await orm.em.findOne(Author, 1, { populate: {
  books: [LoadStrategy.JOINED, { publisher: LoadStrategy.JOINED }]
} });
```
