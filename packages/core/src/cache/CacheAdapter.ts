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
