---
title: Metadata Cache
---

> In v4 and later versions, we need to explicitly install `@mikro-orm/reflection` to use `TsMorphMetadataProvider`.

MikroORM allows different ways to [obtain entity metadata](metadata-providers.md). One way is to use [`ts-morph`](https://github.com/dsherret/ts-morph) to read TypeScript source files of all entities to be able to detect all types. This process can be performance heavy and time-consuming. For this reason, metadata cache is automatically enabled for `TsMorphMetadataProvider`. It can be optionally enabled for the other metadata providers, but it should not be needed.

After the discovery process ends, all metadata will be cached. By default, `FileCacheAdapter` will be used to store the cache inside `./temp` folder to JSON files.

If we use folder based discovery, cache will be dependent on environment - if we run via ts-node, the cache will be generated for TS files. To generate production cache, we can use the CLI command `mikro-orm cache:generate`.

## Automatic Invalidation

Entity metadata are cached together with modified time of the source file, and every time the cache is requested, it first checks if the cache is not invalid. This way we can forget about the caching mechanism most of the time.

One case where we can end up needing to wipe the cache manually is when we work withing a git branch where contents of entities folder differs.

## Disabling Metadata Cache

We can disable metadata caching via:

```ts
await MikroORM.init({
  cache: { enabled: false },
  // ...
});
```

## Pretty Printing

By default, cached metadata will be one line JSON string. You can force pretty printing it:

```ts
await MikroORM.init({
  cache: { pretty: true },
  // ...
});
```

## Using Different temp Folder

We can set the cache directory via:

```ts
await MikroORM.init({
  // defaults to `./temp`
  cache: { options: { cacheDir: '...' } },
  // ...
});
```

## Providing Custom Cache Adapter

You can also implement your own cache adapter, for example to store the cache in redis. To do so, just implement simple `CacheAdapter` interface:

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
   * Clears all items stored in the cache.
   */
  clear(): Promise<void>;

  /**
   * Called inside `MikroORM.close()` Allows graceful shutdowns (e.g. for redis).
   */
  close?(): Promise<void>;

}
```

```ts
export class RedisCacheAdapter implements CacheAdapter { ... }
```

And provide the implementation in `cache.adapter` option:

```ts
await MikroORM.init({
  cache: { adapter: RedisCacheAdapter, options: { ... } },
  // ...
});
```
