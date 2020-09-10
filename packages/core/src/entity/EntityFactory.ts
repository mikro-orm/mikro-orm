import { Utils } from '../utils/Utils';
import { Dictionary, EntityData, EntityMetadata, EntityName, EntityProperty, New, Populate, Primary, AnyEntity } from '../typings';
import { UnitOfWork } from '../unit-of-work';
import { EntityManager } from '../EntityManager';
import { EventType, ReferenceType } from '../enums';

export interface FactoryOptions {
  initialized?: boolean;
  newEntity?: boolean;
  merge?: boolean;
  convertCustomTypes?: boolean;
}

export class EntityFactory {

  private readonly driver = this.em.getDriver();
  private readonly config = this.em.config;
  private readonly metadata = this.em.getMetadata();
  private readonly hydrator = this.config.getHydrator(this, this.em);

  constructor(private readonly unitOfWork: UnitOfWork,
              private readonly em: EntityManager) { }

  create<T, P extends Populate<T> = keyof T>(entityName: EntityName<T>, data: EntityData<T>, options: FactoryOptions = {}): New<T, P> {
    options.initialized = options.initialized ?? true;

    if (Utils.isEntity<T>(data)) {
      return data as New<T, P>;
    }

    entityName = Utils.className(entityName);
    const meta = this.metadata.get(entityName);
    meta.primaryKeys.forEach(pk => this.denormalizePrimaryKey(data, pk, meta.properties[pk]));
    const entity = this.createEntity(data, meta, options.merge, options.convertCustomTypes);
    const wrapped = entity.__helper!;

    if (options.initialized) {
      this.hydrator.hydrate(entity, meta, data, options.newEntity, options.convertCustomTypes);
    } else {
      this.hydrator.hydrateReference(entity, meta, data, options.convertCustomTypes);
    }

    if (options.merge) {
      this.unitOfWork.merge(entity, undefined, false);
    }

    wrapped.__initialized = options.initialized;
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

  private createEntity<T>(data: EntityData<T>, meta: EntityMetadata<T>, merge?: boolean, convertCustomTypes?: boolean): T {
    const root = Utils.getRootEntity(this.metadata, meta);

    if (root.discriminatorColumn) {
      const value = data[root.discriminatorColumn];
      delete data[root.discriminatorColumn];
      const type = root.discriminatorMap![value];
      meta = type ? this.metadata.find(type)! : meta;
    }

    const Entity = meta.class;

    if (meta.primaryKeys.some(pk => !Utils.isDefined(data[pk as keyof T], true))) {
      const params = this.extractConstructorParams<T>(meta, data);
      meta.constructorParams.forEach(prop => delete data[prop]);

      // creates new instance via constructor as this is the new entity
      return new Entity(...params);
    }

    const pks = Utils.getOrderedPrimaryKeys<T>(data as Dictionary, meta, this.driver.getPlatform(), convertCustomTypes);
    const exists = this.unitOfWork.getById<T>(meta.name!, pks);

    if (exists) {
      return exists;
    }

    // creates new entity instance, bypassing constructor call as its already persisted entity
    const entity = Object.create(Entity.prototype) as T & AnyEntity<T>;
    entity.__helper!.__managed = true;
    this.hydrator.hydrateReference(entity, meta, data, convertCustomTypes);

    if (merge) {
      this.unitOfWork.merge<T>(entity, new Set([entity]), false);
    }

    return entity;
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
