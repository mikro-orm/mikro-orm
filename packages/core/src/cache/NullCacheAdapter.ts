import type { SyncCacheAdapter } from './CacheAdapter';

export class NullCacheAdapter implements SyncCacheAdapter {

  /**
   * @inheritDoc
   */
  get(name: string): any {
    return null;
  }

  /**
   * @inheritDoc
   */
  set(name: string, data: any, origin: string): void {
    // ignore
  }

  /**
   * @inheritDoc
   */
  remove(name: string): void {
    // ignore
  }

  /**
   * @inheritDoc
   */
  clear(): void {
    // ignore
  }

}
