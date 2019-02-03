import { readdirSync } from 'fs';
import Project, { ClassInstancePropertyTypes, SourceFile } from 'ts-simple-ast';

import { EntityMetadata, EntityProperty, ReferenceType } from './decorators/Entity';
import { Utils } from './Utils';
import { EntityHelper } from './EntityHelper';
import { NamingStrategy } from './naming-strategy/NamingStrategy';
import { EntityManager } from './EntityManager';

export class MetadataStorage {

  static metadata: { [entity: string]: EntityMetadata } = {};

  private options = this.em.options;
  private logger = this.em.options.logger as Function;

  constructor(private em: EntityManager) { }

  static getMetadata(entity?: string): { [entity: string]: EntityMetadata } {
    if (entity && !MetadataStorage.metadata[entity]) {
      MetadataStorage.metadata[entity] = {} as EntityMetadata;
    }

    return MetadataStorage.metadata;
  }

  discover(): { [k: string]: EntityMetadata } {
    const startTime = Date.now();

    if (this.options.debug) {
      this.logger(`ORM entity discovery started`);
    }

    const project = new Project();
    const sources: SourceFile[] = [];
    const discovered: string[] = [];

    if (!this.em.options.entitiesDirsTs) {
      this.em.options.entitiesDirsTs = this.em.options.entitiesDirs;
    }

    this.em.options.entitiesDirsTs.forEach(dir => {
      sources.push(...project.addExistingSourceFiles(`${this.em.options.baseDir}/${dir}/**/*.ts`));
    });
    this.options.entitiesDirs.forEach(dir => discovered.push(...this.discoverDirectory(sources, dir)));

    discovered.forEach(name => {
      const meta = MetadataStorage.metadata[name];
      this.defineBaseEntityProperties(meta);
      this.validateEntity(meta);
    });

    const diff = Date.now() - startTime;

    if (this.options.debug) {
      this.logger(`- entity discovery finished after ${diff} ms`);
    }

    return MetadataStorage.metadata;
  }

  private discoverDirectory(sources: SourceFile[], basePath: string): string[] {
    const files = readdirSync(this.options.baseDir + '/' + basePath);

    if (this.options.debug) {
      this.logger(`- processing ${files.length} files from directory ${basePath}`);
    }

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
    if (this.options.debug) {
      this.logger(`- processing entity ${file.replace(/\.[jt]s$/, '')}`);
    }

    const name = this.getClassName(file);
    const path = `${this.options.baseDir}/${basePath}/${file}`;
    const target = require(path)[name]; // include the file to trigger loading of metadata
    const meta = MetadataStorage.metadata[name];

    // skip already discovered or when properties
    if (Utils.isEntity(target.prototype) || !meta) {
      return null;
    }

    const source = sources.find(s => !!s.getFilePath().match(file.replace(/\.js$/, '.ts')));
    meta.path = path;
    meta.prototype = target.prototype;
    const properties = source.getClass(name).getInstanceProperties();
    const namingStrategy = this.em.getNamingStrategy();

    if (!meta.collection && meta.name) {
      meta.collection = namingStrategy.classToTableName(meta.name);
    }

    this.initProperties(meta, properties, namingStrategy);

    return meta;
  }

  private initProperties(meta: EntityMetadata, properties: ClassInstancePropertyTypes[], namingStrategy: NamingStrategy) {
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

      this.applyNamingStrategy(meta, prop, namingStrategy);
    });
  }

  private applyNamingStrategy(meta: EntityMetadata, prop: EntityProperty, namingStrategy: NamingStrategy): void {
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

      if (prop.reference === ReferenceType.MANY_TO_MANY && prop.owner) {
        prop.fieldName = namingStrategy.propertyToColumnName(prop.name);
      }
    }

    if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(prop.reference)) {
      if (!prop.pivotTable && prop.reference === ReferenceType.MANY_TO_MANY && prop.owner) {
        prop.pivotTable = namingStrategy.joinTableName(meta.name, prop.type, prop.name);
      }

      if (!prop.inverseJoinColumn && prop.reference === ReferenceType.MANY_TO_MANY) {
        prop.inverseJoinColumn = namingStrategy.joinKeyColumnName(prop.type);
      }

      if (!prop.joinColumn && prop.reference === ReferenceType.ONE_TO_MANY) {
        prop.joinColumn = namingStrategy.joinColumnName(prop.name);
      }

      if (!prop.joinColumn && prop.reference === ReferenceType.MANY_TO_MANY) {
        prop.joinColumn = namingStrategy.joinKeyColumnName(meta.name);
      }

      if (!prop.referenceColumnName) {
        prop.referenceColumnName = namingStrategy.referenceColumnName();
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

    Object.values(base.properties).forEach(prop => {
      meta.properties[prop.name] = prop;

      if (prop.primary) {
        meta.primaryKey = prop.name;
      }
    });
  }

  private validateEntity(meta: EntityMetadata): void {
    this.em.validator.validateEntityDefinition(MetadataStorage.metadata, meta.name);
    EntityHelper.decorate(meta, this.em);

    if (this.em.getDriver().usesPivotTable()) {
      this.definePivotTableEntities(meta);
    }
  }

}
