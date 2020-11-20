import { EntityMetadata, EntityProperty } from '../typings';
import { Utils } from '../utils/Utils';

// to get around circular dependencies
export interface IConfiguration {
  get(key: string, defaultValue?: any): any;
}

export abstract class MetadataProvider {

  constructor(protected readonly config: IConfiguration) { }

  abstract loadEntityMetadata(meta: EntityMetadata, name: string): Promise<void>;

  loadFromCache(meta: EntityMetadata, cache: EntityMetadata): void {
    Utils.merge(meta, cache);
  }

  useCache(): boolean {
    return this.config.get('cache').enabled ?? false;
  }

  protected async initProperties(meta: EntityMetadata, fallback: (prop: EntityProperty) => void | Promise<void>): Promise<void> {
    // load types and column names
    for (const prop of Object.values(meta.properties)) {
      if (Utils.isString(prop.entity)) {
        prop.type = prop.entity;
      } else if (prop.entity) {
        prop.type = Utils.className(prop.entity());
      } else if (!prop.type) {
        await fallback(prop);
      }
    }
  }

}
