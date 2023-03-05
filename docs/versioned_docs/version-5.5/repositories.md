---
title: Using EntityRepository instead of EntityManager
sidebar_label: Entity Repository
---

Entity Repositories are thin layers on top of `EntityManager`. They act as an extension point, so we can add custom methods, or even alter the existing ones. The default, `EntityRepository` implementation just forwards the calls to underlying `EntityManager` instance.

> `EntityRepository` class carries the entity type, so we do not have to pass it to every `find` or `findOne` calls.

```ts
const booksRepository = em.getRepository(Book);

const books = await booksRepository.find({ author: '...' }, {
  populate: ['author'],
  limit: 1,
  offset: 2,
  orderBy: { title: QueryOrder.DESC },
});

console.log(books); // Book[]
```

Note that there is no such thing as "flushing repository" - it is just a shortcut to `em.flush()`. In other words, we always flush the whole Unit of Work, not just a single entity that this repository represents.

## Custom Repository

:::info Since v4, we need to make sure we are working with correctly typed `EntityRepository` to have access to driver specific methods (like `createQueryBuilder()`). Use the one exported from your driver package. :::

To use custom repository, just extend `EntityRepository<T>` class:

```ts
import { EntityRepository } from '@mikro-orm/mysql'; // or any other driver package

export class CustomAuthorRepository extends EntityRepository<Author> {

  // custom methods...
  public findAndUpdate(...) {
    // ...
  }

}
```

And register the repository via `@Entity` decorator:

```ts
@Entity({ customRepository: () => CustomAuthorRepository })
export class Author {
  // ...
}
```

> `@Repository()` decorator has been removed in v5, use `@Entity({ customRepository: () => MyRepository })` instead.

Note that we need to pass that repository reference inside a callback so we will not run into circular dependency issues when using entity references inside that repository.

Now we can access our custom repository via `em.getRepository()` method.

### Inferring custom repository type

To have the `em.getRepository()` method return correctly typed custom repository instead of the generic `EntityRepository<T>`, we can use `EntityRepositoryType` symbol:

```ts
@Entity({ customRepository: () => AuthorRepository })
export class Author {

  [EntityRepositoryType]?: AuthorRepository;

}

const repo = em.getRepository(Author); // repo has type AuthorRepository
```

> We can also register custom base repository (for all entities where we do not specify `customRepository`) globally, via `MikroORM.init({ entityRepository: CustomBaseRepository })`.

For more examples, take a look at [`tests/EntityManager.mongo.test.ts`](https://github.com/mikro-orm/mikro-orm/blob/master/tests/EntityManager.mongo.test.ts) or [`tests/EntityManager.mysql.test.ts`](https://github.com/mikro-orm/mikro-orm/blob/master/tests/EntityManager.mysql.test.ts).
