---
title: Entity Repository
---

Entity Repositories are thin layers on top of `EntityManager`. They act as an extension point, so you can add custom methods, or even alter the existing ones. The default `EntityRepository` implementation just forwards the calls to underlying `EntityManager` instance.

> `EntityRepository` class carries the entity type, so you do not have to pass it to every `find` or `findOne` calls.

```ts
const booksRepository = em.getRepository(Book);

// same as `em.find(Book, { author: '...' }, { ... })`
const books = await booksRepository.find({ author: '...' }, {
  populate: ['author'],
  limit: 1,
  offset: 2,
  orderBy: { title: QueryOrder.DESC },
});

console.log(books); // Book[]
```

## Custom Repository

:::info

You need to make sure you are working with correctly typed `EntityRepository` to have access to driver specific methods (like `createQueryBuilder()`). Use the one exported from your driver package.

:::

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
@Entity({ repository: () => CustomAuthorRepository })
export class Author {
  // ...
}
```

> Use `@Entity({ repository: () => MyRepository })` to register a custom repository.

Note that you need to pass that repository reference inside a callback so you will not run into circular dependency issues when using entity references inside that repository.

Now you can access your custom repository via `em.getRepository()` method.

### Inferring custom repository type

To have the `em.getRepository()` method return correctly typed custom repository instead of the generic `EntityRepository<T>`, you can use `EntityRepositoryType` symbol:

```ts
@Entity({ repository: () => AuthorRepository })
export class Author {

  [EntityRepositoryType]?: AuthorRepository;

}

const repo = em.getRepository(Author); // repo has type AuthorRepository
```

> You can also register custom base repository (for all entities where you do not specify `repository`) globally, via `MikroORM.init({ entityRepository: CustomBaseRepository })`.

## Removed methods from `EntityRepository` interface

Following methods are no longer available on the `EntityRepository` instance since v6:

- `persist`
- `persistAndFlush`
- `remove`
- `removeAndFlush`
- `flush`

They were confusing as they gave a false sense of working with a scoped context (e.g. only with a `User` type), while in fact, they were only shortcuts for the same methods of underlying `EntityManager`. You should work with the `EntityManager` directly instead of using a repository when it comes to entity persistence, repositories should be treated as an extension point for custom logic (e.g. wrapping query builder usage).

> Alternatively, you can use the `repository.getEntityManager()` method to access those methods directly on the `EntityManager`.

If you want to keep those methods on repository level, you can define custom base repository and use it globally:

```ts
import { EntityManager, EntityRepository, AnyEntity } from '@mikro-orm/mysql';

export class ExtendedEntityRepository<T extends object> extends EntityRepository<T> {

  persist(entity: AnyEntity | AnyEntity[]): EntityManager {
    return this.em.persist(entity);
  }

  async persistAndFlush(entity: AnyEntity | AnyEntity[]): Promise<void> {
    await this.em.persistAndFlush(entity);
  }

  remove(entity: AnyEntity): EntityManager {
    return this.em.remove(entity);
  }

  async removeAndFlush(entity: AnyEntity): Promise<void> {
    await this.em.removeAndFlush(entity);
  }

  async flush(): Promise<void> {
    return this.em.flush();
  }

}
```

And specify it in the ORM config:

```ts
MikroORM.init({
   entityRepository: ExtendedEntityRepository,
})
```

You might as well want to use the `EntityRepositoryType` symbol, possibly in a custom base entity.
