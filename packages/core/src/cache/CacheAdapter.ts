export interface CacheAdapter {

  /**
   * Gets the items under `name` key from the cache.
   */
  get<T = any>(name: string): T | Promise<T> | undefined;

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

export interface SyncCacheAdapter extends CacheAdapter {

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
