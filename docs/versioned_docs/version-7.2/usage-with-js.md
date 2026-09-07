---
title: Usage with JavaScript
sidebar_label: Usage with Vanilla JS
---

MikroORM can be used with vanilla JavaScript using the `defineEntity` helper or `EntitySchema`. Both approaches provide full functionality without requiring TypeScript or decorators.

## Using `defineEntity`

The `defineEntity` helper with property builders (`p`) is the recommended approach for defining entities in JavaScript:

```js title="./entities/Author.js"
import { defineEntity, p } from '@mikro-orm/core';
import { Book } from './Book.js';

export const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string().unique(),
    age: p.integer().nullable(),
    termsAccepted: p.boolean().default(false),
    born: p.date().nullable(),
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p.datetime().onCreate(() => new Date()).onUpdate(() => new Date()),
    books: () => p.oneToMany(Book, { mappedBy: 'author' }),
    favouriteBook: () => p.manyToOne(Book).nullable(),
  },
});
```

```js title="./entities/Book.js"
import { defineEntity, p } from '@mikro-orm/core';
import { Author } from './Author.js';
import { BookTag } from './BookTag.js';

export const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author),
    tags: () => p.manyToMany(BookTag),
  },
});
```

```js title="./entities/BookTag.js"
import { defineEntity, p } from '@mikro-orm/core';

export const BookTag = defineEntity({
  name: 'BookTag',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});
```

### Using `defineEntity` with a class

You can also use `defineEntity` with a class instead of just a name. This allows you to use `new Author()` to create instances and define custom methods on your entities:

```js title="./entities/Author.js"
import { defineEntity, p } from '@mikro-orm/core';

export class Author {
  id;
  name;
  email;

  getDisplayName() {
    return `${this.name} <${this.email}>`;
  }
}

export const AuthorSchema = defineEntity({
  class: Author,
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string().unique(),
  },
});
```

When using a class, the entity name is inferred from the class name. You can then use either the class or the schema when working with the ORM.

## Registering entities

Register entities in your configuration:

```js
import { MikroORM } from '@mikro-orm/sqlite';
import { Author } from './entities/Author.js';
import { Book } from './entities/Book.js';
import { BookTag } from './entities/BookTag.js';

const orm = await MikroORM.init({
  entities: [Author, Book, BookTag],
  dbName: 'my-db-name',
});
```

## Working with entities

Use `em.create()` to create entity instances:

```js
const author = em.create(Author, {
  name: 'Jon Snow',
  email: 'jon@wall.st',
});

const book = em.create(Book, {
  title: 'My Life on the Wall',
  author,
});

await em.flush();
```

## Using `EntitySchema`

As an alternative, you can use `EntitySchema` directly for more control:

```js title="./entities/Author.js"
import { EntitySchema } from '@mikro-orm/core';

export const Author = new EntitySchema({
  name: 'Author',
  properties: {
    id: { type: 'number', primary: true },
    name: { type: 'string' },
    email: { type: 'string', unique: true },
    age: { type: 'number', nullable: true },
    termsAccepted: { type: 'boolean', default: false },
    born: { type: 'Date', nullable: true },
    createdAt: { type: 'Date', onCreate: () => new Date() },
    updatedAt: { type: 'Date', onCreate: () => new Date(), onUpdate: () => new Date() },
    books: { kind: '1:m', entity: () => Book, mappedBy: 'author' },
    favouriteBook: { kind: 'm:1', entity: () => Book, nullable: true },
  },
});
```

The `kind` parameter for relationships can be:

| Value | Relationship |
|-------|-------------|
| `'1:1'` | One-to-one |
| `'m:1'` | Many-to-one |
| `'1:m'` | One-to-many |
| `'m:n'` | Many-to-many |
| `'embedded'` | Embedded |

Or you can use `ReferenceKind` enum, e.g. `ReferenceKind.MANY_TO_ONE`.

> Read more about `defineEntity` in the [`defineEntity` section](./define-entity.md).

## Example repository

For a complete working example, see the [Express JavaScript example app](https://github.com/mikro-orm/express-js-example-app).
