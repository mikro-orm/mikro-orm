---
title: Dataloaders
sidebar_label: Dataloaders
---

The n+1 problem is when multiple types of data are requested in one query, but where n requests are required instead of just one. This is typically encountered when data is nested, such as if you were requesting authors and the name of their books. It is an inherent problem of GraphQL APIs and can be solved by batching multiple requests into a single one. This can be automated via the dataloader library which will coalesce all individual loads which occur within a single frame of execution (a single tick of the event loop) and then call your batch function with all requested keys. That means writing a batch loading function for every db call that aggregates multiple queries into a single one, plus filtering the results to reassign them to the original queries. Fortunately, MikroORM has plenty of metadata to transparently automate this process so that you won't have to write your own batch loading functions.

In the current version, MikroORM is able to automatically batch [references](./guide/05-type-safety.md#reference-wrapper) and [collections](./collections.md). However, if you are interested to try it out there is an [out of tree library](https://github.com/darkbasic/mikro-orm-dataloaders) which takes care of batching whole find queries with a subset of the operators supported.

## Usage

Dataloaders are disabled by default, but they can be easily enabled globally:

```ts
import { DataloaderType } from '@mikro-orm/core';

MikroORM.init({
  dataloader: DataloaderType.ALL,
});
```

`DataloaderType.REFERENCE` enables the dataloader for [References](./guide/05-type-safety.md#reference-wrapper), `DataloaderType.COLLECTION` enables it for [Collections](./collections.md) while `DataloaderType.ALL` enables it for both. A boolean value is also supported to enable/disable all of them.

The dataloader can also be enabled per-query via the `load()` method options of `Reference` or `Collection` class.

### `Reference` properties

ManyToOne and OneToOne relations require the use of the [Reference wrapper](./guide/05-type-safety.md#reference-wrapper):

```ts
@ManyToOne(() => Book, { ref: true })
book!: Ref<Book>;
```

Alternatively, you can create the reference instance dynamically:

```diff
-book.author.load({ dataloader: true }); // can be also enabled globally
+wrap(book.author).toReference().load({ dataloader: true });
```

## Example with `Promise.all()`

The following will issue two SQL statements. One to load the authors and another one to load all the books belonging to these authors:

```ts
const authors = await orm.em.find(Author, [1, 2, 3]);
await Promise.all(authors.map(author => author.books.load({ dataloader: true })));
```

This is another example where the dataloader is being used to retrieve multiple references via a single query:

```ts
const books = await orm.em.find(Book, [1, 2, 3]);
await Promise.all(books.map(book => book.author.load({ dataloader: true })));
```

## GraphQL

If you're using GraphQL you won't have to use `Promise.all`, just make sure to use the `Reference.load()` and `Collection.load()` methods in your resolvers. Issuing a normal query would be enough:

```graphql
{
  authors {
    name
    books {
      title
    }
  }
}
```

Assuming you've enabled the dataloaders, MikroORM will coalesce all individual loads which occur within a single frame of execution (a single tick of the event loop) and automatically batch them.
