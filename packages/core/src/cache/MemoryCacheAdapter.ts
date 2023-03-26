import type { CacheAdapter } from './CacheAdapter';

export class MemoryCacheAdapter implements CacheAdapter {

  private readonly data = new Map<string, { data: any; expiration: number }>();

  constructor(private readonly options: { expiration: number }) { }

  /**
   * @inheritDoc
   */
  get<T = any>(name: string): T | undefined {
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
  set(name: string, data: any, origin: string, expiration?: number): void {
    this.data.set(name, { data, expiration: Date.now() + (expiration ?? this.options.expiration) });
  }

  /**
   * @inheritDoc
   */
  remove(name: string): void {
    this.data.delete(name);
  }

  /**
   * @inheritDoc
   */
  clear(): void {
    this.data.clear();
  }

}
