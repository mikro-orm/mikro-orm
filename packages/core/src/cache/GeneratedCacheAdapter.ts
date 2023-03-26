import type { CacheAdapter } from './CacheAdapter';
import type { Dictionary } from '../typings';

export class GeneratedCacheAdapter implements CacheAdapter {

  private readonly data = new Map<string, { data: Dictionary }>();

  constructor(private readonly options: { data: Dictionary }) {
    this.data = new Map<string, { data: any }>(Object.entries(options.data));
  }

  /**
   * @inheritDoc
   */
  get<T = any>(name: string): T | undefined {
    const key = name.replace(/\.[jt]s$/, '');
    const data = this.data.get(key);

    return data as T;
  }

  /**
   * @inheritDoc
   */
  set(name: string, data: any, origin: string): void {
    this.data.set(name, { data });
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
