import type { CacheAdapter } from './CacheAdapter';

export class MemoryCacheAdapter implements CacheAdapter {
	private readonly data = new Map<string, { data: any; expiration: number }>();

	constructor(private readonly options: { expiration: number }) {}

	/**
	 * @inheritDoc
	 */
	async get<T = any>(name: string): Promise<T | undefined> {
		const data = this.data.get(name);

		if (data) {
			if (data.expiration < Date.now()) {
				this.data.delete(name);
			} else {
				return data.data;
			}
		}

		return undefined;
	}

	/**
	 * @inheritDoc
	 */
	async set(name: string, data: any, origin: string, expiration?: number): Promise<void> {
		this.data.set(name, {
			data,
			expiration: Date.now() + (expiration ?? this.options.expiration),
		});
	}

	/**
	 * @inheritDoc
	 */
	async remove(name: string): Promise<void> {
		this.data.delete(name);
	}

	/**
	 * @inheritDoc
	 */
	async clear(): Promise<void> {
		this.data.clear();
	}
}
