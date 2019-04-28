import { CacheAdapter } from './CacheAdapter';

export class NullCacheAdapter implements CacheAdapter {

  async get(name: string): Promise<any> {
    return null;
  }

  async set(name: string, data: any, origin: string): Promise<void> {
    // ignore
  }

}
