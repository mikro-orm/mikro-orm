import { readdirSync } from 'fs';
import { ObjectID } from 'bson';
import Project from 'ts-simple-ast';

import { getMetadataStorage, Options } from './MikroORM';
import { Collection } from './Collection';
import { EntityManager } from './EntityManager';
import { BaseEntity, EntityMetadata, EntityProperty, ReferenceType } from './BaseEntity';
import { Utils } from './Utils';

export const SCALAR_TYPES = ['string', 'number', 'boolean', 'Date'];

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
    let entity: T;

    data._id = new ObjectID(data.id || data._id);
    delete data.id;

    if (this.em.identityMap[`${entityName}-${data._id}`]) {
      entity = this.em.identityMap[`${entityName}-${data._id}`] as T;
    } else {
      // creates new entity instance, with possibility to bypass constructor call when instancing already persisted entity
      const Entity = require(meta.path)[meta.name];
      entity = Object.create(Entity.prototype);
      this.em.identityMap[`${entityName}-${data._id}`] = entity;
    }

    this.initEntity(entity, meta.properties, data);

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

  private initEntity<T extends BaseEntity>(entity: T, properties: any, data: any): void {
    // process base entity properties first
    ['_id', 'createdAt', 'updatedAt'].forEach(k => {
      if (data[k]) {
        entity[k] = data[k];
      }
    });

    // then process user defined properties (ignore not defined keys in `data`)
    Object.keys(properties).forEach(p => {
      const prop = properties[p] as EntityProperty;

      if (prop.reference === ReferenceType.ONE_TO_MANY && !data[p]) {
        return entity[p] = new Collection<T>(entity, prop);
      }

      if (prop.reference === ReferenceType.MANY_TO_MANY) {
        if (prop.owner && Utils.isArray(data[p])) {
          const items = data[p].map((id: ObjectID) => this.createReference(prop.type, id.toHexString()));
          return entity[p] = new Collection<T>(entity, prop, items);
        } else if (!entity[p]) {
          return entity[p] = new Collection<T>(entity, prop, prop.owner ? [] : null);
        }
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

  private loadMetadata(): any {
    const project = new Project();
    const startTime = Date.now();
    this.logger(`ORM entity discovery started`);

    this.options.entitiesDirs.forEach(dir => this.discover(project, dir));
    const diff = Date.now() - startTime;
    this.logger(`- entity discovery finished after ${diff} ms`);
  }

  private discover(project: Project, basePath: string) {
    const files = readdirSync(this.options.baseDir + '/' + basePath);
    this.logger(`- processing ${files.length} files from directory ${basePath}`);

    files.forEach(file => {
      if (!file.match(/\.[jt]s$/) || file.lastIndexOf('.js.map') !== -1 || file.startsWith('.')) {
        return;
      }

      this.logger(`- processing entity ${file.replace(/\.[jt]s$/, '')}`);
      const name = file.split('.')[0];
      const path = `${this.options.baseDir}/${basePath}/${file}`;
      require(path); // include the file to trigger loading of metadata
      const source = project.addExistingSourceFile(path);
      this.metadata[name].path = path;
      const properties = source.getClass(name).getInstanceProperties();

      // init types
      const props = this.metadata[name].properties;
      Object.keys(props).forEach(p => {
        if (props[p].entity) {
          props[p].type = props[p].entity();
        }

        if (props[p].reference === ReferenceType.SCALAR) {
          // const property = classMetadata.getInstanceProperty(p);
          const property = properties.find(v => v.getName() === p);
          props[p].type = property.getType().getText();
        }
      });
    });
  }

}
