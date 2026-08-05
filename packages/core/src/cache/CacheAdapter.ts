/** Interface for async-capable cache storage used by result cache and metadata cache. */
export interface CacheAdapter {
  /**
   * Gets the items under `name` key from the cache. When `origin` is provided, adapters that
   * track the entry origin should ignore entries cached from a different source file.
   */
  get<T = any>(name: string, origin?: string): T | Promise<T | undefined> | undefined;

  /**
   * Sets the item to the cache. `origin` is used for cache invalidation and should reflect the change in data.
   */
  set(name: string, data: any, origin: string, expiration?: number): void | Promise<void>;

  /**
   * Removes the item from cache.
   */
  remove(name: string): void | Promise<void>;

  /**
   * Clears all items stored in the cache.
   */
  clear(): void | Promise<void>;

  /**
   * Called inside `MikroORM.close()` Allows graceful shutdowns (e.g. for redis).
   */
  close?(): void | Promise<void>;
}

/** Synchronous variant of CacheAdapter, used for metadata cache where async access is not needed. */
export interface SyncCacheAdapter extends CacheAdapter {
  /**
   * Gets the items under `name` key from the cache. When `origin` is provided, adapters that
   * track the entry origin should ignore entries cached from a different source file.
   */
  get<T = any>(name: string, origin?: string): T | undefined;

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
