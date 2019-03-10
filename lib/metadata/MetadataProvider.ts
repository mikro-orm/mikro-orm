import { EntityClass, EntityClassGroup, EntityMetadata, IEntityType } from '../decorators';
import { Configuration, Utils } from '../utils';
import { MetadataStorage } from './MetadataStorage';

export abstract class MetadataProvider {

  constructor(protected readonly config: Configuration) { }

  abstract async loadEntityMetadata(meta: EntityMetadata, name: string): Promise<void>;

  loadFromCache(meta: EntityMetadata, cache: EntityMetadata): void {
    Utils.merge(meta, cache);
  }

  prepare<T extends IEntityType<T>>(entity: EntityClass<T> | EntityClassGroup<T>): EntityClass<T> {
    // save path to entity from schema
    if ('entity' in entity && 'schema' in entity) {
      const schema = entity.schema;
      const meta = MetadataStorage.getMetadata(entity.entity.name);
      meta.path = schema.path;

      return entity.entity;
    }

    return entity;
  }

}
