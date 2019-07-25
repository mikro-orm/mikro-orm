import globby from 'globby';
import { extname } from 'path';

import { EntityClass, EntityClassGroup, EntityMetadata, EntityProperty, IEntityType } from '../decorators';
import { EntityManager } from '../EntityManager';
import { Configuration, Logger, Utils, ValidationError } from '../utils';
import { MetadataValidator } from './MetadataValidator';
import { MetadataStorage } from './MetadataStorage';
import { Cascade, EntityHelper, ReferenceType } from '../entity';

export class MetadataDiscovery {

  private readonly metadata = MetadataStorage.getMetadata();
  private readonly namingStrategy = this.config.getNamingStrategy();
  private readonly metadataProvider = this.config.getMetadataProvider();
  private readonly cache = this.config.getCacheAdapter();
  private readonly platform = this.em.getDriver().getPlatform();
  private readonly validator = new MetadataValidator();
  private readonly discovered: EntityMetadata[] = [];

  constructor(private readonly em: EntityManager,
              private readonly config: Configuration,
              private readonly logger: Logger) { }

  async discover(): Promise<Record<string, EntityMetadata>> {
    const startTime = Date.now();
    this.logger.debug(`ORM entity discovery started`);
    this.discovered.length = 0;
    const tsNode = process.argv[0].endsWith('ts-node') || process.argv.slice(1).some(arg => arg.includes('ts-node'));

    if (this.config.get('entities').length > 0) {
      await Utils.runSerial(this.config.get('entities'), entity => this.discoverEntity(entity));
    } else if (tsNode) {
      await Utils.runSerial(this.config.get('entitiesDirsTs'), dir => this.discoverDirectory(dir));
    } else {
      await Utils.runSerial(this.config.get('entitiesDirs'), dir => this.discoverDirectory(dir));
    }

    // validate base entities
    this.discovered
      .filter(meta => meta.extends && !this.discovered.find(m => m.prototype.constructor.name === meta.extends))
      .forEach(meta => { throw ValidationError.fromUnknownBaseEntity(meta); });

    // ignore base entities (not annotated with @Entity)
    const filtered = this.discovered.filter(meta => meta.name);
    filtered.forEach(meta => this.defineBaseEntityProperties(meta));
    filtered.forEach(meta => this.discovered.push(...this.processEntity(meta)));

    const diff = Date.now() - startTime;
    this.logger.debug(`- entity discovery finished after ${diff} ms`);

    const discovered: Record<string, EntityMetadata> = {};
    this.discovered
      .filter(meta => meta.name)
      .forEach(meta => discovered[meta.name] = meta );

    return discovered;
  }

  private async discoverDirectory(basePath: string): Promise<void> {
    const files = await globby('*', { cwd: Utils.normalizePath(this.config.get('baseDir'), basePath) });
    this.logger.debug(`- processing ${files.length} files from directory ${basePath}`);

    for (const file of files) {
      if (
        !file.match(/\.[jt]s$/) ||
        file.endsWith('.js.map') ||
        file.endsWith('.d.ts') ||
        file.startsWith('.') ||
        file.match(/index\.[jt]s$/)
      ) {
        this.logger.debug(`- ignoring file ${file}`);
        continue;
      }

      const name = this.getClassName(file);
      const path = Utils.normalizePath(this.config.get('baseDir'), basePath, file);
      const target = require(path)[name]; // include the file to trigger loading of metadata
      await this.discoverEntity(target, path);
    }
  }

  private async discoverEntity<T extends IEntityType<T>>(entity: EntityClass<T> | EntityClassGroup<T>, path?: string): Promise<void> {
    entity = this.metadataProvider.prepare(entity);
    this.logger.debug(`- processing entity ${entity.name}`);

    const meta = MetadataStorage.getMetadata(entity.name);
    meta.prototype = entity.prototype;
    meta.path = path || meta.path;
    meta.toJsonParams = Utils.getParamNames(entity.prototype.toJSON || '').filter(p => p !== '...args');
    const cache = meta.path && await this.cache.get(entity.name + extname(meta.path));

    if (cache) {
      this.logger.debug(`- using cached metadata for entity ${entity.name}`);
      this.metadataProvider.loadFromCache(meta, cache);
      this.discovered.push(meta);

      return;
    }

    await this.metadataProvider.loadEntityMetadata(meta, entity.name);

    if (!meta.collection && meta.name) {
      meta.collection = this.namingStrategy.classToTableName(meta.name);
    }

    await this.saveToCache(meta, entity);
    this.discovered.push(meta);
  }

  private async saveToCache<T extends IEntityType<T>>(meta: EntityMetadata, entity: EntityClass<T>): Promise<void> {
    const copy = Object.assign({}, meta);
    delete copy.prototype;

    // base entity without properties might not have path, but nothing to cache there
    if (meta.path) {
      await this.cache.set(entity.name + extname(meta.path), copy, meta.path);
    }
  }

  private applyNamingStrategy(meta: EntityMetadata, prop: EntityProperty): void {
    if (!prop.fieldName) {
      this.initFieldName(prop);
    }

    if (prop.reference === ReferenceType.MANY_TO_MANY) {
      this.initManyToManyFields(meta, prop);
    }

    if (prop.reference === ReferenceType.MANY_TO_ONE) {
      const meta2 = this.metadata[prop.type];
      prop.inverseJoinColumn = meta2.properties[meta2.primaryKey].fieldName;
    }

    if (prop.reference === ReferenceType.ONE_TO_MANY || prop.reference === ReferenceType.ONE_TO_ONE) {
      this.initOneToManyFields(meta, prop);
    }
  }

  private initFieldName(prop: EntityProperty): void {
    if (prop.reference === ReferenceType.SCALAR) {
      prop.fieldName = this.namingStrategy.propertyToColumnName(prop.name);
    } else if (prop.reference === ReferenceType.MANY_TO_ONE || prop.reference === ReferenceType.ONE_TO_ONE) {
      prop.fieldName = this.initManyToOneFieldName(prop, prop.name);
    } else if (prop.reference === ReferenceType.MANY_TO_MANY && prop.owner) {
      prop.fieldName = this.namingStrategy.propertyToColumnName(prop.name);
    }
  }

  private initManyToOneFieldName(prop: EntityProperty, name: string): string {
    const meta2 = this.metadata[prop.type];
    const referenceColumnName = meta2.properties[meta2.primaryKey].fieldName;

    return this.namingStrategy.joinKeyColumnName(name, referenceColumnName);
  }

  private initManyToManyFields(meta: EntityMetadata, prop: EntityProperty): void {
    if (!prop.pivotTable && prop.owner) {
      prop.pivotTable = this.namingStrategy.joinTableName(meta.name, prop.type, prop.name);
    }

    if (!prop.referenceColumnName) {
      prop.referenceColumnName = meta.properties[meta.primaryKey].fieldName;
    }

    if (!prop.inverseJoinColumn) {
      prop.inverseJoinColumn = this.initManyToOneFieldName(prop, prop.type);
    }

    if (!prop.joinColumn) {
      prop.joinColumn = this.namingStrategy.joinKeyColumnName(meta.name, prop.referenceColumnName);
    }
  }

  private initOneToManyFields(meta: EntityMetadata, prop: EntityProperty): void {
    if (!prop.joinColumn) {
      prop.joinColumn = this.namingStrategy.joinColumnName(prop.name);
    }

    if (prop.reference === ReferenceType.ONE_TO_ONE && !prop.inverseJoinColumn && prop.mappedBy) {
      prop.inverseJoinColumn = this.metadata[prop.type].properties[prop.mappedBy].fieldName;
    }

    if (!prop.referenceColumnName) {
      prop.referenceColumnName = meta.properties[meta.primaryKey].fieldName;
    }
  }

  private processEntity(meta: EntityMetadata): EntityMetadata[] {
    this.defineBaseEntityProperties(meta);

    // BC with 1:m `fk` option
    Object.values(meta.properties)
      .filter(prop => prop.reference === ReferenceType.ONE_TO_MANY)
      .forEach(prop => Utils.renameKey(prop, 'fk', 'mappedBy'));

    this.validator.validateEntityDefinition(this.metadata, meta.name);
    Object.values(meta.properties).forEach(prop => {
      this.applyNamingStrategy(meta, prop);

      if (prop.version) {
        meta.versionProperty = prop.name;
        prop.default = this.getDefaultVersionValue(prop);
      }
    });
    meta.serializedPrimaryKey = this.platform.getSerializedPrimaryKeyField(meta.primaryKey);

    if (!Utils.isEntity(meta.prototype)) {
      EntityHelper.decorate(meta, this.em);
    }

    const ret: EntityMetadata[] = [];

    if (this.platform.usesPivotTable()) {
      Object.values(meta.properties).forEach(prop => {
        const pivotMeta = this.definePivotTableEntity(meta, prop);

        if (pivotMeta) {
          ret.push(pivotMeta);
        }
      });
    }

    return ret;
  }

  private definePivotTableEntity(meta: EntityMetadata, prop: EntityProperty): EntityMetadata | undefined {
    if (prop.reference === ReferenceType.MANY_TO_MANY && prop.owner && prop.pivotTable) {
      const pk = this.namingStrategy.referenceColumnName();
      const primaryProp = { name: pk, type: 'number', reference: ReferenceType.SCALAR, primary: true, unsigned: true } as EntityProperty;
      this.initFieldName(primaryProp);

      return this.metadata[prop.pivotTable] = {
        name: prop.pivotTable,
        collection: prop.pivotTable,
        primaryKey: pk,
        properties: {
          [pk]: primaryProp,
          [meta.name]: this.definePivotProperty(prop, meta.name, prop.type),
          [prop.type]: this.definePivotProperty(prop, prop.type, meta.name),
        },
      } as EntityMetadata;
    }
  }

  private definePivotProperty(prop: EntityProperty, name: string, inverse: string): EntityProperty {
    const ret = { name, type: name, reference: ReferenceType.MANY_TO_ONE, cascade: [Cascade.ALL] } as EntityProperty;

    if (name === prop.type) {
      const meta = this.metadata[name];
      const prop2 = meta.properties[meta.primaryKey];

      if (!prop2.fieldName) {
        this.initFieldName(prop2);
      }

      ret.owner = false;
      ret.mappedBy = inverse;
      ret.referenceColumnName = prop2.fieldName;
      ret.fieldName = ret.joinColumn = prop.inverseJoinColumn;
      ret.inverseJoinColumn = prop2.fieldName;
    } else {
      ret.owner = true;
      ret.inversedBy = inverse;
      ret.referenceColumnName = prop.referenceColumnName;
      ret.fieldName = ret.joinColumn = prop.joinColumn;
      ret.inverseJoinColumn = prop.referenceColumnName;
    }

    return ret;
  }

  private getClassName(file: string): string {
    const name = file.split('.')[0];
    const ret = name.replace(/-(\w)/, m => m[1].toUpperCase());

    return ret.charAt(0).toUpperCase() + ret.slice(1);
  }

  private defineBaseEntityProperties(meta: EntityMetadata): void {
    const base = this.metadata[meta.extends];

    if (!meta.extends || !base) {
      return;
    }

    meta.properties = { ...base.properties, ...meta.properties };
    const primary = Object.values(meta.properties).find(p => p.primary);

    if (primary && !meta.primaryKey) {
      meta.primaryKey = primary.name;
    }

    Object.keys(base.hooks).forEach(type => {
      meta.hooks[type] = meta.hooks[type] || [];
      meta.hooks[type].unshift(...base.hooks[type]);
    });
  }

  private getDefaultVersionValue(prop: EntityProperty): any {
    if (prop.default) {
      return prop.default;
    }

    if (prop.type.toLowerCase() === 'date') {
      prop.length = prop.length || 3;
      return this.platform.getCurrentTimestampSQL(prop.length);
    }

    return 1;
  }

}
