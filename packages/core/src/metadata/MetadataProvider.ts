import type { EntityMetadata, EntityProperty } from '../typings';
import { Utils } from '../utils/Utils';

// to get around circular dependencies
export interface IConfiguration {
  get(key: string, defaultValue?: any): any;
}

export abstract class MetadataProvider {

  constructor(protected readonly config: IConfiguration) { }

  abstract loadEntityMetadata(meta: EntityMetadata, name: string): Promise<void>;

  /**
   * Re-hydrates missing attributes like `customType` (functions/instances are lost when caching to JSON)
   */
  loadFromCache(meta: EntityMetadata, cache: EntityMetadata): void {
    Object.values(cache.properties).forEach(prop => {
      const metaProp = meta.properties[prop.name];

      if (prop.customType) {
        prop.customType = metaProp.customType;
      }

      if (metaProp?.enum && Array.isArray(metaProp.items)) {
        delete prop.items;
      }
    });

    Utils.mergeConfig(meta, cache);
  }

  useCache(): boolean {
    return this.config.get('metadataCache').enabled ?? false;
  }

  protected async initProperties(meta: EntityMetadata, fallback: (prop: EntityProperty) => void | Promise<void>): Promise<void> {
    // load types and column names
    for (const prop of Object.values(meta.properties)) {
      if (Utils.isString(prop.entity)) {
        prop.type = prop.entity;
      } else if (prop.entity) {
        const tmp = prop.entity();
        prop.type = Array.isArray(tmp) ? tmp.map(t => Utils.className(t)).sort().join(' | ') : Utils.className(tmp);
      } else if (!prop.type) {
        await fallback(prop);
      }
    }
  }

}
