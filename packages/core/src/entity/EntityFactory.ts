import { Utils } from '../utils/Utils';
import type {
  Dictionary,
  EntityData,
  EntityKey,
  EntityMetadata,
  EntityName,
  EntityProperty,
  EntityValue,
  IHydrator,
  New,
  Primary,
} from '../typings';
import type { EntityManager } from '../EntityManager';
import { QueryHelper } from '../utils/QueryHelper';
import { EventType, ReferenceKind } from '../enums';
import { Reference } from './Reference';
import { helper } from './wrap';
import type { EntityComparator } from '../utils/EntityComparator';
import { EntityHelper } from './EntityHelper';
import type { IDatabaseDriver } from '../drivers/IDatabaseDriver';
import type { Platform } from '../platforms/Platform';
import type { Configuration } from '../utils/Configuration';
import type { EventManager } from '../events/EventManager';
import type { MetadataStorage } from '../metadata/MetadataStorage';

export interface FactoryOptions {
  initialized?: boolean;
  newEntity?: boolean;
  merge?: boolean;
  refresh?: boolean;
  convertCustomTypes?: boolean;
  schema?: string;
}

export class EntityFactory {

  private readonly driver: IDatabaseDriver;
  private readonly platform: Platform;
  private readonly config: Configuration;
  private readonly metadata: MetadataStorage;
  private readonly hydrator: IHydrator;
  private readonly eventManager: EventManager;
  private readonly comparator: EntityComparator;

  constructor(private readonly em: EntityManager) {
    this.driver = this.em.getDriver();
    this.platform = this.driver.getPlatform();
    this.config = this.em.config;
    this.metadata = this.em.getMetadata();
    this.hydrator = this.config.getHydrator(this.metadata);
    this.eventManager = this.em.getEventManager();
    this.comparator = this.em.getComparator();
  }

  create<T extends object, P extends string = string>(entityName: EntityName<T>, data: EntityData<T>, options: FactoryOptions = {}): New<T, P> {
    data = Reference.unwrapReference(data);
    options.initialized ??= true;

    if ((data as Dictionary).__entity) {
      return data as New<T, P>;
    }

    entityName = Utils.className(entityName);
    const meta = this.metadata.get(entityName);

    if (meta.virtual) {
      data = { ...data };
      const entity = this.createEntity<T>(data, meta, options);
      this.hydrate(entity, meta, data, options);

      return entity as New<T, P>;
    }

    if (this.platform.usesDifferentSerializedPrimaryKey()) {
      meta.primaryKeys.forEach(pk => this.denormalizePrimaryKey(data, pk, meta.properties[pk]));
    }

    const meta2 = this.processDiscriminatorColumn<T>(meta, data);
    const exists = this.findEntity<T>(data, meta2, options);
    let wrapped = exists && helper(exists);

    if (wrapped && !options.refresh) {
      wrapped.__processing = true;
      this.mergeData(meta2, exists!, data, options);
      wrapped.__processing = false;

      if (wrapped.isInitialized()) {
        return exists as New<T, P>;
      }
    }

    data = { ...data };
    const entity = exists ?? this.createEntity<T>(data, meta2, options);
    wrapped = helper(entity);
    wrapped.__processing = true;
    wrapped.__initialized = options.initialized;

    if (options.newEntity || meta.forceConstructor || meta.virtual) {
      const tmp = { ...data };
      meta.constructorParams.forEach(prop => delete tmp[prop as EntityKey<T>]);
      this.hydrate(entity, meta2, tmp, options);
    } else {
      this.hydrate(entity, meta2, data, options);
    }

    wrapped.__touched = false;

    if (exists && meta.discriminatorColumn && !(entity instanceof meta2.class)) {
      Object.setPrototypeOf(entity, meta2.prototype as object);
    }

    if (options.merge && wrapped.hasPrimaryKey()) {
      this.unitOfWork.register(entity, data, {
        refresh: options.refresh && options.initialized,
        newEntity: options.newEntity,
        loaded: options.initialized,
      });
    }

    if (this.eventManager.hasListeners(EventType.onInit, meta2)) {
      this.eventManager.dispatchEvent(EventType.onInit, { entity, meta: meta2, em: this.em });
    }

    wrapped.__processing = false;

    return entity as New<T, P>;
  }

  mergeData<T extends object>(meta: EntityMetadata<T>, entity: T, data: EntityData<T>, options: FactoryOptions = {}): void {
    // merge unchanged properties automatically
    data = QueryHelper.processParams(data);
    const existsData = this.comparator.prepareEntity(entity);
    const originalEntityData = helper(entity).__originalEntityData ?? {} as EntityData<T>;
    const diff = this.comparator.diffEntities(meta.className, originalEntityData, existsData);

    // version properties are not part of entity snapshots
    if (meta.versionProperty && data[meta.versionProperty] && data[meta.versionProperty] !== originalEntityData[meta.versionProperty]) {
      diff[meta.versionProperty] = data[meta.versionProperty];
    }

    const diff2 = this.comparator.diffEntities(meta.className, existsData, data);

    // do not override values changed by user
    Utils.keys(diff).forEach(key => delete diff2[key]);

    Utils.keys(diff2).filter(key => {
      // ignore null values if there is already present non-null value
      if (existsData[key] != null) {
        return diff2[key] == null;
      }

      return diff2[key] === undefined;
    }).forEach(key => delete diff2[key]);

    // but always add collection properties and formulas if they are part of the `data`
    Utils.keys(data)
      .filter(key => meta.properties[key]?.formula || [ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(meta.properties[key]?.kind))
      .forEach(key => diff2[key] = data[key]);

    // rehydrated with the new values, skip those changed by user
    this.hydrate(entity, meta, diff2, options);

    // we need to update the entity data only with keys that were not present before
    const nullVal = this.config.get('forceUndefined') ? undefined : null;
    Utils.keys(diff2).forEach(key => {
      const prop = meta.properties[key];

      if ([ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind) && Utils.isPlainObject(data[prop.name])) {
        diff2[key] = entity[prop.name] ? helper(entity[prop.name]!).getPrimaryKey(options.convertCustomTypes) as EntityValue<T> : null;
      }

      originalEntityData[key] = diff2[key] === null ? nullVal : diff2[key];
      helper(entity).__loadedProperties.add(key as string);
    });

    // in case of joined loading strategy, we need to cascade the merging to possibly loaded relations manually
    meta.relations.forEach(prop => {
      if ([ReferenceKind.MANY_TO_MANY, ReferenceKind.ONE_TO_MANY].includes(prop.kind) && Array.isArray(data[prop.name])) {
        // instead of trying to match the collection items (which could easily fail if the collection was loaded with different ordering),
        // we just create the entity from scratch, which will automatically pick the right one from the identity map and call `mergeData` on it
        (data[prop.name] as EntityData<T>[])
          .filter(child => Utils.isPlainObject(child)) // objects with prototype can be PKs (e.g. `ObjectId`)
          .forEach(child => this.create(prop.type, child, options)); // we can ignore the value, we just care about the `mergeData` call

        return;
      }

      if ([ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind) && Utils.isPlainObject(data[prop.name]) && entity[prop.name] && helper(entity[prop.name]!).__initialized) {
        this.create(prop.type, data[prop.name] as EntityData<T>, options); // we can ignore the value, we just care about the `mergeData` call
      }
    });

    helper(entity).__touched = false;
  }

  createReference<T extends object>(entityName: EntityName<T>, id: Primary<T> | Primary<T>[] | Record<string, Primary<T>>, options: Pick<FactoryOptions, 'merge' | 'convertCustomTypes' | 'schema'> = {}): T {
    options.convertCustomTypes ??= true;
    entityName = Utils.className(entityName);
    const meta = this.metadata.get<T>(entityName);
    const schema = this.driver.getSchemaName(meta, options);

    if (Array.isArray(id)) {
      // composite FK as PK needs to be wrapped for `getPrimaryKeyCondFromArray` to work correctly
      if (!meta.compositePK && meta.getPrimaryProps()[0].kind !== ReferenceKind.SCALAR) {
        id = [id] as Primary<T>[];
      }

      id = Utils.getPrimaryKeyCondFromArray(id, meta);
    }

    const pks = Utils.getOrderedPrimaryKeys<T>(id, meta);
    const exists = this.unitOfWork.getById<T>(entityName, pks as Primary<T>, schema);

    if (exists) {
      return exists;
    }

    if (Utils.isPrimaryKey(id)) {
      id = { [meta.primaryKeys[0]]: id as Primary<T> };
    }

    return this.create<T>(entityName, id as EntityData<T>, { ...options, initialized: false }) as T;
  }

  createEmbeddable<T extends object>(entityName: EntityName<T>, data: EntityData<T>, options: Pick<FactoryOptions, 'newEntity' | 'convertCustomTypes'> = {}): T {
    entityName = Utils.className(entityName);
    data = { ...data };
    const meta = this.metadata.get(entityName);
    const meta2 = this.processDiscriminatorColumn<T>(meta, data);

    return this.createEntity(data, meta2, options);
  }

  getComparator(): EntityComparator {
    return this.comparator;
  }

  private createEntity<T extends object>(data: EntityData<T>, meta: EntityMetadata<T>, options: FactoryOptions): T {
    if (options.newEntity || meta.forceConstructor || meta.virtual) {
      if (!meta.class) {
        throw new Error(`Cannot create entity ${meta.className}, class prototype is unknown`);
      }

      options.initialized = options.newEntity || options.initialized;
      const params = this.extractConstructorParams<T>(meta, data, options);
      const Entity = meta.class;

      // creates new instance via constructor as this is the new entity
      const entity = new Entity(...params);

      // creating managed entity instance when `forceEntityConstructor` is enabled,
      // we need to wipe all the values as they would cause update queries on next flush
      if (!options.initialized && this.config.get('forceEntityConstructor')) {
        meta.props
          .filter(prop => prop.persist !== false && !prop.primary && data[prop.name] === undefined)
          .forEach(prop => delete entity[prop.name]);
      }

      if (meta.virtual) {
        return entity;
      }

      helper(entity).__schema = this.driver.getSchemaName(meta, options);

      if (options.initialized) {
        EntityHelper.ensurePropagation(entity);
      }

      return entity;
    }

    // creates new entity instance, bypassing constructor call as its already persisted entity
    const entity = Object.create(meta.class.prototype) as T;
    helper(entity).__managed = true;
    helper(entity).__processing = !meta.embeddable && !meta.virtual;
    helper(entity).__schema = this.driver.getSchemaName(meta, options);

    if (options.merge && !options.newEntity) {
      this.hydrator.hydrateReference(entity, meta, data, this, options.convertCustomTypes, this.driver.getSchemaName(meta, options));
      this.unitOfWork.register(entity);
    }

    if (options.initialized) {
      EntityHelper.ensurePropagation(entity);
    }

    return entity;
  }

  private hydrate<T extends object>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, options: FactoryOptions): void {
    if (options.initialized) {
      this.hydrator.hydrate(entity, meta, data, this, 'full', options.newEntity, options.convertCustomTypes, this.driver.getSchemaName(meta, options));
    } else {
      this.hydrator.hydrateReference(entity, meta, data, this, options.convertCustomTypes, this.driver.getSchemaName(meta, options));
    }
    Utils.keys(data).forEach(key => helper(entity)?.__loadedProperties.add(key as string));
  }

  private findEntity<T extends object>(data: EntityData<T>, meta: EntityMetadata<T>, options: FactoryOptions): T | undefined {
    const schema = this.driver.getSchemaName(meta, options);

    if (meta.simplePK) {
      return this.unitOfWork.getById<T>(meta.name!, data[meta.primaryKeys[0]] as Primary<T>, schema);
    }

    if (!Array.isArray(data) && meta.primaryKeys.some(pk => data[pk] == null)) {
      return undefined;
    }

    const pks = Utils.getOrderedPrimaryKeys<T>(data as Dictionary, meta);

    return this.unitOfWork.getById<T>(meta.name!, pks, schema);
  }

  private processDiscriminatorColumn<T extends object>(meta: EntityMetadata<T>, data: EntityData<T>): EntityMetadata<T> {
    if (!meta.root.discriminatorColumn) {
      return meta;
    }

    const prop = meta.properties[meta.root.discriminatorColumn];
    const value = data[prop.name] as string;
    const type = meta.root.discriminatorMap![value];
    meta = type ? this.metadata.find(type)! : meta;

    // `prop.userDefined` is either `undefined` or `false`
    if (prop.userDefined === false) {
      delete data[prop.name];
    }

    return meta;
  }

  /**
   * denormalize PK to value required by driver (e.g. ObjectId)
   */
  private denormalizePrimaryKey<T>(data: EntityData<T>, primaryKey: EntityKey<T>, prop: EntityProperty<T>): void {
    const pk = this.platform.getSerializedPrimaryKeyField(primaryKey) as keyof typeof data;

    if (data[pk] != null || data[primaryKey] != null) {
      let id = (data[pk] || data[primaryKey]) as EntityValue<T>;

      if (prop.type.toLowerCase() === 'objectid') {
        id = this.platform.denormalizePrimaryKey(id as string) as EntityValue<T>;
      }

      delete data[pk];
      data[primaryKey] = id;
    }
  }

  /**
   * returns parameters for entity constructor, creating references from plain ids
   */
  private extractConstructorParams<T extends object>(meta: EntityMetadata<T>, data: EntityData<T>, options: FactoryOptions): EntityValue<T>[] {
    return meta.constructorParams.map(k => {
      if (meta.properties[k] && [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(meta.properties[k].kind) && data[k]) {
        const entity = this.unitOfWork.getById(meta.properties[k].type, data[k] as any, options.schema) as T[keyof T];

        if (entity) {
          return entity;
        }

        if (Utils.isEntity<T>(data[k])) {
          return data[k];
        }

        if (Utils.isObject(data[k]) && !Utils.extractPK(data[k], meta.properties[k].targetMeta, true)) {
          return this.create(meta.properties[k].type, data[k]!, options);
        }

        const { newEntity, initialized, ...rest } = options;
        return this.createReference(meta.properties[k].type, data[k]!, rest);
      }

      if (meta.properties[k]?.kind === ReferenceKind.EMBEDDED && data[k]) {
        /* istanbul ignore next */
        if (Utils.isEntity<T>(data[k])) {
          return data[k];
        }

        return this.createEmbeddable(meta.properties[k].type, data[k]!, options);
      }

      if (!meta.properties[k]) {
        return data;
      }

      return data[k];
    }) as EntityValue<T>[];
  }

  private get unitOfWork() {
    return this.em.getUnitOfWork(false);
  }

}
