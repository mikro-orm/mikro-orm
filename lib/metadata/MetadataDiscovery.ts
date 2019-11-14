import { extname } from 'path';
import globby from 'globby';
import chalk from 'chalk';

import { EntityClass, EntityClassGroup, EntityMetadata, EntityProperty, AnyEntity } from '../types';
import { Configuration, Utils, ValidationError } from '../utils';
import { MetadataValidator } from './MetadataValidator';
import { MetadataStorage } from './MetadataStorage';
import { Cascade, ReferenceType } from '../entity';
import { Platform } from '../platforms';

export class MetadataDiscovery {

  private readonly namingStrategy = this.config.getNamingStrategy();
  private readonly metadataProvider = this.config.getMetadataProvider();
  private readonly cache = this.config.getCacheAdapter();
  private readonly logger = this.config.getLogger();
  private readonly schemaHelper = this.platform.getSchemaHelper();
  private readonly validator = new MetadataValidator();
  private readonly discovered: EntityMetadata[] = [];

  constructor(private readonly metadata: MetadataStorage,
              private readonly platform: Platform,
              private readonly config: Configuration) { }

  async discover(preferTsNode = true): Promise<MetadataStorage> {
    const startTime = Date.now();
    this.logger.log('discovery', `ORM entity discovery started`);
    this.discovered.length = 0;

    if (process.env.WEBPACK && this.config.get('entities').length === 0) {
      throw new Error(`Webpack bundling only supports pre-defined entities. Please use the 'entities' option. See the documentation for more information.`);
    }

    if (this.config.get('entities').length > 0) {
      await Utils.runSerial(this.config.get('entities'), entity => this.discoverEntity(entity));
    } else if (preferTsNode && (this.config.get('tsNode') || Utils.detectTsNode())) {
      await Utils.runSerial(this.config.get('entitiesDirsTs'), dir => this.discoverDirectory(dir));
    } else {
      await Utils.runSerial(this.config.get('entitiesDirs'), dir => this.discoverDirectory(dir));
    }

    this.validator.validateDiscovered(this.discovered, this.config.get('warnWhenNoEntities'));

    // ignore base entities (not annotated with @Entity)
    const filtered = this.discovered.filter(meta => meta.name);
    filtered.forEach(meta => this.defineBaseEntityProperties(meta));
    filtered.forEach(meta => Object.values(meta.properties).forEach(prop => this.initFactoryField(prop)));
    filtered.forEach(meta => Object.values(meta.properties).forEach(prop => this.initFieldName(prop)));
    filtered.forEach(meta => Object.values(meta.properties).forEach(prop => this.initUnsigned(prop)));
    filtered.forEach(meta => this.autoWireBidirectionalProperties(meta));
    filtered.forEach(meta => this.discovered.push(...this.processEntity(meta)));

    const diff = Date.now() - startTime;
    this.logger.log('discovery', `- entity discovery finished after ${chalk.green(`${diff} ms`)}`);

    const discovered = new MetadataStorage();

    this.discovered
      .filter(meta => meta.name)
      .forEach(meta => discovered.set(meta.name, meta));

    return discovered;
  }

  private async discoverDirectory(basePath: string): Promise<void> {
    const files = await globby('*', { cwd: Utils.normalizePath(this.config.get('baseDir'), basePath) });
    this.logger.log('discovery', `- processing ${files.length} files from directory ${basePath}`);

    for (const file of files) {
      if (
        !file.match(/\.[jt]s$/) ||
        file.endsWith('.js.map') ||
        file.endsWith('.d.ts') ||
        file.startsWith('.') ||
        file.match(/index\.[jt]s$/)
      ) {
        this.logger.log('discovery', `- ignoring file ${file}`);
        continue;
      }

      const name = this.namingStrategy.getClassName(file);
      const path = Utils.normalizePath(this.config.get('baseDir'), basePath, file);
      const target = this.getPrototype(path, name);
      this.metadata.set(name, MetadataStorage.getMetadata(name));
      await this.discoverEntity(target, path);
    }
  }

  private prepare<T extends AnyEntity<T>>(entity: EntityClass<T> | EntityClassGroup<T>): EntityClass<T> {
    // save path to entity from schema
    if ('entity' in entity && 'schema' in entity) {
      const schema = entity.schema;
      const meta = this.metadata.get(entity.entity.name, true);
      meta.path = schema.path;

      return entity.entity;
    }

    return entity;
  }

  private async discoverEntity<T extends AnyEntity<T>>(entity: EntityClass<T> | EntityClassGroup<T>, path?: string): Promise<void> {
    entity = this.prepare(entity);
    this.logger.log('discovery', `- processing entity ${chalk.cyan(entity.name)}`);

    const meta = this.metadata.get(entity.name, true);
    meta.prototype = entity.prototype;
    meta.className = entity.name;
    meta.path = Utils.relativePath(path || meta.path, this.config.get('baseDir'));
    meta.toJsonParams = Utils.getParamNames(entity, 'toJSON').filter(p => p !== '...args');
    const cache = meta.path && await this.cache.get(entity.name + extname(meta.path));

    if (cache) {
      this.logger.log('discovery', `- using cached metadata for entity ${chalk.cyan(entity.name)}`);
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

  private async saveToCache<T extends AnyEntity<T>>(meta: EntityMetadata, entity: EntityClass<T>): Promise<void> {
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

    if (prop.reference === ReferenceType.ONE_TO_MANY || prop.reference === ReferenceType.ONE_TO_ONE) {
      this.initOneToManyFields(meta, prop);
    }
  }

  private initFieldName(prop: EntityProperty): void {
    if (prop.fieldName) {
      return;
    }

    if (prop.reference === ReferenceType.SCALAR) {
      prop.fieldName = this.namingStrategy.propertyToColumnName(prop.name);
    } else if ([ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(prop.reference)) {
      prop.fieldName = this.initManyToOneFieldName(prop, prop.name);
    } else if (prop.reference === ReferenceType.MANY_TO_MANY && prop.owner) {
      prop.fieldName = this.namingStrategy.propertyToColumnName(prop.name);
    }
  }

  private initManyToOneFieldName(prop: EntityProperty, name: string): string {
    const meta2 = this.metadata.get(prop.type);
    const referenceColumnName = meta2.properties[meta2.primaryKey].fieldName;

    return this.namingStrategy.joinKeyColumnName(name, referenceColumnName);
  }

  private initManyToManyFields(meta: EntityMetadata, prop: EntityProperty): void {
    const meta2 = this.metadata.get(prop.type);
    Utils.defaultValue(prop, 'fixedOrder', !!prop.fixedOrderColumn);

    if (!prop.owner && !prop.inversedBy && !prop.mappedBy) {
      prop.owner = true;
    }

    if (!prop.pivotTable && prop.owner) {
      prop.pivotTable = this.namingStrategy.joinTableName(meta.collection, meta2.collection, prop.name);
    }

    if (prop.mappedBy) {
      const prop2 = meta2.properties[prop.mappedBy];
      this.initManyToManyFields(meta2, prop2);
      prop.pivotTable = prop2.pivotTable;
      prop.fixedOrder = prop2.fixedOrder;
      prop.fixedOrderColumn = prop2.fixedOrderColumn;
    }

    if (!prop.referenceColumnName) {
      prop.referenceColumnName = meta.properties[meta.primaryKey].fieldName;
    }

    if (!prop.inverseJoinColumn) {
      const meta2 = this.metadata.get(prop.type);
      prop.inverseJoinColumn = this.initManyToOneFieldName(prop, meta2.collection);
    }

    if (!prop.joinColumn) {
      prop.joinColumn = this.namingStrategy.joinKeyColumnName(meta.collection, prop.referenceColumnName);
    }
  }

  private initOneToManyFields(meta: EntityMetadata, prop: EntityProperty): void {
    if (!prop.joinColumn) {
      prop.joinColumn = this.namingStrategy.joinColumnName(prop.name);
    }

    if (prop.reference === ReferenceType.ONE_TO_ONE && !prop.inverseJoinColumn && prop.mappedBy) {
      prop.inverseJoinColumn = this.metadata.get(prop.type).properties[prop.mappedBy].fieldName;
    }

    if (!prop.referenceColumnName) {
      prop.referenceColumnName = meta.properties[meta.primaryKey].fieldName;
    }
  }

  private processEntity(meta: EntityMetadata): EntityMetadata[] {
    const pks = Object.values(meta.properties).filter(prop => prop.primary);
    meta.primaryKeys = pks.map(prop => prop.name);
    meta.compositePK = pks.length > 1;

    this.validator.validateEntityDefinition(this.metadata, meta.name);

    Object.values(meta.properties).forEach(prop => {
      this.applyNamingStrategy(meta, prop);
      this.initVersionProperty(meta, prop);
      this.initColumnType(prop, meta.path);
    });
    meta.serializedPrimaryKey = this.platform.getSerializedPrimaryKeyField(meta.primaryKey);
    const ret: EntityMetadata[] = [];

    if (this.platform.usesPivotTable()) {
      Object
        .values(meta.properties)
        .filter(prop => prop.reference === ReferenceType.MANY_TO_MANY && prop.owner && prop.pivotTable)
        .map(prop => this.definePivotTableEntity(meta, prop))
        .forEach(meta => ret.push(meta));
    }

    return ret;
  }

  private initFactoryField(prop: EntityProperty): void {
    ['mappedBy', 'inversedBy'].forEach(type => {
      const value = prop[type] as string | Function;

      if (value instanceof Function) {
        const meta2 = this.metadata.get(prop.type);
        prop[type] = value(meta2.properties as any).name;
      }
    });
  }

  private definePivotTableEntity(meta: EntityMetadata, prop: EntityProperty): EntityMetadata {
    const data = {
      name: prop.pivotTable,
      collection: prop.pivotTable,
      pivotTable: true,
      properties: {} as Record<string, EntityProperty>,
    } as EntityMetadata;

    if (prop.fixedOrder) {
      const primaryProp = this.defineFixedOrderProperty(prop);
      data.properties[primaryProp.name] = primaryProp;
      data.primaryKey = primaryProp.name;
    } else {
      data.primaryKeys = [meta.name + '_owner', prop.type + '_inverse'];
      data.compositePK = true;
    }

    // handle self-referenced m:n with same default field names
    if (meta.name === prop.type && prop.joinColumn === prop.inverseJoinColumn) {
      prop.joinColumn = this.namingStrategy.joinKeyColumnName(meta.collection + '_1', prop.referenceColumnName);
      prop.inverseJoinColumn = this.namingStrategy.joinKeyColumnName(meta.collection + '_2', prop.referenceColumnName);

      if (prop.inversedBy) {
        const prop2 = this.metadata.get(prop.type).properties[prop.inversedBy];
        prop2.inverseJoinColumn = prop.joinColumn;
        prop2.joinColumn = prop.inverseJoinColumn;
      }
    }

    data.properties[meta.name + '_owner'] = this.definePivotProperty(prop, meta.name + '_owner', meta.name, prop.type + '_inverse', true);
    data.properties[prop.type + '_inverse'] = this.definePivotProperty(prop, prop.type + '_inverse', prop.type, meta.name + '_owner', false);

    return this.metadata.set(prop.pivotTable, data);
  }

  private defineFixedOrderProperty(prop: EntityProperty): EntityProperty {
    const pk = prop.fixedOrderColumn || this.namingStrategy.referenceColumnName();
    const primaryProp = {
      name: pk,
      type: 'number',
      reference: ReferenceType.SCALAR,
      primary: true,
      unsigned: true,
    } as EntityProperty;
    this.initFieldName(primaryProp);
    this.initColumnType(primaryProp);
    this.initUnsigned(primaryProp);
    prop.fixedOrderColumn = pk;

    if (prop.inversedBy) {
      const prop2 = this.metadata.get(prop.type).properties[prop.inversedBy];
      prop2.fixedOrder = true;
      prop2.fixedOrderColumn = pk;
    }

    return primaryProp;
  }

  private definePivotProperty(prop: EntityProperty, name: string, type: string, inverse: string, owner: boolean): EntityProperty {
    const ret = {
      name,
      type,
      reference: ReferenceType.MANY_TO_ONE,
      cascade: [Cascade.ALL],
      fixedOrder: prop.fixedOrder,
      fixedOrderColumn: prop.fixedOrderColumn,
    } as EntityProperty;

    if (owner) {
      ret.owner = true;
      ret.inversedBy = inverse;
      ret.referenceColumnName = prop.referenceColumnName;
      ret.fieldName = ret.joinColumn = prop.joinColumn;
      ret.inverseJoinColumn = prop.referenceColumnName;
    } else {
      const meta = this.metadata.get(type);
      const prop2 = meta.properties[meta.primaryKey];
      ret.owner = false;
      ret.mappedBy = inverse;
      ret.referenceColumnName = prop2.fieldName;
      ret.fieldName = ret.joinColumn = prop.inverseJoinColumn;
      ret.inverseJoinColumn = prop2.fieldName;
    }

    this.initColumnType(ret);
    this.initUnsigned(ret);

    return ret;
  }

  private autoWireBidirectionalProperties(meta: EntityMetadata): void {
    Object.values(meta.properties)
      .filter(prop => prop.reference !== ReferenceType.SCALAR && !prop.owner && prop.mappedBy)
      .forEach(prop => {
        const meta2 = this.metadata.get(prop.type);
        const prop2 = meta2.properties[prop.mappedBy];

        if (!prop2.inversedBy) {
          prop2.inversedBy = prop.name;
        }
      });
  }

  private defineBaseEntityProperties(meta: EntityMetadata): void {
    const base = this.metadata.get(meta.extends);

    if (!meta.extends || !base) {
      return;
    }

    meta.properties = { ...base.properties, ...meta.properties };
    const primary = Object.values(meta.properties).find(p => p.primary);

    if (primary && !meta.primaryKey) {
      meta.primaryKey = primary.name;
    }

    Object.keys(base.hooks || {}).forEach(type => {
      meta.hooks[type] = meta.hooks[type] || [];
      meta.hooks[type].unshift(...base.hooks[type]);
    });
  }

  private getDefaultVersionValue(prop: EntityProperty): any {
    if (typeof prop.default !== 'undefined') {
      return prop.default;
    }

    if (prop.type.toLowerCase() === 'date') {
      prop.length = typeof prop.length === 'undefined' ? 3 : prop.length;
      return this.platform.getCurrentTimestampSQL(prop.length);
    }

    return 1;
  }

  private initVersionProperty(meta: EntityMetadata, prop: EntityProperty): void {
    if (!prop.version) {
      return;
    }

    meta.versionProperty = prop.name;
    prop.default = this.getDefaultVersionValue(prop);
  }

  private initColumnType(prop: EntityProperty, path?: string): void {
    if (prop.columnType || !this.schemaHelper) {
      return;
    }

    if (prop.enum && prop.type && path) {
      return this.initEnumValues(prop, path);
    }

    if (prop.reference === ReferenceType.SCALAR) {
      prop.columnType = this.schemaHelper.getTypeDefinition(prop);
      return;
    }

    const meta = this.metadata.get(prop.type);
    prop.columnType = this.schemaHelper.getTypeDefinition(meta.properties[meta.primaryKey]);
  }

  private initEnumValues(prop: EntityProperty, path: string): void {
    path = Utils.normalizePath(this.config.get('baseDir'), path);
    const target = this.getPrototype(path, prop.type, false);

    if (target) {
      const keys = Object.keys(target);
      const items = Object.values<string>(target).filter(val => !keys.includes(val));
      Utils.defaultValue(prop, 'items', items);
    }

    prop.columnType = this.schemaHelper!.getTypeDefinition(prop);
  }

  private initUnsigned(prop: EntityProperty): void {
    if (prop.reference === ReferenceType.MANY_TO_ONE || prop.reference === ReferenceType.ONE_TO_ONE) {
      const meta2 = this.metadata.get(prop.type);
      const pk = meta2.properties[meta2.primaryKey];
      prop.unsigned = pk.type === 'number';
      prop.referenceColumnName = pk.fieldName;
      prop.referencedTableName = meta2.collection;

      return;
    }

    prop.unsigned = (prop.primary || prop.unsigned) && prop.type === 'number';
  }

  private getPrototype(path: string, name: string, validate = true) {
    const target = require(path)[name];

    if (!target && validate) {
      throw ValidationError.entityNotFound(name, path.replace(this.config.get('baseDir'), '.'));
    }

    return target;
  }

}
