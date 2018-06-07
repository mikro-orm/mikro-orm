import { readdirSync } from 'fs';
import { ObjectID } from 'bson';

import { getMetadataStorage, Options } from './MikroORM';
import { Collection } from './Collection';
import { EntityManager } from './EntityManager';
import { BaseEntity, EntityMetadata, EntityProperty, ReferenceType } from './BaseEntity';
import { Utils } from './Utils';

export class EntityFactory {

  private metadata = getMetadataStorage();
  private options: Options = this.em.options;
  private logger = this.em.options.logger as Function;

  constructor(private em: EntityManager) {
    this.loadMetadata();
  }

  getMetadata(): { [entity: string]: EntityMetadata } {
    return this.metadata;
  }

  create<T extends BaseEntity>(entityName: string, data: any, initialized = true): T {
    const meta = this.metadata[entityName];
    const exclude = [];
    let found = false;
    let entity;

    // TODO test those conditions if we really need them both
    if (data.id && !data._id) {
      data._id = new ObjectID(data.id);
      delete data.id;
    }

    // TODO test those conditions if we really need them both
    if (data._id && typeof data._id === 'string') {
      data._id = new ObjectID(data._id);
    }

    if (this.em.identityMap[`${entityName}-${data._id}`]) {
      entity = this.em.identityMap[`${entityName}-${data._id}`];
      found = true;
    } else {
      const params = this.extractConstructorParams<T>(meta, data);
      const Entity = require(meta.path)[entityName];
      entity = new Entity(...params);
      exclude.push(...meta.constructorParams);
    }

    this.initEntity(entity, meta.properties, data, exclude, found);

    if (initialized) {
      delete entity['_initialized'];
    } else {
      entity['_initialized'] = initialized;
    }

    return entity;
  }

  createReference<T extends BaseEntity>(entityName: string, id: string): T {
    if (this.em.identityMap[`${entityName}-${id}`]) {
      return this.em.identityMap[`${entityName}-${id}`] as T;
    }

    return this.create<T>(entityName, { id }, false);
  }

  initEntity<T extends BaseEntity>(entity: T, properties: any, data: any, exclude: string[] = [], found = false): void {
    // process base entity properties first
    ['_id', 'createdAt', 'updatedAt'].forEach(k => {
      if (data[k]) {
        entity[k] = data[k];
      }
    });

    // then process user defined properties (ignore not defined keys in `data`)
    Object.keys(properties).forEach(p => {
      const prop = properties[p] as EntityProperty;

      if (exclude.includes(p)) {
        return;
      }

      if (prop.reference === ReferenceType.ONE_TO_MANY && !data[p]) {
        return entity[p] = new Collection<T>(prop, entity);
      }

      if (prop.reference === ReferenceType.MANY_TO_MANY && !prop.owner && !found && (!entity[p] || !data[p])) {
        return entity[p] = new Collection<T>(prop, entity);
      }

      if (prop.reference === ReferenceType.MANY_TO_MANY && prop.owner && Utils.isArray(data[p])) {
        const items = data[p].map((id: ObjectID) => this.createReference(prop.type, id.toHexString()));
        return entity[p] = new Collection<T>(prop, entity, items);
      }

      if (prop.reference === ReferenceType.MANY_TO_ONE) {
        if (data[p] instanceof ObjectID) {
          entity[p] = this.createReference(prop.type, data[p].toHexString());
          this.em.addToIdentityMap(entity[p]);
        }

        return;
      }

      if (prop.reference === ReferenceType.SCALAR && data[p]) {
        entity[p] = data[p];
      }
    });
  }

  /**
   * returns parameters for entity constructor, creating references from plain ids
   */
  private extractConstructorParams<T extends BaseEntity>(meta: EntityMetadata, data: any): any[] {
    // TODO support for reference parameters based on type, not variable name
    return meta.constructorParams.map((k: string) => {
      if (meta.properties[k].reference === ReferenceType.MANY_TO_ONE && data[k]) {
        return this.em.getReference<T>(meta.properties[k].type, data[k]);
      }

      return data[k];
    });
  }

  private loadMetadata(): any {
    const startTime = Date.now();
    this.logger(`ORM entity discovery started`);

    this.options.entitiesDirs.forEach(dir => this.discover(dir));
    const diff = Date.now() - startTime;
    this.logger(`- entity discovery finished after ${diff} ms`);
  }

  private discover(basePath: string) {
    const files = readdirSync(this.options.baseDir + '/' + basePath);

    files.forEach(file => {
      if (file.lastIndexOf('.ts') === -1 || file.startsWith('.')) {
        return;
      }

      this.logger(`- processing entity ${file}`);
      const name = file.split('.')[0];
      const path = `${this.options.baseDir}/${basePath}/${file}`;
      require(path);

      this.metadata[name].path = path;
      this.metadata[name].entity = name;

      // init types
      const props = this.metadata[name].properties;
      Object.keys(props).forEach(p => {
        if (props[p].entity) {
          this.metadata[name].properties[p].type = props[p].entity();
        }
      });
    });
  }

}
