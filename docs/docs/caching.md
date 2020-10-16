---
title: Result cache
---

MikroORM have simple result caching mechanism. It works with those methods of 
`EntityManager`: `find()`, `findOne()`, `findAndCount()`, `findOneOrFail()`,
`count()`, as well as with `QueryBuilder` result methods (including `execute`). 

By default, in memory cache is used, that is shared for the whole `MikroORM` 
instance. Default expiration is 1 second.

```ts
const res = await em.find(Book, { author: { name: 'Jon Snow' } }, {
  populate: ['author', 'tags'], 
  cache: 50, // set expiration to 50ms
  // cache: ['cache-id', 50], // set custom cache id and expiration
  // cache: true, // use default cache id and expiration
});
```

Or with query builder:

```ts
const res = await em.createQueryBuilder(Book)
  .where({ author: { name: 'Jon Snow' } })
  .cache()
  .getResultList();
```

We can change the default expiration as well as provide custom cache adapter in
the ORM configuration:

```ts
const orm = await MikroORM.init({
  resultCache: {
    adapter: MemoryCacheAdapter,
    expiration: 1000, // 1s
    options: {},
  },
  // ...
});
```

Custom cache adapters need to implement `CacheAdapter` interface. 
