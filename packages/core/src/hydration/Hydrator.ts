import { AnyEntity, EntityData, EntityMetadata, EntityProperty, IHydrator } from '../typings';
import { EntityFactory } from '../entity';
import { Platform } from '../platforms/Platform';
import { MetadataStorage } from '../metadata/MetadataStorage';
import { Configuration } from '../utils/Configuration';

/* istanbul ignore next */
export abstract class Hydrator implements IHydrator {

  constructor(protected readonly metadata: MetadataStorage,
              protected readonly platform: Platform,
              protected readonly config: Configuration) { }

  /**
   * @inheritDoc
   */
  hydrate<T extends AnyEntity<T>>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, factory: EntityFactory, type: 'full' | 'returning' | 'reference', newEntity = false, convertCustomTypes = false): void {
    const props = this.getProperties(meta, type);

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

  protected getProperties<T extends AnyEntity<T>>(meta: EntityMetadata<T>, type: 'full' | 'returning' | 'reference'): EntityProperty<T>[] {
    if (type === 'reference') {
      return meta.primaryKeys.map(pk => meta.properties[pk]);
    }

    if (type === 'returning') {
      return meta.hydrateProps.filter(prop => prop.primary || prop.defaultRaw);
    }

    return meta.hydrateProps;
  }

  /* istanbul ignore next */
  protected hydrateProperty<T extends AnyEntity<T>>(entity: T, prop: EntityProperty, data: EntityData<T>, factory: EntityFactory, newEntity?: boolean, convertCustomTypes?: boolean): void {
    entity[prop.name] = data[prop.name];
  }

}
