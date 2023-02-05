import type { EntityData, EntityMetadata, EntityProperty, EntityValue, IHydrator } from '../typings';
import type { EntityFactory } from '../entity/EntityFactory';
import type { Platform } from '../platforms/Platform';
import type { MetadataStorage } from '../metadata/MetadataStorage';
import type { Configuration } from '../utils/Configuration';

/* istanbul ignore next */
export abstract class Hydrator implements IHydrator {

  protected running = false;

  constructor(protected readonly metadata: MetadataStorage,
              protected readonly platform: Platform,
              protected readonly config: Configuration) { }

  /**
   * @inheritDoc
   */
  hydrate<T extends object>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, factory: EntityFactory, type: 'full' | 'reference', newEntity = false, convertCustomTypes = false, schema?: string): void {
    // the running state is used to consider propagation as hydration, saving the values directly to the entity data,
    // but we don't want that for new entities, their propagation should result in entity updates when flushing
    this.running = !newEntity;
    const props = this.getProperties(meta, type);

    for (const prop of props) {
      this.hydrateProperty(entity, prop, data, factory, newEntity, convertCustomTypes);
    }
    this.running = false;
  }

  /**
   * @inheritDoc
   */
  hydrateReference<T extends object>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, factory: EntityFactory, convertCustomTypes?: boolean, schema?: string): void {
    this.running = true;
    meta.primaryKeys.forEach(pk => {
      this.hydrateProperty<T>(entity, meta.properties[pk], data, factory, false, convertCustomTypes);
    });
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  protected getProperties<T extends object>(meta: EntityMetadata<T>, type: 'full' | 'reference'): EntityProperty<T>[] {
    if (type === 'reference') {
      return meta.primaryKeys.map(pk => meta.properties[pk]);
    }

    return meta.hydrateProps;
  }

  protected hydrateProperty<T extends object>(entity: T, prop: EntityProperty<T>, data: EntityData<T>, factory: EntityFactory, newEntity?: boolean, convertCustomTypes?: boolean): void {
    entity[prop.name] = data[prop.name] as EntityValue<T>;
  }

}
