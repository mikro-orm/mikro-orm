import type {
  AnyEntity,
  ConnectionType,
  Dictionary,
  EntityKey,
  EntityMetadata,
  EntityName,
  EntityProperty,
  EntityValue,
  FilterKey,
  FilterQuery,
  PopulateOptions,
  Primary,
} from '../typings.js';
import type { EntityManager } from '../EntityManager.js';
import { QueryHelper } from '../utils/QueryHelper.js';
import { Utils } from '../utils/Utils.js';
import { ValidationError } from '../errors.js';
import type { Collection } from './Collection.js';
import {
  LoadStrategy,
  type LockMode,
  type PopulateHint,
  PopulatePath,
  type QueryOrderMap,
  ReferenceKind,
} from '../enums.js';
import { Reference, type ScalarReference } from './Reference.js';
import type { EntityField, FilterOptions, FindOptions, IDatabaseDriver } from '../drivers/IDatabaseDriver.js';
import type { MetadataStorage } from '../metadata/MetadataStorage.js';
import type { Platform } from '../platforms/Platform.js';
import { helper } from './wrap.js';
import type { LoggingOptions } from '../logging/Logger.js';
import { expandDotPaths } from './utils.js';
import { Raw } from '../utils/RawQueryFragment.js';

export type EntityLoaderOptions<Entity, Fields extends string = PopulatePath.ALL, Excludes extends string = never> = {
  where?: FilterQuery<Entity>;
  populateWhere?: PopulateHint | `${PopulateHint}`;
  fields?: readonly EntityField<Entity, Fields>[];
  exclude?: readonly EntityField<Entity, Excludes>[];
  orderBy?: QueryOrderMap<Entity> | QueryOrderMap<Entity>[];
  refresh?: boolean;
  validate?: boolean;
  lookup?: boolean;
  convertCustomTypes?: boolean;
  ignoreLazyScalarProperties?: boolean;
  filters?: FilterOptions;
  strategy?: LoadStrategy | `${LoadStrategy}`;
  lockMode?: Exclude<LockMode, LockMode.OPTIMISTIC>;
  schema?: string;
  connectionType?: ConnectionType;
  logging?: LoggingOptions;
};

export class EntityLoader {

  private readonly metadata: MetadataStorage;
  private readonly driver: IDatabaseDriver;

  constructor(private readonly em: EntityManager) {
    this.metadata = this.em.getMetadata();
    this.driver = this.em.getDriver();
  }

  /**
   * Loads specified relations in batch.
   * This will execute one query for each relation, that will populate it on all the specified entities.
   */
  async populate<Entity extends object, Fields extends string = PopulatePath.ALL>(entityName: EntityName<Entity>, entities: Entity[], populate: PopulateOptions<Entity>[] | boolean, options: EntityLoaderOptions<Entity, Fields>): Promise<void> {
    if (entities.length === 0 || Utils.isEmpty(populate)) {
      return this.setSerializationContext(entities, populate, options);
    }

    const meta = this.metadata.find(entityName)!;

    if ((entities as AnyEntity[]).some(e => !e.__helper)) {
      const entity = entities.find(e => !Utils.isEntity(e));
      throw ValidationError.notDiscoveredEntity(entity, meta, 'populate');
    }

    const references = entities.filter(e => !helper(e).isInitialized());
    const visited = (options as Dictionary).visited ??= new Set<AnyEntity>();
    options.where ??= {} as FilterQuery<Entity>;
    options.orderBy ??= {};
    options.lookup ??= true;
    options.validate ??= true;
    options.refresh ??= false;
    options.convertCustomTypes ??= true;

    if (references.length > 0) {
      await this.populateScalar(meta, references, { ...options, populateWhere: undefined } as any);
    }

    populate = this.normalizePopulate<Entity>(entityName, populate as true, options.strategy as LoadStrategy | undefined, options.lookup, options.exclude as string[]);
    const invalid = populate.find(({ field }) => !this.em.canPopulate(entityName, field));

    /* v8 ignore next */
    if (options.validate && invalid) {
      throw ValidationError.invalidPropertyName(entityName, invalid.field);
    }

    this.setSerializationContext(entities, populate, options);

    for (const entity of entities) {
      visited.add(entity);
    }

    for (const pop of populate) {
      await this.populateField<Entity>(entityName, entities, pop, options as Required<EntityLoaderOptions<Entity>>);
    }

    for (const entity of entities) {
      visited.delete(entity);
    }
  }

  normalizePopulate<Entity>(entityName: EntityName<Entity>, populate: (PopulateOptions<Entity> | boolean)[] | PopulateOptions<Entity> | boolean, strategy?: LoadStrategy, lookup = true, exclude?: string[]): PopulateOptions<Entity>[] {
    const meta = this.metadata.find(entityName)!;
    let normalized = Utils.asArray(populate).map(field => {
      return typeof field === 'boolean' || field.field === PopulatePath.ALL ? { all: !!field, field: meta.primaryKeys[0] } as PopulateOptions<Entity> : field;
    });

    if (normalized.some(p => p.all)) {
      normalized = this.lookupAllRelationships(entityName);
    }

    // convert nested `field` with dot syntax to PopulateOptions with `children` array
    expandDotPaths(meta, normalized, true);

    if (lookup && populate !== false) {
      normalized = this.lookupEagerLoadedRelationships(entityName, normalized, strategy, '', [], exclude);

      // convert nested `field` with dot syntax produced by eager relations
      expandDotPaths(meta, normalized, true);
    }

    // merge same fields
    return this.mergeNestedPopulate(normalized);
  }

  private setSerializationContext<Entity extends object, Fields extends string = PopulatePath.ALL>(entities: Entity[], populate: PopulateOptions<Entity>[] | boolean, options: EntityLoaderOptions<Entity, Fields>): void {
    for (const entity of entities) {
      helper(entity).setSerializationContext({
        populate,
        fields: options.fields,
        exclude: options.exclude,
      } as any);
    }
  }

  /**
   * Merge multiple populates for the same entity with different children. Also skips `*` fields, those can come from
   * partial loading hints (`fields`) that are used to infer the `populate` hint if missing.
   */
  private mergeNestedPopulate<Entity>(populate: PopulateOptions<Entity>[]): PopulateOptions<Entity>[] {
    const tmp = populate.reduce((ret, item) => {
      if (item.field === PopulatePath.ALL) {
        return ret;
      }

      if (!ret[item.field]) {
        ret[item.field] = item;
        return ret;
      }

      if (!ret[item.field].children && item.children) {
        ret[item.field].children = item.children;
      } else if (ret[item.field].children && item.children) {
        ret[item.field].children!.push(...item.children!);
      }

      return ret;
    }, {} as Dictionary<PopulateOptions<Entity>>);

    return Object.values(tmp).map(item => {
      if (item.children) {
        item.children = this.mergeNestedPopulate(item.children);
      }

      return item;
    });
  }

  /**
   * preload everything in one call (this will update already existing references in IM)
   */
  private async populateMany<Entity extends object>(entityName: EntityName<Entity>, entities: Entity[], populate: PopulateOptions<Entity>, options: Required<EntityLoaderOptions<Entity>>): Promise<AnyEntity[]> {
    const [field, ref] = populate.field.split(':', 2) as [EntityKey<Entity>, string | undefined];
    const meta = this.metadata.find<Entity>(entityName)!;
    const prop = meta.properties[field];

    if (prop.kind === ReferenceKind.MANY_TO_MANY && prop.owner && !this.driver.getPlatform().usesPivotTable()) {
      const filtered = entities.filter(e => !(e[prop.name] as Collection<any>)?.isInitialized());

      if (filtered.length > 0) {
        await this.populateScalar(meta, filtered, { ...options, fields: [prop.name] });
      }
    }

    if (prop.kind === ReferenceKind.SCALAR && prop.lazy) {
      const filtered = entities.filter(e => options.refresh || (prop.ref ? !(e[prop.name] as ScalarReference<any>)?.isInitialized() : e[prop.name] === undefined));

      if (options.ignoreLazyScalarProperties || filtered.length === 0) {
        return entities as AnyEntity[];
      }

      await this.populateScalar(meta, filtered, { ...options, fields: [prop.name] });

      return entities as AnyEntity[];
    }

    if (prop.kind === ReferenceKind.EMBEDDED) {
      return [];
    }

    const filtered = this.filterCollections<Entity>(entities, field, options, ref);
    const innerOrderBy = Utils.asArray(options.orderBy)
      .filter(orderBy => (Array.isArray(orderBy[prop.name]) && (orderBy[prop.name] as unknown[]).length > 0) || Utils.isObject(orderBy[prop.name]))
      .flatMap(orderBy => orderBy[prop.name]);
    const where = await this.extractChildCondition(options, prop);

    if (prop.kind === ReferenceKind.MANY_TO_MANY && this.driver.getPlatform().usesPivotTable()) {
      const pivotOrderBy = QueryHelper.mergeOrderBy<Entity>(innerOrderBy, prop.orderBy, prop.targetMeta?.orderBy);
      const res = await this.findChildrenFromPivotTable<Entity>(filtered, prop, options, pivotOrderBy, populate, !!ref);
      return Utils.flatten(res);
    }

    if (prop.polymorphic && prop.polymorphTargets) {
      return this.populatePolymorphic<Entity>(entities, prop, options, !!ref);
    }

    const { items, partial } = await this.findChildren<Entity>((options as Dictionary).filtered ?? entities, prop, populate, {
      ...options,
      where,
      orderBy: innerOrderBy!,
    }, !!(ref || prop.mapToPk));
    const customOrder = innerOrderBy.length > 0 || !!prop.orderBy || !!prop.targetMeta?.orderBy;
    this.initializeCollections<Entity>(filtered, prop, field, items, customOrder, partial);

    return items;
  }

  private async populateScalar<Entity extends object>(meta: EntityMetadata<Entity>, filtered: Entity[], options: Required<EntityLoaderOptions<Entity>>) {
    const pk = Utils.getPrimaryKeyHash(meta.primaryKeys) as FilterKey<Entity>;
    const ids = Utils.unique(filtered.map(e => Utils.getPrimaryKeyValues(e, meta, true)));
    const where = this.mergePrimaryCondition<Entity>(ids as Entity[], pk, options, meta, this.metadata, this.driver.getPlatform());
    const { filters, convertCustomTypes, lockMode, strategy, populateWhere, connectionType, logging, fields } = options;

    await this.em.find(meta.class, where as any, {
      filters, convertCustomTypes, lockMode, strategy, populateWhere, connectionType, logging,
      fields: fields as never[],
      populate: [],
    });
  }

  private async populatePolymorphic<Entity extends object>(entities: Entity[], prop: EntityProperty<Entity>, options: Required<EntityLoaderOptions<Entity>>, ref: boolean): Promise<AnyEntity[]> {
    const ownerMeta = this.metadata.get(entities[0].constructor);

    // Separate entities: those with loaded refs vs those needing FK load
    const toPopulate: Entity[] = [];
    const needsFkLoad: Entity[] = [];

    for (const entity of entities) {
      const refValue = entity[prop.name];

      if (refValue && helper(refValue).hasPrimaryKey()) {
        if (
          (ref && !options.refresh) || // :ref hint - already have reference
          (!ref && helper(refValue).__initialized && !options.refresh) // already loaded
        ) {
          continue;
        }
        toPopulate.push(entity);
      } else if (refValue == null && !helper(entity).__loadedProperties.has(prop.name)) {
        // FK columns weren't loaded (partial loading) — need to re-fetch them.
        // If the property IS in __loadedProperties, the FK was loaded and is genuinely null.
        needsFkLoad.push(entity);
      }
    }

    // Load FK columns using populateScalar pattern
    if (needsFkLoad.length > 0) {
      await this.populateScalar(ownerMeta, needsFkLoad, {
        ...options,
        fields: [...ownerMeta.primaryKeys, prop.name],
      });

      // After loading FKs, add to toPopulate if not using :ref hint
      if (!ref) {
        for (const entity of needsFkLoad) {
          const refValue = entity[prop.name] as object | undefined;
          if (refValue && helper(refValue).hasPrimaryKey()) {
            toPopulate.push(entity);
          }
        }
      }
    }

    if (toPopulate.length === 0) {
      return [];
    }

    // Group references by target class for batch loading
    const groups = new Map<string, AnyEntity[]>();
    for (const entity of toPopulate) {
      const refValue = Reference.unwrapReference(entity[prop.name] as AnyEntity);
      const discriminator = QueryHelper.findDiscriminatorValue(prop.discriminatorMap!, helper(refValue).__meta.class)!;
      const group = groups.get(discriminator) ?? [];
      group.push(refValue);
      groups.set(discriminator, group);
    }

    // Load each group concurrently - identity map handles merging with existing references
    const allItems: AnyEntity[] = [];

    await Promise.all([...groups].map(async ([discriminator, children]) => {
      const targetMeta = this.metadata.find(prop.discriminatorMap![discriminator])!;
      await this.populateScalar(targetMeta, children as any[], options);
      allItems.push(...children);
    }));

    return allItems;
  }

  private initializeCollections<Entity extends object>(filtered: Entity[], prop: EntityProperty, field: keyof Entity, children: AnyEntity[], customOrder: boolean, partial: boolean): void {
    if (prop.kind === ReferenceKind.ONE_TO_MANY) {
      this.initializeOneToMany<Entity>(filtered, children, prop, field, partial);
    }

    if (prop.kind === ReferenceKind.MANY_TO_MANY && !this.driver.getPlatform().usesPivotTable()) {
      this.initializeManyToMany<Entity>(filtered, children, prop, field, customOrder, partial);
    }
  }

  private initializeOneToMany<Entity extends object>(filtered: Entity[], children: AnyEntity[], prop: EntityProperty, field: keyof Entity, partial: boolean): void {
    const mapToPk = prop.targetMeta!.properties[prop.mappedBy].mapToPk;
    const map: Dictionary<Entity[]> = {};

    for (const entity of filtered) {
      const key = helper(entity).getSerializedPrimaryKey();
      map[key] = [];
    }

    for (const child of children) {
      const pk = child.__helper.__data[prop.mappedBy] ?? child[prop.mappedBy];

      if (pk) {
        const key = helper(mapToPk ? this.em.getReference(prop.targetMeta!.class, pk) : pk).getSerializedPrimaryKey();
        map[key]?.push(child as Entity);
      }
    }

    for (const entity of filtered) {
      const key = helper(entity).getSerializedPrimaryKey();
      (entity[field] as unknown as Collection<Entity>).hydrate(map[key], undefined, partial);
    }
  }

  private initializeManyToMany<Entity>(filtered: Entity[], children: AnyEntity[], prop: EntityProperty<Entity>, field: keyof Entity, customOrder: boolean, partial: boolean): void {
    if (prop.mappedBy) {
      for (const entity of filtered) {
        const items = children.filter(child => (child[prop.mappedBy] as Collection<AnyEntity>).contains(entity as AnyEntity, false));
        (entity[field] as Collection<AnyEntity>).hydrate(items, true, partial);
      }
    } else { // owning side of M:N without pivot table needs to be reordered
      for (const entity of filtered) {
        const order = !customOrder ? [...(entity[prop.name] as Collection<AnyEntity>).getItems(false)] : []; // copy order of references
        const items = children.filter(child => (entity[prop.name] as Collection<AnyEntity>).contains(child, false));

        if (!customOrder) {
          items.sort((a, b) => order.indexOf(a) - order.indexOf(b));
        }

        (entity[field] as Collection<AnyEntity>).hydrate(items, true, partial);
      }
    }
  }

  private async findChildren<Entity extends object>(entities: Entity[], prop: EntityProperty<Entity>, populate: PopulateOptions<Entity>, options: Required<EntityLoaderOptions<Entity>>, ref: boolean): Promise<{ items: AnyEntity[]; partial: boolean }> {
    const children = Utils.unique(this.getChildReferences<Entity>(entities, prop, options, ref));
    const meta = prop.targetMeta!;
    // When targetKey is set, use it for FK lookup instead of the PK
    let fk: string | string[] = prop.targetKey ?? Utils.getPrimaryKeyHash(meta.primaryKeys);
    let schema: string | undefined = options.schema;
    const partial = !Utils.isEmpty(prop.where) || !Utils.isEmpty(options.where);
    let polymorphicOwnerProp: EntityProperty | undefined;

    if (prop.kind === ReferenceKind.ONE_TO_MANY || (prop.kind === ReferenceKind.MANY_TO_MANY && !prop.owner)) {
      const ownerProp = meta.properties[prop.mappedBy];

      if (ownerProp.polymorphic && ownerProp.fieldNames.length >= 2) {
        const idColumns = ownerProp.fieldNames.slice(1);
        fk = idColumns.length === 1 ? idColumns[0] : idColumns;
        polymorphicOwnerProp = ownerProp;
      } else {
        fk = ownerProp.name;
      }
    }

    if (prop.kind === ReferenceKind.ONE_TO_ONE && !prop.owner && !ref) {
      children.length = 0;
      fk = meta.properties[prop.mappedBy].name;
      children.push(...this.filterByReferences(entities, prop.name, options.refresh) as AnyEntity[]);
    }

    if (children.length === 0) {
      return { items: [], partial };
    }

    if (!schema && [ReferenceKind.ONE_TO_ONE, ReferenceKind.MANY_TO_ONE].includes(prop.kind)) {
      schema = children.find(e => e.__helper!.__schema)?.__helper!.__schema;
    }

    const ids = Utils.unique(children.map(e => prop.targetKey ? e[prop.targetKey] : e.__helper.getPrimaryKey()));
    let where: FilterQuery<Entity>;

    if (polymorphicOwnerProp && Array.isArray(fk)) {
      const conditions = ids.map(id => {
        const pkValues = Object.values(id as Record<string, unknown>);
        return Object.fromEntries((fk as string[]).map((col, idx) => [col, pkValues[idx]]));
      });
      where = (conditions.length === 1 ? conditions[0] : { $or: conditions }) as FilterQuery<Entity>;
    } else {
      where = this.mergePrimaryCondition<Entity>(ids, fk as FilterKey<Entity>, options, meta, this.metadata, this.driver.getPlatform());
    }

    if (polymorphicOwnerProp) {
      const parentMeta = this.metadata.find(entities[0].constructor)!;
      const discriminatorValue = QueryHelper.findDiscriminatorValue(polymorphicOwnerProp.discriminatorMap!, parentMeta.class) ?? parentMeta.tableName;
      const discriminatorColumn = polymorphicOwnerProp.fieldNames[0];
      where = { $and: [where, { [discriminatorColumn]: discriminatorValue }] } as FilterQuery<Entity>;
    }

    const fields = this.buildFields(options.fields, prop, ref) as any;

    /* eslint-disable prefer-const */
    let {
      refresh,
      filters,
      convertCustomTypes,
      lockMode,
      strategy,
      populateWhere = 'infer',
      connectionType,
      logging,
    } = options;
    /* eslint-enable prefer-const */

    if (typeof populateWhere === 'object') {
      populateWhere = await this.extractChildCondition({ where: populateWhere } as any, prop);
    }

    if (!Utils.isEmpty(prop.where) || Raw.hasObjectFragments(prop.where)) {
      where = { $and: [where, prop.where] } as FilterQuery<Entity>;
    }

    const orderBy = QueryHelper.mergeOrderBy(options.orderBy, prop.orderBy);

    const items = await this.em.find(meta.class, where, {
      filters, convertCustomTypes, lockMode, populateWhere, logging,
      orderBy,
      populate: populate.children as never ?? populate.all ?? [],
      exclude: Array.isArray(options.exclude) ? Utils.extractChildElements(options.exclude, prop.name) as any : options.exclude,
      strategy, fields, schema, connectionType,
      // @ts-ignore not a public option, will be propagated to the populate call
      refresh: refresh && !children.every(item => options.visited.has(item)),
      // @ts-ignore not a public option, will be propagated to the populate call
      visited: options.visited,
    });

    // For targetKey relations, wire up loaded entities to parent references
    // This is needed because the references were created under alternate key,
    // but loaded entities are stored under PK, so they don't automatically merge
    if (prop.targetKey && [ReferenceKind.ONE_TO_ONE, ReferenceKind.MANY_TO_ONE].includes(prop.kind)) {
      const itemsByKey = new Map<string, AnyEntity>();
      for (const item of items) {
        itemsByKey.set('' + item[prop.targetKey], item);
      }

      for (const entity of entities) {
        const ref = entity[prop.name] as AnyEntity;
        /* v8 ignore next */
        if (!ref) {
          continue;
        }

        const keyValue = '' + (Reference.isReference(ref) ? (ref.unwrap() as Dictionary)[prop.targetKey] : (ref as Dictionary)[prop.targetKey]);
        const loadedItem = itemsByKey.get(keyValue);

        if (loadedItem) {
          entity[prop.name] = (Reference.isReference(ref) ? Reference.create(loadedItem) : loadedItem) as EntityValue<Entity>;
        }
      }
    }

    if ([ReferenceKind.ONE_TO_ONE, ReferenceKind.MANY_TO_ONE].includes(prop.kind) && items.length !== children.length) {
      const nullVal = this.em.config.get('forceUndefined') ? undefined : null;
      const itemsMap = new Set<string>();
      const childrenMap = new Set<string>();
      // Use targetKey value if set, otherwise use serialized PK
      const getKey = (e: AnyEntity) => prop.targetKey ? '' + e[prop.targetKey] : helper(e).getSerializedPrimaryKey();

      for (const item of items) {
        /* v8 ignore next */
        itemsMap.add(getKey(item));
      }

      for (const child of children) {
        childrenMap.add(getKey(child));
      }

      for (const entity of entities) {
        const ref = entity[prop.name] as AnyEntity ?? {};
        const key = helper(ref) ? getKey(ref) : undefined;

        if (key && childrenMap.has(key) && !itemsMap.has(key)) {
          entity[prop.name] = nullVal as EntityValue<Entity>;
          helper(entity).__originalEntityData![prop.name] = null;
        }
      }
    }

    for (const item of items) {
      if (ref && !helper(item).__onLoadFired) {
        helper(item).__initialized = false;
        // eslint-disable-next-line dot-notation
        this.em.getUnitOfWork()['loadedEntities'].delete(item);
      }
    }

    return { items, partial };
  }

  private mergePrimaryCondition<Entity extends object>(ids: Entity[], pk: FilterKey<Entity>, options: EntityLoaderOptions<Entity>, meta: EntityMetadata, metadata: MetadataStorage, platform: Platform): FilterQuery<Entity> {
    const cond1 = QueryHelper.processWhere<Entity>({ where: { [pk]: { $in: ids } } as FilterQuery<Entity>, entityName: meta.class, metadata, platform, convertCustomTypes: !options.convertCustomTypes });
    const where = { ...options.where } as Dictionary;
    Utils.dropUndefinedProperties(where);

    return where[pk]
      ? { $and: [cond1, where] } as FilterQuery<any>
      : { ...cond1, ...where };
  }

  private async populateField<Entity extends object>(entityName: EntityName<Entity>, entities: Entity[], populate: PopulateOptions<Entity>, options: Required<EntityLoaderOptions<Entity>>): Promise<void> {
    const field = populate.field.split(':')[0] as EntityKey<Entity>;
    const prop = this.metadata.find(entityName)!.properties[field] as EntityProperty<Entity>;

    if (prop.kind === ReferenceKind.SCALAR && !prop.lazy) {
      return;
    }

    options = { ...options, filters: QueryHelper.mergePropertyFilters(prop.filters, options.filters)! };
    const populated = await this.populateMany<Entity>(entityName, entities, populate, options);

    if (!populate.children && !populate.all) {
      return;
    }

    const children: Entity[] = [];

    for (const entity of entities) {
      const ref = entity[field] as unknown;

      if (Utils.isEntity<Entity>(ref)) {
        children.push(ref);
      } else if (Reference.isReference<Entity>(ref)) {
        children.push(ref.unwrap());
      } else if (Utils.isCollection<Entity>(ref)) {
        children.push(...ref.getItems());
      } else if (ref && prop.kind === ReferenceKind.EMBEDDED) {
        children.push(...Utils.asArray(ref as Entity));
      }
    }

    if (populated.length === 0 && !populate.children) {
      return;
    }

    const fields = this.buildFields(options.fields, prop);
    const innerOrderBy = Utils.asArray(options.orderBy)
      .filter(orderBy => Utils.isObject(orderBy[prop.name]))
      .map(orderBy => orderBy[prop.name]);
    const { refresh, filters, ignoreLazyScalarProperties, populateWhere, connectionType, logging, schema } = options;
    const exclude = Array.isArray(options.exclude) ? Utils.extractChildElements(options.exclude, prop.name) as any : options.exclude;
    const visited = (options as Dictionary).visited;

    for (const entity of entities) {
      visited.delete(entity);
    }

    const unique = Utils.unique(children);
    const filtered = unique.filter(e => !visited.has(e));

    for (const entity of entities) {
      visited.add(entity);
    }

    if (!prop.targetMeta) {
      return;
    }

    const populateChildren = async (targetMeta: EntityMetadata, items: Entity[]) => {
      await this.populate<Entity>(targetMeta.class, items, populate.children ?? populate.all as any, {
        where: await this.extractChildCondition(options, prop, false) as FilterQuery<Entity>,
        orderBy: innerOrderBy as QueryOrderMap<Entity>[],
        fields,
        exclude,
        validate: false,
        lookup: false,
        filters,
        ignoreLazyScalarProperties,
        populateWhere,
        connectionType,
        logging,
        schema,
        // @ts-ignore not a public option, will be propagated to the populate call
        refresh: refresh && !filtered.every(item => options.visited.has(item)),
        // @ts-ignore not a public option, will be propagated to the populate call
        visited: options.visited,
        // @ts-ignore not a public option
        filtered,
      });
    };

    if (prop.polymorphic && prop.polymorphTargets) {
      await Promise.all(prop.polymorphTargets.map(async targetMeta => {
        const targetChildren = unique.filter(child => helper(child).__meta.className === targetMeta.className);
        if (targetChildren.length > 0) {
          await populateChildren(targetMeta, targetChildren);
        }
      }));
    } else {
      await populateChildren(prop.targetMeta!, unique);
    }
  }

  /** @internal */
  async findChildrenFromPivotTable<Entity extends object>(filtered: Entity[], prop: EntityProperty<Entity>, options: Required<EntityLoaderOptions<Entity>>, orderBy?: QueryOrderMap<Entity>[], populate?: PopulateOptions<Entity>, pivotJoin?: boolean): Promise<AnyEntity[][]> {
    const ids = (filtered as AnyEntity[]).map(e => e.__helper!.__primaryKeys);
    const refresh = options.refresh;
    let where = await this.extractChildCondition(options, prop, true);
    const fields = this.buildFields(options.fields, prop);
    const exclude = Array.isArray(options.exclude) ? Utils.extractChildElements(options.exclude, prop.name) : options.exclude;
    const populateFilter = (options as Dictionary).populateFilter?.[prop.name];
    const options2 = { ...options, fields, exclude, populateFilter } as unknown as FindOptions<Entity, any, any, any>;
    (['limit', 'offset', 'first', 'last', 'before', 'after', 'overfetch'] as const).forEach(prop => delete options2[prop]);
    options2.populate = (populate?.children ?? []);

    if (prop.customType) {
      ids.forEach((id, idx) => ids[idx] = QueryHelper.processCustomType<Entity>(prop, id as FilterQuery<Entity>, this.driver.getPlatform()) as Primary<Entity>[]);
    }

    if (!Utils.isEmpty(prop.where)) {
      where = { $and: [where, prop.where] } as FilterQuery<Entity>;
    }

    const map = await this.driver.loadFromPivotTable<any, any>(prop, ids, where, orderBy, this.em.getTransactionContext(), options2, pivotJoin);
    const children: AnyEntity[][] = [];

    for (const entity of (filtered as AnyEntity[])) {
      const items = map[entity.__helper!.getSerializedPrimaryKey()].map(item => {
        if (pivotJoin) {
          return this.em.getReference(prop.targetMeta!.class, item, {
            convertCustomTypes: true,
            schema: options.schema ?? this.em.config.get('schema'),
          });
        }

        const entity = this.em.getEntityFactory().create(prop.targetMeta!.class, item, {
          refresh,
          merge: true,
          convertCustomTypes: true,
          schema: options.schema ?? this.em.config.get('schema'),
        });
        return this.em.getUnitOfWork().register(entity as AnyEntity, item, { refresh, loaded: true });
      });
      (entity[prop.name] as unknown as Collection<AnyEntity>).hydrate(items, true);
      children.push(items);
    }

    return children;
  }

  private async extractChildCondition<Entity>(options: Required<EntityLoaderOptions<Entity>>, prop: EntityProperty<Entity>, filters = false) {
    const where = options.where as Dictionary;
    const subCond = Utils.isPlainObject(where[prop.name]) ? where[prop.name] : {};
    const meta2 = prop.targetMeta!;
    const pk = Utils.getPrimaryKeyHash(meta2.primaryKeys);

    ['$and', '$or'].forEach(op => {
      if (where[op]) {
        const child = where[op]
          .map((cond: Dictionary) => cond[prop.name])
          .filter((sub: unknown) => sub != null && !(Utils.isPlainObject(sub) && Utils.getObjectQueryKeys(sub).every(key => Utils.isOperator(key, false))))
          .map((cond: Dictionary) => {
            if (Utils.isPrimaryKey(cond)) {
              return { [pk]: cond };
            }

            return cond;
          });

        if (child.length > 0) {
          subCond[op] = child;
        }
      }
    });

    const operators = Object.keys(subCond).filter(key => Utils.isOperator(key, false));

    if (operators.length > 0) {
      operators.forEach(op => {
        subCond[pk] ??= {};
        subCond[pk][op] = subCond[op];
        delete subCond[op];
      });
    }

    if (filters) {
      return this.em.applyFilters(meta2.class, subCond, options.filters, 'read', options);
    }

    return subCond;
  }

  private buildFields<Entity>(fields: readonly EntityField<Entity>[] = [], prop: EntityProperty<Entity>, ref?: boolean): readonly EntityField<Entity>[] | undefined {
    if (ref) {
      fields = prop.targetMeta!.primaryKeys.map(targetPkName => `${prop.name}.${targetPkName}`) as EntityField<Entity>[];
    }

    const ret = fields.reduce((ret, f) => {
      if (Utils.isPlainObject(f)) {
        Utils.keys(f)
          .filter(ff => ff === prop.name)
          .forEach(ff => ret.push(...f[ff] as EntityField<Entity>[]));
      } else if (f.toString().includes('.')) {
        const parts = f.toString().split('.');
        const propName = parts.shift();
        const childPropName = parts.join('.') as EntityField<Entity>;

        /* v8 ignore next */
        if (propName === prop.name) {
          ret.push(childPropName);
        }
      }

      return ret;
    }, [] as EntityField<Entity>[]);

    // we need to automatically select the FKs too, e.g. for 1:m relations to be able to wire them with the items
    if (prop.kind === ReferenceKind.ONE_TO_MANY || prop.kind === ReferenceKind.MANY_TO_MANY) {
      const owner = prop.targetMeta!.properties[prop.mappedBy] as EntityProperty<Entity>;

      // when the owning FK is lazy, we need to explicitly select it even without user-provided fields,
      // otherwise the driver will exclude it and we won't be able to map children to their parent collections
      if (owner && !ret.includes(owner.name) && (ret.length > 0 || owner.lazy)) {
        ret.push(owner.name);
      }
    }

    if (ret.length === 0) {
      return undefined;
    }

    return ret;
  }

  private getChildReferences<Entity extends object>(entities: Entity[], prop: EntityProperty<Entity>, options: Required<EntityLoaderOptions<Entity>>, ref: boolean): AnyEntity[] {
    const filtered = this.filterCollections(entities, prop.name, options, ref);

    if (prop.kind === ReferenceKind.ONE_TO_MANY) {
      return filtered.map(e => (e[prop.name] as unknown as Collection<Entity, AnyEntity>).owner);
    }

    if (prop.kind === ReferenceKind.MANY_TO_MANY && prop.owner) {
      return filtered.reduce((a, b) => {
        a.push(...(b[prop.name] as Collection<AnyEntity>).getItems());
        return a;
      }, [] as AnyEntity[]);
    }

    if (prop.kind === ReferenceKind.MANY_TO_MANY) { // inverse side
      return filtered as AnyEntity[];
    }

    // MANY_TO_ONE or ONE_TO_ONE
    return this.filterReferences(entities, prop.name, options, ref) as AnyEntity[];
  }

  private filterCollections<Entity extends object>(entities: Entity[], field: keyof Entity, options: Required<EntityLoaderOptions<Entity>>, ref?: string | boolean): Entity[] {
    if (options.refresh) {
      return entities.filter(e => e[field]);
    }

    return entities.filter(e => Utils.isCollection(e[field]) && !(e[field] as unknown as Collection<AnyEntity>).isInitialized(!ref));
  }

  private isPropertyLoaded(entity: AnyEntity | undefined, field: string): boolean {
    if (!entity || field === '*') {
      return true;
    }

    const wrapped = helper(entity);

    if (!field.includes('.')) {
      return wrapped.__loadedProperties.has(field);
    }

    const [f, ...r] = field.split('.');

    /* v8 ignore next */
    if (!wrapped.__loadedProperties.has(f) || !wrapped.__meta.properties[f]?.targetMeta) {
      return false;
    }

    if ([ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(wrapped.__meta.properties[f].kind)) {
      return entity[f].getItems(false).every((item: AnyEntity) => this.isPropertyLoaded(item, r.join('.')));
    }

    return this.isPropertyLoaded(entity[f], r.join('.'));
  }

  private filterReferences<Entity extends object>(entities: Entity[], field: keyof Entity & string, options: Required<EntityLoaderOptions<Entity>>, ref: boolean): Entity[keyof Entity][] {
    if (ref) {
      return [];
    }

    const children = entities.filter(e => Utils.isEntity(e[field], true));

    if (options.refresh) {
      return children.map(e => Reference.unwrapReference(e[field] as AnyEntity)) as Entity[keyof Entity][];
    }

    if (options.fields) {
      return children
        .map(e => Reference.unwrapReference(e[field] as AnyEntity) as Entity)
        .filter(target => {
          const wrapped = helper(target);
          const childFields = (options.fields as string[])
            .filter(f => f.startsWith(`${field}.`))
            .map(f => f.substring(field.length + 1));

          return !wrapped.__initialized || !childFields.every(cf => this.isPropertyLoaded(target, cf));
        }) as Entity[keyof Entity][];
    }

    return children
      .filter(e => !(e[field] as AnyEntity).__helper!.__initialized)
      .map(e => Reference.unwrapReference(e[field] as AnyEntity)) as Entity[keyof Entity][];
  }

  private filterByReferences<Entity extends object>(entities: Entity[], field: keyof Entity, refresh: boolean): Entity[] {
    /* v8 ignore next */
    if (refresh) {
      return entities;
    }

    return entities.filter(e => e[field] !== null && !(e[field] as AnyEntity)?.__helper?.__initialized);
  }

  private lookupAllRelationships<Entity>(entityName: EntityName<Entity>): PopulateOptions<Entity>[] {
    const ret: PopulateOptions<Entity>[] = [];
    const meta = this.metadata.find<Entity>(entityName)!;

    meta.relations.forEach(prop => {
      ret.push({
        field: this.getRelationName(meta, prop),
        // force select-in strategy when populating all relations as otherwise we could cause infinite loops when self-referencing
        strategy: LoadStrategy.SELECT_IN,
        // no need to look up populate children recursively as we just pass `all: true` here
        all: true,
      });
    });

    return ret;
  }

  private getRelationName<Entity>(meta: EntityMetadata<Entity>, prop: EntityProperty<Entity>): EntityKey<Entity> {
    if (!prop.embedded) {
      return prop.name;
    }

    return `${this.getRelationName(meta, meta.properties[prop.embedded[0]])}.${prop.embedded[1]}` as EntityKey<Entity>;
  }

  private lookupEagerLoadedRelationships<Entity>(entityName: EntityName<Entity>, populate: PopulateOptions<Entity>[], strategy?: LoadStrategy, prefix = '', visited: EntityMetadata[] = [], exclude?: string[]): PopulateOptions<Entity>[] {
    const meta = this.metadata.find<Entity>(entityName);

    if (!meta && !prefix) {
      return populate;
    }

    if (!meta || visited.includes(meta)) {
      return [];
    }

    visited.push(meta);
    const ret: PopulateOptions<Entity>[] = prefix === '' ? [...populate] : [];

    meta.relations
      .filter(prop => {
        const field = this.getRelationName(meta, prop);
        const prefixed = prefix ? `${prefix}.${field}` : field;
        const isExcluded = exclude?.includes(prefixed);
        const eager = prop.eager && !populate.some(p => p.field === `${prop.name}:ref`);
        const populated = populate.some(p => p.field === prop.name);
        const disabled = populate.some(p => p.field === prop.name && p.all === false);

        return !disabled && !isExcluded && (eager || populated);
      })
      .forEach(prop => {
        const field = this.getRelationName(meta, prop);
        const prefixed = prefix ? `${prefix}.${field}` as EntityKey<Entity> : field;
        const nestedPopulate = populate.filter(p => p.field === prop.name).flatMap(p => p.children).filter(Boolean);
        const nested = this.lookupEagerLoadedRelationships<Entity>(prop.targetMeta!.class, nestedPopulate as any, strategy, prefixed, visited.slice(), exclude);

        if (nested.length > 0) {
          ret.push(...nested);
        } else {
          const selfReferencing = [meta.tableName, ...visited.map(m => m.tableName)].includes(prop.targetMeta!.tableName) && prop.eager;
          ret.push({
            field: prefixed,
            // enforce select-in strategy for self-referencing relations
            strategy: selfReferencing ? LoadStrategy.SELECT_IN : strategy ?? prop.strategy,
          });
        }
      });

    return ret;
  }

}
