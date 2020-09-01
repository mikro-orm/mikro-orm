import { EntityManager, Utils } from '..';
import { AnyEntity, EntityData, EntityMetadata, EntityProperty } from '../typings';
import { EntityFactory } from '../entity';

export abstract class Hydrator {

  constructor(protected readonly factory: EntityFactory,
              protected readonly em: EntityManager) { }

  /**
   * Hydrates the whole entity. This process handles custom type conversions, creating missing Collection instances,
   * mapping FKs to entity instances, as well as merging those entities.
   */
  hydrate<T extends AnyEntity<T>>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, newEntity?: boolean, convertCustomTypes?: boolean): void {
    const props = this.getProperties(meta, entity);

    for (const prop of props) {
      this.hydrateProperty(entity, prop, data, newEntity, convertCustomTypes);
    }
  }

  /**
   * Hydrates primary keys only
   */
  hydrateReference<T extends AnyEntity<T>>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, convertCustomTypes?: boolean): void {
    const props = this.getProperties(meta, entity).filter(prop => prop.primary);

    for (const prop of props) {
      this.hydrateProperty<T>(entity, prop, data, false, convertCustomTypes);
    }
  }

  private getProperties<T extends AnyEntity<T>>(meta: EntityMetadata<T>, entity: T): EntityProperty<T>[] {
    const metadata = this.em.getMetadata();
    const root = Utils.getRootEntity(metadata, meta);

    if (root.discriminatorColumn) {
      meta = metadata.find(entity.constructor.name)!;
    }

    return Object.values<EntityProperty>(meta.properties).filter(prop => {
      return !prop.inherited && root.discriminatorColumn !== prop.name && !prop.embedded;
    });
  }

  protected abstract hydrateProperty<T extends AnyEntity<T>>(entity: T, prop: EntityProperty, value: EntityData<T>, newEntity?: boolean, convertCustomTypes?: boolean): void;

}
