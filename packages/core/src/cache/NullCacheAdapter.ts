import type { CacheAdapter } from './CacheAdapter';

export class NullCacheAdapter implements CacheAdapter {

  /**
   * @inheritdoc
   */
  async get(name: string): Promise<any> {
    return null;
  }

  /**
   * @inheritdoc
   */
  async set(name: string, data: any, origin: string): Promise<void> {
    // ignore
  }

  /**
   * @inheritdoc
   */
  async clear(): Promise<void> {
    // ignore
  }

}
