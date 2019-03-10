import { Utils, Configuration } from '../utils';
import { EntityData, EntityMetadata, EntityName, IEntityType, IPrimaryKey } from '../decorators';
import { MetadataStorage } from '../metadata';
import { UnitOfWork } from '../unit-of-work';
import { ReferenceType } from './enums';
import { IDatabaseDriver } from '..';

export const SCALAR_TYPES = ['string', 'number', 'boolean', 'Date'];

export class EntityFactory {

  private readonly metadata = MetadataStorage.getMetadata();
  private readonly hydrator = this.config.getHydrator(this);

  constructor(private readonly unitOfWork: UnitOfWork,
              private readonly driver: IDatabaseDriver,
              private readonly config: Configuration) { }

  create<T extends IEntityType<T>>(entityName: EntityName<T>, data: EntityData<T>, initialized = true): T {
    entityName = Utils.className(entityName);
    data = Object.assign({}, data);
    const meta = this.metadata[entityName];

    // normalize PK to `id: string`
    if (data.id || data._id) {
      data.id = this.driver.normalizePrimaryKey(data.id || data._id);
      delete data._id;
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

  private createEntity<T extends IEntityType<T>>(data: EntityData<T>, meta: EntityMetadata<T>): T {
    const Entity = require(meta.path)[meta.name];

    if (!data.id) {
      const params = this.extractConstructorParams<T>(meta, data);
      meta.constructorParams.forEach(prop => delete data[prop]);
      return new Entity(...params);
    }

    if (this.unitOfWork.getById(meta.name, data.id)) {
      return this.unitOfWork.getById<T>(meta.name, data.id);
    }

    // creates new entity instance, with possibility to bypass constructor call when instancing already persisted entity
    const entity = Object.create(Entity.prototype);
    entity.id = data.id as number | string;
    this.unitOfWork.addToIdentityMap(entity);

    return entity;
  }

  createReference<T extends IEntityType<T>>(entityName: EntityName<T>, id: IPrimaryKey): T {
    entityName = Utils.className(entityName);

    if (this.unitOfWork.getById(entityName, id)) {
      return this.unitOfWork.getById<T>(entityName, id);
    }

    return this.create<T>(entityName, { id } as EntityData<T>, false);
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
