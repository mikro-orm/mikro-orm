import { Configuration, Utils } from '../utils';
import { EntityData, EntityMetadata, EntityName, AnyEntity, Primary } from '../types';
import { MetadataStorage } from '../metadata';
import { UnitOfWork } from '../unit-of-work';
import { ReferenceType } from './enums';
import { IDatabaseDriver } from '..';

export const SCALAR_TYPES = ['string', 'number', 'boolean', 'Date'];

export class EntityFactory {

  private readonly hydrator = this.config.getHydrator(this);

  constructor(private readonly unitOfWork: UnitOfWork,
              private readonly driver: IDatabaseDriver,
              private readonly config: Configuration,
              private readonly metadata: MetadataStorage) { }

  create<T extends AnyEntity<T>>(entityName: EntityName<T>, data: EntityData<T>, initialized = true): T {
    entityName = Utils.className(entityName);
    data = Object.assign({}, data);
    const meta = this.metadata.get(entityName);
    const platform = this.driver.getPlatform();
    const pk = platform.getSerializedPrimaryKeyField(meta.primaryKey);

    // denormalize PK to value required by driver
    if (data[pk] || data[meta.primaryKey]) {
      const id = platform.denormalizePrimaryKey(data[pk] || data[meta.primaryKey]);
      delete data[pk];
      data[meta.primaryKey as keyof T] = id as Primary<T> & T[keyof T];
    }

    const entity = this.createEntity(data, meta);
    this.hydrator.hydrate(entity, meta, data);

    if (initialized) {
      delete entity.__initialized;
    } else {
      entity.__initialized = initialized;
    }

    return entity;
  }

  createReference<T extends AnyEntity<T>>(entityName: EntityName<T>, id: Primary<T>): T {
    entityName = Utils.className(entityName);
    const meta = this.metadata.get(entityName);

    if (this.unitOfWork.getById(entityName, id)) {
      return this.unitOfWork.getById<T>(entityName, id);
    }

    return this.create<T>(entityName, { [meta.primaryKey]: id } as EntityData<T>, false);
  }

  private createEntity<T extends AnyEntity<T>>(data: EntityData<T>, meta: EntityMetadata<T>): T {
    const path = Utils.absolutePath(meta.path, this.config.get('baseDir'));
    const Entity = require(path)[meta.name];

    if (!data[meta.primaryKey]) {
      const params = this.extractConstructorParams<T>(meta, data);
      meta.constructorParams.forEach(prop => delete data[prop]);
      const entity = new Entity(...params);
      this.runHooks(entity, meta);

      return entity;
    }

    if (this.unitOfWork.getById<T>(meta.name, data[meta.primaryKey])) {
      return this.unitOfWork.getById<T>(meta.name, data[meta.primaryKey]);
    }

    // creates new entity instance, with possibility to bypass constructor call when instancing already persisted entity
    const entity = Object.create(Entity.prototype);
    entity[meta.primaryKey] = data[meta.primaryKey];
    this.runHooks(entity, meta);

    return entity;
  }

  /**
   * returns parameters for entity constructor, creating references from plain ids
   */
  private extractConstructorParams<T extends AnyEntity<T>>(meta: EntityMetadata<T>, data: EntityData<T>): T[keyof T][] {
    return meta.constructorParams.map(k => {
      if (meta.properties[k] && meta.properties[k].reference === ReferenceType.MANY_TO_ONE && data[k]) {
        const entity = this.unitOfWork.getById(meta.properties[k].type, data[k]) as T[keyof T];
        return entity || this.createReference(meta.properties[k].type, data[k]);
      }

      return data[k];
    });
  }

  private runHooks<T extends AnyEntity<T>>(entity: T, meta: EntityMetadata<T>): void {
    if (meta.hooks && meta.hooks.onInit && meta.hooks.onInit.length > 0) {
      meta.hooks.onInit.forEach(hook => (entity[hook] as unknown as () => void)());
    }
  }

}
