import { AnyEntity, EntityData, EntityMetadata, EntityProperty } from '../typings';
import { EntityFactory } from '../entity';
import { Platform } from '../platforms/Platform';
import { MetadataStorage } from '../metadata/MetadataStorage';

export abstract class Hydrator {

  constructor(protected readonly factory: EntityFactory,
              protected readonly metadata: MetadataStorage,
              protected readonly platform: Platform) { }

  /**
   * Hydrates the whole entity. This process handles custom type conversions, creating missing Collection instances,
   * mapping FKs to entity instances, as well as merging those entities.
   */
  hydrate<T extends AnyEntity<T>>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, newEntity?: boolean, convertCustomTypes?: boolean, returning?: boolean): void {
    const props = this.getProperties(meta, entity, returning);

    for (const prop of props) {
      this.hydrateProperty(entity, prop, data, newEntity, convertCustomTypes);
    }
  }

  /**
   * Hydrates primary keys only
   */
  hydrateReference<T extends AnyEntity<T>>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, convertCustomTypes?: boolean): void {
    meta.primaryKeys.forEach(pk => {
      this.hydrateProperty<T>(entity, meta.properties[pk], data, false, convertCustomTypes);
    });
  }

  protected getProperties<T extends AnyEntity<T>>(meta: EntityMetadata<T>, entity: T, returning?: boolean): EntityProperty<T>[] {
    if (meta.root.discriminatorColumn) {
      meta = this.metadata.find(entity.constructor.name)!;
    }

    if (returning) {
      return meta.hydrateProps.filter(prop => prop.primary || prop.defaultRaw);
    }

    return meta.hydrateProps;
  }

  protected abstract hydrateProperty<T extends AnyEntity<T>>(entity: T, prop: EntityProperty, value: EntityData<T>, newEntity?: boolean, convertCustomTypes?: boolean): void;

}
