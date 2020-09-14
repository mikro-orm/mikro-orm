import { Utils } from '../utils/Utils';
import { Dictionary, EntityData, EntityMetadata, EntityName, EntityProperty, New, Populate, Primary, AnyEntity } from '../typings';
import { UnitOfWork } from '../unit-of-work';
import { EntityManager } from '../EntityManager';
import { EventType, ReferenceType } from '../enums';
import { WrappedEntity } from './WrappedEntity';

export interface FactoryOptions {
  initialized?: boolean;
  newEntity?: boolean;
  merge?: boolean;
  refresh?: boolean;
  convertCustomTypes?: boolean;
}

export class EntityFactory {

  private readonly driver = this.em.getDriver();
  private readonly config = this.em.config;
  private readonly metadata = this.em.getMetadata();
  private readonly hydrator = this.config.getHydrator(this, this.em);

  constructor(private readonly unitOfWork: UnitOfWork,
              private readonly em: EntityManager) { }

  create<T extends AnyEntity<T>, P extends Populate<T> = keyof T>(entityName: EntityName<T>, data: EntityData<T>, options: FactoryOptions = {}): New<T, P> {
    options.initialized = options.initialized ?? true;

    if (Utils.isEntity<T>(data)) {
      return data as New<T, P>;
    }

    entityName = Utils.className(entityName);
    const meta = this.metadata.get(entityName);
    meta.primaryKeys.forEach(pk => this.denormalizePrimaryKey(data, pk, meta.properties[pk]));

    const meta2 = this.processDiscriminatorColumn<T>(meta, data);
    const exists = this.findEntity<T>(data, meta2, options.convertCustomTypes);

    if (exists && exists.__helper!.isInitialized() && !options.refresh) {
      return exists as New<T, P>;
    }

    const entity = exists ?? this.createEntity<T>(data, meta2, options);
    this.hydrate(entity, meta, data, options);

    if (options.merge) {
      this.unitOfWork.registerManaged(entity, data, options.refresh, options.newEntity);
    }

    entity.__helper!.__initialized = options.initialized;
    this.runHooks(entity, meta);

    return entity as New<T, P>;
  }

  createReference<T>(entityName: EntityName<T>, id: Primary<T> | Primary<T>[] | Record<string, Primary<T>>, options: Pick<FactoryOptions, 'merge' | 'convertCustomTypes'> = {}): T {
    options.convertCustomTypes = options.convertCustomTypes ?? true;
    entityName = Utils.className(entityName);
    const meta = this.metadata.get(entityName);

    if (Array.isArray(id)) {
      id = Utils.getPrimaryKeyCondFromArray(id, meta.primaryKeys);
    }

    const pks = Utils.getOrderedPrimaryKeys<T>(id, meta, this.driver.getPlatform(), options.convertCustomTypes);

    if (Utils.isPrimaryKey(id)) {
      id = { [meta.primaryKeys[0]]: id as Primary<T> };
    }

    const exists = this.unitOfWork.getById<T>(entityName, pks);

    if (exists) {
      return exists;
    }

    return this.create<T>(entityName, id as EntityData<T>, { initialized: false, ...options });
  }

  private createEntity<T extends AnyEntity<T>>(data: EntityData<T>, meta: EntityMetadata<T>, options: FactoryOptions): T {
    if (meta.primaryKeys.some(pk => !Utils.isDefined(data[pk as keyof T], true))) {
      const params = this.extractConstructorParams<T>(meta, data);
      const Entity = meta.class;
      meta.constructorParams.forEach(prop => delete data[prop]);

      // creates new instance via constructor as this is the new entity
      const entity = new Entity(...params);
      // perf: create the helper instance early to bypass the double getter defined on the prototype in EntityHelper
      Object.defineProperty(entity, '__helper', { value: new WrappedEntity(entity as T, this.em) });

      return entity;
    }

    // creates new entity instance, bypassing constructor call as its already persisted entity
    const entity = Object.create(meta.class.prototype) as T & AnyEntity<T>;
    // perf: create the helper instance early to bypass the double getter defined on the prototype in EntityHelper
    Object.defineProperty(entity, '__helper', { value: new WrappedEntity(entity as T, this.em) });
    entity.__helper!.__managed = true;
    this.hydrator.hydrateReference(entity, meta, data, options.convertCustomTypes);

    if (!options.newEntity) {
      this.unitOfWork.registerManaged<T>(entity);
    }

    return entity;
  }

  private hydrate<T>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, options: FactoryOptions): void {
    if (options.initialized) {
      this.hydrator.hydrate(entity, meta, data, options.newEntity, options.convertCustomTypes);
    } else {
      this.hydrator.hydrateReference(entity, meta, data, options.convertCustomTypes);
    }
  }

  private findEntity<T>(data: EntityData<T>, meta: EntityMetadata<T>, convertCustomTypes?: boolean): T | undefined {
    if (meta.primaryKeys.some(pk => !Utils.isDefined(data[pk as keyof T], true))) {
      return undefined;
    }

    const pks = Utils.getOrderedPrimaryKeys<T>(data as Dictionary, meta, this.driver.getPlatform(), convertCustomTypes);

    return this.unitOfWork.getById<T>(meta.name!, pks);
  }

  private processDiscriminatorColumn<T>(meta: EntityMetadata<T>, data: EntityData<T>): EntityMetadata<T> {
    const root = Utils.getRootEntity(this.metadata, meta);

    if (!root.discriminatorColumn) {
      return meta;
    }

    const prop = meta.properties[root.discriminatorColumn];
    const value = data[prop.name];
    const type = root.discriminatorMap![value];
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
    const platform = this.driver.getPlatform();
    const pk = platform.getSerializedPrimaryKeyField(primaryKey);

    if (Utils.isDefined(data[pk], true) || Utils.isDefined(data[primaryKey], true)) {
      let id = data[pk] || data[primaryKey];

      if (prop.type.toLowerCase() === 'objectid') {
        id = platform.denormalizePrimaryKey(id);
      }

      delete data[pk];
      data[primaryKey as keyof T] = id as Primary<T> & T[keyof T];
    }
  }

  /**
   * returns parameters for entity constructor, creating references from plain ids
   */
  private extractConstructorParams<T>(meta: EntityMetadata<T>, data: EntityData<T>): T[keyof T][] {
    return meta.constructorParams.map(k => {
      if (meta.properties[k] && [ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(meta.properties[k].reference) && data[k]) {
        const entity = this.unitOfWork.getById(meta.properties[k].type, data[k]) as T[keyof T];

        if (entity) {
          return entity;
        }

        if (Utils.isEntity<T>(data[k])) {
          return data[k];
        }

        return this.createReference(meta.properties[k].type, data[k]);
      }

      if (!meta.properties[k]) {
        return data;
      }

      return data[k];
    });
  }

  private runHooks<T>(entity: T, meta: EntityMetadata<T>): void {
    /* istanbul ignore next */
    const hooks = meta.hooks?.onInit || [];

    if (hooks.length > 0) {
      hooks.forEach(hook => (entity[hook] as unknown as () => void)());
    }

    this.em.getEventManager().dispatchEvent(EventType.onInit, { entity, em: this.em });
  }

}
