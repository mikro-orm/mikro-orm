import { readdirSync } from 'fs';
import { join } from 'path';
import Project, { ClassInstancePropertyTypes, SourceFile } from 'ts-morph';

import { EntityMetadata, EntityProperty, ReferenceType } from '../decorators/Entity';
import { Utils } from '../utils/Utils';
import { EntityHelper } from '../utils/EntityHelper';
import { NamingStrategy } from '..';
import { EntityManager } from '../EntityManager';
import { MikroORMOptions } from '../MikroORM';
import { CacheAdapter } from '../cache/CacheAdapter';
import { Logger } from '../utils/Logger';
import { MetadataValidator } from './MetadataValidator';

export class MetadataStorage {

  private static readonly metadata: { [entity: string]: EntityMetadata } = {};

  private readonly namingStrategy: NamingStrategy;
  private readonly cache: CacheAdapter;
  private readonly validator = new MetadataValidator();

  constructor(private readonly em: EntityManager,
              private readonly options: MikroORMOptions,
              private readonly logger: Logger) {
    const NamingStrategy = this.options.namingStrategy || this.em.getDriver().getConfig().namingStrategy;
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

    const dirs = this.options.entitiesDirsTs.map(dir => join(this.options.baseDir, dir, '**', '*.ts'));
    const sources = project.addExistingSourceFiles(dirs);
    this.options.entitiesDirs.forEach(dir => discovered.push(...this.discoverDirectory(sources, dir)));
    discovered.forEach(name => this.processEntity(name));
    const diff = Date.now() - startTime;
    this.logger.debug(`- entity discovery finished after ${diff} ms`);

    return MetadataStorage.metadata;
  }

  private discoverDirectory(sources: SourceFile[], basePath: string): string[] {
    const files = readdirSync(join(this.options.baseDir, basePath));
    this.logger.debug(`- processing ${files.length} files from directory ${basePath}`);

    const discovered: string[] = [];
    files.forEach(file => {
      if (
        !file.match(/\.[jt]s$/) ||
        file.endsWith('.js.map') ||
        file.endsWith('.d.ts') ||
        file.startsWith('.') ||
        file.match(/index\.[jt]s$/)
      ) {
        this.logger.debug(`- ignoring file ${file}`);
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
      Utils.merge(meta, cache);
      meta.prototype = target.prototype;

      return meta;
    }

    const source = sources.find(s => !!s.getFilePath().match(file.replace(/\.js$/, '.ts')));
    meta.path = path;
    meta.prototype = target.prototype;
    const properties = source!.getClass(name)!.getInstanceProperties();

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
    Object.values(meta.properties).forEach(prop => {
      if (prop.entity) {
        prop.type = Utils.className(prop.entity());
      } else {
        const old = prop.type;
        const property = properties.find(v => v.getName() === prop.name);
        prop.type = property!.getType().getText(property);

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
      if (prop.reference === ReferenceType.SCALAR) {
        prop.fieldName = this.namingStrategy.propertyToColumnName(prop.name);
      } else if (prop.reference === ReferenceType.MANY_TO_ONE) {
        prop.fieldName = this.namingStrategy.joinColumnName(prop.name);
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
    this.validator.validateEntityDefinition(MetadataStorage.metadata, meta.name);
    EntityHelper.decorate(meta, this.em);

    if (this.em.getDriver().getConfig().usesPivotTable) {
      this.definePivotTableEntities(meta);
    }
  }

}
