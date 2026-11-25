import type { EntityData, EntityMetadata, EntityProperty, EntityValue, IHydrator } from '../typings.js';
import type { EntityFactory } from '../entity/EntityFactory.js';
import type { Platform } from '../platforms/Platform.js';
import type { MetadataStorage } from '../metadata/MetadataStorage.js';
import type { Configuration } from '../utils/Configuration.js';

/** Abstract base class for hydrating entity instances from raw database data. */
/* v8 ignore next */
export abstract class Hydrator implements IHydrator {
  constructor(
    protected readonly metadata: MetadataStorage,
    protected readonly platform: Platform,
    protected readonly config: Configuration,
  ) {}

  /**
   * @inheritDoc
   */
  hydrate<T extends object>(
    entity: T,
    meta: EntityMetadata<T>,
    data: EntityData<T>,
    factory: EntityFactory,
    type: 'full' | 'reference',
    newEntity = false,
    convertCustomTypes = false,
    schema?: string,
    parentSchema?: string,
  ): void {
    const props = this.getProperties(meta, type);

    for (const prop of props) {
      this.hydrateProperty(entity, prop, data, factory, newEntity, convertCustomTypes);
    }
  }

  /**
   * @inheritDoc
   */
  hydrateReference<T extends object>(
    entity: T,
    meta: EntityMetadata<T>,
    data: EntityData<T>,
    factory: EntityFactory,
    convertCustomTypes?: boolean,
    schema?: string,
    parentSchema?: string,
  ): void {
    meta.primaryKeys.forEach(pk => {
      this.hydrateProperty<T>(entity, meta.properties[pk], data, factory, false, convertCustomTypes);
    });
  }

  protected getProperties<T extends object>(meta: EntityMetadata<T>, type: 'full' | 'reference'): EntityProperty<T>[] {
    if (type === 'reference') {
      return meta.primaryKeys.map(pk => meta.properties[pk]);
    }

    return meta.hydrateProps;
  }

  protected hydrateProperty<T extends object>(
    entity: T,
    prop: EntityProperty<T>,
    data: EntityData<T>,
    factory: EntityFactory,
    newEntity?: boolean,
    convertCustomTypes?: boolean,
  ): void {
    entity[prop.name] = data[prop.name] as EntityValue<T>;
  }
}
