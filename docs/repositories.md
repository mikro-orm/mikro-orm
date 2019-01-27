# Using EntityRepository instead of EntityManager

More convenient way of fetching entities from database is by using `EntityRepository`, that
carries the entity name so you do not have to pass it to every `find` and `findOne` calls:

API:

```typescript
EntityRepository.persist(entity: IEntity, flush?: boolean): Promise<void>;
EntityRepository.findOne(where: FilterQuery<IEntity> | string, populate?: string[]): Promise<IEntity>;
EntityRepository.find(where: FilterQuery<IEntity>, populate?: string[], orderBy?: { [k: string]: 1 | -1; }, limit?: number, offset?: number): Promise<IEntity[]>;
EntityRepository.findAll(populate?: string[], orderBy?: { [k: string]: 1 | -1; }, limit?: number, offset?: number): Promise<IEntity[]>;
EntityRepository.remove(where: IEntity | any): Promise<number>;
EntityRepository.flush(): Promise<void>;
EntityRepository.canPopulate(property: string): boolean;
EntityRepository.count(where?: any): Promise<number>;
```

Example:

```typescript
const booksRepository = orm.em.getRepository<Book>(Book.name);

// with sorting, limit and offset parameters, populating author references
const books = await booksRepository.find({ author: '...' }, ['author'], { title: -1 }, 2, 1);
console.log(books); // Book[]
```

## Custom repository

To use custom repository, just extend `EntityRepository<T>` class:

```typescript
export class CustomAuthorRepository extends EntityRepository<Author> {

  // your custom methods...
  public findAndUpdate(...) {
    // ...
  }

}
```

And register your repository as `@Entity` decorator:

```typescript
@Entity({ customRepository: () => CustomAuthorRepository })
export class Publisher {
  // ...
}
```

Note that we need to pass that repository reference inside a callback so we will not run
into circular dependency issues when using entity references inside that repository.

Now you can access your custom repository via `EntityManager.getRepository()` method.
