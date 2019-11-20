import { IDatabaseDriver, wrap } from '..';
import { EntityData, EntityMetadata, EntityProperty, AnyEntity } from '../types';
import { EntityFactory } from '../entity';

export abstract class Hydrator {

  constructor(protected readonly factory: EntityFactory,
              protected readonly driver: IDatabaseDriver) { }

  hydrate<T extends AnyEntity<T>>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, newEntity: boolean): void {
    if (data[meta.primaryKey]) {
      wrap(entity).__primaryKey = data[meta.primaryKey];
    }

    // then process user defined properties (ignore not defined keys in `data`)
    Object.values<EntityProperty>(meta.properties).forEach(prop => {
      const value = data[prop.name];
      this.hydrateProperty(entity, prop, value, newEntity);
    });
  }

  protected abstract hydrateProperty<T extends AnyEntity<T>>(entity: T, prop: EntityProperty, value: EntityData<T>[any], newEntity: boolean): void;

}
