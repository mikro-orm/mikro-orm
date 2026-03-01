---
title: Entity Repository
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

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

To use a custom repository, extend `EntityRepository<T>` class:

```ts
import { EntityRepository } from '@mikro-orm/mysql'; // or any other driver package

export class CustomAuthorRepository extends EntityRepository<Author> {

  // custom methods...
  findAndUpdate(...) {
    // ...
  }

}
```

And register the repository via the entity definition:

<Tabs
groupId="entity-def"
defaultValue="define-entity-class"
values={[
{label: 'defineEntity + class', value: 'define-entity-class'},
{label: 'defineEntity', value: 'define-entity'},
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
]
}
>
  <TabItem value="define-entity-class">

```ts
const AuthorSchema = defineEntity({
  name: 'Author',
  repository: () => CustomAuthorRepository,
  properties: {
    id: p.integer().primary(),
    // ...
  },
});

export class Author extends AuthorSchema.class {}
AuthorSchema.setClass(Author);
```

  </TabItem>

<TabItem value="define-entity">

```ts
export const Author = defineEntity({
  name: 'Author',
  repository: () => CustomAuthorRepository,
  properties: {
    id: p.integer().primary(),
    // ...
  },
});
```

</TabItem>
<TabItem value="reflect-metadata">

```ts
@Entity({ repository: () => CustomAuthorRepository })
export class Author {
  // ...
}
```

</TabItem>
<TabItem value="ts-morph">

```ts
@Entity({ repository: () => CustomAuthorRepository })
export class Author {
  // ...
}
```

</TabItem>
</Tabs>

Note that you need to pass that repository reference inside a callback so you will not run into circular dependency issues when using entity references inside that repository.

Now you can access your custom repository via `em.getRepository()` method.

### Inferring custom repository type

To have the `em.getRepository()` method return correctly typed custom repository instead of the generic `EntityRepository<T>`, use the `EntityRepositoryType` symbol:

<Tabs
groupId="entity-def"
defaultValue="define-entity-class"
values={[
{label: 'defineEntity + class', value: 'define-entity-class'},
{label: 'defineEntity', value: 'define-entity'},
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
]
}
>
  <TabItem value="define-entity-class">

```ts
const AuthorSchema = defineEntity({
  name: 'Author',
  repository: () => AuthorRepository,
  properties: {
    id: p.integer().primary(),
    // ...
  },
});

const repo = em.getRepository(Author); // repo has type AuthorRepository```

  </TabItem>

<TabItem value="define-entity">

```ts
export const Author = defineEntity({
  name: 'Author',
  repository: () => AuthorRepository,
  properties: {
    id: p.integer().primary(),
    // ...
  },
});

const repo = em.getRepository(Author); // repo has type AuthorRepository
```

With `defineEntity`, the `EntityRepositoryType` is inferred automatically from the `repository` option — no extra symbol needed.

</TabItem>
<TabItem value="reflect-metadata">

```ts
@Entity({ repository: () => AuthorRepository })
export class Author {

  [EntityRepositoryType]?: AuthorRepository;

}

const repo = em.getRepository(Author); // repo has type AuthorRepository
```

</TabItem>
<TabItem value="ts-morph">

```ts
@Entity({ repository: () => AuthorRepository })
export class Author {

  [EntityRepositoryType]?: AuthorRepository;

}

const repo = em.getRepository(Author); // repo has type AuthorRepository
```

</TabItem>
</Tabs>

> You can also register a custom base repository (for all entities where you do not specify `repository`) globally, via `MikroORM.init({ entityRepository: () => CustomBaseRepository })`.

## Generic Custom Repository

When you want all your repositories to share custom methods, you can create a generic base repository. Getting the type parameters right can be tricky — here's the pattern:

```ts
import { EntityRepository, EntityManager } from '@mikro-orm/mysql'; // or any other driver package

export class BaseRepository<Entity extends object> extends EntityRepository<Entity> {

  // All custom methods use the same `Entity` type parameter.
  // `this.em` and `this.entityName` are available from the parent class.

  async exists(where: FilterQuery<Entity>): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  async findOrCreate(where: FilterQuery<Entity>, data: RequiredEntityData<Entity>): Promise<Entity> {
    let entity = await this.findOne(where);

    if (!entity) {
      entity = this.create(data);
      await this.em.flush();
    }

    return entity;
  }

}
```

Register it globally so all entities use it by default:

```ts
MikroORM.init({
  entityRepository: () => BaseRepository,
});
```

### Entity-specific repositories extending the generic base

You can then create entity-specific repositories that extend your generic base and add methods specific to that entity:

```ts
export class AuthorRepository extends BaseRepository<Author> {

  async findActive(): Promise<Author[]> {
    return this.find({ active: true });
  }

}
```

Register it the same way as any custom repository, via the entity definition:

<Tabs
groupId="entity-def"
defaultValue="define-entity-class"
values={[
{label: 'defineEntity + class', value: 'define-entity-class'},
{label: 'defineEntity', value: 'define-entity'},
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
]
}
>
  <TabItem value="define-entity-class">

```ts
const AuthorSchema = defineEntity({
  name: 'Author',
  repository: () => AuthorRepository,
  properties: {
    id: p.integer().primary(),
    // ...
  },
});

// em.getRepository(Author) now returns AuthorRepository,
// which has both BaseRepository methods and AuthorRepository methods.```

  </TabItem>

<TabItem value="define-entity">

```ts
export const Author = defineEntity({
  name: 'Author',
  repository: () => AuthorRepository,
  properties: {
    id: p.integer().primary(),
    // ...
  },
});

// em.getRepository(Author) now returns AuthorRepository,
// which has both BaseRepository methods and AuthorRepository methods.
```

With `defineEntity`, the `EntityRepositoryType` is inferred automatically.

</TabItem>
<TabItem value="reflect-metadata">

```ts
@Entity({ repository: () => AuthorRepository })
export class Author {

  [EntityRepositoryType]?: AuthorRepository;

}

// em.getRepository(Author) now returns AuthorRepository,
// which has both BaseRepository methods and AuthorRepository methods.
```

</TabItem>
<TabItem value="ts-morph">

```ts
@Entity({ repository: () => AuthorRepository })
export class Author {

  [EntityRepositoryType]?: AuthorRepository;

}

// em.getRepository(Author) now returns AuthorRepository,
// which has both BaseRepository methods and AuthorRepository methods.
```

</TabItem>
</Tabs>

Entities without a specific repository will still use the `BaseRepository` with its generic methods.

### Using `EntityRepositoryType` with a base entity

If you use a common base entity, you can set the `EntityRepositoryType` there so all inheriting entities get the correct type by default:

<Tabs
groupId="entity-def"
defaultValue="define-entity-class"
values={[
{label: 'defineEntity + class', value: 'define-entity-class'},
{label: 'defineEntity', value: 'define-entity'},
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
]
}
>
  <TabItem value="define-entity-class">

```ts
const BaseEntitySchema = defineEntity({
  name: 'BaseEntity',
  abstract: true,
  properties: {
    id: p.integer().primary(),
  },
});

export class BaseEntity extends BaseEntitySchema.class {}
BaseEntitySchema.setClass(BaseEntity);
```

  </TabItem>

<TabItem value="define-entity">

```ts
export const BaseEntity = defineEntity({
  name: 'BaseEntity',
  abstract: true,
  properties: {
    id: p.integer().primary(),
  },
});
```

With `defineEntity`, when you set `repository` globally via the ORM config, the repository type is resolved automatically for all entities — no `EntityRepositoryType` symbol needed.

</TabItem>
<TabItem value="reflect-metadata">

```ts
import { EntityRepositoryType, PrimaryKey } from '@mikro-orm/core';

export abstract class BaseEntity {

  [EntityRepositoryType]?: BaseRepository<this>;

  @PrimaryKey()
  id!: number;

}
```

</TabItem>
<TabItem value="ts-morph">

```ts
import { EntityRepositoryType, PrimaryKey } from '@mikro-orm/core';

export abstract class BaseEntity {

  [EntityRepositoryType]?: BaseRepository<this>;

  @PrimaryKey()
  id!: number;

}
```

</TabItem>
</Tabs>

Now `em.getRepository(AnyEntityExtendingBaseEntity)` returns `BaseRepository<T>` without needing to redeclare the symbol on every entity. Entities with entity-specific repositories can still override it.

## Removed methods from `EntityRepository` interface

Following methods are no longer available on the `EntityRepository` instance since v6:

- `persist`
- `persistAndFlush`
- `remove`
- `removeAndFlush`
- `flush`

They were confusing as they gave a false sense of working with a scoped context (e.g. only with a `User` type), while in fact, they were only shortcuts for the same methods of underlying `EntityManager`. You should work with the `EntityManager` directly instead of using a repository when it comes to entity persistence, repositories should be treated as an extension point for custom logic (e.g. wrapping query builder usage).

> Alternatively, you can use the `repository.getEntityManager()` method to access those methods directly on the `EntityManager`.

If you want to keep those methods on repository level, you can define a custom base repository and use it globally:

```ts
import { EntityManager, EntityRepository } from '@mikro-orm/mysql';

export class ExtendedEntityRepository<T extends object> extends EntityRepository<T> {

  persist(entity: object | object[]): EntityManager {
    return this.em.persist(entity);
  }

  async persistAndFlush(entity: object | object[]): Promise<void> {
    await this.em.persistAndFlush(entity);
  }

  remove(entity: object): EntityManager {
    return this.em.remove(entity);
  }

  async removeAndFlush(entity: object): Promise<void> {
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
  entityRepository: () => ExtendedEntityRepository,
});
```

You might as well want to use the `EntityRepositoryType` symbol, possibly in a custom base entity (as shown above).
