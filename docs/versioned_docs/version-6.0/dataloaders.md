---
title: Dataloaders
sidebar_label: Dataloaders
---

The n+1 problem is when multiple types of data are requested in one query, but where n requests are required instead of just one. This is typically encountered when data is nested, such as if you were requesting authors and the name of their books. It is an inherent problem of GraphQL APIs and can be solved by batching multiple requests into a single one. This can be automated via the dataloader library which will coalesce all individual loads which occur within a single frame of execution (a single tick of the event loop) and then call your batch function with all requested keys. That means writing a batch loading function for each and every db call which aggregates multiple queries into a single one, plus filtering the results to reassign them to the original queries. Fortunately MikroORM has plently of metadata to trasparently automate this process so that you won't have to write your own batch loading functions.

In the current version MikroORM is able to automatically batch references and collections, but if you are interested to try it out there is an [out of tree library](https://github.com/darkbasic/mikro-orm-dataloaders) which takes care of batching whole find queries with a subset of the operators supported.

Dataloaders are disabled by default but they can be easily enabled globally:

```ts
import { Dataloader } from '@mikro-orm/core';

MikroORM.init({
  dataloader: Dataloader.ALL,
});
```

`Dataloader.REFERENCE` enables the dataloader for References, `Dataloader.COLLECTION` enables it for Collections while `Dataloader.ALL` enables it for both. A boolean value is also supported to enable/disable all of them.

The dataloader can also be enabled per-query. The following will issue two SQL statements. One to load the authors and another one to load all the books belonging to these authors:

```ts
const authors = await orm.em.find(Author, [1, 2, 3]);
await Promise.all(authors.map(author => author.books.load({ dataloader: true })));
```

This is another example where the dataloader is being used to retrieve multiple references via a single query:

```ts
const books = await orm.em.find(Book, [1, 2, 3]);
await Promise.all(books.map(book => book.author.load({ dataloader: true })));
```

If you're using GraphQL you won't have to use `Promise.all`. Issuing a normal query would be enough:

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

Assuming you've enabled the dataloaders MikroORM will coalesce all individual loads which occur within a single frame of execution (a single tick of the event loop) and automatically batch them.
