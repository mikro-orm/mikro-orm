import { inspect } from 'node:util';
import DataLoader from 'dataloader';
import {
  type Configuration,
  Cursor,
  DataloaderUtils,
  getOnConflictReturningFields,
  QueryHelper,
  RawQueryFragment,
  TransactionContext,
  Utils,
} from './utils';
import {
  type AssignOptions,
  EntityAssigner,
  EntityFactory,
  EntityLoader,
  type EntityLoaderOptions,
  type EntityRepository,
  EntityValidator,
  helper,
  Reference,
} from './entity';
import { ChangeSet, ChangeSetType, UnitOfWork } from './unit-of-work';
import type {
  CountOptions,
  DeleteOptions,
  EntityField,
  FindAllOptions,
  FindByCursorOptions,
  FindOneOptions,
  FindOneOrFailOptions,
  FindOptions,
  GetReferenceOptions,
  IDatabaseDriver,
  LockOptions,
  NativeInsertUpdateOptions,
  UpdateOptions,
  UpsertManyOptions,
  UpsertOptions,
} from './drivers';
import type {
  AnyEntity,
  AnyString,
  ArrayElement,
  AutoPath,
  ConnectionType,
  Constructor,
  Dictionary,
  EntityData,
  EntityDictionary,
  EntityDTO,
  EntityKey,
  EntityMetadata,
  EntityName,
  FilterDef,
  FilterQuery,
  FromEntityType,
  GetRepository,
  IHydrator,
  IsSubset,
  Loaded,
  MaybePromise,
  MergeLoaded,
  MergeSelected,
  NoInfer,
  ObjectQuery,
  PopulateOptions,
  Primary,
  Ref,
  RequiredEntityData,
  UnboxArray,
} from './typings';
import {
  EventType,
  FlushMode,
  LoadStrategy,
  LockMode,
  PopulateHint,
  PopulatePath,
  QueryFlag,
  ReferenceKind,
  SCALAR_TYPES,
  type TransactionOptions,
} from './enums';
import type { MetadataStorage } from './metadata';
import type { Transaction } from './connections';
import { EventManager, type FlushEventArgs, TransactionEventBroadcaster } from './events';
import type { EntityComparator } from './utils/EntityComparator';
import { OptimisticLockError, ValidationError } from './errors';
import type { CacheAdapter } from './cache/CacheAdapter';

/**
 * The EntityManager is the central access point to ORM functionality. It is a facade to all different ORM subsystems
 * such as UnitOfWork, Query Language, and Repository API.
 * @template {IDatabaseDriver} Driver current driver type
 */
export class EntityManager<Driver extends IDatabaseDriver = IDatabaseDriver> {

  private static counter = 1;
  readonly _id = EntityManager.counter++;
  readonly global = false;
  readonly name: string;
  protected readonly refLoader = new DataLoader(DataloaderUtils.getRefBatchLoadFn(this));
  protected readonly colLoader = new DataLoader(DataloaderUtils.getColBatchLoadFn(this));
  protected readonly colLoaderMtoN = new DataLoader(DataloaderUtils.getManyToManyColBatchLoadFn(this));
  private readonly validator: EntityValidator;
  private readonly repositoryMap: Dictionary<EntityRepository<any>> = {};
  private readonly entityLoader: EntityLoader;
  protected readonly comparator: EntityComparator;
  private readonly entityFactory: EntityFactory;
  private readonly unitOfWork: UnitOfWork;
  private readonly resultCache: CacheAdapter;
  private filters: Dictionary<FilterDef> = {};
  private filterParams: Dictionary<Dictionary> = {};
  protected loggerContext?: Dictionary;
  private transactionContext?: Transaction;
  private disableTransactions: boolean;
  private flushMode?: FlushMode;
  private _schema?: string;

  /**
   * @internal
   */
  constructor(readonly config: Configuration,
              protected readonly driver: Driver,
              protected readonly metadata: MetadataStorage,
              protected readonly useContext = true,
              protected readonly eventManager = new EventManager(config.get('subscribers'))) {
    this.entityLoader = new EntityLoader(this);
    this.name = this.config.get('contextName');
    this.validator = new EntityValidator(this.config.get('strict'));
    this.comparator = this.config.getComparator(this.metadata);
    this.resultCache = this.config.getResultCacheAdapter();
    this.disableTransactions = this.config.get('disableTransactions');
    this.entityFactory = new EntityFactory(this);
    this.unitOfWork = new UnitOfWork(this);
  }

  /**
   * Gets the Driver instance used by this EntityManager.
   * Driver is singleton, for one MikroORM instance, only one driver is created.
   */
  getDriver(): Driver {
    return this.driver;
  }

  /**
   * Gets the Connection instance, by default returns write connection
   */
  getConnection(type?: ConnectionType): ReturnType<Driver['getConnection']> {
    return this.driver.getConnection(type) as ReturnType<Driver['getConnection']>;
  }

  /**
   * Gets the platform instance. Just like the driver, platform is singleton, one for a MikroORM instance.
   */
  getPlatform(): ReturnType<Driver['getPlatform']> {
    return this.driver.getPlatform() as ReturnType<Driver['getPlatform']>;
  }

  /**
   * Gets repository for given entity. You can pass either string name or entity class reference.
   */
  getRepository<
    Entity extends object,
    Repository extends EntityRepository<Entity> = EntityRepository<Entity>,
  >(entityName: EntityName<Entity>): GetRepository<Entity, Repository> {
    entityName = Utils.className(entityName);

    if (!this.repositoryMap[entityName]) {
      const meta = this.metadata.get(entityName);
      const RepositoryClass = this.config.getRepositoryClass(meta.repository) as Constructor<EntityRepository<any>>;
      this.repositoryMap[entityName] = new RepositoryClass(this, entityName);
    }

    return this.repositoryMap[entityName] as unknown as GetRepository<Entity, Repository>;
  }

  /**
   * Shortcut for `em.getRepository()`.
   */
  repo<
    Entity extends object,
    Repository extends EntityRepository<Entity> = EntityRepository<Entity>,
  >(entityName: EntityName<Entity>): GetRepository<Entity, Repository> {
    return this.getRepository(entityName);
  }

  /**
   * Gets EntityValidator instance
   */
  getValidator(): EntityValidator {
    return this.validator;
  }

  /**
   * Finds all entities matching your `where` query. You can pass additional options via the `options` parameter.
   */
  async find<
    Entity extends object,
    Hint extends string = never,
    Fields extends string = PopulatePath.ALL,
    Excludes extends string = never,
  >(entityName: EntityName<Entity>, where: FilterQuery<NoInfer<Entity>>, options: FindOptions<Entity, Hint, Fields, Excludes> = {}): Promise<Loaded<Entity, Hint, Fields, Excludes>[]> {
    if (options.disableIdentityMap ?? this.config.get('disableIdentityMap')) {
      const em = this.getContext(false);
      const fork = em.fork({ keepTransactionContext: true });
      const ret = await fork.find(entityName, where, { ...options, disableIdentityMap: false });
      fork.clear();

      return ret;
    }

    const em = this.getContext();
    em.prepareOptions(options);
    await em.tryFlush(entityName, options);
    entityName = Utils.className(entityName);
    where = await em.processWhere(entityName, where, options, 'read') as FilterQuery<Entity>;
    em.validator.validateParams(where);
    options.orderBy = options.orderBy || {};
    options.populate = await em.preparePopulate(entityName, options) as any;
    const populate = options.populate as unknown as PopulateOptions<Entity>[];
    const cacheKey = em.cacheKey(entityName, options, 'em.find', where);
    const cached = await em.tryCache<Entity, Loaded<Entity, Hint, Fields, Excludes>[]>(entityName, options.cache, cacheKey, options.refresh, true);

    if (cached?.data) {
      await em.entityLoader.populate<Entity>(entityName, cached.data as Entity[], populate, {
        ...options as Dictionary,
        ...em.getPopulateWhere(where as ObjectQuery<Entity>, options),
        convertCustomTypes: false,
        ignoreLazyScalarProperties: true,
        lookup: false,
      });

      return cached.data;
    }

    const meta = this.metadata.get<Entity>(entityName);
    options = { ...options };
    // save the original hint value so we know it was infer/all
    (options as Dictionary)._populateWhere = options.populateWhere ?? this.config.get('populateWhere');
    options.populateWhere = this.createPopulateWhere({ ...where } as ObjectQuery<Entity>, options);
    options.populateFilter = await this.getJoinedFilters(meta, { ...where } as ObjectQuery<Entity>, options);
    const results = await em.driver.find(entityName, where, { ctx: em.transactionContext, em, ...options });

    if (results.length === 0) {
      await em.storeCache(options.cache, cached!, []);
      return [];
    }

    const ret: Loaded<Entity, Hint, Fields, Excludes>[] = [];

    for (const data of results) {
      const entity = em.entityFactory.create(entityName, data as EntityData<Entity>, {
        merge: true,
        refresh: options.refresh,
        schema: options.schema,
        convertCustomTypes: true,
      }) as Loaded<Entity, Hint, Fields, Excludes>;

      ret.push(entity);
    }

    const unique = Utils.unique(ret);
    await em.entityLoader.populate<Entity, Fields>(entityName, unique as Entity[], populate, {
      ...options as Dictionary,
      ...em.getPopulateWhere(where as ObjectQuery<Entity>, options),
      convertCustomTypes: false,
      ignoreLazyScalarProperties: true,
      lookup: false,
    });
    await em.unitOfWork.dispatchOnLoadEvent();

    if (meta.virtual) {
      await em.storeCache(options.cache, cached!, () => ret);
    } else {
      await em.storeCache(options.cache, cached!, () => unique.map(e => helper(e).toPOJO()));
    }

    return unique;
  }

  /**
   * Finds all entities of given type, optionally matching the `where` condition provided in the `options` parameter.
   */
  async findAll<
    Entity extends object,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(entityName: EntityName<Entity>, options?: FindAllOptions<NoInfer<Entity>, Hint, Fields, Excludes>): Promise<Loaded<Entity, Hint, Fields, Excludes>[]> {
    return this.find(entityName, options?.where ?? {}, options);
  }

  private getPopulateWhere<
    Entity extends object,
    Hint extends string = never,
  >(where: ObjectQuery<Entity>, options: Pick<FindOptions<Entity, Hint>, 'populateWhere'>): { where: ObjectQuery<Entity>; populateWhere?: PopulateHint | `${PopulateHint}` } {
    if (options.populateWhere === undefined) {
      options.populateWhere = this.config.get('populateWhere');
    }

    if (options.populateWhere === PopulateHint.ALL) {
      return { where: {} as ObjectQuery<Entity>, populateWhere: options.populateWhere as 'all' };
    }

    /* istanbul ignore next */
    if (options.populateWhere === PopulateHint.INFER) {
      return { where, populateWhere: options.populateWhere as 'infer' };
    }

    return { where: options.populateWhere as ObjectQuery<Entity> };
  }

  /**
   * Registers global filter to this entity manager. Global filters are enabled by default (unless disabled via last parameter).
   */
  addFilter<T1>(name: string, cond: FilterQuery<T1> | ((args: Dictionary) => MaybePromise<FilterQuery<T1>>), entityName?: EntityName<T1> | [EntityName<T1>], enabled?: boolean): void;

  /**
   * Registers global filter to this entity manager. Global filters are enabled by default (unless disabled via last parameter).
   */
  addFilter<T1, T2>(name: string, cond: FilterQuery<T1 | T2> | ((args: Dictionary) => MaybePromise<FilterQuery<T1 | T2>>), entityName?: [EntityName<T1>, EntityName<T2>], enabled?: boolean): void;

  /**
   * Registers global filter to this entity manager. Global filters are enabled by default (unless disabled via last parameter).
   */
  addFilter<T1, T2, T3>(name: string, cond: FilterQuery<T1 | T2 | T3> | ((args: Dictionary) => MaybePromise<FilterQuery<T1 | T2 | T3>>), entityName?: [EntityName<T1>, EntityName<T2>, EntityName<T3>], enabled?: boolean): void;

  /**
   * Registers global filter to this entity manager. Global filters are enabled by default (unless disabled via last parameter).
   */
  addFilter(name: string, cond: Dictionary | ((args: Dictionary) => MaybePromise<FilterQuery<AnyEntity>>), entityName?: EntityName<AnyEntity> | EntityName<AnyEntity>[], enabled?: boolean): void;

  /**
   * Registers global filter to this entity manager. Global filters are enabled by default (unless disabled via last parameter).
   */
  addFilter(name: string, cond: Dictionary | ((args: Dictionary) => MaybePromise<FilterQuery<AnyEntity>>), entityName?: EntityName<AnyEntity> | EntityName<AnyEntity>[], enabled = true): void {
    const options: FilterDef = { name, cond, default: enabled };

    if (entityName) {
      options.entity = Utils.asArray(entityName).map(n => Utils.className(n));
    }

    this.getContext(false).filters[name] = options;
  }

  /**
   * Sets filter parameter values globally inside context defined by this entity manager.
   * If you want to set shared value for all contexts, be sure to use the root entity manager.
   */
  setFilterParams(name: string, args: Dictionary): void {
    this.getContext().filterParams[name] = args;
  }

  /**
   * Returns filter parameters for given filter set in this context.
   */
  getFilterParams<T extends Dictionary = Dictionary>(name: string): T {
    return this.getContext().filterParams[name] as T;
  }

  /**
   * Sets logger context for this entity manager.
   */
  setLoggerContext(context: Dictionary): void {
    this.getContext().loggerContext = context;
  }

  /**
   * Gets logger context for this entity manager.
   */
  getLoggerContext<T extends Dictionary = Dictionary>(options?: { disableContextResolution?: boolean }): T {
    const em = options?.disableContextResolution ? this : this.getContext();
    em.loggerContext ??= {};

    return em.loggerContext as T;
  }

  setFlushMode(flushMode?: FlushMode): void {
    this.getContext(false).flushMode = flushMode;
  }

  protected async processWhere<
    Entity extends object,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(entityName: string, where: FilterQuery<Entity>, options: FindOptions<Entity, Hint, Fields, Excludes> | FindOneOptions<Entity, Hint, Fields, Excludes>, type: 'read' | 'update' | 'delete'): Promise<FilterQuery<Entity>> {
    where = QueryHelper.processWhere({
      where,
      entityName,
      metadata: this.metadata,
      platform: this.driver.getPlatform(),
      convertCustomTypes: options.convertCustomTypes,
      aliased: type === 'read',
    });
    where = (await this.applyFilters(entityName, where, options.filters ?? {}, type, options))!;
    where = await this.applyDiscriminatorCondition(entityName, where);

    return where;
  }

  // this method only handles the problem for mongo driver, SQL drivers have their implementation inside QueryBuilder
  protected applyDiscriminatorCondition<Entity extends object>(entityName: string, where: FilterQuery<Entity>): FilterQuery<Entity> {
    const meta = this.metadata.find<Entity>(entityName);

    if (!meta?.discriminatorValue) {
      return where;
    }

    const types = Object.values(meta.root.discriminatorMap!).map(cls => this.metadata.find(cls)!);
    const children: EntityMetadata[] = [];
    const lookUpChildren = (ret: EntityMetadata[], type: string) => {
      const children = types.filter(meta2 => meta2.extends === type);
      children.forEach(m => lookUpChildren(ret, m.className));
      ret.push(...children.filter(c => c.discriminatorValue));

      return children;
    };
    lookUpChildren(children, meta.className);
    /* istanbul ignore next */
    (where as Dictionary)[meta.root.discriminatorColumn!] = children.length > 0 ? { $in: [meta.discriminatorValue, ...children.map(c => c.discriminatorValue)] } : meta.discriminatorValue;

    return where;
  }

  protected createPopulateWhere<Entity extends object>(cond: ObjectQuery<Entity>, options: FindOptions<Entity, any, any, any> | FindOneOptions<Entity, any, any, any> | CountOptions<Entity, any>): ObjectQuery<Entity> {
    const ret = {} as ObjectQuery<Entity>;
    const populateWhere = options.populateWhere ?? this.config.get('populateWhere');

    if (populateWhere === PopulateHint.INFER) {
      Utils.merge(ret, cond);
    } else if (typeof populateWhere === 'object') {
      Utils.merge(ret, populateWhere);
    }

    return ret;
  }

  protected async getJoinedFilters<Entity extends object>(meta: EntityMetadata<Entity>, cond: ObjectQuery<Entity>, options: FindOptions<Entity, any, any, any> | FindOneOptions<Entity, any, any, any>): Promise<ObjectQuery<Entity>> {
    const ret = {} as ObjectQuery<Entity>;

    if (options.populate) {
      for (const hint of (options.populate as unknown as PopulateOptions<Entity>[])) {
        const field = hint.field.split(':')[0] as EntityKey<Entity>;
        const prop = meta.properties[field];
        const joined = (prop.strategy || options.strategy || hint.strategy || this.config.get('loadStrategy')) === LoadStrategy.JOINED && prop.kind !== ReferenceKind.SCALAR;

        if (!joined && !hint.filter) {
          continue;
        }

        const where = await this.applyFilters<Entity>(prop.type, {}, options.filters ?? {}, 'read', { ...options, populate: hint.children });
        const where2 = await this.getJoinedFilters<Entity>(prop.targetMeta!, {} as ObjectQuery<Entity>, { ...options, populate: hint.children as any, populateWhere: PopulateHint.ALL });

        if (Utils.hasObjectKeys(where!)) {
          ret[field] = ret[field] ? { $and: [where, ret[field]] } : where as any;
        }

        if (Utils.hasObjectKeys(where2)) {
          if (ret[field]) {
            Utils.merge(ret[field], where2);
          } else {
            ret[field] = where2 as any;
          }
        }
      }
    }

    return ret;
  }

  /**
   * When filters are active on M:1 or 1:1 relations, we need to ref join them eagerly as they might affect the FK value.
   */
  protected async autoJoinRefsForFilters<T extends object>(meta: EntityMetadata<T>, options: FindOptions<T, any, any, any> | FindOneOptions<T, any, any, any>): Promise<void> {
    if (!meta || !this.config.get('autoJoinRefsForFilters')) {
      return;
    }

    const props = meta.relations.filter(prop => {
      return !prop.object && [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind)
        && ((options.fields?.length ?? 0) === 0 || options.fields?.some(f => prop.name === f || prop.name.startsWith(`${String(f)}.`)));
    });
    const ret = options.populate as PopulateOptions<T>[];

    for (const prop of props) {
      const cond = await this.applyFilters(prop.type, {}, options.filters ?? {}, 'read', options);

      if (!Utils.isEmpty(cond)) {
        const populated = (options.populate as PopulateOptions<T>[]).filter(({ field }) => field.split(':')[0] === prop.name);

        if (populated.length > 0) {
          populated.forEach(hint => hint.filter = true);
        } else {
          ret.push({ field: `${prop.name}:ref` as any, strategy: LoadStrategy.JOINED, filter: true });
        }
      }
    }
  }

  /**
   * @internal
   */
  async applyFilters<Entity extends object>(
    entityName: string,
    where: FilterQuery<Entity> | undefined,
    options: Dictionary<boolean | Dictionary> | string[] | boolean,
    type: 'read' | 'update' | 'delete',
    findOptions?: FindOptions<any, any, any, any> | FindOneOptions<any, any, any, any>,
  ): Promise<FilterQuery<Entity> | undefined> {
    const meta = this.metadata.find<Entity>(entityName);
    const filters: FilterDef[] = [];
    const ret: Dictionary[] = [];

    if (!meta) {
      return where;
    }

    const active = new Set<string>();
    const push = (source: Dictionary<FilterDef>) => {
      const activeFilters = QueryHelper
        .getActiveFilters(entityName, options, source)
        .filter(f => !active.has(f.name));
      filters.push(...activeFilters);
      activeFilters.forEach(f => active.add(f.name));
    };
    push(this.config.get('filters'));
    push(this.filters);
    push(meta.filters);

    if (filters.length === 0) {
      return where;
    }

    for (const filter of filters) {
      let cond: Dictionary;

      if (filter.cond instanceof Function) {
        // @ts-ignore
        const args = Utils.isPlainObject(options[filter.name]) ? options[filter.name] : this.getContext().filterParams[filter.name];

        if (!args && filter.cond.length > 0 && filter.args !== false) {
          throw new Error(`No arguments provided for filter '${filter.name}'`);
        }

        cond = await filter.cond(args, type, this, findOptions, entityName);
      } else {
        cond = filter.cond;
      }

      ret.push(QueryHelper.processWhere({
        where: cond,
        entityName,
        metadata: this.metadata,
        platform: this.driver.getPlatform(),
        aliased: type === 'read',
      }));
    }

    const conds = [...ret, where as Dictionary].filter(c => Utils.hasObjectKeys(c)) as FilterQuery<Entity>[];

    return conds.length > 1 ? { $and: conds } as FilterQuery<Entity> : conds[0];
  }

  /**
   * Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
   * where the first element is the array of entities, and the second is the count.
   */
  async findAndCount<
    Entity extends object,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(entityName: EntityName<Entity>, where: FilterQuery<NoInfer<Entity>>, options: FindOptions<Entity, Hint, Fields, Excludes> = {}): Promise<[Loaded<Entity, Hint, Fields, Excludes>[], number]> {
    const em = this.getContext(false);
    await em.tryFlush(entityName, options);
    options.flushMode = 'commit'; // do not try to auto flush again

    return RawQueryFragment.run(async () => {
      return Promise.all([
        em.find(entityName, where, options),
        em.count(entityName, where, options as CountOptions<Entity, Hint>),
      ]);
    });
  }

  /**
   * Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as {@apilink Cursor} object.
   * Supports `before`, `after`, `first` and `last` options while disallowing `limit` and `offset`. Explicit `orderBy` option
   * is required.
   *
   * Use `first` and `after` for forward pagination, or `last` and `before` for backward pagination.
   *
   * - `first` and `last` are numbers and serve as an alternative to `offset`, those options are mutually exclusive, use only one at a time
   * - `before` and `after` specify the previous cursor value, it can be one of the:
   *     - `Cursor` instance
   *     - opaque string provided by `startCursor/endCursor` properties
   *     - POJO/entity instance
   *
   * ```ts
   * const currentCursor = await em.findByCursor(User, {}, {
   *   first: 10,
   *   after: previousCursor, // cursor instance
   *   orderBy: { id: 'desc' },
   * });
   *
   * // to fetch next page
   * const nextCursor = await em.findByCursor(User, {}, {
   *   first: 10,
   *   after: currentCursor.endCursor, // opaque string
   *   orderBy: { id: 'desc' },
   * });
   *
   * // to fetch next page
   * const nextCursor2 = await em.findByCursor(User, {}, {
   *   first: 10,
   *   after: { id: lastSeenId }, // entity-like POJO
   *   orderBy: { id: 'desc' },
   * });
   * ```
   *
   * The options also support an `includeCount` (true by default) option. If set to false, the `totalCount` is not
   * returned as part of the cursor. This is useful for performance reason, when you don't care about the total number
   * of pages.
   *
   * The `Cursor` object provides the following interface:
   *
   * ```ts
   * Cursor<User> {
   *   items: [
   *     User { ... },
   *     User { ... },
   *     User { ... },
   *   ],
   *   totalCount: 50, // not included if `includeCount: false`
   *   startCursor: 'WzRd',
   *   endCursor: 'WzZd',
   *   hasPrevPage: true,
   *   hasNextPage: true,
   * }
   * ```
   */
  async findByCursor<
    Entity extends object,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
    IncludeCount extends boolean = true,
  >(entityName: EntityName<Entity>, where: FilterQuery<NoInfer<Entity>>, options: FindByCursorOptions<Entity, Hint, Fields, Excludes, IncludeCount>): Promise<Cursor<Entity, Hint, Fields, Excludes, IncludeCount>> {
    const em = this.getContext(false);
    entityName = Utils.className(entityName);
    options.overfetch ??= true;

    if (Utils.isEmpty(options.orderBy)) {
      throw new Error('Explicit `orderBy` option required');
    }

    const [entities, count] = options.includeCount !== false
      ? await em.findAndCount(entityName, where, options)
      : [await em.find(entityName, where, options)];
    return new Cursor(
      entities,
      count as IncludeCount extends true ? number : undefined,
      options,
      this.metadata.get(entityName),
    );
  }

  /**
   * Refreshes the persistent state of an entity from the database, overriding any local changes that have not yet been
   * persisted. Returns the same entity instance (same object reference), but re-hydrated. If the entity is no longer
   * in database, the method throws an error just like `em.findOneOrFail()` (and respects the same config options).
   */
  async refreshOrFail<
    Entity extends object,
    Naked extends FromEntityType<Entity> = FromEntityType<Entity>,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(entity: Entity, options: FindOneOrFailOptions<Entity, Hint, Fields, Excludes> = {}): Promise<MergeLoaded<Entity, Naked, Hint, Fields, Excludes, true>> {
    const ret = await this.refresh(entity, options);

    if (!ret) {
      options.failHandler ??= this.config.get('findOneOrFailHandler');
      const entityName = entity.constructor.name;
      const where = helper(entity).getPrimaryKey() as any;
      throw options.failHandler!(entityName, where);
    }

    return ret as any;
  }

  /**
   * Refreshes the persistent state of an entity from the database, overriding any local changes that have not yet been
   * persisted. Returns the same entity instance (same object reference), but re-hydrated. If the entity is no longer
   * in database, the method returns `null`.
   */
  async refresh<
    Entity extends object,
    Naked extends FromEntityType<Entity> = FromEntityType<Entity>,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(entity: Entity, options: FindOneOptions<Entity, Hint, Fields, Excludes> = {}): Promise<MergeLoaded<Entity, Naked, Hint, Fields, Excludes, true> | null> {
    const fork = this.fork({ keepTransactionContext: true });
    const entityName = entity.constructor.name;
    const reloaded = await fork.findOne(entityName, entity, {
      schema: helper(entity).__schema,
      ...options,
      flushMode: FlushMode.COMMIT,
    });

    const em = this.getContext();

    if (reloaded) {
      for (const e of fork.unitOfWork.getIdentityMap()) {
        const ref = em.getReference(e.constructor.name, helper(e).getPrimaryKey());
        const data = this.comparator.prepareEntity(e as Entity);
        em.config.getHydrator(this.metadata).hydrate(
          ref,
          helper(ref).__meta,
          helper(e).toPOJO() as object,
          em.entityFactory,
          'full',
          false,
          true,
        );
        helper(ref).__originalEntityData = data;
      }
    } else {
      em.unitOfWork.unsetIdentity(entity);
    }

    return reloaded ? entity as any : reloaded;
  }

  /**
   * Finds first entity matching your `where` query.
   */
  async findOne<
    Entity extends object,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(entityName: EntityName<Entity>, where: FilterQuery<NoInfer<Entity>>, options: FindOneOptions<Entity, Hint, Fields, Excludes> = {}): Promise<Loaded<Entity, Hint, Fields, Excludes> | null> {
    if (options.disableIdentityMap ?? this.config.get('disableIdentityMap')) {
      const em = this.getContext(false);
      const fork = em.fork({ keepTransactionContext: true });
      const ret = await fork.findOne(entityName, where, { ...options, disableIdentityMap: false });
      fork.clear();

      return ret;
    }

    const em = this.getContext();
    entityName = Utils.className(entityName);
    em.prepareOptions(options);
    let entity = em.unitOfWork.tryGetById<Entity>(entityName, where, options.schema);

    // query for a not managed entity which is already in the identity map as it
    // was provided with a PK this entity does not exist in the db, there can't
    // be any relations to it, so no need to deal with the populate hint
    if (entity && !helper(entity).__managed) {
      return entity as Loaded<Entity, Hint, Fields, Excludes>;
    }

    await em.tryFlush(entityName, options);
    const meta = em.metadata.get<Entity>(entityName);
    where = await em.processWhere(entityName, where, options, 'read');
    em.validator.validateEmptyWhere(where);
    em.checkLockRequirements(options.lockMode, meta);
    const isOptimisticLocking = !Utils.isDefined(options.lockMode) || options.lockMode === LockMode.OPTIMISTIC;

    if (entity && !em.shouldRefresh(meta, entity, options) && isOptimisticLocking) {
      return em.lockAndPopulate(meta, entity, where, options);
    }

    em.validator.validateParams(where);
    options.populate = await em.preparePopulate(entityName, options) as any;
    const cacheKey = em.cacheKey(entityName, options, 'em.findOne', where);
    const cached = await em.tryCache<Entity, Loaded<Entity, Hint, Fields, Excludes>>(entityName, options.cache, cacheKey, options.refresh, true);

    if (cached?.data !== undefined) {
      if (cached.data) {
        await em.entityLoader.populate<Entity, Fields>(entityName, [cached.data as Entity], options.populate as unknown as PopulateOptions<Entity>[], {
          ...options as Dictionary,
          ...em.getPopulateWhere(where as ObjectQuery<Entity>, options),
          convertCustomTypes: false,
          ignoreLazyScalarProperties: true,
          lookup: false,
        });
      }

      return cached.data;
    }

    options = { ...options };
    // save the original hint value so we know it was infer/all
    (options as Dictionary)._populateWhere = options.populateWhere ?? this.config.get('populateWhere');
    options.populateWhere = this.createPopulateWhere({ ...where } as ObjectQuery<Entity>, options);
    options.populateFilter = await this.getJoinedFilters(meta, { ...where } as ObjectQuery<Entity>, options);
    const data = await em.driver.findOne<Entity, Hint, Fields, Excludes>(entityName, where, {
      ctx: em.transactionContext,
      em,
      ...options,
    });

    if (!data) {
      await em.storeCache(options.cache, cached!, null);
      return null;
    }

    entity = em.entityFactory.create<Entity>(entityName, data as EntityData<Entity>, {
      merge: true,
      refresh: options.refresh,
      schema: options.schema,
      convertCustomTypes: true,
    });

    await em.lockAndPopulate(meta, entity, where, options);
    await em.unitOfWork.dispatchOnLoadEvent();
    await em.storeCache(options.cache, cached!, () => helper(entity!).toPOJO());

    return entity as Loaded<Entity, Hint, Fields, Excludes>;
  }

  /**
   * Finds first entity matching your `where` query. If nothing found, it will throw an error.
   * If the `strict` option is specified and nothing is found or more than one matching entity is found, it will throw an error.
   * You can override the factory for creating this method via `options.failHandler` locally
   * or via `Configuration.findOneOrFailHandler` (`findExactlyOneOrFailHandler` when specifying `strict`) globally.
   */
  async findOneOrFail<
    Entity extends object,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(entityName: EntityName<Entity>, where: FilterQuery<NoInfer<Entity>>, options: FindOneOrFailOptions<Entity, Hint, Fields, Excludes> = {}): Promise<Loaded<Entity, Hint, Fields, Excludes>> {
    let entity: Loaded<Entity, Hint, Fields, Excludes> | null;
    let isStrictViolation = false;

    if (options.strict) {
      const ret = await this.find(entityName, where, { ...options, limit: 2 } as FindOptions<Entity, Hint, Fields, Excludes>);
      isStrictViolation = ret.length !== 1;
      entity = ret[0];
    } else {
      entity = await this.findOne<Entity, Hint, Fields, Excludes>(entityName, where, options);
    }

    if (!entity || isStrictViolation) {
      const key = options.strict ? 'findExactlyOneOrFailHandler' : 'findOneOrFailHandler';
      options.failHandler ??= this.config.get(key);
      entityName = Utils.className(entityName);
      /* istanbul ignore next */
      where = Utils.isEntity(where) ? helper(where).getPrimaryKey() as any : where;
      throw options.failHandler!(entityName, where);
    }

    return entity as Loaded<Entity, Hint, Fields, Excludes>;
  }

  /**
   * Creates or updates the entity, based on whether it is already present in the database.
   * This method performs an `insert on conflict merge` query ensuring the database is in sync, returning a managed
   * entity instance. The method accepts either `entityName` together with the entity `data`, or just entity instance.
   *
   * ```ts
   * // insert into "author" ("age", "email") values (33, 'foo@bar.com') on conflict ("email") do update set "age" = 41
   * const author = await em.upsert(Author, { email: 'foo@bar.com', age: 33 });
   * ```
   *
   * The entity data needs to contain either the primary key, or any other unique property. Let's consider the following example, where `Author.email` is a unique property:
   *
   * ```ts
   * // insert into "author" ("age", "email") values (33, 'foo@bar.com') on conflict ("email") do update set "age" = 41
   * // select "id" from "author" where "email" = 'foo@bar.com'
   * const author = await em.upsert(Author, { email: 'foo@bar.com', age: 33 });
   * ```
   *
   * Depending on the driver support, this will either use a returning query, or a separate select query, to fetch the primary key if it's missing from the `data`.
   *
   * If the entity is already present in current context, there won't be any queries - instead, the entity data will be assigned and an explicit `flush` will be required for those changes to be persisted.
   */
  async upsert<Entity extends object, Fields extends string = any>(entityNameOrEntity: EntityName<Entity> | Entity, data?: EntityData<Entity> | NoInfer<Entity>, options: UpsertOptions<Entity, Fields> = {}): Promise<Entity> {
    if (options.disableIdentityMap ?? this.config.get('disableIdentityMap')) {
      const em = this.getContext(false);
      const fork = em.fork({ keepTransactionContext: true });
      const ret = await fork.upsert(entityNameOrEntity, data, { ...options, disableIdentityMap: false });
      fork.clear();

      return ret;
    }

    const em = this.getContext(false);
    em.prepareOptions(options);

    let entityName: EntityName<Entity>;
    let where: FilterQuery<Entity>;
    let entity: Entity | null = null;

    if (data === undefined) {
      entityName = (entityNameOrEntity as Dictionary).constructor.name;
      data = entityNameOrEntity as Entity;
    } else {
      entityName = Utils.className(entityNameOrEntity as EntityName<Entity>);
    }

    const meta = this.metadata.get<Entity>(entityName);
    const convertCustomTypes = !Utils.isEntity(data);

    if (Utils.isEntity(data)) {
      entity = data as Entity;

      if (helper(entity).__managed && helper(entity).__em === em && !this.config.get('upsertManaged')) {
        em.entityFactory.mergeData(meta, entity, data, { initialized: true });
        return entity;
      }

      where = helper(entity).getPrimaryKey() as FilterQuery<Entity>;
      data = em.comparator.prepareEntity(entity);
    } else {
      data = Utils.copy(QueryHelper.processParams(data));
      where = Utils.extractPK(data, meta) as FilterQuery<Entity>;

      if (where && !this.config.get('upsertManaged')) {
        const exists = em.unitOfWork.getById<Entity>(entityName, where as Primary<Entity>, options.schema);

        if (exists) {
          return em.assign(exists, data as any) as any;
        }
      }
    }

    const unique = options.onConflictFields as string[] ?? meta.props.filter(p => p.unique).map(p => p.name);
    const propIndex = !Utils.isRawSql(unique) && unique.findIndex(p => (data as Dictionary)[p] != null);

    if (options.onConflictFields || where == null) {
      if (propIndex !== false && propIndex >= 0) {
        where = { [unique[propIndex]]: (data as Dictionary)[unique[propIndex]] } as FilterQuery<Entity>;
      } else if (meta.uniques.length > 0) {
        for (const u of meta.uniques) {
          if (Utils.asArray<EntityKey<Entity>>(u.properties).every(p => data![p] != null)) {
            where = Utils.asArray<EntityKey<Entity>>(u.properties).reduce((o, key) => {
              o[key] = data![key];
              return o;
            }, {} as any);
            break;
          }
        }
      }
    }

    data = QueryHelper.processObjectParams(data) as EntityData<Entity>;
    em.validator.validateParams(data, 'insert data');

    if (em.eventManager.hasListeners(EventType.beforeUpsert, meta)) {
      await em.eventManager.dispatchEvent(EventType.beforeUpsert, { entity: data as Entity, em, meta }, meta);
    }

    const ret = await em.driver.nativeUpdate(entityName, where, data, {
      ctx: em.transactionContext,
      upsert: true,
      convertCustomTypes,
      ...options,
    });

    em.unitOfWork.getChangeSetPersister().mapReturnedValues(entity, data, ret.row, meta, true);

    entity ??= em.entityFactory.create(entityName, data, {
      refresh: true,
      initialized: true,
      schema: options.schema,
    });

    const uniqueFields = options.onConflictFields ?? (Utils.isPlainObject(where) ? Object.keys(where) : meta!.primaryKeys) as (keyof Entity)[];
    const returning = getOnConflictReturningFields(meta, data, uniqueFields, options) as string[];

    if (options.onConflictAction === 'ignore' || !helper(entity).hasPrimaryKey() || (returning.length > 0 && !(this.getPlatform().usesReturningStatement() && ret.row))) {
      const where = {} as FilterQuery<Entity>;

      if (Array.isArray(uniqueFields)) {
        for (const prop of uniqueFields) {
          if (data![prop as EntityKey] != null) {
            where[prop as EntityKey] = data![prop as EntityKey];
          } else if (meta.primaryKeys.includes(prop as EntityKey) && ret.insertId != null) {
            where[prop as EntityKey] = ret.insertId as never;
          }
        }
      }

      const data2 = await this.driver.findOne(meta.className, where, {
        fields: returning as any[],
        ctx: em.transactionContext,
        convertCustomTypes: true,
        connectionType: 'write',
        schema: options.schema,
      });
      em.getHydrator().hydrate(entity, meta, data2!, em.entityFactory, 'full', false, true);
    }

    // recompute the data as there might be some values missing (e.g. those with db column defaults)
    const snapshot = this.comparator.prepareEntity(entity);
    em.unitOfWork.register(entity, snapshot, { refresh: true });

    if (em.eventManager.hasListeners(EventType.afterUpsert, meta)) {
      await em.eventManager.dispatchEvent(EventType.afterUpsert, { entity, em, meta }, meta);
    }

    return entity;
  }

  /**
   * Creates or updates the entity, based on whether it is already present in the database.
   * This method performs an `insert on conflict merge` query ensuring the database is in sync, returning a managed
   * entity instance. The method accepts either `entityName` together with the entity `data`, or just entity instance.
   *
   * ```ts
   * // insert into "author" ("age", "email") values (33, 'foo@bar.com') on conflict ("email") do update set "age" = 41
   * const authors = await em.upsertMany(Author, [{ email: 'foo@bar.com', age: 33 }, ...]);
   * ```
   *
   * The entity data needs to contain either the primary key, or any other unique property. Let's consider the following example, where `Author.email` is a unique property:
   *
   * ```ts
   * // insert into "author" ("age", "email") values (33, 'foo@bar.com'), (666, 'lol@lol.lol') on conflict ("email") do update set "age" = excluded."age"
   * // select "id" from "author" where "email" = 'foo@bar.com'
   * const author = await em.upsertMany(Author, [
   *   { email: 'foo@bar.com', age: 33 },
   *   { email: 'lol@lol.lol', age: 666 },
   * ]);
   * ```
   *
   * Depending on the driver support, this will either use a returning query, or a separate select query, to fetch the primary key if it's missing from the `data`.
   *
   * If the entity is already present in current context, there won't be any queries - instead, the entity data will be assigned and an explicit `flush` will be required for those changes to be persisted.
   */
  async upsertMany<Entity extends object, Fields extends string = any>(entityNameOrEntity: EntityName<Entity> | Entity[], data?: (EntityData<Entity> | NoInfer<Entity>)[], options: UpsertManyOptions<Entity, Fields> = {}): Promise<Entity[]> {
    if (options.disableIdentityMap ?? this.config.get('disableIdentityMap')) {
      const em = this.getContext(false);
      const fork = em.fork({ keepTransactionContext: true });
      const ret = await fork.upsertMany(entityNameOrEntity, data, { ...options, disableIdentityMap: false });
      fork.clear();

      return ret;
    }

    const em = this.getContext(false);
    em.prepareOptions(options);

    let entityName: string;
    let propIndex: number;

    if (data === undefined) {
      entityName = (entityNameOrEntity as Entity[])[0].constructor.name;
      data = entityNameOrEntity as Entity[];
    } else {
      entityName = Utils.className(entityNameOrEntity as EntityName<Entity>);
    }

    const batchSize = options.batchSize ?? this.config.get('batchSize');

    if (data.length > batchSize) {
      const ret: Entity[] = [];

      for (let i = 0; i < data.length; i += batchSize) {
        const chunk = data.slice(i, i + batchSize);
        ret.push(...await this.upsertMany(entityName, chunk, options));
      }

      return ret;
    }

    const meta = this.metadata.get<Entity>(entityName);
    const convertCustomTypes = !Utils.isEntity(data[0]);
    const allData: EntityData<Entity>[] = [];
    const allWhere: FilterQuery<Entity>[] = [];
    const entities = new Map<Entity, EntityData<Entity>>();
    const entitiesByData = new Map<EntityData<Entity>, Entity>();

    for (let i = 0; i < data.length; i++) {
      let row = data[i];
      let where: FilterQuery<Entity>;

      if (Utils.isEntity(row)) {
        const entity = row as Entity;

        if (helper(entity).__managed && helper(entity).__em === em && !this.config.get('upsertManaged')) {
          em.entityFactory.mergeData(meta, entity, row, { initialized: true });
          entities.set(entity, row);
          entitiesByData.set(row, entity);
          continue;
        }

        where = helper(entity).getPrimaryKey() as FilterQuery<Entity>;
        row = em.comparator.prepareEntity(entity);
      } else {
        row = data[i] = Utils.copy(QueryHelper.processParams(row));
        where = Utils.extractPK(row, meta) as FilterQuery<Entity>;

        if (where && !this.config.get('upsertManaged')) {
          const exists = em.unitOfWork.getById<Entity>(entityName, where as Primary<Entity>, options.schema);

          if (exists) {
            em.assign(exists, row as any);
            entities.set(exists, row);
            entitiesByData.set(row, exists);
            continue;
          }
        }
      }

      const unique = meta.props.filter(p => p.unique).map(p => p.name);
      propIndex = unique.findIndex(p => row[p] != null);

      if (options.onConflictFields || where == null) {
        if (propIndex >= 0) {
          where = { [unique[propIndex]]: row[unique[propIndex] as EntityKey<Entity>] } as FilterQuery<Entity>;
        } else if (meta.uniques.length > 0) {
          for (const u of meta.uniques) {
            if (Utils.asArray<EntityKey<Entity>>(u.properties).every(p => row[p] != null)) {
              where = Utils.asArray<EntityKey<Entity>>(u.properties).reduce((o, key) => {
                o[key] = row[key];
                return o;
              }, {} as Dictionary) as FilterQuery<Entity>;
              break;
            }
          }
        }
      }

      row = QueryHelper.processObjectParams(row) as EntityData<Entity>;
      where = QueryHelper.processWhere({
        where,
        entityName,
        metadata: this.metadata,
        platform: this.getPlatform(),
      });
      em.validator.validateParams(row, 'insert data');
      allData.push(row);
      allWhere.push(where);
    }

    if (entities.size === data.length) {
      return [...entities.keys()];
    }

    if (em.eventManager.hasListeners(EventType.beforeUpsert, meta)) {
      for (const dto of data) {
        const entity = entitiesByData.get(dto) ?? dto as Entity;
        await em.eventManager.dispatchEvent(EventType.beforeUpsert, { entity, em, meta }, meta);
      }
    }

    const res = await em.driver.nativeUpdateMany(entityName, allWhere, allData, {
      ctx: em.transactionContext,
      upsert: true,
      convertCustomTypes,
      ...options,
    });

    entities.clear();
    entitiesByData.clear();
    const loadPK = new Map<Entity, FilterQuery<Entity>>();

    allData.forEach((row, i) => {
      em.unitOfWork.getChangeSetPersister().mapReturnedValues(Utils.isEntity(data![i]) ? data![i] as Entity : null, Utils.isEntity(data![i]) ? {} : data![i], res.rows?.[i], meta, true);
      const entity = Utils.isEntity(data![i]) ? data![i] as Entity : em.entityFactory.create(entityName, row, {
        refresh: true,
        initialized: true,
        schema: options.schema,
      });

      if (!helper(entity).hasPrimaryKey()) {
        loadPK.set(entity, allWhere[i]);
      }

      entities.set(entity, row);
      entitiesByData.set(row, entity);
    });

    // skip if we got the PKs via returning statement (`rows`)
    const uniqueFields = options.onConflictFields ?? (Utils.isPlainObject(allWhere![0]) ? Object.keys(allWhere![0]).flatMap(key => Utils.splitPrimaryKeys(key)) : meta!.primaryKeys) as (keyof Entity)[];
    const returning = getOnConflictReturningFields(meta, data[0], uniqueFields, options) as string[];
    const reloadFields = returning.length > 0 && !(this.getPlatform().usesReturningStatement() && res.rows?.length);

    if (options.onConflictAction === 'ignore' || (!res.rows?.length && loadPK.size > 0) || reloadFields) {
      const unique = meta.hydrateProps.filter(p => !p.lazy).map(p => p.name);
      const add = new Set(propIndex! >= 0 ? [unique[propIndex!]] : [] as EntityKey<Entity>[]);

      for (const cond of loadPK.values()) {
        Utils.keys(cond).forEach(key => add.add(key as EntityKey));
      }

      const where = { $or: [] as Dictionary[] };

      if (Array.isArray(uniqueFields)) {
        data.forEach((item, idx) => {
          where.$or[idx] = {};
          uniqueFields.forEach(prop => {
            where.$or[idx][prop as string] = item[prop as EntityKey];
          });
        });
      }

      const data2 = await this.driver.find(meta.className, where, {
        fields: returning.concat(...add).concat(...(Array.isArray(uniqueFields) ? uniqueFields : []) as string[]) as any,
        ctx: em.transactionContext,
        convertCustomTypes: true,
        connectionType: 'write',
        schema: options.schema,
      });

      for (const [entity, cond] of loadPK.entries()) {
        const row = data2.find(row => {
          const tmp: Dictionary = {};
          add.forEach(k => {
            if (!meta.properties[k]?.primary) {
              tmp[k] = row[k];
            }
          });
          return this.comparator.matching(entityName, cond as EntityKey, tmp);
        });

        /* istanbul ignore next */
        if (!row) {
          throw new Error(`Cannot find matching entity for condition ${JSON.stringify(cond)}`);
        }

        em.getHydrator().hydrate(entity, meta, row, em.entityFactory, 'full', false, true);
      }

      if (loadPK.size !== data2.length && Array.isArray(uniqueFields)) {
        for (let i = 0; i < allData.length; i++) {
          const data = allData[i];
          const cond = uniqueFields.reduce((a, b) => {
            // @ts-ignore
            a[b] = data[b];
            return a;
          }, {});
          const entity = entitiesByData.get(data);
          const row = data2.find(item => {
            const pk = uniqueFields.reduce((a, b) => {
              // @ts-ignore
              a[b] = item[b];
              return a;
            }, {});
            return this.comparator.matching(entityName, cond, pk);
          });

          /* istanbul ignore next */
          if (!row) {
            throw new Error(`Cannot find matching entity for condition ${JSON.stringify(cond)}`);
          }

          em.getHydrator().hydrate(entity, meta, row, em.entityFactory, 'full');
        }
      }
    }

    for (const [entity] of entities) {
      // recompute the data as there might be some values missing (e.g. those with db column defaults)
      const snapshot = this.comparator.prepareEntity(entity);
      em.unitOfWork.register(entity, snapshot, { refresh: true });
    }

    if (em.eventManager.hasListeners(EventType.afterUpsert, meta)) {
      for (const [entity] of entities) {
        await em.eventManager.dispatchEvent(EventType.afterUpsert, { entity, em, meta }, meta);
      }
    }

    return [...entities.keys()];
  }

  /**
   * Runs your callback wrapped inside a database transaction.
   */
  async transactional<T>(cb: (em: this) => T | Promise<T>, options: TransactionOptions = {}): Promise<T> {
    const em = this.getContext(false);

    if (this.disableTransactions || em.disableTransactions) {
      return cb(em);
    }

    const fork = em.fork({
      clear: options.clear ?? false, // state will be merged once resolves
      flushMode: options.flushMode,
      cloneEventManager: true,
      disableTransactions: options.ignoreNestedTransactions,
      loggerContext: options.loggerContext,
    });
    options.ctx ??= em.transactionContext;
    const propagateToUpperContext = !em.global || this.config.get('allowGlobalContext');

    return TransactionContext.create(fork, async () => {
      return fork.getConnection().transactional(async trx => {
        fork.transactionContext = trx;

        if (propagateToUpperContext) {
          fork.eventManager.registerSubscriber({
            afterFlush(args: FlushEventArgs) {
              args.uow.getChangeSets()
                .filter(cs => [ChangeSetType.DELETE, ChangeSetType.DELETE_EARLY].includes(cs.type))
                .forEach(cs => em.unitOfWork.unsetIdentity(cs.entity));
            },
          });
        }

        const ret = await cb(fork);
        await fork.flush();

        if (propagateToUpperContext) {
          // ensure all entities from inner context are merged to the upper one
          for (const entity of fork.unitOfWork.getIdentityMap()) {
            em.merge(entity, { disableContextResolution: true, keepIdentity: true, refresh: true });
          }
        }

        return ret;
      }, { ...options, eventBroadcaster: new TransactionEventBroadcaster(fork, undefined, { topLevelTransaction: !options.ctx }) });
    });
  }

  /**
   * Starts new transaction bound to this EntityManager. Use `ctx` parameter to provide the parent when nesting transactions.
   */
  async begin(options: Omit<TransactionOptions, 'ignoreNestedTransactions'> = {}): Promise<void> {
    if (this.disableTransactions) {
      return;
    }

    const em = this.getContext(false);
    em.transactionContext = await em.getConnection('write').begin({
      ...options,
      eventBroadcaster: new TransactionEventBroadcaster(em, undefined, { topLevelTransaction: !options.ctx }),
    });
  }

  /**
   * Commits the transaction bound to this EntityManager. Flushes before doing the actual commit query.
   */
  async commit(): Promise<void> {
    const em = this.getContext(false);

    if (this.disableTransactions) {
      await em.flush();
      return;
    }

    if (!em.transactionContext) {
      throw ValidationError.transactionRequired();
    }

    await em.flush();
    await em.getConnection('write').commit(em.transactionContext, new TransactionEventBroadcaster(em));
    delete em.transactionContext;
  }

  /**
   * Rollbacks the transaction bound to this EntityManager.
   */
  async rollback(): Promise<void> {
    if (this.disableTransactions) {
      return;
    }

    const em = this.getContext(false);

    if (!em.transactionContext) {
      throw ValidationError.transactionRequired();
    }

    await em.getConnection('write').rollback(em.transactionContext, new TransactionEventBroadcaster(em));
    delete em.transactionContext;
    em.unitOfWork.clearActionsQueue();
  }

  /**
   * Runs your callback wrapped inside a database transaction.
   */
  async lock<T extends object>(entity: T, lockMode: LockMode, options: LockOptions | number | Date = {}): Promise<void> {
    options = Utils.isPlainObject(options) ? options as LockOptions : { lockVersion: options };
    await this.getUnitOfWork().lock(entity, { lockMode, ...options });
  }

  /**
   * Fires native insert query. Calling this has no side effects on the context (identity map).
   */
  async insert<Entity extends object>(entityNameOrEntity: EntityName<Entity> | Entity, data?: RequiredEntityData<Entity> | Entity, options: NativeInsertUpdateOptions<Entity> = {}): Promise<Primary<Entity>> {
    const em = this.getContext(false);
    em.prepareOptions(options);

    let entityName;

    if (data === undefined) {
      entityName = (entityNameOrEntity as Dictionary).constructor.name;
      data = entityNameOrEntity as Entity;
    } else {
      entityName = Utils.className(entityNameOrEntity as EntityName<Entity>);
    }

    if (Utils.isEntity<Entity>(data)) {
      if (options.schema && helper(data).getSchema() == null) {
        helper(data).setSchema(options.schema);
      }

      if (!helper(data).__managed) {
        // the entity might have been created via `em.create()`, which adds it to the persist stack automatically
        em.unitOfWork.getPersistStack().delete(data);
        // it can be also in the identity map if it had a PK value already
        em.unitOfWork.unsetIdentity(data);
      }

      const meta = helper(data).__meta;
      const payload = em.comparator.prepareEntity(data);
      const cs = new ChangeSet(data, ChangeSetType.CREATE, payload, meta);
      await em.unitOfWork.getChangeSetPersister().executeInserts([cs], { ctx: em.transactionContext, ...options });

      return cs.getPrimaryKey()!;
    }

    data = QueryHelper.processObjectParams(data);
    em.validator.validateParams(data, 'insert data');
    const res = await em.driver.nativeInsert<Entity>(entityName, data as EntityData<Entity>, { ctx: em.transactionContext, ...options });

    return res.insertId!;
  }

  /**
   * Fires native multi-insert query. Calling this has no side effects on the context (identity map).
   */
  async insertMany<Entity extends object>(entityNameOrEntities: EntityName<Entity> | Entity[], data?: RequiredEntityData<Entity>[] | Entity[], options: NativeInsertUpdateOptions<Entity> = {}): Promise<Primary<Entity>[]> {
    const em = this.getContext(false);
    em.prepareOptions(options);

    let entityName;

    if (data === undefined) {
      entityName = ((entityNameOrEntities as Entity[])[0] as Dictionary).constructor.name;
      data = entityNameOrEntities as Entity[];
    } else {
      entityName = Utils.className(entityNameOrEntities as EntityName<Entity>);
    }

    if (data.length === 0) {
      return [];
    }

    if (Utils.isEntity<Entity>(data[0])) {
      const meta = helper<Entity>(data[0]).__meta;
      const css = data.map(row => {
        if (options.schema && helper(row).getSchema() == null) {
          helper(row).setSchema(options.schema);
        }

        if (!helper(row).__managed) {
          // the entity might have been created via `em.create()`, which adds it to the persist stack automatically
          em.unitOfWork.getPersistStack().delete(row);

          // it can be also in the identity map if it had a PK value already
          em.unitOfWork.unsetIdentity(row);
        }

        const payload = em.comparator.prepareEntity(row) as EntityData<Entity>;
        return new ChangeSet<Entity>(row as Entity, ChangeSetType.CREATE, payload, meta);
      });
      await em.unitOfWork.getChangeSetPersister().executeInserts(css, { ctx: em.transactionContext, ...options });

      return css.map(cs => cs.getPrimaryKey()!);
    }

    data = data.map(row => QueryHelper.processObjectParams(row));
    data.forEach(row => em.validator.validateParams(row, 'insert data'));
    const res = await em.driver.nativeInsertMany<Entity>(entityName, data as EntityData<Entity>[], { ctx: em.transactionContext, ...options });

    if (res.insertedIds) {
      return res.insertedIds;
    }

    return [res.insertId];
  }

  /**
   * Fires native update query. Calling this has no side effects on the context (identity map).
   */
  async nativeUpdate<Entity extends object>(entityName: EntityName<Entity>, where: FilterQuery<NoInfer<Entity>>, data: EntityData<Entity>, options: UpdateOptions<Entity> = {}): Promise<number> {
    const em = this.getContext(false);
    em.prepareOptions(options);

    entityName = Utils.className(entityName);
    data = QueryHelper.processObjectParams(data);
    where = await em.processWhere(entityName, where, { ...options, convertCustomTypes: false }, 'update');
    em.validator.validateParams(data, 'update data');
    em.validator.validateParams(where, 'update condition');
    const res = await em.driver.nativeUpdate(entityName, where, data, { ctx: em.transactionContext, ...options });

    return res.affectedRows;
  }

  /**
   * Fires native delete query. Calling this has no side effects on the context (identity map).
   */
  async nativeDelete<Entity extends object>(entityName: EntityName<Entity>, where: FilterQuery<NoInfer<Entity>>, options: DeleteOptions<Entity> = {}): Promise<number> {
    const em = this.getContext(false);
    em.prepareOptions(options);

    entityName = Utils.className(entityName);
    where = await em.processWhere(entityName, where, options, 'delete');
    em.validator.validateParams(where, 'delete condition');
    const res = await em.driver.nativeDelete(entityName, where, { ctx: em.transactionContext, ...options });

    return res.affectedRows;
  }

  /**
   * Maps raw database result to an entity and merges it to this EntityManager.
   */
  map<Entity extends object>(entityName: EntityName<Entity>, result: EntityDictionary<Entity>, options: { schema?: string } = {}): Entity {
    entityName = Utils.className(entityName);
    const meta = this.metadata.get(entityName);
    const data = this.driver.mapResult(result, meta) as Dictionary;

    Object.keys(data).forEach(k => {
      const prop = meta.properties[k];

      if (prop && prop.kind === ReferenceKind.SCALAR && SCALAR_TYPES.includes(prop.runtimeType) && !prop.customType && (prop.setter || !prop.getter)) {
        data[k] = this.validator.validateProperty(prop, data[k], data);
      }
    });

    return this.merge<Entity>(entityName, data as EntityData<Entity>, {
      convertCustomTypes: true,
      refresh: true, ...options,
    });
  }

  /**
   * Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
   * via second parameter. By default, it will return already loaded entities without modifying them.
   */
  merge<Entity extends object>(entity: Entity, options?: MergeOptions): Entity;

  /**
   * Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
   * via second parameter. By default, it will return already loaded entities without modifying them.
   */
  merge<Entity extends object>(entityName: EntityName<Entity>, data: EntityData<Entity> | EntityDTO<Entity>, options?: MergeOptions): Entity;

  /**
   * Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
   * via second parameter. By default, it will return already loaded entities without modifying them.
   */
  merge<Entity extends object>(entityName: EntityName<Entity> | Entity, data?: EntityData<Entity> | EntityDTO<Entity> | MergeOptions, options: MergeOptions = {}): Entity {
    if (Utils.isEntity(entityName)) {
      return this.merge((entityName as Dictionary).constructor.name, entityName as unknown as EntityData<Entity>, data as MergeOptions);
    }

    const em = options.disableContextResolution ? this : this.getContext();
    options.schema ??= em._schema;
    entityName = Utils.className(entityName as string);
    em.validator.validatePrimaryKey(data as EntityData<Entity>, em.metadata.get(entityName));
    let entity = em.unitOfWork.tryGetById<Entity>(entityName, data as FilterQuery<Entity>, options.schema, false);

    if (entity && helper(entity).__managed && helper(entity).__initialized && !options.refresh) {
      return entity;
    }

    const meta = em.metadata.find(entityName)!;
    const childMeta = em.metadata.getByDiscriminatorColumn(meta, data as EntityData<Entity>);
    const dataIsEntity = Utils.isEntity<Entity>(data);

    if (options.keepIdentity && entity && dataIsEntity && entity !== data) {
      em.entityFactory.mergeData(meta, entity, helper(data).__originalEntityData!, { initialized: true, merge: true, ...options });
      return entity;
    }

    entity = dataIsEntity ? data : em.entityFactory.create<Entity>(entityName, data as EntityData<Entity>, { merge: true, ...options });
    em.validator.validate(entity, data, childMeta ?? meta);
    em.unitOfWork.merge(entity);

    return entity!;
  }

  /**
   * Creates new instance of given entity and populates it with given data.
   * The entity constructor will be used unless you provide `{ managed: true }` in the `options` parameter.
   * The constructor will be given parameters based on the defined constructor of the entity. If the constructor
   * parameter matches a property name, its value will be extracted from `data`. If no matching property exists,
   * the whole `data` parameter will be passed. This means we can also define `constructor(data: Partial<T>)` and
   * `em.create()` will pass the data into it (unless we have a property named `data` too).
   *
   * The parameters are strictly checked, you need to provide all required properties. You can use `OptionalProps`
   * symbol to omit some properties from this check without making them optional. Alternatively, use `partial: true`
   * in the options to disable the strict checks for required properties. This option has no effect on runtime.
   *
   * The newly created entity will be automatically marked for persistence via `em.persist` unless you disable this
   * behavior, either locally via `persist: false` option, or globally via `persistOnCreate` ORM config option.
   */
  create<Entity extends object, Convert extends boolean = false>(entityName: EntityName<Entity>, data: RequiredEntityData<Entity, never, Convert>, options?: CreateOptions<Convert>): Entity;

  /**
   * Creates new instance of given entity and populates it with given data.
   * The entity constructor will be used unless you provide `{ managed: true }` in the `options` parameter.
   * The constructor will be given parameters based on the defined constructor of the entity. If the constructor
   * parameter matches a property name, its value will be extracted from `data`. If no matching property exists,
   * the whole `data` parameter will be passed. This means we can also define `constructor(data: Partial<T>)` and
   * `em.create()` will pass the data into it (unless we have a property named `data` too).
   *
   * The parameters are strictly checked, you need to provide all required properties. You can use `OptionalProps`
   * symbol to omit some properties from this check without making them optional. Alternatively, use `partial: true`
   * in the options to disable the strict checks for required properties. This option has no effect on runtime.
   *
   * The newly created entity will be automatically marked for persistence via `em.persist` unless you disable this
   * behavior, either locally via `persist: false` option, or globally via `persistOnCreate` ORM config option.
   */
  create<Entity extends object, Convert extends boolean = false>(entityName: EntityName<Entity>, data: EntityData<Entity, Convert>, options: CreateOptions<Convert> & { partial: true }): Entity;

  /**
   * Creates new instance of given entity and populates it with given data.
   * The entity constructor will be used unless you provide `{ managed: true }` in the `options` parameter.
   * The constructor will be given parameters based on the defined constructor of the entity. If the constructor
   * parameter matches a property name, its value will be extracted from `data`. If no matching property exists,
   * the whole `data` parameter will be passed. This means we can also define `constructor(data: Partial<T>)` and
   * `em.create()` will pass the data into it (unless we have a property named `data` too).
   *
   * The parameters are strictly checked, you need to provide all required properties. You can use `OptionalProps`
   * symbol to omit some properties from this check without making them optional. Alternatively, use `partial: true`
   * in the options to disable the strict checks for required properties. This option has no effect on runtime.
   *
   * The newly created entity will be automatically marked for persistence via `em.persist` unless you disable this
   * behavior, either locally via `persist: false` option, or globally via `persistOnCreate` ORM config option.
   */
  create<Entity extends object, Convert extends boolean = false>(entityName: EntityName<Entity>, data: RequiredEntityData<Entity, never, Convert>, options: CreateOptions<Convert> = {}): Entity {
    const em = this.getContext();
    options.schema ??= em._schema;
    const entity = em.entityFactory.create(entityName, data as EntityData<Entity>, {
      ...options,
      newEntity: !options.managed,
      merge: options.managed,
    });
    options.persist ??= em.config.get('persistOnCreate');

    if (options.persist && !this.getMetadata(entityName).embeddable) {
      em.persist(entity);
    }

    return entity;
  }

  /**
   * Shortcut for `wrap(entity).assign(data, { em })`
   */
  assign<
    Entity extends object,
    Naked extends FromEntityType<Entity> = FromEntityType<Entity>,
    Convert extends boolean = false,
    Data extends EntityData<Naked, Convert> | Partial<EntityDTO<Naked>> = EntityData<Naked, Convert> | Partial<EntityDTO<Naked>>,
  >(entity: Entity | Partial<Entity>, data: Data & IsSubset<EntityData<Naked, Convert>, Data>, options: AssignOptions<Convert> = {}): MergeSelected<Entity, Naked, keyof Data & string> {
    return EntityAssigner.assign(entity, data as any, { em: this.getContext(), ...options }) as any;
  }

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<Entity extends object>(entityName: EntityName<Entity>, id: Primary<Entity>, options: Omit<GetReferenceOptions, 'wrapped'> & { wrapped: true }): Ref<Entity>;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<Entity extends object>(entityName: EntityName<Entity>, id: Primary<Entity> | Primary<Entity>[]): Entity;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<Entity extends object>(entityName: EntityName<Entity>, id: Primary<Entity>, options: Omit<GetReferenceOptions, 'wrapped'> & { wrapped: false }): Entity;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<Entity extends object>(entityName: EntityName<Entity>, id: Primary<Entity>, options?: GetReferenceOptions): Entity | Reference<Entity>;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<Entity extends object>(entityName: EntityName<Entity>, id: Primary<Entity>, options: GetReferenceOptions = {}): Entity | Ref<Entity> | Reference<Entity> {
    options.schema ??= this.schema;
    options.convertCustomTypes ??= false;
    const meta = this.metadata.get(Utils.className(entityName));

    if (Utils.isPrimaryKey(id)) {
      if (meta.compositePK) {
        throw ValidationError.invalidCompositeIdentifier(meta);
      }

      id = [id] as Primary<Entity>;
    }

    const entity = this.getEntityFactory().createReference<Entity>(entityName, id, { merge: true, ...options });

    if (options.wrapped) {
      return Reference.create(entity);
    }

    return entity;
  }

  /**
   * Returns total number of entities matching your `where` query.
   */
  async count<
    Entity extends object,
    Hint extends string = never,
  >(entityName: EntityName<Entity>, where: FilterQuery<NoInfer<Entity>> = {} as FilterQuery<Entity>, options: CountOptions<Entity, Hint> = {}): Promise<number> {
    const em = this.getContext(false);

    // Shallow copy options since the object will be modified when deleting orderBy
    options = { ...options };
    em.prepareOptions(options);

    entityName = Utils.className(entityName);
    await em.tryFlush(entityName, options);
    where = await em.processWhere(entityName, where, options as FindOptions<Entity, Hint>, 'read') as FilterQuery<Entity>;
    options.populate = await em.preparePopulate(entityName, options as FindOptions<Entity, Hint>) as any;
    options = { ...options };
    // save the original hint value so we know it was infer/all
    const meta = em.metadata.find(entityName)!;
    (options as Dictionary)._populateWhere = options.populateWhere ?? this.config.get('populateWhere');
    options.populateWhere = this.createPopulateWhere({ ...where } as ObjectQuery<Entity>, options);
    options.populateFilter = await this.getJoinedFilters(meta, { ...where } as ObjectQuery<Entity>, options as FindOptions<Entity>);
    em.validator.validateParams(where);
    delete (options as FindOptions<Entity>).orderBy;

    const cacheKey = em.cacheKey(entityName, options, 'em.count', where);
    const cached = await em.tryCache<Entity, number>(entityName, options.cache, cacheKey);

    if (cached?.data !== undefined) {
      return cached.data as number;
    }

    const count = await em.driver.count<Entity, Hint>(entityName, where, { ctx: em.transactionContext, em, ...options });
    await em.storeCache(options.cache, cached!, () => +count);

    return +count;
  }

  /**
   * Tells the EntityManager to make an instance managed and persistent.
   * The entity will be entered into the database at or before transaction commit or as a result of the flush operation.
   */
  persist<Entity extends object>(entity: Entity | Reference<Entity> | Iterable<Entity | Reference<Entity>>): this {
    const em = this.getContext();

    if (Utils.isEntity(entity)) {
      // do not cascade just yet, cascading of entities in persist stack is done when flushing
      em.unitOfWork.persist(entity, undefined, { cascade: false });
      return em;
    }

    const entities = Utils.asArray(entity);

    for (const ent of entities) {
      if (!Utils.isEntity(ent, true)) {
        /* istanbul ignore next */
        const meta = typeof ent === 'object' ? em.metadata.find((ent as Dictionary).constructor.name) : undefined;
        throw ValidationError.notDiscoveredEntity(ent, meta);
      }

      // do not cascade just yet, cascading of entities in persist stack is done when flushing
      em.unitOfWork.persist(Reference.unwrapReference(ent), undefined, { cascade: false });
    }

    return this;
  }

  /**
   * Persists your entity immediately, flushing all not yet persisted changes to the database too.
   * Equivalent to `em.persist(e).flush()`.
   */
  async persistAndFlush(entity: AnyEntity | Reference<AnyEntity> | Iterable<AnyEntity | Reference<AnyEntity>>): Promise<void> {
    await this.persist(entity).flush();
  }

  /**
   * Marks entity for removal.
   * A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.
   *
   * To remove entities by condition, use `em.nativeDelete()`.
   */
  remove<Entity extends object>(entity: Entity | Reference<Entity> | Iterable<Entity | Reference<Entity>>): this {
    const em = this.getContext();

    if (Utils.isEntity<Entity>(entity)) {
      // do not cascade just yet, cascading of entities in persist stack is done when flushing
      em.unitOfWork.remove(entity, undefined, { cascade: false });
      return em;
    }

    const entities = Utils.asArray(entity, true);

    for (const ent of entities) {
      if (!Utils.isEntity(ent, true)) {
        throw new Error(`You need to pass entity instance or reference to 'em.remove()'. To remove entities by condition, use 'em.nativeDelete()'.`);
      }

      // do not cascade just yet, cascading of entities in remove stack is done when flushing
      em.unitOfWork.remove(Reference.unwrapReference(ent), undefined, { cascade: false });
    }

    return em;
  }

  /**
   * Removes an entity instance immediately, flushing all not yet persisted changes to the database too.
   * Equivalent to `em.remove(e).flush()`
   */
  async removeAndFlush(entity: AnyEntity | Reference<AnyEntity> | Iterable<AnyEntity | Reference<AnyEntity>>): Promise<void> {
    await this.remove(entity).flush();
  }

  /**
   * Flushes all changes to objects that have been queued up to now to the database.
   * This effectively synchronizes the in-memory state of managed objects with the database.
   */
  async flush(): Promise<void> {
    await this.getUnitOfWork().commit();
  }

  /**
   * @internal
   */
  async tryFlush<Entity extends object>(entityName: EntityName<Entity>, options: { flushMode?: FlushMode | AnyString }): Promise<void> {
    const em = this.getContext();
    const flushMode = options.flushMode ?? em.flushMode ?? em.config.get('flushMode');
    entityName = Utils.className(entityName);
    const meta = em.metadata.get(entityName);

    if (flushMode === FlushMode.COMMIT) {
      return;
    }

    if (flushMode === FlushMode.ALWAYS || em.getUnitOfWork().shouldAutoFlush(meta)) {
      await em.flush();
    }
  }

  /**
   * Clears the EntityManager. All entities that are currently managed by this EntityManager become detached.
   */
  clear(): void {
    this.getContext().unitOfWork.clear();
  }

  /**
   * Checks whether given property can be populated on the entity.
   */
  canPopulate<Entity extends object>(entityName: EntityName<Entity>, property: string): boolean {
    entityName = Utils.className(entityName);
    // eslint-disable-next-line prefer-const
    let [p, ...parts] = property.split('.');
    const meta = this.metadata.find(entityName);

    if (!meta) {
      return true;
    }

    if (p.includes(':')) {
      p = p.split(':', 2)[0];
    }

    const ret = p in meta.root.properties;

    if (!ret) {
      return !!this.metadata.find(property)?.pivotTable;
    }

    if (parts.length > 0) {
      return this.canPopulate((meta.root.properties)[p].type, parts.join('.'));
    }

    return ret;
  }

  /**
   * Loads specified relations in batch. This will execute one query for each relation, that will populate it on all the specified entities.
   */
  async populate<
    Entity extends object,
    Naked extends FromEntityType<UnboxArray<Entity>> = FromEntityType<UnboxArray<Entity>>,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(entities: Entity, populate: readonly AutoPath<Naked, Hint, PopulatePath.ALL>[] | false, options: EntityLoaderOptions<Naked, Fields, Excludes> = {}): Promise<Entity extends object[] ? MergeLoaded<ArrayElement<Entity>, Naked, Hint, Fields, Excludes>[] : MergeLoaded<Entity, Naked, Hint, Fields, Excludes>> {
    const arr = Utils.asArray(entities);

    if (arr.length === 0) {
      return entities as any;
    }

    const em = this.getContext();
    em.prepareOptions(options);
    const entityName = (arr[0] as Dictionary).constructor.name;
    const preparedPopulate = await em.preparePopulate<Entity>(entityName, { populate: populate as any }, options.validate);
    await em.entityLoader.populate(entityName, arr, preparedPopulate, options as EntityLoaderOptions<Entity>);

    return entities as any;
  }

  /**
   * Returns new EntityManager instance with its own identity map
   */
  fork(options: ForkOptions = {}): this {
    const em = options.disableContextResolution ? this : this.getContext(false);
    options.clear ??= true;
    options.useContext ??= false;
    options.freshEventManager ??= false;
    options.cloneEventManager ??= false;

    const eventManager = options.freshEventManager
      ? new EventManager(em.config.get('subscribers'))
      : options.cloneEventManager
        ? em.eventManager.clone()
        : em.eventManager;

    // we need to allow global context here as forking from global EM is fine
    const allowGlobalContext = em.config.get('allowGlobalContext');
    em.config.set('allowGlobalContext', true);
    const fork = new (em.constructor as typeof EntityManager)(em.config, em.driver, em.metadata, options.useContext, eventManager);
    fork.setFlushMode(options.flushMode ?? em.flushMode);
    fork.disableTransactions = options.disableTransactions ?? this.disableTransactions ?? this.config.get('disableTransactions');
    em.config.set('allowGlobalContext', allowGlobalContext);

    if (options.keepTransactionContext) {
      fork.transactionContext = em.transactionContext;
    }

    fork.filters = { ...em.filters };
    fork.filterParams = Utils.copy(em.filterParams);
    fork.loggerContext = Utils.merge({}, em.loggerContext, options.loggerContext);
    fork._schema = options.schema ?? em._schema;

    if (!options.clear) {
      for (const entity of em.unitOfWork.getIdentityMap()) {
        fork.unitOfWork.register(entity);
      }

      for (const entity of em.unitOfWork.getOrphanRemoveStack()) {
        fork.unitOfWork.getOrphanRemoveStack().add(entity);
      }
    }

    return fork as this;
  }

  /**
   * Gets the UnitOfWork used by the EntityManager to coordinate operations.
   */
  getUnitOfWork(useContext = true): UnitOfWork {
    if (!useContext) {
      return this.unitOfWork;
    }

    return this.getContext().unitOfWork;
  }

  /**
   * Gets the EntityFactory used by the EntityManager.
   */
  getEntityFactory(): EntityFactory {
    return this.getContext().entityFactory;
  }

  /**
   * @internal use `em.populate()` as the user facing API, this is exposed only for internal usage
   */
  getEntityLoader(): EntityLoader {
    return this.getContext().entityLoader;
  }

  /**
   * Gets the Hydrator used by the EntityManager.
   */
  getHydrator(): IHydrator {
    return this.config.getHydrator(this.getMetadata());
  }

  /**
   * Gets the EntityManager based on current transaction/request context.
   * @internal
   */
  getContext(validate = true): this {
    if (!this.useContext) {
      return this;
    }

    let em = TransactionContext.getEntityManager(this.name) as this; // prefer the tx context

    if (em) {
      return em;
    }

    // no explicit tx started
    em = this.config.get('context')(this.name) as this ?? this;

    if (validate && !this.config.get('allowGlobalContext') && em.global) {
      throw ValidationError.cannotUseGlobalContext();
    }

    return em;
  }

  getEventManager(): EventManager {
    return this.eventManager;
  }

  /**
   * Checks whether this EntityManager is currently operating inside a database transaction.
   */
  isInTransaction(): boolean {
    return !!this.getContext(false).transactionContext;
  }

  /**
   * Gets the transaction context (driver dependent object used to make sure queries are executed on same connection).
   */
  getTransactionContext<T extends Transaction = Transaction>(): T | undefined {
    return this.getContext(false).transactionContext as T;
  }

  /**
   * Sets the transaction context.
   */
  setTransactionContext(ctx: Transaction): void {
    this.getContext(false).transactionContext = ctx;
  }

  /**
   * Resets the transaction context.
   */
  resetTransactionContext(): void {
    delete this.getContext(false).transactionContext;
  }

  /**
   * Gets the `MetadataStorage`.
   */
  getMetadata(): MetadataStorage;

  /**
   * Gets the `EntityMetadata` instance when provided with the `entityName` parameter.
   */
  getMetadata<Entity extends object>(entityName: EntityName<Entity>): EntityMetadata<Entity>;

  /**
   * Gets the `MetadataStorage` (without parameters) or `EntityMetadata` instance when provided with the `entityName` parameter.
   */
  getMetadata<Entity extends object>(entityName?: EntityName<Entity>): EntityMetadata<Entity> | MetadataStorage {
    if (entityName) {
      entityName = Utils.className(entityName);
      return this.metadata.get(entityName);
    }

    return this.metadata;
  }

  /**
   * Gets the EntityComparator.
   */
  getComparator(): EntityComparator {
    return this.comparator;
  }

  private checkLockRequirements(mode: LockMode | undefined, meta: EntityMetadata): void {
    if (!mode) {
      return;
    }

    if (mode === LockMode.OPTIMISTIC && !meta.versionProperty) {
      throw OptimisticLockError.notVersioned(meta);
    }

    if ([LockMode.PESSIMISTIC_READ, LockMode.PESSIMISTIC_WRITE].includes(mode) && !this.isInTransaction()) {
      throw ValidationError.transactionRequired();
    }
  }

  private async lockAndPopulate<T extends object, P extends string = never, F extends string = '*', E extends string = never>(meta: EntityMetadata<T>, entity: T, where: FilterQuery<T>, options: FindOneOptions<T, P, F, E>): Promise<Loaded<T, P, F, E>> {
    if (!meta.virtual && options.lockMode === LockMode.OPTIMISTIC) {
      await this.lock(entity, options.lockMode, {
        lockVersion: options.lockVersion,
        lockTableAliases: options.lockTableAliases,
      });
    }

    const preparedPopulate = await this.preparePopulate<T>(meta.className, options);
    await this.entityLoader.populate(meta.className, [entity], preparedPopulate, {
      ...options as Dictionary,
      ...this.getPopulateWhere<T>(where as ObjectQuery<T>, options),
      orderBy: options.populateOrderBy ?? options.orderBy,
      convertCustomTypes: false,
      ignoreLazyScalarProperties: true,
      lookup: false,
    });

    return entity as Loaded<T, P, F, E>;
  }

  private buildFields<T extends object, P extends string>(fields: readonly EntityField<T, P>[]): string[] {
    return fields.reduce((ret, f) => {
      if (Utils.isPlainObject(f)) {
        Utils.keys(f).forEach(ff => ret.push(...this.buildFields(f[ff]!).map(field => `${ff as string}.${field}` as never)));
      } else {
        ret.push(f as never);
      }

      return ret;
    }, [] as string[]);
  }

  private async preparePopulate<Entity extends object>(entityName: string, options: Pick<FindOptions<Entity, any, any>, 'populate' | 'strategy' | 'fields' | 'flags'>, validate = true): Promise<PopulateOptions<Entity>[]> {
    if (options.populate === false) {
      return [];
    }

    const meta = this.metadata.find(entityName)!;

    // infer populate hint if only `fields` are available
    if (!options.populate && options.fields) {
      // we need to prune the `populate` hint from to-one relations, as partially loading them does not require their population, we want just the FK
      const pruneToOneRelations = (meta: EntityMetadata, fields: string[]): string[] => {
        const ret: string[] = [];

        for (let field of fields) {
          if (field === PopulatePath.ALL || field.startsWith(`${PopulatePath.ALL}.`)) {
            ret.push(...meta.props.filter(prop => prop.lazy || [ReferenceKind.SCALAR, ReferenceKind.EMBEDDED].includes(prop.kind)).map(prop => prop.name));
            continue;
          }

          field = field.split(':')[0];

          if (!field.includes('.') && ![ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(meta.properties[field].kind)) {
            ret.push(field);
            continue;
          }

          const parts = field.split('.');
          const key = parts.shift()!;

          if (parts.length === 0) {
            continue;
          }

          const prop = meta.properties[key];

          if (!prop.targetMeta) {
            ret.push(key);
            continue;
          }

          const inner = pruneToOneRelations(prop.targetMeta, [parts.join('.')]);

          if (inner.length > 0) {
            ret.push(...inner.map(c => `${key}.${c}`));
          }
        }

        return Utils.unique(ret);
      };

      options.populate = pruneToOneRelations(meta, this.buildFields(options.fields)) as any;
    }

    if (!options.populate) {
      const populate = this.entityLoader.normalizePopulate<Entity>(entityName, [], options.strategy as LoadStrategy);
      await this.autoJoinRefsForFilters(meta, { ...options, populate });

      return populate;
    }

    if (typeof options.populate !== 'boolean') {
      options.populate = Utils.asArray(options.populate).map(field => {
        /* istanbul ignore next */
        if (typeof field === 'boolean' || field === PopulatePath.ALL) {
          return [{ field: meta.primaryKeys[0], strategy: options.strategy, all: !!field }]; //
        }

        // will be handled in QueryBuilder when processing the where condition via CriteriaNode
        if (field === PopulatePath.INFER) {
          options.flags ??= [];
          options.flags.push(QueryFlag.INFER_POPULATE);

          return [];
        }

        if (Utils.isString(field)) {
          return [{ field, strategy: options.strategy }];
        }

        return [field];
      }).flat() as any;
    }

    const populate: PopulateOptions<Entity>[] = this.entityLoader.normalizePopulate<Entity>(entityName, options.populate as true, options.strategy as LoadStrategy);
    const invalid = populate.find(({ field }) => !this.canPopulate(entityName, field));

    if (validate && invalid) {
      throw ValidationError.invalidPropertyName(entityName, invalid.field);
    }

    await this.autoJoinRefsForFilters(meta, { ...options, populate });

    return populate.map(field => {
      // force select-in strategy when populating all relations as otherwise we could cause infinite loops when self-referencing
      const all = field.all ?? (Array.isArray(options.populate) && options.populate.includes('*'));
      field.strategy = all ? LoadStrategy.SELECT_IN : (options.strategy ?? field.strategy) as LoadStrategy;

      return field;
    });
  }

  /**
   * when the entity is found in identity map, we check if it was partially loaded or we are trying to populate
   * some additional lazy properties, if so, we reload and merge the data from database
   */
  protected shouldRefresh<T extends object, P extends string = never, F extends string = '*', E extends string = never>(meta: EntityMetadata<T>, entity: T, options: FindOneOptions<T, P, F, E>) {
    if (!helper(entity).__initialized || options.refresh) {
      return true;
    }

    let autoRefresh: boolean;

    if (options.fields) {
      autoRefresh = options.fields.some(field => !helper(entity).__loadedProperties.has(field as string));
    } else {
      autoRefresh = meta.comparableProps.some(prop => {
        const inlineEmbedded = prop.kind === ReferenceKind.EMBEDDED && !prop.object;
        return !inlineEmbedded && !prop.lazy && !helper(entity).__loadedProperties.has(prop.name);
      });
    }

    if (autoRefresh) {
      return true;
    }

    if (Array.isArray(options.populate)) {
      return options.populate.some(field => !helper(entity).__loadedProperties.has(field as string));
    }

    return !!options.populate;
  }

  protected prepareOptions(options: FindOptions<any, any, any, any> | FindOneOptions<any, any, any, any> | CountOptions<any, any>): void {
    if (!Utils.isEmpty((options as FindOptions<any>).fields) && !Utils.isEmpty((options as FindOptions<any>).exclude)) {
      throw new ValidationError(`Cannot combine 'fields' and 'exclude' option.`);
    }

    options.schema ??= this._schema;
    options.logging = options.loggerContext = Utils.merge(
      { id: this.id },
      this.loggerContext,
      options.loggerContext,
      options.logging,
    );
  }

  /**
   * @internal
   */
  cacheKey<T extends object>(
    entityName: string,
    options: FindOptions<T, any, any, any> | FindOneOptions<T, any, any, any> | CountOptions<T, any>,
    method: string,
    where: FilterQuery<T>,
  ): unknown[] {
    const { ...opts } = options;

    // ignore some irrelevant options, e.g. logger context can contain dynamic data for the same query
    for (const k of ['ctx', 'strategy', 'flushMode', 'logging', 'loggerContext']) {
      delete opts[k as keyof typeof opts];
    }

    return [entityName, method, opts, where];
  }

  /**
   * @internal
   */
  async tryCache<T extends object, R>(entityName: string, config: boolean | number | [string, number] | undefined, key: unknown, refresh?: boolean, merge?: boolean): Promise<{ data?: R | null; key: string } | undefined> {
    config ??= this.config.get('resultCache').global;

    if (!config) {
      return undefined;
    }

    const em = this.getContext();
    const cacheKey = Array.isArray(config) ? config[0] : JSON.stringify(key);
    const cached = await em.resultCache.get(cacheKey!);

    if (!cached) {
      return { key: cacheKey, data: cached };
    }

    let data: R;

    if (Array.isArray(cached) && merge) {
      data = cached.map(item => em.entityFactory.create<T>(entityName, item, {
        merge: true,
        convertCustomTypes: true,
        refresh,
        recomputeSnapshot: true,
      })) as unknown as R;
    } else if (Utils.isObject<EntityData<T>>(cached) && merge) {
      data = em.entityFactory.create<T>(entityName, cached, {
        merge: true,
        convertCustomTypes: true,
        refresh,
        recomputeSnapshot: true,
      }) as unknown as R;
    } else {
      data = cached;
    }

    await em.unitOfWork.dispatchOnLoadEvent();

    return { key: cacheKey, data };
  }

  /**
   * @internal
   */
  async storeCache(config: boolean | number | [string, number] | undefined, key: { key: string }, data: unknown | (() => unknown)) {
    config ??= this.config.get('resultCache').global;

    if (config) {
      const em = this.getContext();
      const expiration = Array.isArray(config) ? config[1] : (Utils.isNumber(config) ? config : undefined);
      await em.resultCache.set(key.key, data instanceof Function ? data() : data, '', expiration);
    }
  }

  /**
   * Clears result cache for given cache key. If we want to be able to call this method,
   * we need to set the cache key explicitly when storing the cache.
   *
   * ```ts
   * // set the cache key to 'book-cache-key', with expiration of 60s
   * const res = await em.find(Book, { ... }, { cache: ['book-cache-key', 60_000] });
   *
   * // clear the cache key by name
   * await em.clearCache('book-cache-key');
   * ```
   */
  async clearCache(cacheKey: string) {
    await this.getContext().resultCache.remove(cacheKey);
  }

  /**
   * Returns the default schema of this EntityManager. Respects the context, so global EM will give you the contextual schema
   * if executed inside request context handler.
   */
  get schema(): string | undefined {
    return this.getContext(false)._schema;
  }

  /**
   * Sets the default schema of this EntityManager. Respects the context, so global EM will set the contextual schema
   * if executed inside request context handler.
   */
  set schema(schema: string | null | undefined) {
    this.getContext(false)._schema = schema ?? undefined;
  }

  /**
   * Returns the ID of this EntityManager. Respects the context, so global EM will give you the contextual ID
   * if executed inside request context handler.
   */
  get id(): number {
    return this.getContext(false)._id;
  }

  /** @ignore */
  [inspect.custom]() {
    return `[EntityManager<${this.id}>]`;
  }

}

export interface CreateOptions<Convert extends boolean> {
  /** creates a managed entity instance instead, bypassing the constructor call */
  managed?: boolean;
  /** create entity in a specific schema - alternatively, use `wrap(entity).setSchema()` */
  schema?: string;
  /** persist the entity automatically - this is the default behavior and is also configurable globally via `persistOnCreate` option */
  persist?: boolean;
  /** this option disables the strict typing which requires all mandatory properties to have value, it has no effect on runtime */
  partial?: boolean;
  /** convert raw database values based on mapped types (by default, already converted values are expected) */
  convertCustomTypes?: Convert;
  /**
   * Property `onCreate` hooks are normally executed during `flush` operation.
   * With this option, they will be processed early inside `em.create()` method.
   */
  processOnCreateHooksEarly?: boolean;
}

export interface MergeOptions {
  refresh?: boolean;
  convertCustomTypes?: boolean;
  schema?: string;
  disableContextResolution?: boolean;
  keepIdentity?: boolean;
}

export interface ForkOptions {
  /** do we want a clear identity map? defaults to true */
  clear?: boolean;
  /** use request context? should be used only for top level request scope EM, defaults to false */
  useContext?: boolean;
  /** do we want to use fresh EventManager instance? defaults to false (global instance) */
  freshEventManager?: boolean;
  /** do we want to clone current EventManager instance? defaults to false (global instance) */
  cloneEventManager?: boolean;
  /** use this flag to ignore the current async context - this is required if we want to call `em.fork()` inside the `getContext` handler */
  disableContextResolution?: boolean;
  /** set flush mode for this fork, overrides the global option can be overridden locally via FindOptions */
  flushMode?: FlushMode;
  /** disable transactions for this fork */
  disableTransactions?: boolean;
  /** should we keep the transaction context of the parent EM? */
  keepTransactionContext?: boolean;
  /** default schema to use for this fork */
  schema?: string;
  /** default logger context, can be overridden via {@apilink FindOptions} */
  loggerContext?: Dictionary;
}
