import { CacheAdapter } from './CacheAdapter';

export class NullCacheAdapter implements CacheAdapter {

  get(name: string): any {
    return null;
  }

  set(name: string, data: any, origin: string): void {
    // ignore
  }

}
