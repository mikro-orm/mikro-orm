---
title: Result cache
---

MikroORM has simple result caching mechanism. It works with those methods of `EntityManager`: `find()`, `findOne()`, `findAndCount()`, `findOneOrFail()`, `count()`, as well as with `QueryBuilder` result methods (including `execute`).

By default, in memory cache is used, that is shared for the whole `MikroORM` instance. Default expiration is 1 second.

```ts
const res = await em.find(Book, { author: { name: 'Jon Snow' } }, {
  populate: ['author', 'tags'],
  cache: 50, // set expiration to 50ms
  // cache: ['cache-key', 50], // set custom cache key and expiration
  // cache: true, // use default cache key and expiration
});
```

Or with query builder:

```ts
const res = await em.createQueryBuilder(Book)
  .where({ author: { name: 'Jon Snow' } })
  .cache()
  .getResultList();
```

We can change the default expiration as well as provide custom cache adapter in the ORM configuration:

```ts
const orm = await MikroORM.init({
  resultCache: {
    // following options are the defaults
    adapter: MemoryCacheAdapter,
    expiration: 1000, // 1s
    options: {},
  },
  // ...
});
```

To clear the cached result, we need to load it with explicit cache key, and later on we can use `em.clearCache(cacheKey)` method.

```ts
// set the cache key to 'book-cache-key', with expiration of 60s
const res = await em.find(Book, { ... }, { cache: ['book-cache-key', 60_000] });

// clear the cache key by name
await em.clearCache('book-cache-key');
```

Custom cache adapters need to implement `CacheAdapter` interface.

```ts
export interface CacheAdapter {

  /**
   * Gets the items under `name` key from the cache.
   */
  get(name: string): Promise<any>;

  /**
   * Sets the item to the cache. `origin` is used for cache invalidation and should reflect the change in data.
   */
  set(name: string, data: any, origin: string, expiration?: number): Promise<void>;

  /**
   * Removes the item from cache.
   */
  remove(name: string): Promise<void>;

  /**
   * Clears all items stored in the cache.
   */
  clear(): Promise<void>;

  /**
   * Called inside `MikroORM.close()` Allows graceful shutdowns (e.g. for redis).
   */
  close?(): Promise<void>;

}
```
