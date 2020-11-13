---
title: Using EntityRepository instead of EntityManager
sidebar_label: Entity Repository
---

More convenient way of fetching entities from database is by using `EntityRepository`, that
carries the entity name so you do not have to pass it to every `find` and `findOne` calls:

Example:

```typescript
const booksRepository = orm.em.getRepository(Book);

// with sorting, limit and offset parameters, populating author references
const books = await booksRepository.find({ author: '...' }, ['author'], { title: QueryOrder.DESC }, 2, 1);

// or with options object
const books = await booksRepository.find({ author: '...' }, { 
  populate: ['author'],
  limit: 1,
  offset: 2,
  sort: { title: QueryOrder.DESC },
});

console.log(books); // Book[]
```

## Custom Repository

:::info
Since v4, we need to make sure we are working with correctly typed `EntityRepository` 
to have access to driver specific methods (like `createQueryBuilder()`). Use the one
exported from your driver package.
:::

To use custom repository, just extend `EntityRepository<T>` class:

```typescript
import { EntityRepository } from '@mikro-orm/mysql'; // or any other driver package

@Repository(Author)
export class CustomAuthorRepository extends EntityRepository<Author> {

  // your custom methods...
  public findAndUpdate(...) {
    // ...
  }

}
```

You can also omit the `@Repository` decorator and register your repository in `@Entity` 
decorator instead:

```typescript
@Entity({ customRepository: () => CustomAuthorRepository })
export class Author {
  // ...
}
```

Note that we need to pass that repository reference inside a callback so we will not run
into circular dependency issues when using entity references inside that repository.

Now you can access your custom repository via `em.getRepository()` method.

### Inferring custom repository type

To have the `em.getRepository()` method return correctly typed custom repository
instead of the generic `EntityRepository<T>`, we can use `EntityRepositoryType`
symbol:

```ts
@Entity({ customRepository: () => AuthorRepository })
export class Author {

  [EntityRepositoryType]?: AuthorRepository;

}

const repo = em.getRepository(Author); // repo has type AuthorRepository
```

> You can also register custom base repository (for all entities where you do not specify 
> `customRepository`) globally, via `MikroORM.init({ entityRepository: CustomBaseRepository })`.

> Note that you cannot use both `@Repository(Author)` on the repository and `{ customRepository: () => AuthorRepository }` on the entity at the same time. This will cause a circular dependency and throws an error. Either one of options achieves the same goal.

For more examples, take a look at
[`tests/EntityManager.mongo.test.ts`](https://github.com/mikro-orm/mikro-orm/blob/master/tests/EntityManager.mongo.test.ts)
or [`tests/EntityManager.mysql.test.ts`](https://github.com/mikro-orm/mikro-orm/blob/master/tests/EntityManager.mongo.test.ts).
