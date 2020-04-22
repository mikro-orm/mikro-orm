import { EntityManager, Utils } from '..';
import { AnyEntity, EntityData, EntityMetadata, EntityProperty } from '../typings';
import { EntityFactory } from '../entity';

export abstract class Hydrator {

  constructor(protected readonly factory: EntityFactory,
              protected readonly em: EntityManager) { }

  hydrate<T extends AnyEntity<T>>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, newEntity: boolean): void {
    const metadata = this.em.getMetadata();
    const root = Utils.getRootEntity(metadata, meta);

    if (root.discriminatorColumn) {
      meta = metadata.get(entity.constructor.name);
    }

    for (const prop of Object.values<EntityProperty>(meta.properties).filter(prop => !prop.inherited && root.discriminatorColumn !== prop.name)) {
      this.hydrateProperty(entity, prop, data[prop.name], newEntity);
    }
  }

  protected abstract hydrateProperty<T extends AnyEntity<T>>(entity: T, prop: EntityProperty, value: EntityData<T>[any], newEntity: boolean): void;

}
