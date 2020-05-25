import { EntityMetadata, EntityProperty } from '../typings';
import { Configuration, Utils } from '../utils';

export abstract class MetadataProvider {

  constructor(protected readonly config: Configuration) { }

  abstract async loadEntityMetadata(meta: EntityMetadata, name: string): Promise<void>;

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
