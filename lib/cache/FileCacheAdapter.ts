import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { CacheAdapter } from './CacheAdapter';

export class FileCacheAdapter implements CacheAdapter {

  constructor(private readonly options: { cacheDir: string }) {
    if (!existsSync(this.options.cacheDir)) {
      mkdirSync(this.options.cacheDir);
    }
  }

  get(name: string): any {
    if (!existsSync(this.path(name))) {
      return null;
    }

    const buffer = readFileSync(this.path(name));
    const payload = JSON.parse(buffer.toString());

    if (!existsSync(payload.origin) || payload.modified !== this.getModifiedTime(payload.origin)) {
      return null;
    }

    return payload.data;
  }

  set(name: string, data: any, origin: string): void {
    const payload = {
      modified: this.getModifiedTime(origin),
      data,
      origin,
    };
    writeFileSync(this.path(name), JSON.stringify(payload));
  }

  private path(name: string): string {
    return `${this.options.cacheDir}/${name}.json`;
  }

  private getModifiedTime(origin: string): number {
    return statSync(origin).mtimeMs;
  }

}
