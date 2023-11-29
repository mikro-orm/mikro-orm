import globby from 'globby';
import { ensureDirSync, pathExistsSync, readFileSync, readJSONSync, unlinkSync, writeJSONSync } from 'fs-extra';

import type { SyncCacheAdapter } from './CacheAdapter';
import { Utils } from '../utils/Utils';
import type { Dictionary } from '../typings';

export class FileCacheAdapter implements SyncCacheAdapter {

  private readonly VERSION = Utils.getORMVersion();
  private cache: Dictionary = {};

  constructor(private readonly options: { cacheDir: string; combined?: boolean | string },
              private readonly baseDir: string,
              private readonly pretty = false) { }

  /**
   * @inheritDoc
   */
  get(name: string): any {
    const path = this.path(name);

    if (!pathExistsSync(path)) {
      return null;
    }

    const payload = readJSONSync(path);
    const hash = this.getHash(payload.origin);

    if (!hash || payload.hash !== hash) {
      return null;
    }

    return payload.data;
  }

  /**
   * @inheritDoc
   */
  set(name: string, data: any, origin: string): void {
    if (this.options.combined) {
      this.cache[name.replace(/\.[jt]s$/, '')] = data;
      return;
    }

    const path = this.path(name);
    const hash = this.getHash(origin);
    const opts = this.pretty ? { spaces: 2 } : {};
    writeJSONSync(path!, { data, origin, hash, version: this.VERSION }, opts);
  }

  /**
   * @inheritDoc
   */
  remove(name: string): void {
    const path = this.path(name);
    unlinkSync(path);
  }

  /**
   * @inheritDoc
   */
  clear(): void {
    const path = this.path('*');
    const files = globby.sync(path);
    files.forEach(file => unlinkSync(file));
    this.cache = {};
  }

  combine(): string | void {
    if (!this.options.combined) {
      return;
    }

    let path = typeof this.options.combined === 'string'
      ? this.options.combined
      : './metadata.json';
    path = Utils.normalizePath(this.options.cacheDir, path);
    this.options.combined = path; // override in the options, so we can log it from the CLI in `cache:generate` command
    writeJSONSync(path, this.cache, { spaces: this.pretty ? 2 : undefined });

    return path;
  }

  private path(name: string): string {
    ensureDirSync(this.options.cacheDir);
    return `${this.options.cacheDir}/${name}.json`;
  }

  private getHash(origin: string): string | null {
    origin = Utils.absolutePath(origin, this.baseDir);

    if (!pathExistsSync(origin)) {
      return null;
    }

    const contents = readFileSync(origin);

    return Utils.hash(contents.toString() + this.VERSION);
  }

}
