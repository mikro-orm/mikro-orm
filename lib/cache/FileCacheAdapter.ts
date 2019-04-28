import { ensureDir, pathExists, readJSON, stat, writeJSON } from 'fs-extra';
import { CacheAdapter } from './CacheAdapter';

export class FileCacheAdapter implements CacheAdapter {

  constructor(private readonly options: { cacheDir: string }) { }

  async get(name: string): Promise<any> {
    const path = await this.path(name);

    if (!await pathExists(path)) {
      return null;
    }

    const payload = await readJSON(path);
    const modified = await this.getModifiedTime(payload.origin);

    if (!await pathExists(payload.origin) || payload.modified !== modified) {
      return null;
    }

    return payload.data;
  }

  async set(name: string, data: any, origin: string): Promise<void> {
    const modified = await this.getModifiedTime(origin);
    const path = await this.path(name);
    await writeJSON(path, { modified, data, origin });
  }

  private async path(name: string): Promise<string> {
    await ensureDir(this.options.cacheDir);
    return `${this.options.cacheDir}/${name}.json`;
  }

  private async getModifiedTime(origin: string): Promise<number> {
    const stats = await stat(origin);
    return stats.mtimeMs;
  }

}
