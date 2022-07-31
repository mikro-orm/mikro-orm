import { Utils } from '../utils/Utils';
import type { AnyEntity, Dictionary, EntityData, EntityMetadata, EntityName, EntityProperty, New, Primary } from '../typings';
import type { EntityManager } from '../EntityManager';
import { EventType, ReferenceType } from '../enums';
import { Reference } from './Reference';

export interface FactoryOptions {
  initialized?: boolean;
  newEntity?: boolean;
  merge?: boolean;
  refresh?: boolean;
  convertCustomTypes?: boolean;
  schema?: string;
}

export class EntityFactory {

  private readonly driver = this.em.getDriver();
  private readonly platform = this.driver.getPlatform();
  private readonly config = this.em.config;
  private readonly metadata = this.em.getMetadata();
  private readonly hydrator = this.config.getHydrator(this.metadata);
  private readonly eventManager = this.em.getEventManager();
  private readonly comparator = this.em.getComparator();

  constructor(private readonly em: EntityManager) { }

  create<T extends AnyEntity<T>, P extends string = string>(entityName: EntityName<T>, data: EntityData<T>, options: FactoryOptions = {}): New<T, P> {
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

    if (exists && exists.__helper!.__initialized && !options.refresh) {
      exists.__helper!.__initialized = options.initialized;
      this.mergeData(meta2, exists, data, options);

      return exists as New<T, P>;
    }

    data = { ...data };
    const entity = exists ?? this.createEntity<T>(data, meta2, options);
    entity.__helper!.__initialized = options.initialized;
    this.hydrate(entity, meta2, data, options);
    entity.__helper!.__touched = false;

    if (exists && meta.discriminatorColumn && !(entity instanceof meta2.class)) {
      Object.setPrototypeOf(entity, meta2.prototype);
    }

    if (options.merge && entity.__helper!.hasPrimaryKey()) {
      this.unitOfWork.registerManaged(entity, data, {
        refresh: options.refresh && options.initialized,
        newEntity: options.newEntity,
        loaded: options.initialized,
      });
    }

    if (this.eventManager.hasListeners(EventType.onInit, meta2)) {
      this.eventManager.dispatchEvent(EventType.onInit, { entity, em: this.em });
    }

    return entity as New<T, P>;
  }

  mergeData<T extends AnyEntity<T>>(meta: EntityMetadata<T>, entity: T, data: EntityData<T>, options: FactoryOptions): void {
    // merge unchanged properties automatically
    data = { ...data };
    const existsData = this.comparator.prepareEntity(entity);
    const originalEntityData = entity.__helper!.__originalEntityData ?? {} as EntityData<T>;
    const diff = this.comparator.diffEntities(meta.className, originalEntityData, existsData);

    // version properties are not part of entity snapshots
    if (meta.versionProperty && data[meta.versionProperty as string] && data[meta.versionProperty as string] !== originalEntityData[meta.versionProperty as string]) {
      diff[meta.versionProperty as string] = data[meta.versionProperty as string];
    }

    const diff2 = this.comparator.diffEntities(meta.className, existsData, data);

    // do not override values changed by user
    Object.keys(diff).forEach(key => delete diff2[key]);
    Object.keys(diff2).filter(key => diff2[key] === undefined).forEach(key => delete diff2[key]);
    this.hydrate(entity, meta, diff2, options);

    // we need to update the entity data only with keys that were not present before
    Object.keys(diff2).forEach(key => {
      const prop = meta.properties[key];

      if ([ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(prop.reference) && Utils.isPlainObject(data[prop.name])) {
        diff2[key] = (entity[prop.name] as AnyEntity).__helper!.getPrimaryKey(options.convertCustomTypes);
      }

      originalEntityData[key] = diff2[key];
      entity.__helper!.__loadedProperties.add(key);
    });

    // in case of joined loading strategy, we need to cascade the merging to possibly loaded relations manually
    meta.relations.forEach(prop => {
      if ([ReferenceType.MANY_TO_MANY, ReferenceType.ONE_TO_MANY].includes(prop.reference) && Array.isArray(data[prop.name as string])) {
        // instead of trying to match the collection items (which could easily fail if the collection was loaded with different ordering),
        // we just create the entity from scratch, which will automatically pick the right one from the identity map and call `mergeData` on it
        (data[prop.name as string] as EntityData<T>[])
          .filter(child => Utils.isPlainObject(child)) // objects with prototype can be PKs (e.g. `ObjectId`)
          .forEach(child => this.create(prop.type, child, options)); // we can ignore the value, we just care about the `mergeData` call

        return;
      }

      if ([ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(prop.reference) && Utils.isPlainObject(data[prop.name as string]) && entity[prop.name] && (entity[prop.name] as AnyEntity).__helper!.__initialized) {
        this.create(prop.type, data[prop.name as string] as EntityData<T>, options); // we can ignore the value, we just care about the `mergeData` call
      }
    });

    entity.__helper!.__touched = false;
  }

  createReference<T>(entityName: EntityName<T>, id: Primary<T> | Primary<T>[] | Record<string, Primary<T>>, options: Pick<FactoryOptions, 'merge' | 'convertCustomTypes' | 'schema'> = {}): T {
    options.convertCustomTypes ??= true;
    entityName = Utils.className(entityName);
    const meta = this.metadata.get<T>(entityName);
    const schema = this.driver.getSchemaName(meta, options);

    if (Array.isArray(id)) {
      id = Utils.getPrimaryKeyCondFromArray(id, meta);
    }

    const pks = Utils.getOrderedPrimaryKeys<T>(id, meta, this.platform, options.convertCustomTypes);

    if (Utils.isPrimaryKey(id)) {
      id = { [meta.primaryKeys[0]]: id as Primary<T> };
    }

    const exists = this.unitOfWork.getById<T>(entityName, pks, schema);

    if (exists) {
      return exists;
    }

    return this.create<T>(entityName, id as EntityData<T>, { ...options, initialized: false }) as T;
  }

  createEmbeddable<T>(entityName: EntityName<T>, data: EntityData<T>, options: Pick<FactoryOptions, 'newEntity' | 'convertCustomTypes'> = {}): T {
    entityName = Utils.className(entityName);
    data = { ...data };
    const meta = this.metadata.get(entityName);
    const meta2 = this.processDiscriminatorColumn<T>(meta, data);

    return this.createEntity(data, meta2, options);
  }

  private createEntity<T extends AnyEntity<T>>(data: EntityData<T>, meta: EntityMetadata<T>, options: FactoryOptions): T {
    if (options.newEntity || meta.forceConstructor || meta.virtual) {
      if (!meta.class) {
        throw new Error(`Cannot create entity ${meta.className}, class prototype is unknown`);
      }

      options.initialized = options.newEntity || options.initialized;
      const params = this.extractConstructorParams<T>(meta, data, options);
      const Entity = meta.class;
      meta.constructorParams.forEach(prop => delete data[prop]);

      // creates new instance via constructor as this is the new entity
      const entity = new Entity(...params);

      if (meta.virtual) {
        return entity;
      }

      entity.__helper!.__schema = this.driver.getSchemaName(meta, options);

      if (!options.newEntity) {
        meta.relations
          .filter(prop => [ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(prop.reference))
          .forEach(prop => delete entity[prop.name]);

        if (options.initialized && !(entity as Dictionary).__gettersDefined) {
          Object.defineProperties(entity, meta.definedProperties);
        }
      }

      return entity;
    }

    // creates new entity instance, bypassing constructor call as its already persisted entity
    const entity = Object.create(meta.class.prototype) as T;
    entity.__helper!.__managed = true;
    entity.__helper!.__schema = this.driver.getSchemaName(meta, options);

    if (options.merge && !options.newEntity) {
      this.hydrator.hydrateReference(entity, meta, data, this, options.convertCustomTypes, this.driver.getSchemaName(meta, options));
      this.unitOfWork.registerManaged(entity);
    }

    if (options.initialized && !(entity as Dictionary).__gettersDefined) {
      Object.defineProperties(entity, meta.definedProperties);
    }

    return entity;
  }

  private hydrate<T extends AnyEntity<T>>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, options: FactoryOptions): void {
    if (options.initialized) {
      this.hydrator.hydrate(entity, meta, data, this, 'full', options.newEntity, options.convertCustomTypes, this.driver.getSchemaName(meta, options));
    } else {
      this.hydrator.hydrateReference(entity, meta, data, this, options.convertCustomTypes, this.driver.getSchemaName(meta, options));
    }
    Object.keys(data).forEach(key => entity.__helper?.__loadedProperties.add(key));
  }

  private findEntity<T>(data: EntityData<T>, meta: EntityMetadata<T>, options: FactoryOptions): T | undefined {
    const schema = this.driver.getSchemaName(meta, options);

    if (!meta.compositePK && !meta.getPrimaryProps()[0]?.customType) {
      return this.unitOfWork.getById<T>(meta.name!, data[meta.primaryKeys[0] as string] as Primary<T>, schema);
    }

    if (meta.primaryKeys.some(pk => data[pk as string] == null)) {
      return undefined;
    }

    const pks = Utils.getOrderedPrimaryKeys<T>(data as Dictionary, meta, this.platform, options.convertCustomTypes);

    return this.unitOfWork.getById<T>(meta.name!, pks, schema);
  }

  private processDiscriminatorColumn<T>(meta: EntityMetadata<T>, data: EntityData<T>): EntityMetadata<T> {
    if (!meta.root.discriminatorColumn) {
      return meta;
    }

    const prop = meta.properties[meta.root.discriminatorColumn];
    const value = data[prop.name];
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
  private denormalizePrimaryKey<T>(data: EntityData<T>, primaryKey: string, prop: EntityProperty<T>): void {
    const pk = this.platform.getSerializedPrimaryKeyField(primaryKey);

    if (data[pk] != null || data[primaryKey] != null) {
      let id = data[pk] || data[primaryKey];

      if (prop.type.toLowerCase() === 'objectid') {
        id = this.platform.denormalizePrimaryKey(id);
      }

      delete data[pk];
      data[primaryKey] = id as Primary<T> & T[keyof T];
    }
  }

  /**
   * returns parameters for entity constructor, creating references from plain ids
   */
  private extractConstructorParams<T>(meta: EntityMetadata<T>, data: EntityData<T>, options: FactoryOptions): T[keyof T][] {
    return meta.constructorParams.map(k => {
      if (meta.properties[k] && [ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(meta.properties[k].reference) && data[k]) {
        const entity = this.unitOfWork.getById(meta.properties[k].type, data[k], options.schema) as T[keyof T];

        if (entity) {
          return entity;
        }

        if (Utils.isEntity<T>(data[k])) {
          return data[k];
        }

        return this.createReference(meta.properties[k].type, data[k], options);
      }

      if (meta.properties[k]?.reference === ReferenceType.EMBEDDED && data[k]) {
        /* istanbul ignore next */
        if (Utils.isEntity<T>(data[k])) {
          return data[k];
        }

        return this.createEmbeddable(meta.properties[k].type, data[k], options);
      }

      if (!meta.properties[k]) {
        return data;
      }

      return data[k];
    });
  }

  private get unitOfWork() {
    return this.em.getUnitOfWork(false);
  }

}
