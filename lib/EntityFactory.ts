import { Collection } from './Collection';
import { EntityManager } from './EntityManager';
import { IPrimaryKey } from './decorators/PrimaryKey';
import { EntityMetadata, IEntity, ReferenceType } from './decorators/Entity';
import { Utils } from './utils/Utils';
import { MetadataStorage } from './metadata/MetadataStorage';

export const SCALAR_TYPES = ['string', 'number', 'boolean', 'Date'];

export class EntityFactory {

  private readonly metadata = MetadataStorage.getMetadata();

  constructor(private em: EntityManager) { }

  create<T extends IEntity>(entityName: string, data: any, initialized = true): T {
    const meta = this.metadata[entityName];
    const exclude: string[] = [];
    let entity: T;

    // normalize PK to `id: string`
    if (data.id || data._id) {
      data.id = this.em.getDriver().normalizePrimaryKey(data.id || data._id);
      delete data._id;
    }

    if (!data.id) {
      const params = this.extractConstructorParams<T>(meta, data);
      const Entity = require(meta.path)[entityName];
      entity = new Entity(...params);
      exclude.push(...meta.constructorParams);
    } else if (this.em.getIdentity(entityName, data.id)) {
      entity = this.em.getIdentity<T>(entityName, data.id);
    } else {
      // creates new entity instance, with possibility to bypass constructor call when instancing already persisted entity
      const Entity = require(meta.path)[meta.name];
      entity = Object.create(Entity.prototype);
      this.em.setIdentity(entity, data.id);
    }

    this.initEntity(entity, meta, data, exclude);

    if (initialized) {
      delete entity['__initialized'];
    } else {
      entity['__initialized'] = initialized;
    }

    return entity;
  }

  createReference<T extends IEntity>(entityName: string, id: IPrimaryKey): T {
    if (this.em.getIdentity(entityName, id)) {
      return this.em.getIdentity<T>(entityName, id);
    }

    return this.create<T>(entityName, { id }, false);
  }

  private initEntity<T extends IEntity>(entity: T, meta: EntityMetadata, data: any, exclude: string[]): void {
    entity.id = data.id; // process PK first

    // then process user defined properties (ignore not defined keys in `data`)
    Object.values(meta.properties).forEach(prop => {
      if (exclude.includes(prop.name)) {
        return;
      }

      if (prop.reference === ReferenceType.ONE_TO_MANY) {
        return entity[prop.name] = new Collection<T>(entity, undefined, !!data[prop.name]);
      }

      if (prop.reference === ReferenceType.MANY_TO_MANY) {
        if (prop.owner && Array.isArray(data[prop.name])) {
          const driver = this.em.getDriver();
          const items = data[prop.name].map((id: IPrimaryKey) => this.createReference(prop.type, driver.normalizePrimaryKey(id)));
          return entity[prop.name] = new Collection<T>(entity, items);
        } else if (!entity[prop.name]) {
          const items = prop.owner && !this.em.getDriver().usesPivotTable() ? [] : undefined;
          return entity[prop.name] = new Collection<T>(entity, items, false);
        }
      }

      if (prop.reference === ReferenceType.MANY_TO_ONE) {
        if (data[prop.name] && !Utils.isEntity(data[prop.name])) {
          const id = this.em.getDriver().normalizePrimaryKey(data[prop.name]);
          entity[prop.name] = this.createReference(prop.type, id);
        }

        return;
      }

      if (prop.reference === ReferenceType.SCALAR && data[prop.name]) {
        entity[prop.name] = data[prop.name];
      }
    });
  }

  /**
   * returns parameters for entity constructor, creating references from plain ids
   */
  private extractConstructorParams<T extends IEntity>(meta: EntityMetadata, data: any): any[] {
    return meta.constructorParams.map((k: string) => {
      if (meta.properties[k].reference === ReferenceType.MANY_TO_ONE && data[k]) {
        return this.em.getReference<T>(meta.properties[k].type, data[k]);
      }

      return data[k];
    });
  }

}
