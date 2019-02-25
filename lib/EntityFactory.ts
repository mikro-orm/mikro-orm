import { Collection } from './Collection';
import { IPrimaryKey } from './decorators/PrimaryKey';
import { EntityClass, EntityData, EntityMetadata, IEntity, IEntityType, ReferenceType } from './decorators/Entity';
import { Utils } from './utils/Utils';
import { MetadataStorage } from './metadata/MetadataStorage';
import { UnitOfWork } from './UnitOfWork';
import { IDatabaseDriver } from './drivers/IDatabaseDriver';

export const SCALAR_TYPES = ['string', 'number', 'boolean', 'Date'];

export class EntityFactory {

  private readonly metadata = MetadataStorage.getMetadata();

  constructor(private readonly unitOfWork: UnitOfWork,
              private readonly driver: IDatabaseDriver) { }

  create<T extends IEntityType<T>>(entityName: string | EntityClass<T>, data: EntityData<T>, initialized = true): T {
    entityName = Utils.className(entityName);
    const meta = this.metadata[entityName];
    const Entity = require(meta.path)[meta.name];
    const exclude: string[] = [];
    let entity: T;

    // normalize PK to `id: string`
    if (data.id || data._id) {
      data.id = this.driver.normalizePrimaryKey(data.id || data._id);
      delete data._id;
    }

    if (!data.id) {
      const params = this.extractConstructorParams<T>(meta, data);
      entity = new Entity(...params);
      exclude.push(...meta.constructorParams);
    } else if (this.unitOfWork.getById(entityName, data.id)) {
      entity = this.unitOfWork.getById<T>(entityName, data.id);
    } else {
      // creates new entity instance, with possibility to bypass constructor call when instancing already persisted entity
      entity = Object.create(Entity.prototype);
      entity.id = data.id as number | string;
      this.unitOfWork.addToIdentityMap(entity);
    }

    this.initEntity(entity, meta, data, exclude);

    if (initialized) {
      delete entity.__initialized;
    } else {
      entity.__initialized = initialized;
    }

    return entity;
  }

  createReference<T extends IEntityType<T>>(entityName: string | EntityClass<T>, id: IPrimaryKey): T {
    entityName = Utils.className(entityName);

    if (this.unitOfWork.getById(entityName, id)) {
      return this.unitOfWork.getById<T>(entityName, id);
    }

    return this.create<T>(entityName, { id } as EntityData<T>, false);
  }

  private initEntity<T extends IEntityType<T>>(entity: T, meta: EntityMetadata, data: EntityData<T>, exclude: string[]): void {
    entity.id = data.id as string | number; // process PK first

    // then process user defined properties (ignore not defined keys in `data`)
    Object.values(meta.properties).forEach(prop => {
      const value = data[prop.name];

      if (exclude.includes(prop.name)) {
        return;
      }

      if (prop.reference === ReferenceType.ONE_TO_MANY) {
        return entity[prop.name as keyof T] = new Collection<IEntity>(entity, undefined, !!value) as T[keyof T];
      }

      if (prop.reference === ReferenceType.MANY_TO_MANY) {
        if (prop.owner && Array.isArray(value)) {
          const items = value.map((id: IPrimaryKey) => this.createReference(prop.type, this.driver.normalizePrimaryKey(id)));
          return entity[prop.name as keyof T] = new Collection<IEntity>(entity, items) as T[keyof T];
        } else if (!entity[prop.name as keyof T]) {
          const items = prop.owner && !this.driver.getConfig().usesPivotTable ? [] : undefined;
          return entity[prop.name as keyof T] = new Collection<IEntity>(entity, items, false) as T[keyof T];
        }
      }

      if (prop.reference === ReferenceType.MANY_TO_ONE) {
        if (value && !Utils.isEntity(value)) {
          const id = this.driver.normalizePrimaryKey(value as IPrimaryKey);
          entity[prop.name as keyof T] = this.createReference(prop.type, id as IPrimaryKey);
        }

        return;
      }

      if (prop.reference === ReferenceType.SCALAR && value) {
        entity[prop.name as keyof T] = value;
      }
    });
  }

  /**
   * returns parameters for entity constructor, creating references from plain ids
   */
  private extractConstructorParams<T extends IEntityType<T>>(meta: EntityMetadata<T>, data: EntityData<T>): T[keyof T][] {
    return meta.constructorParams.map(k => {
      if (meta.properties[k].reference === ReferenceType.MANY_TO_ONE && data[k]) {
        const entity = this.unitOfWork.getById(meta.properties[k].type, data[k]) as T[keyof T];
        return entity || this.createReference(meta.properties[k].type, data[k]);
      }

      return data[k];
    });
  }

}
