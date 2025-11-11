---
title: Metadata Cache
---

> In v4 and later versions, we need to explicitly install `@mikro-orm/reflection` to use `TsMorphMetadataProvider`.

MikroORM allows different ways to [obtain entity metadata](./metadata-providers.md). One way is to use [`ts-morph`](https://github.com/dsherret/ts-morph) to read TypeScript source files of all entities to be able to detect all types. This process can be performance heavy and time-consuming. For this reason, metadata cache is automatically enabled for `TsMorphMetadataProvider`. It can be optionally enabled for the other metadata providers, but it should not be needed.

After the discovery process ends, all metadata will be cached. By default, `FileCacheAdapter` will be used to store the cache inside `./temp` folder to JSON files.

If we use folder-based discovery, cache will be dependent on environment—if we run via ts-node, the cache will be generated for TS files. To generate production cache, we can use the CLI command `mikro-orm cache:generate`. Alternatively, you can generate a cache bundle and use the [`GeneratedCacheAdapter`](./deployment.md#deploy-pre-built-cache), which allows to remove the production dependency on `@mikro-orm/reflection` package.

## Automatic Invalidation

Entity metadata are cached together with modified time of the source file, and every time the cache is requested, it first checks if the cache is not invalid. This way we can forget about the caching mechanism most of the time.

One case where we can end up needing to wipe the cache manually is when we work within a git branch where contents of entities folder differs.

## Disabling Metadata Cache

We can disable metadata caching via:

```ts
await MikroORM.init({
  metadataCache: { enabled: false },
  // ...
});
```

## Pretty Printing

By default, cached metadata will be one line JSON string. You can force pretty printing it:

```ts
await MikroORM.init({
  metadataCache: { pretty: true },
  // ...
});
```

## Using Different temp Folder

We can set the cache directory via:

```ts
await MikroORM.init({
  // defaults to `./temp`
  metadataCache: { options: { cacheDir: '...' } },
  // ...
});
```

## Providing Custom Cache Adapter

To provide a custom cache implementation, you need to implement the `SyncCacheAdapter` interface:

```ts
export interface SyncCacheAdapter {

  /**
   * Gets the items under `name` key from the cache.
   */
  get<T = any>(name: string): T | undefined;

  /**
   * Sets the item to the cache. `origin` is used for cache invalidation and should reflect the change in data.
   */
  set(name: string, data: any, origin: string, expiration?: number): void;

  /**
   * Removes the item from cache.
   */
  remove(name: string): void;

  /**
   * Generates a combined cache from all existing entries.
   */
  combine?(): string | void;

}
```

```ts
export class RedisCacheAdapter implements SyncCacheAdapter { ... }
```

And provide the implementation in `cache.adapter` option:

```ts
await MikroORM.init({
  metadataCache: { adapter: RedisCacheAdapter, options: { ... } },
  // ...
});
```

If you need async operations, fetch your cache before initializing the ORM and pass it to your adapter first via `metadataCache.options`. Similarly, save your cache after the ORM is initialized.

```ts
class RedisMetadataCache implements SyncCacheAdapter {

  constructor(private readonly cache: Record<string, any>) {}

  get<T = any>(name: string): T | undefined {
    return this.cache[name] as T | undefined;
  }

  set(name: string, data: any, origin: string, expiration?: number): void {
    this.cache[name] = { data, origin, expiration };
  }

  remove(name: string): void {
    delete this.cache[name];
  }

  combine?(): string | void {
    return JSON.stringify(this.cache);
  }

}

const existingCache = await fetchFromRedis(...) ?? {};
const orm = await MikroORM.init({
  metadataCache: { adapter: RedisCacheAdapter, options: { existingCache } },
  // ...
});
// ...
await saveToRedis(..., existingCache);
```
