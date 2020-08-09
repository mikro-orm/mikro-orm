---
title: Metadata Cache
---

> In v4 you need to explicitly install `@mikro-orm/reflection` to use `TsMorphMetadataProvider`.

Under the hood, `MikroORM` uses [`ts-morph`](https://github.com/dsherret/ts-morph) to read 
TypeScript source files of all entities to be able to detect all types. Thanks to this, 
defining the type is enough for runtime validation.

If you use folder-based discovery, you should specify paths to
the compiled entities via `entities` as well as paths to the TS source files of
those entities via `entitiesTs`. When you run the ORM via `ts-node`, the latter
will be used automatically, or if you explicitly pass `tsNode: true` in the config.

After the discovery process ends, all metadata will be cached. By default, `FileCacheAdapter`
will be used to store the cache inside `./temp` folder to JSON files. 

## Automatic Invalidation

Entity metadata are cached together with modified time of the source file, and every time
the cache is requested, it first checks if the cache is not invalid. This way you can forgot 
about the caching mechanism most of the time.

One case where you can end up needing to wipe the cache manually is when you work withing a 
git branch where contents of entities folder differs. 

## Disabling Metadata Cache

You can disable caching via:

```typescript
await MikroORM.init({
  cache: { enabled: false },
  // ...
});
```

## Pretty Printing

By default, cached metadata will be one line JSON string. You can force pretty printing it:

```typescript
await MikroORM.init({
  cache: { pretty: true },
  // ...
});
```

## Using Different temp Folder

You can set the temp folder via:

```typescript
await MikroORM.init({
  cache: { options: { cacheDir: '...' } },
  // ...
});
```

## Providing Custom Cache Adapter

You can also implement your own cache adapter, for example to store the cache in redis. 
To do so, just implement simple `CacheAdapter` interface:

```typescript
export interface CacheAdapter {

  get(name: string): any;

  set(name: string, data: any, origin: string): void;

}
```

```typescript
export class RedisCacheAdapter implements CacheAdapter { ... }
```

And provide the implementation in `cache.adapter` option:

```typescript
await MikroORM.init({
  cache: { adapter: RedisCacheAdapter, options: { ... } },
  // ...
});
```
