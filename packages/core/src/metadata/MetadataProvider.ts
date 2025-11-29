import type { EntityMetadata } from '../typings.js';
import type { Logger } from '../logging/Logger.js';
import { Utils } from '../utils/Utils.js';

// to get around circular dependencies
export interface IConfiguration {
  get(key: string, defaultValue?: any): any;
  getLogger(): Logger;
}

export class MetadataProvider {

  constructor(protected readonly config: IConfiguration) { }

  loadEntityMetadata(meta: EntityMetadata): void {
    for (const prop of meta.props) {
      if (typeof prop.entity === 'string') {
        prop.type = prop.entity;
      } else if (prop.entity) {
        const tmp = prop.entity();
        prop.type = Array.isArray(tmp) ? tmp.map(t => Utils.className(t)).sort().join(' | ') : Utils.className(tmp);
      /* v8 ignore next */
      } else if (!prop.type && !(prop.enum && (prop.items?.length ?? 0) > 0)) {
        throw new Error(`Please provide either 'type' or 'entity' attribute in ${meta.className}.${prop.name}.`);
      }
    }
  }

  loadFromCache(meta: EntityMetadata, cache: EntityMetadata): void {
    Object.values(cache.properties).forEach(prop => {
      const metaProp = meta.properties[prop.name];

      /* v8 ignore next 3 */
      if (metaProp?.enum && Array.isArray(metaProp.items)) {
        delete prop.items;
      }
    });

    Utils.mergeConfig(meta, cache);
  }

  useCache(): boolean {
    return this.config.get('metadataCache').enabled ?? false;
  }

}
