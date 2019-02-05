import { merge } from 'lodash';
import { readdirSync } from 'fs';
import Project, { ClassInstancePropertyTypes, SourceFile } from 'ts-simple-ast';

import { EntityMetadata, EntityProperty, ReferenceType } from './decorators/Entity';
import { Utils } from './Utils';
import { EntityHelper } from './EntityHelper';
import { NamingStrategy } from './naming-strategy/NamingStrategy';
import { EntityManager } from './EntityManager';
import { MikroORMOptions } from './MikroORM';
import { CacheAdapter } from './cache/CacheAdapter';
import { Logger } from './Logger';

export class MetadataStorage {

  private static readonly metadata: { [entity: string]: EntityMetadata } = {};

  private readonly namingStrategy: NamingStrategy;
  private readonly cache: CacheAdapter;

  constructor(private readonly em: EntityManager,
              private readonly options: MikroORMOptions,
              private readonly logger: Logger) {
    const NamingStrategy = this.options.namingStrategy || this.em.getDriver().getDefaultNamingStrategy();
    this.namingStrategy = new NamingStrategy();
    this.cache = new this.options.cache.adapter(this.options.cache.options);
  }

  static getMetadata(entity?: string): { [entity: string]: EntityMetadata } {
    if (entity && !MetadataStorage.metadata[entity]) {
      MetadataStorage.metadata[entity] = {} as EntityMetadata;
    }

    return MetadataStorage.metadata;
  }

  discover(): { [k: string]: EntityMetadata } {
    const startTime = Date.now();
    this.logger.debug(`ORM entity discovery started`);

    const project = new Project();
    const discovered: string[] = [];

    if (!this.options.entitiesDirsTs) {
      this.options.entitiesDirsTs = this.options.entitiesDirs;
    }

    const dirs = this.options.entitiesDirsTs.map(dir => `${this.options.baseDir}/${dir}/**/*.ts`);
    const sources = project.addExistingSourceFiles(dirs);
    this.options.entitiesDirs.forEach(dir => discovered.push(...this.discoverDirectory(sources, dir)));
    discovered.forEach(name => this.processEntity(name));
    const diff = Date.now() - startTime;
    this.logger.debug(`- entity discovery finished after ${diff} ms`);

    return MetadataStorage.metadata;
  }

  private discoverDirectory(sources: SourceFile[], basePath: string): string[] {
    const files = readdirSync(this.options.baseDir + '/' + basePath);
    this.logger.debug(`- processing ${files.length} files from directory ${basePath}`);

    const discovered = [];
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

      const meta = this.discoverFile(sources, basePath, file);

      // ignore base entities (not annotated with @Entity)
      if (meta && meta.name) {
        discovered.push(meta.name);
      }
    });

    return discovered;
  }

  private discoverFile(sources: SourceFile[], basePath: string, file: string): EntityMetadata | null {
    const name = this.getClassName(file);
    this.logger.debug(`- processing entity ${name}`);

    const path = `${this.options.baseDir}/${basePath}/${file}`;
    const target = require(path)[name]; // include the file to trigger loading of metadata
    const meta = MetadataStorage.metadata[name];
    const cache = this.cache.get(name, path);

    // skip already discovered or when properties
    if (Utils.isEntity(target.prototype) || !meta) {
      return null;
    }

    if (cache) {
      this.logger.debug(`- using cached metadata for entity ${name}`);
      merge(meta, cache);
      meta.prototype = target.prototype;

      return meta;
    }

    const source = sources.find(s => !!s.getFilePath().match(file.replace(/\.js$/, '.ts')));
    meta.path = path;
    meta.prototype = target.prototype;
    const properties = source.getClass(name).getInstanceProperties();

    if (!meta.collection && meta.name) {
      meta.collection = this.namingStrategy.classToTableName(meta.name);
    }

    this.initProperties(meta, properties);
    const copy = Object.assign({}, meta);
    delete copy.prototype;
    this.cache.set(name, copy, path);

    return meta;
  }

  private initProperties(meta: EntityMetadata, properties: ClassInstancePropertyTypes[]) {
    // init types and column names
    Object.keys(meta.properties).forEach(p => {
      const prop = meta.properties[p];

      if (prop.entity) {
        const type = prop.entity();
        prop.type = type instanceof Function ? type.name : type;
      } else {
        const old = prop.type;
        const property = properties.find(v => v.getName() === p);
        prop.type = property.getType().getText(property);

        if (prop.type === 'any' && old) {
          prop.type = old;
        }
      }

      this.applyNamingStrategy(meta, prop);
    });
  }

  private applyNamingStrategy(meta: EntityMetadata, prop: EntityProperty): void {
    if (prop.reference === ReferenceType.MANY_TO_ONE && !prop.fk) {
      prop.fk = this.namingStrategy.referenceColumnName();
    }

    if (!prop.fieldName) {
      switch (prop.reference) {
        case ReferenceType.SCALAR:
          prop.fieldName = this.namingStrategy.propertyToColumnName(prop.name);
          break;
        case ReferenceType.MANY_TO_ONE:
          prop.fieldName = this.namingStrategy.joinColumnName(prop.name);
          break;
      }

      if (prop.reference === ReferenceType.MANY_TO_MANY && prop.owner) {
        prop.fieldName = this.namingStrategy.propertyToColumnName(prop.name);
      }
    }

    if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(prop.reference)) {
      if (!prop.pivotTable && prop.reference === ReferenceType.MANY_TO_MANY && prop.owner) {
        prop.pivotTable = this.namingStrategy.joinTableName(meta.name, prop.type, prop.name);
      }

      if (!prop.inverseJoinColumn && prop.reference === ReferenceType.MANY_TO_MANY) {
        prop.inverseJoinColumn = this.namingStrategy.joinKeyColumnName(prop.type);
      }

      if (!prop.joinColumn && prop.reference === ReferenceType.ONE_TO_MANY) {
        prop.joinColumn = this.namingStrategy.joinColumnName(prop.name);
      }

      if (!prop.joinColumn && prop.reference === ReferenceType.MANY_TO_MANY) {
        prop.joinColumn = this.namingStrategy.joinKeyColumnName(meta.name);
      }

      if (!prop.referenceColumnName) {
        prop.referenceColumnName = this.namingStrategy.referenceColumnName();
      }
    }
  }

  private definePivotTableEntities(meta: EntityMetadata): void {
    Object.values(meta.properties).forEach(prop => {
      if (prop.reference === ReferenceType.MANY_TO_MANY && prop.owner && prop.pivotTable) {
        MetadataStorage.metadata[prop.pivotTable] = {
          name: prop.pivotTable,
          collection: prop.pivotTable,
          primaryKey: prop.referenceColumnName,
          properties: {
            [meta.name]: {
              name: meta.name,
              joinColumn: prop.joinColumn,
              inverseJoinColumn: prop.inverseJoinColumn,
              reference: ReferenceType.MANY_TO_ONE,
            } as EntityProperty,
            [prop.type]: {
              name: prop.type,
              joinColumn: prop.inverseJoinColumn,
              inverseJoinColumn: prop.joinColumn,
              reference: ReferenceType.MANY_TO_ONE,
            } as EntityProperty,
          },
        } as EntityMetadata;
      }
    });
  }

  private getClassName(file: string): string {
    const name = file.split('.')[0];
    const ret = name.replace(/-(\w)/, m => m[1].toUpperCase());

    return ret.charAt(0).toUpperCase() + ret.slice(1);
  }

  private defineBaseEntityProperties(meta: EntityMetadata): void {
    const base = MetadataStorage.metadata[meta.extends];

    if (!meta.extends || !base) {
      return;
    }

    meta.properties = { ...base.properties, ...meta.properties };
    const primary = Object.values(base.properties).find(p => p.primary);

    if (primary && !meta.primaryKey) {
      meta.primaryKey = primary.name;
    }
  }

  private processEntity(name: string): void {
    const meta = MetadataStorage.metadata[name];
    this.defineBaseEntityProperties(meta);
    this.em.validator.validateEntityDefinition(MetadataStorage.metadata, meta.name);
    EntityHelper.decorate(meta, this.em);

    if (this.em.getDriver().usesPivotTable()) {
      this.definePivotTableEntities(meta);
    }
  }

}
