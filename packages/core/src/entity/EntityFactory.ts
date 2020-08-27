import { ObjectBindingPattern, Utils } from '../utils';
import { Dictionary, EntityData, EntityMetadata, EntityName, EntityProperty, New, Populate, Primary } from '../typings';
import { UnitOfWork } from '../unit-of-work';
import { ReferenceType } from './enums';
import { EntityManager, EventType, wrap } from '..';

export const SCALAR_TYPES = ['string', 'number', 'boolean', 'Date', 'Buffer', 'RegExp'];

export class EntityFactory {

  private readonly driver = this.em.getDriver();
  private readonly config = this.em.config;
  private readonly metadata = this.em.getMetadata();
  private readonly hydrator = this.config.getHydrator(this, this.em);

  constructor(private readonly unitOfWork: UnitOfWork,
              private readonly em: EntityManager) { }

  create<T, P extends Populate<T> = keyof T>(entityName: EntityName<T>, data: EntityData<T>, initialized = true, newEntity = false): New<T, P> {
    if (Utils.isEntity<T>(data)) {
      return data as New<T, P>;
    }

    entityName = Utils.className(entityName);
    const meta = this.metadata.get(entityName);
    meta.primaryKeys.forEach(pk => this.denormalizePrimaryKey(data, pk, meta.properties[pk]));
    const entity = this.createEntity(data, meta);
    const wrapped = entity.__helper!;

    if (initialized && !Utils.isEntity(data)) {
      this.hydrator.hydrate(entity, meta, data, newEntity);
    }

    wrapped.__initialized = initialized;

    this.runHooks(entity, meta);

    return entity as New<T, P>;
  }

  createReference<T>(entityName: EntityName<T>, id: Primary<T> | Primary<T>[] | Record<string, Primary<T>>): T {
    entityName = Utils.className(entityName);
    const meta = this.metadata.get(entityName);

    if (Array.isArray(id)) {
      id = Utils.getPrimaryKeyCondFromArray(id, meta.primaryKeys);
    }

    const pks = Utils.getOrderedPrimaryKeys<T>(id, meta);

    if (Utils.isPrimaryKey(id)) {
      id = { [meta.primaryKeys[0]]: id as Primary<T> };
    }

    if (this.unitOfWork.getById(entityName, pks)) {
      return this.unitOfWork.getById<T>(entityName, pks);
    }

    return this.create<T>(entityName, id as EntityData<T>, false);
  }

  private createEntity<T>(data: EntityData<T>, meta: EntityMetadata<T>): T {
    const root = Utils.getRootEntity(this.metadata, meta);

    if (root.discriminatorColumn) {
      const value = data[root.discriminatorColumn];
      delete data[root.discriminatorColumn];
      const type = root.discriminatorMap![value];
      meta = type ? this.metadata.find(type)! : meta;
    }

    const Entity = meta.class;
    const pks = Utils.getOrderedPrimaryKeys<T>(data as Dictionary, meta);

    if (meta.primaryKeys.some(pk => !Utils.isDefined(data[pk as keyof T], true))) {
      const params = this.extractConstructorParams<T>(meta, data);
      meta.constructorParams.forEach(prop => delete data[prop]);

      // creates new instance via constructor as this is the new entity
      return new Entity(...params);
    }

    if (this.unitOfWork.getById<T>(meta.name!, pks)) {
      return this.unitOfWork.getById<T>(meta.name!, pks);
    }

    // creates new entity instance, bypassing constructor call as its already persisted entity
    const entity = Object.create(Entity.prototype);

    meta.primaryKeys.forEach(pk => {
      const prop = meta.properties[pk];

      if (prop.reference === ReferenceType.SCALAR) {
        entity[pk] = data[pk];
      } else {
        entity[pk] = this.createReference(prop.type, data[pk]);
      }
    });

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

      if (!(k in data) || k as unknown === ObjectBindingPattern) {
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
