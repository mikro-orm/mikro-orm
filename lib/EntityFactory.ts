import { readdirSync } from 'fs';
import Project, { SourceFile } from 'ts-simple-ast';

import { getMetadataStorage, MikroORMOptions } from './MikroORM';
import { Collection } from './Collection';
import { EntityManager } from './EntityManager';
import { IPrimaryKey } from './decorators/PrimaryKey';
import { EntityMetadata, EntityProperty, IEntity, ReferenceType } from './decorators/Entity';
import { Utils } from './Utils';
import { NamingStrategy } from './naming-strategy/NamingStrategy';

export const SCALAR_TYPES = ['string', 'number', 'boolean', 'Date'];

export class EntityFactory {

  private metadata = getMetadataStorage();
  private options: MikroORMOptions = this.em.options;
  private logger = this.em.options.logger as Function;

  constructor(private em: EntityManager) {
    this.loadMetadata();
  }

  getMetadata(): { [entity: string]: EntityMetadata } {
    return this.metadata;
  }

  create<T extends IEntity>(entityName: string, data: any, initialized = true): T {
    const meta = this.metadata[entityName];
    const exclude = [];
    let entity: T;

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

    entity.setEntityManager(this.em);
    this.initEntity(entity, meta.properties, data, exclude);

    if (initialized) {
      delete entity['_initialized'];
    } else {
      entity['_initialized'] = initialized;
    }

    return entity;
  }

  createReference<T extends IEntity>(entityName: string, id: IPrimaryKey): T {
    if (this.em.getIdentity(entityName, id)) {
      return this.em.getIdentity<T>(entityName, id);
    }

    return this.create<T>(entityName, { id }, false);
  }

  private initEntity<T extends IEntity>(entity: T, properties: any, data: any, exclude: string[]): void {
    // process base entity properties first
    ['_id', 'id'].forEach(k => {
      if (data[k]) {
        entity[k] = data[k];
      }
    });

    // then process user defined properties (ignore not defined keys in `data`)
    Object.keys(properties).forEach(p => {
      if (exclude.includes(p)) {
        return;
      }

      const prop = properties[p] as EntityProperty;

      if (prop.reference === ReferenceType.ONE_TO_MANY && !data[p]) {
        return entity[p] = new Collection<T>(entity, null, false);
      }

      if (prop.reference === ReferenceType.MANY_TO_MANY) {
        if (prop.owner && Array.isArray(data[p])) {
          const driver = this.em.getDriver();
          const items = data[p].map((id: IPrimaryKey) => this.createReference(prop.type, driver.normalizePrimaryKey(id)));
          return entity[p] = new Collection<T>(entity, items, false);
        } else if (!entity[p]) {
          const items = prop.owner && !this.em.getDriver().usesPivotTable() ? [] : null;
          return entity[p] = new Collection<T>(entity, items, false);
        }
      }

      if (prop.reference === ReferenceType.MANY_TO_ONE) {
        if (data[p] && !Utils.isEntity(data[p])) {
          const id = this.em.getDriver().normalizePrimaryKey(data[p]);
          entity[p] = this.createReference(prop.type, id);
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
  private extractConstructorParams<T extends IEntity>(meta: EntityMetadata, data: any): any[] {
    return meta.constructorParams.map((k: string) => {
      if (meta.properties[k].reference === ReferenceType.MANY_TO_ONE && data[k]) {
        return this.em.getReference<T>(meta.properties[k].type, data[k]);
      }

      return data[k];
    });
  }

  private loadMetadata(): any {
    const startTime = Date.now();

    if (this.options.debug) {
      this.logger(`ORM entity discovery started`);
    }

    const project = new Project();
    const sources: SourceFile[] = [];

    if (!this.em.options.entitiesDirsTs) {
      this.em.options.entitiesDirsTs = this.em.options.entitiesDirs;
    }

    this.em.options.entitiesDirsTs.forEach(dir => {
      sources.push(...project.addExistingSourceFiles(`${this.em.options.baseDir}/${dir}/**/*.ts`));
    });

    this.options.entitiesDirs.forEach(dir => this.discover(sources, dir));
    const diff = Date.now() - startTime;

    if (this.options.debug) {
      this.logger(`- entity discovery finished after ${diff} ms`);
    }
  }

  private discover(sources: SourceFile[], basePath: string) {
    const files = readdirSync(this.options.baseDir + '/' + basePath);

    if (this.options.debug) {
      this.logger(`- processing ${files.length} files from directory ${basePath}`);
    }

    files.forEach(file => {
      if (
        !file.match(/\.[jt]s$/) ||
        file.endsWith('.js.map') ||
        file.endsWith('.d.ts') ||
        file.startsWith('.') ||
        file.match(/index\.[jt]s$/)
      ) {
        return;
      }

      if (this.options.debug) {
        this.logger(`- processing entity ${file.replace(/\.[jt]s$/, '')}`);
      }

      const name = file.split('.')[0];
      const path = `${this.options.baseDir}/${basePath}/${file}`;
      require(path); // include the file to trigger loading of metadata
      const source = sources.find(s => !!s.getFilePath().match(new RegExp(name + '.ts')));
      this.metadata[name].path = path;
      const properties = source.getClass(name).getInstanceProperties();
      const namingStrategy = this.em.getNamingStrategy();

      if (!this.metadata[name].collection) {
        this.metadata[name].collection = namingStrategy.classToTableName(this.metadata[name].name);
      }

      // init types and column names
      const props = this.metadata[name].properties;
      Object.keys(props).forEach(p => {
        const property = properties.find(v => v.getName() === p);

        if (props[p].entity) {
          const type = props[p].entity();
          props[p].type = type instanceof Function ? type.name : type;
        } else {
          const old = props[p].type;

          if (props[p].reference === ReferenceType.SCALAR) {
            props[p].type = property.getType().getText();
          }

          if ([ReferenceType.SCALAR, ReferenceType.MANY_TO_ONE].includes(props[p].reference) && property.getType().getSymbol()) {
            props[p].type = property.getType().getSymbol().getName();
          }

          if (props[p].type === 'any') {
            props[p].type = old;
          }
        }

        this.applyNamingStrategy(name, props[p], namingStrategy);
      });
    });
  }

  private applyNamingStrategy(name: string, prop: EntityProperty, namingStrategy: NamingStrategy): void {
    if (prop.reference === ReferenceType.MANY_TO_ONE && !prop.fk) {
      prop.fk = this.em.getNamingStrategy().referenceColumnName();
    }

    if (!prop.fieldName) {
      switch (prop.reference) {
        case ReferenceType.SCALAR:
          prop.fieldName = namingStrategy.propertyToColumnName(prop.name);
          break;
        case ReferenceType.MANY_TO_ONE:
          prop.fieldName = namingStrategy.joinColumnName(prop.name);
          break;
      }
    }

    if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(prop.reference)) {
      if (!prop.pivotTable && prop.reference === ReferenceType.MANY_TO_MANY && prop.owner) {
        prop.pivotTable = namingStrategy.joinTableName(this.metadata[name].name, prop.type, prop.name);
      }

      if (!prop.inverseJoinColumn && prop.reference === ReferenceType.MANY_TO_MANY) {
        prop.inverseJoinColumn = namingStrategy.joinKeyColumnName(prop.type);
      }

      if (!prop.joinColumn && prop.reference === ReferenceType.ONE_TO_MANY) {
        prop.joinColumn = namingStrategy.joinColumnName(prop.name);
      }

      if (!prop.joinColumn && prop.reference === ReferenceType.MANY_TO_MANY) {
        prop.joinColumn = namingStrategy.joinKeyColumnName(this.metadata[name].name);
      }

      if (!prop.referenceColumnName) {
        prop.referenceColumnName = namingStrategy.referenceColumnName();
      }
    }
  }

}
