import type { EntityMetadata } from '../typings';
import type { Logger } from '../logging/Logger';
import { Utils } from '../utils/Utils';

// to get around circular dependencies
export interface IConfiguration {
  get(key: string, defaultValue?: any): any;
  getLogger(): Logger;
}

export abstract class MetadataProvider {

  constructor(protected readonly config: IConfiguration) { }

  abstract loadEntityMetadata(meta: EntityMetadata, name: string): void;

  loadFromCache(meta: EntityMetadata, cache: EntityMetadata): void {
    Object.values(cache.properties).forEach(prop => {
      const metaProp = meta.properties[prop.name];

      if (metaProp?.enum && Array.isArray(metaProp.items)) {
        delete prop.items;
      }
    });

    // Preserve function expressions from indexes/uniques — they can't survive JSON cache serialization
    const expressionMap = new Map<string, Function>();

    for (const idx of [...(meta.indexes ?? []), ...(meta.uniques ?? [])]) {
      if (typeof idx.expression === 'function' && idx.name) {
        expressionMap.set(idx.name, idx.expression);
      }
    }

    Utils.mergeConfig(meta, cache);

    // Restore function expressions that were lost during JSON serialization
    if (expressionMap.size > 0) {
      for (const idx of [...(meta.indexes ?? []), ...(meta.uniques ?? [])]) {
        const fn = idx.name && expressionMap.get(idx.name);

        if (fn && typeof idx.expression !== 'function') {
          idx.expression = fn as any;
        }
      }
    }
  }

  useCache(): boolean {
    return this.config.get('metadataCache').enabled ?? false;
  }

}
