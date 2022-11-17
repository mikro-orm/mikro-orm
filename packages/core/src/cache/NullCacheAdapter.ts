import type { CacheAdapter } from './CacheAdapter';

export class NullCacheAdapter implements CacheAdapter {
	/**
	 * @inheritDoc
	 */
	async get(name: string): Promise<any> {
		return null;
	}

	/**
	 * @inheritDoc
	 */
	async set(name: string, data: any, origin: string): Promise<void> {
		// ignore
	}

	/**
	 * @inheritDoc
	 */
	async remove(name: string): Promise<void> {
		// ignore
	}

	/**
	 * @inheritDoc
	 */
	async clear(): Promise<void> {
		// ignore
	}
}
