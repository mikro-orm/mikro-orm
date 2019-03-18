import { IDatabaseDriver } from '..';
import { EntityData, EntityMetadata, EntityProperty, IEntityType } from '../decorators';
import { EntityFactory } from '../entity';

export abstract class Hydrator {

  constructor(protected readonly factory: EntityFactory,
              protected readonly driver: IDatabaseDriver) { }

  hydrate<T extends IEntityType<T>>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>): void {
    entity.__primaryKey = data[meta.primaryKey];

    // then process user defined properties (ignore not defined keys in `data`)
    Object.values(meta.properties).forEach(prop => {
      const value = data[prop.name];
      this.hydrateProperty(entity, prop, value);
    });
  }

  protected abstract hydrateProperty<T extends IEntityType<T>>(entity: T, prop: EntityProperty, value: EntityData<T>[any]): void;

}
