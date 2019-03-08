import { IDatabaseDriver } from '..';
import { EntityData, EntityMetadata, EntityProperty, IEntityType } from '../decorators/Entity';
import { EntityFactory } from '../entity/EntityFactory';

export abstract class Hydrator {

  constructor(protected readonly factory: EntityFactory,
              protected readonly driver: IDatabaseDriver) { }

  hydrate<T extends IEntityType<T>>(entity: T, meta: EntityMetadata, data: EntityData<T>): void {
    entity.id = data.id as string | number; // process PK first

    // then process user defined properties (ignore not defined keys in `data`)
    Object.values(meta.properties).forEach(prop => {
      const value = data[prop.name];
      this.hydrateProperty(entity, prop, value);
    });
  }

  protected abstract hydrateProperty<T extends IEntityType<T>>(entity: T, prop: EntityProperty, value: EntityData<T>[any]): void;

}
