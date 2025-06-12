import type {
  AnyEntity,
  ConnectionType,
  Dictionary,
  EntityKey,
  EntityMetadata,
  EntityProperty,
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
import type { EntityField, FindOptions, IDatabaseDriver } from '../drivers/IDatabaseDriver.js';
import type { MetadataStorage } from '../metadata/MetadataStorage.js';
import type { Platform } from '../platforms/Platform.js';
import { helper } from './wrap.js';
import type { LoggingOptions } from '../logging/Logger.js';
import { raw, RawQueryFragment } from '../utils/RawQueryFragment.js';
import { expandDotPaths } from './utils.js';

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
  filters?: Dictionary<boolean | Dictionary> | string[] | boolean;
  strategy?: LoadStrategy;
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
  async populate<Entity extends object, Fields extends string = PopulatePath.ALL>(entityName: string, entities: Entity[], populate: PopulateOptions<Entity>[] | boolean, options: EntityLoaderOptions<Entity, Fields>): Promise<void> {
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
    options.filters ??= {};
    options.lookup ??= true;
    options.validate ??= true;
    options.refresh ??= false;
    options.convertCustomTypes ??= true;

    if (references.length > 0) {
      await this.populateScalar(meta, references, options as any);
    }

    populate = this.normalizePopulate<Entity>(entityName, populate as true, options.strategy, options.lookup);
    const invalid = populate.find(({ field }) => !this.em.canPopulate(entityName, field));

    /* v8 ignore next 3 */
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

  normalizePopulate<Entity>(entityName: string, populate: (PopulateOptions<Entity> | boolean)[] | PopulateOptions<Entity> | boolean, strategy?: LoadStrategy, lookup = true): PopulateOptions<Entity>[] {
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
      normalized = this.lookupEagerLoadedRelationships(entityName, normalized, strategy);

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
  private async populateMany<Entity extends object>(entityName: string, entities: Entity[], populate: PopulateOptions<Entity>, options: Required<EntityLoaderOptions<Entity>>): Promise<AnyEntity[]> {
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

    if (prop.kind === ReferenceKind.MANY_TO_MANY && this.driver.getPlatform().usesPivotTable()) {
      const res = await this.findChildrenFromPivotTable<Entity>(filtered, prop, options, innerOrderBy as QueryOrderMap<Entity>[], populate, !!ref);
      return Utils.flatten(res);
    }

    const where = await this.extractChildCondition(options, prop);
    const data = await this.findChildren<Entity>(entities, prop, populate, { ...options, where, orderBy: innerOrderBy! }, !!(ref || prop.mapToPk));
    this.initializeCollections<Entity>(filtered, prop, field, data, innerOrderBy.length > 0);

    return data;
  }

  private async populateScalar<Entity extends object>(meta: EntityMetadata<Entity>, filtered: Entity[], options: Required<EntityLoaderOptions<Entity>>) {
    const pk = Utils.getPrimaryKeyHash(meta.primaryKeys) as FilterKey<Entity>;
    const ids = Utils.unique(filtered.map(e => Utils.getPrimaryKeyValues(e, meta.primaryKeys, true)));
    const where = this.mergePrimaryCondition<Entity>(ids as Entity[], pk, options, meta, this.metadata, this.driver.getPlatform());
    const { filters, convertCustomTypes, lockMode, strategy, populateWhere, connectionType, logging, fields } = options;

    await this.em.find(meta.className, where, {
      filters, convertCustomTypes, lockMode, strategy, populateWhere, connectionType, logging,
      fields: fields as never[],
      populate: [],
    });
  }

  private initializeCollections<Entity extends object>(filtered: Entity[], prop: EntityProperty, field: keyof Entity, children: AnyEntity[], customOrder: boolean): void {
    if (prop.kind === ReferenceKind.ONE_TO_MANY) {
      this.initializeOneToMany<Entity>(filtered, children, prop, field);
    }

    if (prop.kind === ReferenceKind.MANY_TO_MANY && !this.driver.getPlatform().usesPivotTable()) {
      this.initializeManyToMany<Entity>(filtered, children, prop, field, customOrder);
    }
  }

  private initializeOneToMany<Entity extends object>(filtered: Entity[], children: AnyEntity[], prop: EntityProperty, field: keyof Entity): void {
    const mapToPk = prop.targetMeta!.properties[prop.mappedBy].mapToPk;
    const map: Dictionary<Entity[]> = {};

    for (const entity of filtered) {
      const key = helper(entity).getSerializedPrimaryKey();
      map[key] = [];
    }

    for (const child of children) {
      const pk = child.__helper.__data[prop.mappedBy] ?? child[prop.mappedBy];

      if (pk) {
        const key = helper(mapToPk ? this.em.getReference(prop.type, pk) : pk).getSerializedPrimaryKey();
        map[key]?.push(child as Entity);
      }
    }

    for (const entity of filtered) {
      const key = helper(entity).getSerializedPrimaryKey();
      (entity[field] as unknown as Collection<Entity>).hydrate(map[key]);
    }
  }

  private initializeManyToMany<Entity>(filtered: Entity[], children: AnyEntity[], prop: EntityProperty<Entity>, field: keyof Entity, customOrder: boolean): void {
    if (prop.mappedBy) {
      for (const entity of filtered) {
        const items = children.filter(child => (child[prop.mappedBy] as Collection<AnyEntity>).contains(entity as AnyEntity, false));
        (entity[field] as Collection<AnyEntity>).hydrate(items, true);
      }
    } else { // owning side of M:N without pivot table needs to be reordered
      for (const entity of filtered) {
        const order = !customOrder ? [...(entity[prop.name] as Collection<AnyEntity>).getItems(false)] : []; // copy order of references
        const items = children.filter(child => (entity[prop.name] as Collection<AnyEntity>).contains(child, false));

        if (!customOrder) {
          items.sort((a, b) => order.indexOf(a) - order.indexOf(b));
        }

        (entity[field] as Collection<AnyEntity>).hydrate(items, true);
      }
    }
  }

  private async findChildren<Entity extends object>(entities: Entity[], prop: EntityProperty<Entity>, populate: PopulateOptions<Entity>, options: Required<EntityLoaderOptions<Entity>>, ref: boolean): Promise<AnyEntity[]> {
    const children = this.getChildReferences<Entity>(entities, prop, options, ref);
    const meta = prop.targetMeta!;
    let fk = Utils.getPrimaryKeyHash(meta.primaryKeys);
    let schema: string | undefined = options.schema;

    if (prop.kind === ReferenceKind.ONE_TO_MANY || (prop.kind === ReferenceKind.MANY_TO_MANY && !prop.owner)) {
      fk = meta.properties[prop.mappedBy].name;
    }

    if (prop.kind === ReferenceKind.ONE_TO_ONE && !prop.owner && !ref) {
      children.length = 0;
      fk = meta.properties[prop.mappedBy].name;
      children.push(...this.filterByReferences(entities, prop.name, options.refresh) as AnyEntity[]);
    }

    if (children.length === 0) {
      return [];
    }

    if (!schema && [ReferenceKind.ONE_TO_ONE, ReferenceKind.MANY_TO_ONE].includes(prop.kind)) {
      schema = children.find(e => e.__helper!.__schema)?.__helper!.__schema;
    }

    const ids = Utils.unique(children.map(e => e.__helper.getPrimaryKey()));
    let where = this.mergePrimaryCondition<Entity>(ids, fk as FilterKey<Entity>, options, meta, this.metadata, this.driver.getPlatform());
    const fields = this.buildFields(options.fields, prop, ref) as any;

    /* eslint-disable prefer-const */
    let {
      refresh,
      filters,
      convertCustomTypes,
      lockMode,
      strategy,
      populateWhere,
      connectionType,
      logging,
    } = options;
    /* eslint-enable prefer-const */

    if (typeof populateWhere === 'object') {
      populateWhere = await this.extractChildCondition({ where: populateWhere } as any, prop);
    }

    if (!Utils.isEmpty(prop.where)) {
      where = { $and: [where, prop.where] } as FilterQuery<Entity>;
    }

    const propOrderBy: QueryOrderMap<Entity>[] = [];

    if (prop.orderBy) {
      for (const item of Utils.asArray(prop.orderBy)) {
        for (const field of Utils.keys(item)) {
          const rawField = RawQueryFragment.getKnownFragment(field, false);

          if (rawField) {
            const raw2 = raw(rawField.sql, rawField.params);
            propOrderBy.push({ [raw2.toString()]: item[field] } as QueryOrderMap<Entity>);
            continue;
          }

          propOrderBy.push({ [field]: item[field] } as QueryOrderMap<Entity>);
        }
      }
    }

    const orderBy = [...Utils.asArray(options.orderBy), ...propOrderBy].filter((order, idx, array) => {
      // skip consecutive ordering with the same key to get around mongo issues
      return idx === 0 || !Utils.equals(Object.keys(array[idx - 1]), Object.keys(order));
    });
    const items = await this.em.find(prop.type, where, {
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

    for (const item of items) {
      if (ref && !helper(item).__onLoadFired) {
        helper(item).__initialized = false;
        // eslint-disable-next-line dot-notation
        this.em.getUnitOfWork()['loadedEntities'].delete(item);
      }
    }

    return items;
  }

  private mergePrimaryCondition<Entity extends object>(ids: Entity[], pk: FilterKey<Entity>, options: EntityLoaderOptions<Entity>, meta: EntityMetadata, metadata: MetadataStorage, platform: Platform): FilterQuery<Entity> {
    const cond1 = QueryHelper.processWhere<Entity>({ where: { [pk]: { $in: ids } } as FilterQuery<Entity>, entityName: meta.className, metadata, platform, convertCustomTypes: !options.convertCustomTypes });
    const where = { ...options.where } as Dictionary;
    Utils.dropUndefinedProperties(where);

    return where[pk]
      ? { $and: [cond1, where] } as FilterQuery<any>
      : { ...cond1, ...where };
  }

  private async populateField<Entity extends object>(entityName: string, entities: Entity[], populate: PopulateOptions<Entity>, options: Required<EntityLoaderOptions<Entity>>): Promise<void> {
    const field = populate.field.split(':')[0] as EntityKey<Entity>;
    const prop = this.metadata.find(entityName)!.properties[field] as EntityProperty<Entity>;

    if (prop.kind === ReferenceKind.SCALAR && !prop.lazy) {
      return;
    }

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

    const filtered = Utils.unique(children.filter(e => !visited.has(e)));

    for (const entity of entities) {
      visited.add(entity);
    }

    await this.populate<Entity>(prop.type, filtered, populate.children ?? populate.all as any, {
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
    });
  }

  /** @internal */
  async findChildrenFromPivotTable<Entity extends object>(filtered: Entity[], prop: EntityProperty<Entity>, options: Required<EntityLoaderOptions<Entity>>, orderBy?: QueryOrderMap<Entity>[], populate?: PopulateOptions<Entity>, pivotJoin?: boolean): Promise<AnyEntity[][]> {
    const ids = (filtered as AnyEntity[]).map(e => e.__helper!.__primaryKeys);
    const refresh = options.refresh;
    let where = await this.extractChildCondition(options, prop, true);
    const fields = this.buildFields(options.fields, prop);
    const exclude = Array.isArray(options.exclude) ? Utils.extractChildElements(options.exclude, prop.name) : options.exclude;
    const options2 = { ...options } as unknown as FindOptions<Entity, any, any, any>;
    delete options2.limit;
    delete options2.offset;
    options2.fields = fields;
    options2.exclude = exclude;
    options2.populate = (populate?.children ?? []);
    const ownerMeta = (filtered[0] as AnyEntity)?.__helper.__meta;

    if (ownerMeta?.getPrimaryProp().customType) {
      ids.forEach((id, idx) => ids[idx] = QueryHelper.processCustomType<Entity>(ownerMeta.getPrimaryProp(), id as FilterQuery<Entity>, this.driver.getPlatform()) as Primary<Entity>[]);
    }

    if (!Utils.isEmpty(prop.where)) {
      where = { $and: [where, prop.where] } as FilterQuery<Entity>;
    }

    const map = await this.driver.loadFromPivotTable<any, any>(prop, ids, where, orderBy, this.em.getTransactionContext(), options2, pivotJoin);
    const children: AnyEntity[][] = [];

    for (const entity of (filtered as AnyEntity[])) {
      const items = map[entity.__helper!.getSerializedPrimaryKey()].map(item => {
        if (pivotJoin) {
          return this.em.getReference(prop.type, item, {
            convertCustomTypes: true,
            schema: options.schema ?? this.em.config.get('schema'),
          });
        }

        const entity = this.em.getEntityFactory().create(prop.type, item, {
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
    const meta2 = this.metadata.find(prop.type);

    if (!meta2) {
      return {};
    }

    const pk = Utils.getPrimaryKeyHash(meta2.primaryKeys);

    ['$and', '$or'].forEach(op => {
      if (where[op]) {
        const child = where[op]
          .map((cond: Dictionary) => cond[prop.name])
          .filter((sub: unknown) => sub != null && !(Utils.isPlainObject(sub) && Object.keys(sub).every(key => Utils.isOperator(key, false))))
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
      return this.em.applyFilters(prop.type, subCond, options.filters, 'read', options);
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

        /* v8 ignore next 3 */
        if (propName === prop.name) {
          ret.push(childPropName);
        }
      }

      return ret;
    }, [] as EntityField<Entity>[]);

    if (ret.length === 0) {
      return undefined;
    }

    // we need to automatically select the FKs too, e.g. for 1:m relations to be able to wire them with the items
    if (prop.kind === ReferenceKind.ONE_TO_MANY || prop.kind === ReferenceKind.MANY_TO_MANY) {
      const owner = prop.targetMeta!.properties[prop.mappedBy] as EntityProperty<Entity>;

      if (owner && !ret.includes(owner.name)) {
        ret.push(owner.name);
      }
    }

    return ret;
  }

  private getChildReferences<Entity extends object>(entities: Entity[], prop: EntityProperty<Entity>, options: Required<EntityLoaderOptions<Entity>>, ref: boolean): AnyEntity[] {
    const filtered = this.filterCollections(entities, prop.name, options, ref);
    const children: AnyEntity[] = [];

    if (prop.kind === ReferenceKind.ONE_TO_MANY) {
      children.push(...filtered.map(e => (e[prop.name] as unknown as Collection<Entity, AnyEntity>).owner));
    } else if (prop.kind === ReferenceKind.MANY_TO_MANY && prop.owner) {
      children.push(...filtered.reduce((a, b) => {
        a.push(...(b[prop.name] as Collection<AnyEntity>).getItems());
        return a;
      }, [] as AnyEntity[]));
    } else if (prop.kind === ReferenceKind.MANY_TO_MANY) { // inverse side
      children.push(...filtered as AnyEntity[]);
    } else { // MANY_TO_ONE or ONE_TO_ONE
      children.push(...this.filterReferences(entities, prop.name, options, ref) as AnyEntity[]);
    }

    return children;
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

    /* v8 ignore next 3 */
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
    /* v8 ignore next 3 */
    if (refresh) {
      return entities;
    }

    return entities.filter(e => e[field] !== null && !(e[field] as AnyEntity)?.__helper?.__initialized);
  }

  private lookupAllRelationships<Entity>(entityName: string): PopulateOptions<Entity>[] {
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

  private lookupEagerLoadedRelationships<Entity>(entityName: string, populate: PopulateOptions<Entity>[], strategy?: LoadStrategy, prefix = '', visited: string[] = []): PopulateOptions<Entity>[] {
    const meta = this.metadata.find<Entity>(entityName);

    if (!meta && !prefix) {
      return populate;
    }

    if (visited.includes(entityName) || !meta) {
      return [];
    }

    visited.push(entityName);
    const ret: PopulateOptions<Entity>[] = prefix === '' ? [...populate] : [];

    meta.relations
      .filter(prop => {
        const eager = prop.eager && !populate.some(p => p.field === `${prop.name}:ref`);
        const populated = populate.some(p => p.field === prop.name);
        const disabled = populate.some(p => p.field === prop.name && p.all === false);

        return !disabled && (eager || populated);
      })
      .forEach(prop => {
        const field = this.getRelationName(meta, prop);
        const prefixed = prefix ? `${prefix}.${field}` as EntityKey<Entity> : field;
        const nestedPopulate = populate.filter(p => p.field === prop.name).flatMap(p => p.children).filter(Boolean);
        const nested = this.lookupEagerLoadedRelationships<Entity>(prop.type, nestedPopulate as any, strategy, prefixed, visited.slice());

        if (nested.length > 0) {
          ret.push(...nested);
        } else {
          const selfReferencing = [meta.className, meta.root.className, ...visited].includes(prop.type) && prop.eager;
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
