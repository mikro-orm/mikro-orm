import type { EntityMetadata } from '../typings.js';
import type { Logger } from '../logging/Logger.js';
import { Utils } from '../utils/Utils.js';
import type { SyncCacheAdapter } from '../cache/CacheAdapter.js';
import type { Platform } from '../platforms/Platform.js';

// to get around circular dependencies
export interface IConfiguration {
  get(key: string, defaultValue?: any): any;
  getLogger(): Logger;
  getMetadataCacheAdapter(): SyncCacheAdapter;
  getPlatform(): Platform;
}

export class MetadataProvider {

  constructor(protected readonly config: IConfiguration) { }

  loadEntityMetadata(meta: EntityMetadata): void {
    for (const prop of meta.props) {
      /* v8 ignore next */
      if (typeof prop.entity === 'string') {
        prop.type = prop.entity;
      } else if (prop.entity) {
        const tmp = prop.entity();
        prop.type = Array.isArray(tmp) ? tmp.map(t => Utils.className(t)).sort().join(' | ') : Utils.className(tmp);
      } else if (!prop.type && !(prop.enum && (prop.items?.length ?? 0) > 0)) {
        throw new Error(`Please provide either 'type' or 'entity' attribute in ${meta.className}.${prop.name}.`);
      }
    }
  }

  loadFromCache(meta: EntityMetadata, cache: EntityMetadata): void {
    Object.values(cache.properties).forEach(prop => {
      const metaProp = meta.properties[prop.name];

      /* v8 ignore next */
      if (metaProp?.enum && Array.isArray(metaProp.items)) {
        delete prop.items;
      }
    });

    Utils.mergeConfig(meta, cache);
  }

  static useCache(): boolean {
    return false;
  }

  useCache(): boolean {
    return this.config.get('metadataCache').enabled ?? MetadataProvider.useCache();
  }

  saveToCache(meta: EntityMetadata): void {
    //
  }

  getCachedMetadata<T>(meta: Pick<EntityMetadata<T>, 'className' | 'path' | 'root'>, root: EntityMetadata<T>): EntityMetadata<T> | undefined {
    if (!this.useCache()) {
      return undefined;
    }

    const cache = meta.path && this.config.getMetadataCacheAdapter().get(this.getCacheKey(meta));

    if (cache) {
      this.loadFromCache(meta as EntityMetadata<T>, cache);
      meta.root = root;
    }

    return cache;
  }

  combineCache(): void {
    const path = this.config.getMetadataCacheAdapter().combine?.();

    // override the path in the options, so we can log it from the CLI in `cache:generate` command
    if (path) {
      this.config.get('metadataCache').combined = path;
    }
  }

  getCacheKey(meta: Pick<EntityMetadata, 'className' | 'path'>): string {
    return meta.className;
  }

}
