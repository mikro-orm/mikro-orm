import { AnyEntity, EntityData, EntityMetadata, EntityProperty, IHydrator } from '../typings';
import { EntityFactory } from '../entity';
import { Platform } from '../platforms/Platform';
import { MetadataStorage } from '../metadata/MetadataStorage';

/* istanbul ignore next */
export abstract class Hydrator implements IHydrator {

  constructor(protected readonly metadata: MetadataStorage,
              protected readonly platform: Platform) { }

  /**
   * @inheritDoc
   */
  hydrate<T extends AnyEntity<T>>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, factory: EntityFactory, newEntity?: boolean, convertCustomTypes?: boolean, returning?: boolean): void {
    const props = this.getProperties(meta, entity, returning);

    for (const prop of props) {
      this.hydrateProperty(entity, prop, data, factory, newEntity, convertCustomTypes);
    }
  }

  /**
   * @inheritDoc
   */
  hydrateReference<T extends AnyEntity<T>>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, factory: EntityFactory, convertCustomTypes?: boolean): void {
    meta.primaryKeys.forEach(pk => {
      this.hydrateProperty<T>(entity, meta.properties[pk], data, factory, false, convertCustomTypes);
    });
  }

  protected getProperties<T extends AnyEntity<T>>(meta: EntityMetadata<T>, entity: T, returning?: boolean, reference?: boolean): EntityProperty<T>[] {
    if (reference) {
      return meta.primaryKeys.map(pk => meta.properties[pk]);
    }

    if (meta.root.discriminatorColumn) {
      meta = this.metadata.find(entity.constructor.name)!;
    }

    if (returning) {
      return meta.hydrateProps.filter(prop => prop.primary || prop.defaultRaw);
    }

    return meta.hydrateProps;
  }

  /* istanbul ignore next */
  protected hydrateProperty<T extends AnyEntity<T>>(entity: T, prop: EntityProperty, data: EntityData<T>, factory: EntityFactory, newEntity?: boolean, convertCustomTypes?: boolean): void {
    entity[prop.name] = data[prop.name];
  }

}
