import { basename, extname, isAbsolute } from 'path';
import globby from 'globby';
import c from 'ansi-colors';

import type { AnyEntity, Constructor, Dictionary, EntityClass, EntityClassGroup, EntityProperty } from '../typings';
import { EntityMetadata } from '../typings';
import { Utils } from '../utils/Utils';
import type { Configuration } from '../utils/Configuration';
import { MetadataValidator } from './MetadataValidator';
import { MetadataStorage } from './MetadataStorage';
import { EntitySchema } from './EntitySchema';
import { Cascade, ReferenceType } from '../enums';
import { MetadataError } from '../errors';
import type { Platform } from '../platforms';
import { ArrayType, BlobType, EnumArrayType, JsonType, Type } from '../types';

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
    this.logger.log('discovery', `ORM entity discovery started, using ${c.cyan(this.metadataProvider.constructor.name)}`);
    await this.findEntities(preferTsNode);
    await this.processDiscoveredEntities(this.discovered);

    const diff = Date.now() - startTime;
    this.logger.log('discovery', `- entity discovery finished, found ${c.green('' + this.discovered.length)} entities, took ${c.green(`${diff} ms`)}`);

    const discovered = new MetadataStorage();

    this.discovered
      .filter(meta => meta.name)
      .forEach(meta => discovered.set(meta.name!, meta));

    return discovered;
  }

  async processDiscoveredEntities(discovered: EntityMetadata[]): Promise<EntityMetadata[]> {
    for (const meta of discovered) {
      let i = 1;
      Object.values(meta.properties).forEach(prop => meta.propertyOrder.set(prop.name, i++));
    }

    // ignore base entities (not annotated with @Entity)
    const filtered = discovered.filter(meta => meta.name);
    filtered.forEach(meta => this.initSingleTableInheritance(meta, filtered));
    filtered.forEach(meta => this.defineBaseEntityProperties(meta));
    filtered.forEach(meta => this.metadata.set(meta.className, EntitySchema.fromMetadata(meta).init().meta));
    filtered.forEach(meta => this.initAutoincrement(meta));
    filtered.forEach(meta => Object.values(meta.properties).forEach(prop => this.initEmbeddables(meta, prop)));
    filtered.forEach(meta => Object.values(meta.properties).forEach(prop => this.initFactoryField(prop)));
    filtered.forEach(meta => Object.values(meta.properties).forEach(prop => this.initFieldName(prop)));
    filtered.forEach(meta => Object.values(meta.properties).forEach(prop => this.initVersionProperty(meta, prop)));
    filtered.forEach(meta => Object.values(meta.properties).forEach(prop => this.initCustomType(meta, prop)));

    for (const meta of filtered) {
      for (const prop of Object.values(meta.properties)) {
        await this.initColumnType(prop, meta.path);
      }
    }

    filtered.forEach(meta => Object.values(meta.properties).forEach(prop => this.initIndexes(prop)));
    filtered.forEach(meta => this.autoWireBidirectionalProperties(meta));

    for (const meta of filtered) {
      discovered.push(...(await this.processEntity(meta)));
    }

    discovered.forEach(meta => meta.sync(true));

    return discovered.map(meta => this.metadata.get(meta.className));
  }

  private async findEntities(preferTsNode: boolean): Promise<EntityMetadata[]> {
    this.discovered.length = 0;

    const key = (preferTsNode && this.config.get('tsNode', Utils.detectTsNode()) && this.config.get('entitiesTs').length > 0) ? 'entitiesTs' : 'entities';
    const paths = this.config.get(key).filter(item => Utils.isString(item)) as string[];
    const refs = this.config.get(key).filter(item => !Utils.isString(item)) as Constructor<AnyEntity>[];

    if (this.config.get('discovery').requireEntitiesArray && paths.length > 0) {
      throw new Error(`[requireEntitiesArray] Explicit list of entities is required, please use the 'entities' option.`);
    }

    await this.discoverDirectories(paths);
    await this.discoverReferences(refs);
    this.validator.validateDiscovered(this.discovered, this.config.get('discovery').warnWhenNoEntities!);

    return this.discovered;
  }

  private async discoverDirectories(paths: string[]): Promise<void> {
    if (paths.length === 0) {
      return;
    }

    paths = paths.map(path => Utils.normalizePath(path));
    const files = await globby(paths, { cwd: Utils.normalizePath(this.config.get('baseDir')) });
    this.logger.log('discovery', `- processing ${c.cyan('' + files.length)} files`);
    const found: [Constructor<AnyEntity>, string][] = [];

    for (const filepath of files) {
      const filename = basename(filepath);

      if (
        !filename.match(/\.[jt]s$/) ||
        filename.endsWith('.js.map') ||
        filename.endsWith('.d.ts') ||
        filename.startsWith('.') ||
        filename.match(/index\.[jt]s$/)
      ) {
        this.logger.log('discovery', `- ignoring file ${filename}`);
        continue;
      }

      const name = this.namingStrategy.getClassName(filename);
      const path = Utils.normalizePath(...(isAbsolute(filepath) ? [filepath] : [this.config.get('baseDir'), filepath]));
      const targets = await this.getEntityClassOrSchema(path, name);

      for (const target of targets) {
        if (!(target instanceof Function) && !(target instanceof EntitySchema)) {
          this.logger.log('discovery', `- ignoring file ${filename}`);
          continue;
        }

        this.metadata.set(name, Utils.copy(MetadataStorage.getMetadata(name, path)));
        const entity = this.prepare(target) as Constructor<AnyEntity>;
        const schema = this.getSchema(entity);
        const meta = schema.init().meta;
        this.metadata.set(meta.className, meta);

        found.push([entity, path]);
      }
    }

    for (const [entity, path] of found) {
      await this.discoverEntity(entity, path);
    }
  }

  async discoverReferences(refs: Constructor<AnyEntity>[]): Promise<EntityMetadata[]> {
    const found: Constructor<AnyEntity>[] = [];

    for (const entity of refs) {
      const schema = this.getSchema(this.prepare(entity) as Constructor<AnyEntity>);
      const meta = schema.init().meta;
      this.metadata.set(meta.className, meta);
      found.push(entity);
    }

    for (const entity of found) {
      await this.discoverEntity(entity);
    }

    // discover parents (base entities) automatically
    for (const meta of Object.values(this.metadata.getAll())) {
      if (!meta.class) {
        continue;
      }

      const parent = Object.getPrototypeOf(meta.class);

      if (parent.name !== '' && !this.metadata.has(parent.name)) {
        await this.discoverReferences([parent]);
      }
    }

    return this.discovered.filter(meta => found.find(m => m.name === meta.className));
  }

  private prepare<T extends AnyEntity<T>>(entity: EntityClass<T> | EntityClassGroup<T> | EntitySchema<T>): EntityClass<T> | EntitySchema<T> {
    if ('schema' in entity && entity.schema instanceof EntitySchema) {
      return entity.schema;
    }

    // save path to entity from schema
    if ('entity' in entity && 'schema' in entity) {
      const meta = this.metadata.get(entity.entity.name, true);
      meta.path = (entity.schema as EntityMetadata).path;

      return entity.entity;
    }

    return entity;
  }

  private getSchema<T extends AnyEntity<T>>(entity: Constructor<T> | EntitySchema<T>): EntitySchema<T> {
    if (entity instanceof EntitySchema) {
      return entity;
    }

    const path = (entity as Dictionary).__path;

    if (path) {
      const meta = Utils.copy(MetadataStorage.getMetadata(entity.name, path));
      meta.path = Utils.relativePath(path, this.config.get('baseDir'));
      this.metadata.set(entity.name, meta);
    }

    const exists = this.metadata.has(entity.name);
    const meta = this.metadata.get<T>(entity.name, true);
    meta.abstract = meta.abstract ?? !(exists && meta.name);
    const schema = EntitySchema.fromMetadata<T>(meta);
    schema.setClass(entity);
    schema.meta.useCache = this.metadataProvider.useCache();

    return schema;
  }

  private async discoverEntity<T extends AnyEntity<T>>(entity: EntityClass<T> | EntityClassGroup<T> | EntitySchema<T>, path?: string): Promise<void> {
    entity = this.prepare(entity);
    this.logger.log('discovery', `- processing entity ${c.cyan((entity as EntityClass<T>).name)}${c.grey(path ? ` (${path})` : '')}`);
    const schema = this.getSchema(entity as Constructor<T>);
    const meta = schema.init().meta;
    const root = Utils.getRootEntity(this.metadata, meta);
    this.metadata.set(meta.className, meta);
    schema.meta.path = Utils.relativePath(path || meta.path, this.config.get('baseDir'));
    const cache = meta.useCache && meta.path && await this.cache.get(meta.className + extname(meta.path));

    if (cache) {
      this.logger.log('discovery', `- using cached metadata for entity ${c.cyan(meta.className)}`);
      this.metadataProvider.loadFromCache(meta, cache);
      meta.root = root;
      this.discovered.push(meta);

      return;
    }

    if (!(entity instanceof EntitySchema)) {
      await this.metadataProvider.loadEntityMetadata(meta, meta.className);
    }

    if (!meta.collection && meta.name) {
      const entityName = root.discriminatorColumn ? root.name : meta.name;
      meta.collection = this.namingStrategy.classToTableName(entityName!);
    }

    delete (meta as any).root; // to allow caching (as root can contain cycles)
    await this.saveToCache(meta);
    meta.root = root;
    this.discovered.push(meta);
  }

  private async saveToCache<T extends AnyEntity<T>>(meta: EntityMetadata): Promise<void> {
    if (!meta.useCache) {
      return;
    }

    const copy = Object.assign({}, meta);
    delete copy.prototype;

    // base entity without properties might not have path, but nothing to cache there
    if (meta.path) {
      await this.cache.set(meta.className + extname(meta.path), copy, meta.path);
    }
  }

  private applyNamingStrategy(meta: EntityMetadata, prop: EntityProperty): void {
    if (!prop.fieldNames) {
      this.initFieldName(prop);
    }

    if (prop.reference === ReferenceType.MANY_TO_MANY) {
      this.initManyToManyFields(meta, prop);
    }

    if ([ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(prop.reference)) {
      this.initManyToOneFields(prop);
    }

    if (prop.reference === ReferenceType.ONE_TO_MANY) {
      this.initOneToManyFields(prop);
    }
  }

  private initFieldName(prop: EntityProperty): void {
    if (prop.fieldNames && prop.fieldNames.length > 0) {
      return;
    }

    if (prop.reference === ReferenceType.SCALAR || (prop.reference === ReferenceType.EMBEDDED && prop.object)) {
      prop.fieldNames = [this.namingStrategy.propertyToColumnName(prop.name)];
    } else if ([ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(prop.reference)) {
      prop.fieldNames = this.initManyToOneFieldName(prop, prop.name);
    } else if (prop.reference === ReferenceType.MANY_TO_MANY && prop.owner) {
      prop.fieldNames = this.initManyToManyFieldName(prop, prop.name);
    }
  }

  private initManyToOneFieldName(prop: EntityProperty, name: string): string[] {
    const meta2 = this.metadata.get(prop.type);
    const ret: string[] = [];

    for (const primaryKey of meta2.primaryKeys) {
      this.initFieldName(meta2.properties[primaryKey]);

      for (const fieldName of meta2.properties[primaryKey].fieldNames) {
        ret.push(this.namingStrategy.joinKeyColumnName(name, fieldName, meta2.compositePK));
      }
    }

    return ret;
  }

  private initManyToManyFieldName(prop: EntityProperty, name: string): string[] {
    const meta2 = this.metadata.get(prop.type);
    return meta2.primaryKeys.map(() => this.namingStrategy.propertyToColumnName(name));
  }

  private initManyToManyFields(meta: EntityMetadata, prop: EntityProperty): void {
    const meta2 = this.metadata.get(prop.type);
    Utils.defaultValue(prop, 'fixedOrder', !!prop.fixedOrderColumn);

    if (!prop.pivotTable && prop.owner && this.platform.usesPivotTable()) {
      prop.pivotTable = this.namingStrategy.joinTableName(meta.collection, meta2.collection, prop.name);
    }

    if (prop.mappedBy) {
      const prop2 = meta2.properties[prop.mappedBy];
      this.initManyToManyFields(meta2, prop2);
      prop.pivotTable = prop2.pivotTable;
      prop.fixedOrder = prop2.fixedOrder;
      prop.fixedOrderColumn = prop2.fixedOrderColumn;
      prop.joinColumns = prop2.inverseJoinColumns;
      prop.inverseJoinColumns = prop2.joinColumns;
    }

    if (!prop.referencedColumnNames) {
      prop.referencedColumnNames = Utils.flatten(meta.primaryKeys.map(primaryKey => meta.properties[primaryKey].fieldNames));
    }

    if (!prop.joinColumns) {
      prop.joinColumns = prop.referencedColumnNames.map(referencedColumnName => this.namingStrategy.joinKeyColumnName(meta.root.className, referencedColumnName, meta.compositePK));
    }

    if (!prop.inverseJoinColumns) {
      const meta2 = this.metadata.get(prop.type);
      prop.inverseJoinColumns = this.initManyToOneFieldName(prop, meta2.root.className);
    }
  }

  private initManyToOneFields(prop: EntityProperty): void {
    const meta2 = this.metadata.get(prop.type);
    const fieldNames = Utils.flatten(meta2.primaryKeys.map(primaryKey => meta2.properties[primaryKey].fieldNames));
    Utils.defaultValue(prop, 'referencedTableName', meta2.collection);

    if (!prop.joinColumns) {
      prop.joinColumns = fieldNames.map(fieldName => this.namingStrategy.joinKeyColumnName(prop.name, fieldName, fieldNames.length > 1));
    }

    if (!prop.referencedColumnNames) {
      prop.referencedColumnNames = fieldNames;
    }
  }

  private initOneToManyFields(prop: EntityProperty): void {
    const meta2 = this.metadata.get(prop.type);

    if (!prop.joinColumns) {
      prop.joinColumns = [this.namingStrategy.joinColumnName(prop.name)];
    }

    if (!prop.referencedColumnNames) {
      meta2.getPrimaryProps().forEach(pk => this.applyNamingStrategy(meta2, pk));
      prop.referencedColumnNames = Utils.flatten(meta2.getPrimaryProps().map(pk => pk.fieldNames));
    }
  }

  private async processEntity(meta: EntityMetadata): Promise<EntityMetadata[]> {
    const pks = Object.values(meta.properties).filter(prop => prop.primary);
    meta.primaryKeys = pks.map(prop => prop.name);
    meta.compositePK = pks.length > 1;
    meta.forceConstructor = this.shouldForceConstructorUsage(meta);
    this.validator.validateEntityDefinition(this.metadata, meta.name!);

    for (const prop of Object.values(meta.properties)) {
      this.applyNamingStrategy(meta, prop);
      this.initDefaultValue(prop);
      this.initVersionProperty(meta, prop);
      this.initCustomType(meta, prop);
      await this.initColumnType(prop, meta.path);
      this.initRelation(prop);
    }

    meta.serializedPrimaryKey = this.platform.getSerializedPrimaryKeyField(meta.primaryKeys[0]);
    const serializedPKProp = meta.properties[meta.serializedPrimaryKey];

    if (serializedPKProp && meta.serializedPrimaryKey !== meta.primaryKeys[0]) {
      serializedPKProp.persist = false;
    }

    const ret: EntityMetadata[] = [];

    if (this.platform.usesPivotTable()) {
      const promises = Object
        .values(meta.properties)
        .filter(prop => prop.reference === ReferenceType.MANY_TO_MANY && prop.owner && prop.pivotTable)
        .map(prop => this.definePivotTableEntity(meta, prop));
      (await Promise.all(promises)).forEach(meta => ret.push(meta));
    }

    return ret;
  }

  private initFactoryField<T>(prop: EntityProperty<T>): void {
    ['mappedBy', 'inversedBy'].forEach(type => {
      const value = prop[type];

      if (value instanceof Function) {
        const meta2 = this.metadata.get(prop.type);
        prop[type] = value(meta2.properties).name;
      }
    });
  }

  private async definePivotTableEntity(meta: EntityMetadata, prop: EntityProperty): Promise<EntityMetadata> {
    let tableName = prop.pivotTable;
    let schemaName: string | undefined;

    if (prop.pivotTable.includes('.')) {
      [schemaName, tableName] = prop.pivotTable.split('.');
    }

    const data = new EntityMetadata({
      name: prop.pivotTable,
      className: prop.pivotTable,
      collection: tableName,
      schema: schemaName,
      pivotTable: true,
    });

    if (prop.fixedOrder) {
      const primaryProp = await this.defineFixedOrderProperty(prop);
      data.properties[primaryProp.name] = primaryProp;
      data.primaryKeys = [primaryProp.name];
    } else {
      data.primaryKeys = [meta.name + '_owner', prop.type + '_inverse'];
      data.compositePK = true;
    }

    // handle self-referenced m:n with same default field names
    if (meta.name === prop.type && prop.joinColumns.every((joinColumn, idx) => joinColumn === prop.inverseJoinColumns[idx])) {
      prop.joinColumns = prop.referencedColumnNames.map(name => this.namingStrategy.joinKeyColumnName(meta.root.className + '_1', name, meta.compositePK));
      prop.inverseJoinColumns = prop.referencedColumnNames.map(name => this.namingStrategy.joinKeyColumnName(meta.root.className + '_2', name, meta.compositePK));

      if (prop.inversedBy) {
        const prop2 = this.metadata.get(prop.type).properties[prop.inversedBy];
        prop2.inverseJoinColumns = prop.joinColumns;
        prop2.joinColumns = prop.inverseJoinColumns;
      }
    }

    data.properties[meta.name + '_owner'] = await this.definePivotProperty(prop, meta.name + '_owner', meta.name!, prop.type + '_inverse', true);
    data.properties[prop.type + '_inverse'] = await this.definePivotProperty(prop, prop.type + '_inverse', prop.type, meta.name + '_owner', false);

    return this.metadata.set(prop.pivotTable, data);
  }

  private async defineFixedOrderProperty(prop: EntityProperty): Promise<EntityProperty> {
    const pk = prop.fixedOrderColumn || this.namingStrategy.referenceColumnName();
    const primaryProp = {
      name: pk,
      type: 'number',
      reference: ReferenceType.SCALAR,
      primary: true,
      autoincrement: true,
      unsigned: this.platform.supportsUnsigned(),
    } as EntityProperty;
    this.initFieldName(primaryProp);
    await this.initColumnType(primaryProp);
    prop.fixedOrderColumn = pk;

    if (prop.inversedBy) {
      const prop2 = this.metadata.get(prop.type).properties[prop.inversedBy];
      prop2.fixedOrder = true;
      prop2.fixedOrderColumn = pk;
    }

    return primaryProp;
  }

  private async definePivotProperty(prop: EntityProperty, name: string, type: string, inverse: string, owner: boolean): Promise<EntityProperty> {
    const ret = {
      name,
      type,
      reference: ReferenceType.MANY_TO_ONE,
      cascade: [Cascade.ALL],
      fixedOrder: prop.fixedOrder,
      fixedOrderColumn: prop.fixedOrderColumn,
      index: this.platform.indexForeignKeys(),
      primary: !prop.fixedOrder,
      autoincrement: false,
    } as EntityProperty;

    const meta = this.metadata.get(type);
    ret.targetMeta = meta;
    ret.joinColumns = [];
    ret.inverseJoinColumns = [];
    ret.referencedTableName = meta.collection;

    if (owner) {
      ret.owner = true;
      ret.inversedBy = inverse;
      ret.referencedColumnNames = prop.referencedColumnNames;
      ret.fieldNames = ret.joinColumns = prop.joinColumns;
      ret.inverseJoinColumns = prop.referencedColumnNames;
      meta.primaryKeys.forEach(primaryKey => {
        const prop2 = meta.properties[primaryKey];
        ret.length = prop2.length;
        ret.precision = prop2.precision;
        ret.scale = prop2.scale;
      });
    } else {
      ret.owner = false;
      ret.mappedBy = inverse;
      ret.fieldNames = ret.joinColumns = prop.inverseJoinColumns;
      ret.referencedColumnNames = [];
      ret.inverseJoinColumns = [];
      ret.referencedTableName = meta.collection;
      meta.primaryKeys.forEach(primaryKey => {
        const prop2 = meta.properties[primaryKey];
        ret.referencedColumnNames.push(...prop2.fieldNames);
        ret.inverseJoinColumns.push(...prop2.fieldNames);
        ret.length = prop2.length;
        ret.precision = prop2.precision;
        ret.scale = prop2.scale;
      });
    }

    await this.initColumnType(ret);

    return ret;
  }

  private autoWireBidirectionalProperties(meta: EntityMetadata): void {
    Object.values(meta.properties)
      .filter(prop => prop.reference !== ReferenceType.SCALAR && !prop.owner && prop.mappedBy)
      .forEach(prop => {
        const meta2 = this.metadata.get(prop.type);
        const prop2 = meta2.properties[prop.mappedBy];

        if (prop2 && !prop2.inversedBy) {
          prop2.inversedBy = prop.name;
        }
      });
  }

  private defineBaseEntityProperties(meta: EntityMetadata): number {
    const base = meta.extends && this.metadata.get(meta.extends);

    if (!base || base === meta) { // make sure we do not fall into infinite loop
      return 0;
    }

    let order = this.defineBaseEntityProperties(base);
    const old = Object.values(meta.properties).map(x => x.name);
    meta.properties = { ...base.properties, ...meta.properties };
    meta.filters = { ...base.filters, ...meta.filters };

    if (!meta.discriminatorValue) {
      Object.values(base.properties).filter(prop => !old.includes(prop.name)).forEach(prop => {
        meta.properties[prop.name] = { ...prop };
        meta.propertyOrder.set(prop.name, (order += 0.01));
      });
    }

    meta.indexes = Utils.unique([...base.indexes, ...meta.indexes]);
    meta.uniques = Utils.unique([...base.uniques, ...meta.uniques]);
    const pks = Object.values(meta.properties).filter(p => p.primary).map(p => p.name);

    if (pks.length > 0 && meta.primaryKeys.length === 0) {
      meta.primaryKeys = pks;
    }

    Object.keys(base.hooks).forEach(type => {
      meta.hooks[type] = Utils.unique([...base.hooks[type], ...(meta.hooks[type] || [])]);
    });

    if (meta.constructorParams.length === 0 && base.constructorParams.length > 0) {
      meta.constructorParams = [...base.constructorParams];
    }

    if (meta.toJsonParams.length === 0 && base.toJsonParams.length > 0) {
      meta.toJsonParams = [...base.toJsonParams];
    }

    return order;
  }

  private initEmbeddables(meta: EntityMetadata, embeddedProp: EntityProperty, visited = new WeakSet<EntityProperty>()): void {
    if (embeddedProp.reference !== ReferenceType.EMBEDDED || visited.has(embeddedProp)) {
      return;
    }

    visited.add(embeddedProp);
    const embeddable = this.discovered.find(m => m.name === embeddedProp.type);
    embeddedProp.embeddable = embeddable!.class;
    embeddedProp.embeddedProps = {};
    let order = meta.propertyOrder.get(embeddedProp.name)!;
    const getRootProperty: (prop: EntityProperty) => EntityProperty = (prop: EntityProperty) => prop.embedded ? getRootProperty(meta.properties[prop.embedded[0]]) : prop;

    for (const prop of Object.values(embeddable!.properties).filter(p => p.persist !== false)) {
      const prefix = embeddedProp.prefix === false ? '' : embeddedProp.prefix === true ? embeddedProp.name + '_' : embeddedProp.prefix;
      const name = prefix + prop.name;

      if (meta.properties[name] !== undefined && getRootProperty(meta.properties[name]).reference !== ReferenceType.EMBEDDED) {
        throw MetadataError.conflictingPropertyName(meta.className, name, embeddedProp.name);
      }

      meta.properties[name] = Utils.copy(prop);
      meta.properties[name].name = name;
      meta.properties[name].embedded = [embeddedProp.name, prop.name];
      meta.propertyOrder.set(name, (order += 0.01));
      embeddedProp.embeddedProps[prop.name] = meta.properties[name];

      if (embeddedProp.nullable) {
        meta.properties[name].nullable = true;
      }

      const isParentObject: (prop: EntityProperty) => boolean = (prop: EntityProperty) => {
        if (prop.object) {
          return true;
        }

        return prop.embedded ? isParentObject(meta.properties[prop.embedded[0]]) : false;
      };
      const rootProperty = getRootProperty(embeddedProp);

      if (isParentObject(embeddedProp)) {
        embeddedProp.object = true;
        this.initFieldName(embeddedProp);
        let path: string[] = [];
        let tmp = embeddedProp;

        while (tmp.embedded && tmp.object) {
          path.unshift(tmp.embedded![1]);
          tmp = meta.properties[tmp.embedded[0]];
        }

        if (tmp === rootProperty) {
          path.unshift(this.namingStrategy.propertyToColumnName(rootProperty.name));
        } else {
          path = [embeddedProp.fieldNames[0]];
        }

        path.push(prop.name);
        meta.properties[name].fieldNames = [path.join('.')]; // store path for ObjectHydrator
        meta.properties[name].fieldNameRaw = this.platform.getSearchJsonPropertySQL(path.join('->'), prop.type); // for querying in SQL drivers
        meta.properties[name].persist = false; // only virtual as we store the whole object
      }

      this.initEmbeddables(meta, meta.properties[name], visited);
    }
  }

  private initSingleTableInheritance(meta: EntityMetadata, metadata: EntityMetadata[]): void {
    if (meta.root !== meta && !(meta as Dictionary).__processed) {
      meta.root = metadata.find(m => m.className === meta.root.className)!;
      (meta.root as Dictionary).__processed = true;
    } else {
      delete (meta.root as Dictionary).__processed;
    }

    if (!meta.root.discriminatorColumn) {
      return;
    }

    if (!meta.root.discriminatorMap) {
      meta.root.discriminatorMap = {} as Dictionary<string>;
      const children = metadata.filter(m => m.root.className === meta.root.className && !m.abstract);
      children.forEach(m => {
        const name = m.discriminatorValue || this.namingStrategy.classToTableName(m.className);
        meta.root.discriminatorMap![name] = m.className;
      });
    }

    meta.discriminatorValue = Object.entries(meta.root.discriminatorMap!).find(([, className]) => className === meta.className)?.[0];

    if (!meta.root.properties[meta.root.discriminatorColumn]) {
      this.createDiscriminatorProperty(meta.root);
    }

    Utils.defaultValue(meta.root.properties[meta.root.discriminatorColumn], 'items', Object.keys(meta.root.discriminatorMap));
    Utils.defaultValue(meta.root.properties[meta.root.discriminatorColumn], 'index', true);

    if (meta.root === meta) {
      return;
    }

    Object.values(meta.properties).forEach(prop => {
      const exists = meta.root.properties[prop.name];
      prop = Utils.copy(prop);
      prop.nullable = true;

      if (!exists) {
        prop.inherited = true;
      }

      meta.root.addProperty(prop);
    });

    meta.collection = meta.root.collection;
    meta.root.indexes = Utils.unique([...meta.root.indexes, ...meta.indexes]);
    meta.root.uniques = Utils.unique([...meta.root.uniques, ...meta.uniques]);
  }

  private createDiscriminatorProperty(meta: EntityMetadata): void {
    meta.addProperty({
      name: meta.discriminatorColumn!,
      type: 'string',
      enum: true,
      reference: ReferenceType.SCALAR,
      userDefined: false,
    } as EntityProperty);
  }

  private initAutoincrement(meta: EntityMetadata): void {
    const pks = meta.getPrimaryProps();

    if (pks.length === 1 && this.isNumericProperty(pks[0])) {
      /* istanbul ignore next */
      pks[0].autoincrement = pks[0].autoincrement ?? true;
    }
  }

  private getDefaultVersionValue(prop: EntityProperty): string {
    if (typeof prop.defaultRaw !== 'undefined') {
      return prop.defaultRaw;
    }

    if (prop.type.toLowerCase() === 'date') {
      prop.length = prop.length ?? this.platform.getDefaultVersionLength();
      return this.platform.getCurrentTimestampSQL(prop.length);
    }

    return '1';
  }

  private initDefaultValue(prop: EntityProperty): void {
    if (prop.defaultRaw || !('default' in prop)) {
      return;
    }

    let val = prop.default;

    if (prop.customType instanceof ArrayType && Array.isArray(prop.default)) {
      val = prop.customType.convertToDatabaseValue(prop.default, this.platform)!;
    }

    prop.defaultRaw = typeof val === 'string' ? `'${val}'` : '' + val;
  }

  private initVersionProperty(meta: EntityMetadata, prop: EntityProperty): void {
    if (!prop.version) {
      return;
    }

    meta.versionProperty = prop.name;
    prop.defaultRaw = this.getDefaultVersionValue(prop);
  }

  private initCustomType(meta: EntityMetadata, prop: EntityProperty): void {
    if (!prop.customType && prop.array && prop.items) {
      prop.customType = new EnumArrayType(`${meta.className}.${prop.name}`, prop.items);
    }

    // `string[]` can be returned via ts-morph, while reflect metadata will give us just `array`
    if (!prop.customType && !prop.columnTypes && ['string[]', 'array'].includes(prop.type)) {
      prop.customType = Type.getType(ArrayType);
    }

    // for number arrays we make sure to convert the items to numbers
    if (!prop.customType && !prop.columnTypes && prop.type === 'number[]') {
      prop.customType = new ArrayType(i => +i);
    }

    if (!prop.customType && !prop.columnTypes && prop.type === 'Buffer') {
      prop.customType = Type.getType(BlobType);
    }

    if (!prop.customType && !prop.columnTypes && prop.type === 'json') {
      prop.customType = Type.getType(JsonType);
    }

    if (prop.type as unknown instanceof Type) {
      prop.customType = prop.type as unknown as Type<any>;
    }

    // eslint-disable-next-line no-prototype-builtins
    if (Type.isPrototypeOf(prop.type) && !prop.customType) {
      prop.customType = Type.getType(prop.type as unknown as Constructor<Type>);
    }

    if (prop.customType) {
      prop.columnTypes = prop.columnTypes ?? [prop.customType.getColumnType(prop, this.platform)];
    }

    if (prop.customType as unknown instanceof Type && prop.reference === ReferenceType.SCALAR) {
      prop.type = prop.customType.constructor.name;
    }
  }

  private initRelation(prop: EntityProperty): void {
    if (prop.reference === ReferenceType.SCALAR) {
      return;
    }

    const meta2 = this.discovered.find(m => m.className === prop.type)!;
    prop.referencedPKs = meta2.primaryKeys;
    prop.targetMeta = meta2;
  }

  private async initColumnType(prop: EntityProperty, path?: string): Promise<void> {
    this.initUnsigned(prop);
    this.metadata.find(prop.type)?.getPrimaryProps().map(pk => {
      prop.length = prop.length ?? pk.length;
      /* istanbul ignore next */
      prop.precision = prop.precision ?? pk.precision;
      /* istanbul ignore next */
      prop.scale = prop.scale ?? pk.scale;
    });

    if (prop.columnTypes || !this.schemaHelper) {
      return;
    }

    if (prop.enum && !prop.items && prop.type && path) {
      await this.initEnumValues(prop, path);
    }

    if (prop.reference === ReferenceType.SCALAR) {
      const mappedType = this.getMappedType(prop);
      prop.columnTypes = [mappedType.getColumnType(prop, this.platform)];
      return;
    }

    if (prop.reference === ReferenceType.EMBEDDED && prop.object && !prop.columnTypes) {
      prop.columnTypes = [this.platform.getJsonDeclarationSQL()];
      return;
    }

    const meta = this.metadata.get(prop.type);
    prop.columnTypes = [];

    for (const pk of meta.getPrimaryProps()) {
      this.initCustomType(meta, pk);
      await this.initColumnType(pk);

      const mappedType = this.getMappedType(pk);
      let columnTypes = pk.columnTypes;

      if (pk.autoincrement) {
        columnTypes = [mappedType.getColumnType({ ...pk, autoincrement: false }, this.platform)];
      }

      prop.columnTypes.push(...columnTypes);

      if (!meta.compositePK) {
        prop.customType = pk.customType;
      }
    }
  }

  private getMappedType(prop: EntityProperty): Type<unknown> {
    let t = prop.type.toLowerCase();

    if (prop.enum) {
      t = prop.items?.every(item => Utils.isString(item)) ? 'enum' : 'tinyint';
    }

    if (t === 'date') {
      t = 'datetime';
    }

    return prop.customType ?? this.platform.getMappedType(t);
  }

  private async initEnumValues(prop: EntityProperty, path: string): Promise<void> {
    path = Utils.normalizePath(this.config.get('baseDir'), path);
    const exports = await import(path);
    const target = exports[prop.type] || exports.default;

    if (target) {
      const items = Utils.extractEnumValues(target);
      Utils.defaultValue(prop, 'items', items);
    }
  }

  private initUnsigned(prop: EntityProperty): void {
    if ([ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(prop.reference)) {
      const meta2 = this.metadata.get(prop.type);

      meta2.primaryKeys.forEach(primaryKey => {
        const pk = meta2.properties[primaryKey];
        prop.unsigned = this.platform.supportsUnsigned() && this.isNumericProperty(pk);
      });

      return;
    }

    prop.unsigned = (prop.primary || prop.unsigned) && this.isNumericProperty(prop) && this.platform.supportsUnsigned();
  }

  private initIndexes(prop: EntityProperty): void {
    if ((prop.reference === ReferenceType.MANY_TO_ONE || (prop.reference === ReferenceType.ONE_TO_ONE && prop.owner)) && this.platform.indexForeignKeys()) {
      prop.index = prop.index ?? true;
    }
  }

  private isNumericProperty(prop: EntityProperty): boolean {
    return prop.type === 'number' || this.platform.isBigIntProperty(prop);
  }

  private async getEntityClassOrSchema(path: string, name: string) {
    const exports = await import(path);
    const targets = Object.values<Dictionary>(exports)
      .filter(item => item instanceof EntitySchema || (item instanceof Function && MetadataStorage.isKnownEntity(item.name)));

    // ignore class implementations that are linked from an EntitySchema
    for (const item of targets) {
      if (item instanceof EntitySchema) {
        targets.forEach((item2, idx) => {
          if (item.meta.class === item2) {
            targets.splice(idx, 1);
          }
        });
      }
    }

    if (targets.length > 0) {
      return targets;
    }

    const target = exports.default || exports[name];

    /* istanbul ignore next */
    if (!target) {
      throw MetadataError.entityNotFound(name, path.replace(this.config.get('baseDir'), '.'));
    }

    return [target];
  }

  private shouldForceConstructorUsage<T>(meta: EntityMetadata<T>) {
    const forceConstructor = this.config.get('forceEntityConstructor');

    if (Array.isArray(forceConstructor)) {
      return forceConstructor.some(cls => Utils.className(cls) === meta.className);
    }

    return meta.forceConstructor = forceConstructor;
  }

}
