# @mikro-orm/mongodb

[MikroORM](https://mikro-orm.io) driver for MongoDB databases, built on top of the official [`mongodb`](https://www.npmjs.com/package/mongodb) Node.js driver.

## Installation

```sh
npm install @mikro-orm/core @mikro-orm/mongodb
```

## Usage

```typescript
import { defineEntity, p, MikroORM } from '@mikro-orm/mongodb';

const AuthorSchema = defineEntity({
  name: 'Author',
  properties: {
    id: p.objectId().primary(),
    name: p.string(),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
});
export class Author extends AuthorSchema.class {}
AuthorSchema.setClass(Author);

const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    id: p.objectId().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author).inversedBy('books'),
  },
});
export class Book extends BookSchema.class {}
BookSchema.setClass(Book);

const orm = await MikroORM.init({
  entities: [Author, Book],
  dbName: 'my-db',
  clientUrl: 'mongodb://localhost:27017',
});

const author = orm.em.create(Author, { name: 'Jon Snow' });
orm.em.create(Book, { title: 'My Life on The Wall', author });
await orm.em.flush();

const authors = await orm.em.find(
  Author,
  { name: /Jon/ },
  {
    populate: ['books'],
  },
);
```

## Features

- Full MongoDB support with native ObjectId handling
- [MongoDB-specific operators](https://mikro-orm.io/docs/usage-with-mongo) — `$regex`, `$exists`, `$elemMatch`, and more
- Automatic serialized primary key conversion (`_id` ↔ `id`)
- [MongoDB migrations](https://mikro-orm.io/docs/migrations#mongodb-support) via `@mikro-orm/migrations-mongodb`
- Embeddables, virtual entities, and lazy loading

## Documentation

See the [official MikroORM documentation](https://mikro-orm.io/docs) and the [MongoDB usage guide](https://mikro-orm.io/docs/usage-with-mongo).

## License

Copyright © 2018-present [Martin Adámek](https://github.com/b4nan). Licensed under the [MIT License](https://github.com/mikro-orm/mikro-orm/blob/master/LICENSE).
