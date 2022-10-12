import { inspect } from 'util';
import type { Configuration } from './utils';
import { QueryHelper, TransactionContext, Utils } from './utils';
import type { AssignOptions, EntityLoaderOptions, EntityRepository, IdentifiedReference } from './entity';
import { EntityAssigner, EntityFactory, EntityLoader, EntityValidator, helper, Reference } from './entity';
import { ChangeSetType, UnitOfWork } from './unit-of-work';
import type { CountOptions, DeleteOptions, EntityManagerType, FindOneOptions, FindOneOrFailOptions, FindOptions, IDatabaseDriver, LockOptions, NativeInsertUpdateOptions, UpdateOptions, GetReferenceOptions, EntityField } from './drivers';
import type { AnyEntity, AutoPath, ConnectionType, Dictionary, EntityData, EntityDictionary, EntityDTO, EntityMetadata, EntityName, FilterDef, FilterQuery, GetRepository, Loaded, Populate, PopulateOptions, Primary, RequiredEntityData } from './typings';
import { FlushMode, LoadStrategy, LockMode, PopulateHint, ReferenceType, SCALAR_TYPES } from './enums';
import type { TransactionOptions } from './enums';
import type { MetadataStorage } from './metadata';
import type { Transaction } from './connections';
import type { FlushEventArgs } from './events';
import { EventManager, TransactionEventBroadcaster } from './events';
import type { EntityComparator } from './utils/EntityComparator';
import { OptimisticLockError, ValidationError } from './errors';
import type { CommitOptions } from './unit-of-work/UnitOfWork';

/**
 * The EntityManager is the central access point to ORM functionality. It is a facade to all different ORM subsystems
 * such as UnitOfWork, Query Language and Repository API.
 * @template {D} current driver type
 */
export class EntityManager<D extends IDatabaseDriver = IDatabaseDriver> {

  private static counter = 1;
  readonly _id = EntityManager.counter++;
  readonly global = false;
  readonly name = this.config.get('contextName');
  private readonly validator = new EntityValidator(this.config.get('strict'));
  private readonly repositoryMap: Dictionary<EntityRepository<any>> = {};
  private readonly entityLoader: EntityLoader = new EntityLoader(this);
  private readonly comparator = this.config.getComparator(this.metadata);
  private readonly entityFactory: EntityFactory = new EntityFactory(this);
  private readonly unitOfWork: UnitOfWork = new UnitOfWork(this);
  private readonly resultCache = this.config.getResultCacheAdapter();
  private filters: Dictionary<FilterDef> = {};
  private filterParams: Dictionary<Dictionary> = {};
  private transactionContext?: Transaction;
  private flushMode?: FlushMode;

  /**
   * @internal
   */
  constructor(readonly config: Configuration,
              private readonly driver: D,
              private readonly metadata: MetadataStorage,
              private readonly useContext = true,
              private readonly eventManager = new EventManager(config.get('subscribers'))) { }

  /**
   * Gets the Driver instance used by this EntityManager.
   * Driver is singleton, for one MikroORM instance, only one driver is created.
   */
  getDriver(): D {
    return this.driver;
  }

  /**
   * Gets the Connection instance, by default returns write connection
   */
  getConnection(type?: ConnectionType): ReturnType<D['getConnection']> {
    return this.driver.getConnection(type) as ReturnType<D['getConnection']>;
  }

  /**
   * Gets the platform instance. Just like the driver, platform is singleton, one for a MikroORM instance.
   */
  getPlatform(): ReturnType<D['getPlatform']> {
    return this.driver.getPlatform() as ReturnType<D['getPlatform']>;
  }

  /**
   * Gets repository for given entity. You can pass either string name or entity class reference.
   */
  getRepository<T extends object, U extends EntityRepository<T> = EntityRepository<T>>(entityName: EntityName<T>): GetRepository<T, U> {
    entityName = Utils.className(entityName);

    if (!this.repositoryMap[entityName]) {
      const meta = this.metadata.get(entityName);
      const RepositoryClass = this.config.getRepositoryClass(meta.customRepository)!;
      this.repositoryMap[entityName] = new RepositoryClass(this.getContext(false), entityName) as EntityRepository<any>;
    }

    return this.repositoryMap[entityName] as unknown as GetRepository<T, U>;
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
  async find<T extends object, P extends string = never>(entityName: EntityName<T>, where: FilterQuery<T>, options: FindOptions<T, P> = {}): Promise<Loaded<T, P>[]> {
    if (options.disableIdentityMap) {
      const em = this.getContext(false);
      const fork = em.fork();
      const ret = await fork.find<T, P>(entityName, where, { ...options, disableIdentityMap: false });
      fork.clear();

      return ret;
    }

    const em = this.getContext();
    await em.tryFlush(entityName, options);
    entityName = Utils.className(entityName);
    where = await em.processWhere<T, P>(entityName, where, options, 'read');
    em.validator.validateParams(where);
    options.orderBy = options.orderBy || {};
    options.populate = em.preparePopulate<T, P>(entityName, options) as unknown as Populate<T, P>;
    const populate = options.populate as unknown as PopulateOptions<T>[];
    const cached = await em.tryCache<T, Loaded<T, P>[]>(entityName, options.cache, [entityName, 'em.find', options, where], options.refresh, true);

    if (cached?.data) {
      await em.entityLoader.populate<T, P>(entityName, cached.data as T[], populate, {
        ...options as Dictionary,
        ...em.getPopulateWhere(where, options),
        convertCustomTypes: false,
        ignoreLazyScalarProperties: true,
        lookup: false,
      });

      return cached.data;
    }

    const results = await em.driver.find<T, P>(entityName, where, { ctx: em.transactionContext, ...options });

    if (results.length === 0) {
      await em.storeCache(options.cache, cached!, []);
      return [];
    }

    const meta = this.metadata.get(entityName);
    const ret: T[] = [];

    for (const data of results) {
      const entity = em.entityFactory.create(entityName, data as EntityData<T>, {
        merge: true,
        refresh: options.refresh,
        schema: options.schema,
        convertCustomTypes: true,
      }) as T;

      if (!meta.virtual) {
        em.unitOfWork.registerManaged(entity, data, { refresh: options.refresh, loaded: true });
      }

      ret.push(entity);
    }

    if (meta.virtual) {
      await em.unitOfWork.dispatchOnLoadEvent();
      await em.storeCache(options.cache, cached!, () => ret);

      return ret as Loaded<T, P>[];
    }

    const unique = Utils.unique(ret);
    await em.entityLoader.populate<T, P>(entityName, unique, populate, {
      ...options as Dictionary,
      ...em.getPopulateWhere(where, options),
      convertCustomTypes: false,
      ignoreLazyScalarProperties: true,
      lookup: false,
    });
    await em.unitOfWork.dispatchOnLoadEvent();
    await em.storeCache(options.cache, cached!, () => unique.map(e => helper(e).toPOJO()));

    return unique as Loaded<T, P>[];
  }

  private getPopulateWhere<T extends object, P extends string>(where: FilterQuery<T>, options: Pick<FindOptions<T, P>, 'populateWhere'>): { where: FilterQuery<T>; populateWhere?: PopulateHint } {
    if (options.populateWhere === undefined) {
      options.populateWhere = this.config.get('populateWhere');
    }

    if (options.populateWhere === PopulateHint.ALL) {
      return { where: {} as FilterQuery<T>, populateWhere: options.populateWhere };
    }

    if (options.populateWhere === PopulateHint.INFER) {
      return { where, populateWhere: options.populateWhere };
    }

    return { where: options.populateWhere };
  }

  /**
   * Registers global filter to this entity manager. Global filters are enabled by default (unless disabled via last parameter).
   */
  addFilter<T1>(name: string, cond: FilterQuery<T1> | ((args: Dictionary) => FilterQuery<T1>), entityName?: EntityName<T1> | [EntityName<T1>], enabled?: boolean): void;

  /**
   * Registers global filter to this entity manager. Global filters are enabled by default (unless disabled via last parameter).
   */
  addFilter<T1, T2>(name: string, cond: FilterQuery<T1 | T2> | ((args: Dictionary) => FilterQuery<T1 | T2>), entityName?: [EntityName<T1>, EntityName<T2>], enabled?: boolean): void;

  /**
   * Registers global filter to this entity manager. Global filters are enabled by default (unless disabled via last parameter).
   */
  addFilter<T1, T2, T3>(name: string, cond: FilterQuery<T1 | T2 | T3> | ((args: Dictionary) => FilterQuery<T1 | T2 | T3>), entityName?: [EntityName<T1>, EntityName<T2>, EntityName<T3>], enabled?: boolean): void;

  /**
   * Registers global filter to this entity manager. Global filters are enabled by default (unless disabled via last parameter).
   */
  addFilter(name: string, cond: Dictionary | ((args: Dictionary) => FilterQuery<AnyEntity>), entityName?: EntityName<AnyEntity> | EntityName<AnyEntity>[], enabled = true): void {
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

  setFlushMode(flushMode?: FlushMode): void {
    this.getContext(false).flushMode = flushMode;
  }

  protected async processWhere<T extends object, P extends string = never>(entityName: string, where: FilterQuery<T>, options: FindOptions<T, P> | FindOneOptions<T, P>, type: 'read' | 'update' | 'delete'): Promise<FilterQuery<T>> {
    where = QueryHelper.processWhere({
      where: where as FilterQuery<T>,
      entityName,
      metadata: this.metadata,
      platform: this.driver.getPlatform(),
      convertCustomTypes: options.convertCustomTypes,
      aliased: type === 'read',
    });
    where = await this.applyFilters(entityName, where, options.filters ?? {}, type);
    where = await this.applyDiscriminatorCondition(entityName, where);

    return where;
  }

  protected applyDiscriminatorCondition<T extends object>(entityName: string, where: FilterQuery<T>): FilterQuery<T> {
    const meta = this.metadata.find(entityName);

    if (!meta || !meta.discriminatorValue) {
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
    where![meta.root.discriminatorColumn!] = children.length > 0 ? { $in: [meta.discriminatorValue, ...children.map(c => c.discriminatorValue)] } : meta.discriminatorValue;

    return where;
  }

  /**
   * @internal
   */
  async applyFilters<T extends object>(entityName: string, where: FilterQuery<T>, options: Dictionary<boolean | Dictionary> | string[] | boolean, type: 'read' | 'update' | 'delete'): Promise<FilterQuery<T>> {
    const meta = this.metadata.find<T>(entityName);
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
        const args = Utils.isPlainObject(options[filter.name]) ? options[filter.name] : this.getContext().filterParams[filter.name];

        if (!args && filter.cond.length > 0 && filter.args !== false) {
          throw new Error(`No arguments provided for filter '${filter.name}'`);
        }

        cond = await filter.cond(args, type, this);
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

    const conds = [...ret, where as Dictionary].filter(c => Utils.hasObjectKeys(c)) as FilterQuery<T>[];

    return conds.length > 1 ? { $and: conds } as FilterQuery<T> : conds[0];
  }

  /**
   * Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
   * where first element is the array of entities and the second is the count.
   */
  async findAndCount<T extends object, P extends string = never>(entityName: EntityName<T>, where: FilterQuery<T>, options: FindOptions<T, P> = {}): Promise<[Loaded<T, P>[], number]> {
    const [entities, count] = await Promise.all([
      this.find<T, P>(entityName, where, options),
      this.count(entityName, where, options),
    ]);

    return [entities, count];
  }

  /**
   * Refreshes the persistent state of an entity from the database, overriding any local changes that have not yet been persisted.
   */
  async refresh<T extends object, P extends string = never>(entity: T, options: FindOneOptions<T, P> = {}): Promise<T> {
    await this.findOne(entity.constructor.name, entity, {
      schema: helper(entity).__schema,
      ...options,
      refresh: true,
      flushMode: FlushMode.COMMIT,
    });

    return entity;
  }

  /**
   * Finds first entity matching your `where` query.
   */
  async findOne<T extends object, P extends string = never>(entityName: EntityName<T>, where: FilterQuery<T>, options: FindOneOptions<T, P> = {}): Promise<Loaded<T, P> | null> {
    if (options.disableIdentityMap) {
      const em = this.getContext(false);
      const fork = em.fork();
      const ret = await fork.findOne<T, P>(entityName, where, { ...options, disableIdentityMap: false });
      fork.clear();

      return ret;
    }

    const em = this.getContext();
    await em.tryFlush(entityName, options);
    entityName = Utils.className(entityName);
    const meta = em.metadata.get<T>(entityName);
    where = await em.processWhere(entityName, where, options, 'read');
    em.validator.validateEmptyWhere(where);
    em.checkLockRequirements(options.lockMode, meta);
    let entity = em.unitOfWork.tryGetById<T>(entityName, where, options.schema);
    const isOptimisticLocking = !Utils.isDefined(options.lockMode) || options.lockMode === LockMode.OPTIMISTIC;

    if (entity && !em.shouldRefresh(meta, entity, options) && isOptimisticLocking) {
      return em.lockAndPopulate(entityName, entity, where, options);
    }

    em.validator.validateParams(where);
    options.populate = em.preparePopulate<T, P>(entityName, options) as unknown as Populate<T, P>;
    const cached = await em.tryCache<T, Loaded<T, P>>(entityName, options.cache, [entityName, 'em.findOne', options, where], options.refresh, true);

    if (cached?.data) {
      await em.entityLoader.populate<T, P>(entityName, [cached.data as T], options.populate as unknown as PopulateOptions<T>[], {
        ...options as Dictionary,
        ...em.getPopulateWhere(where, options),
        convertCustomTypes: false,
        ignoreLazyScalarProperties: true,
        lookup: false,
      });
      em.unitOfWork.saveSnapshots();

      return cached.data;
    }

    const data = await em.driver.findOne<T, P>(entityName, where, { ctx: em.transactionContext, ...options });

    if (!data) {
      await em.storeCache(options.cache, cached!, null);
      return null;
    }

    entity = em.entityFactory.create<T>(entityName, data as EntityData<T>, {
      merge: true,
      refresh: options.refresh,
      schema: options.schema,
      convertCustomTypes: true,
    });

    if (!meta.virtual) {
      em.unitOfWork.registerManaged(entity, data, { refresh: options.refresh, loaded: true });
      await em.lockAndPopulate(entityName, entity, where, options);
    }

    await em.unitOfWork.dispatchOnLoadEvent();
    await em.storeCache(options.cache, cached!, () => helper(entity).toPOJO());

    return entity as Loaded<T, P>;
  }

  /**
   * Finds first entity matching your `where` query. If nothing found, it will throw an error.
   * If the `strict` option is specified and nothing is found or more than one matching entity is found, it will throw an error.
   * You can override the factory for creating this method via `options.failHandler` locally
   * or via `Configuration.findOneOrFailHandler` (`findExactlyOneOrFailHandler` when specifying `strict`) globally.
   */
  async findOneOrFail<T extends object, P extends string = never>(entityName: EntityName<T>, where: FilterQuery<T>, options: FindOneOrFailOptions<T, P> = {}): Promise<Loaded<T, P>> {
    let entity: Loaded<T, P> | null;
    let isStrictViolation = false;

    if (options.strict) {
      const ret = await this.find(entityName, where, { ...options as FindOptions<T, P>, limit: 2 });
      isStrictViolation = ret.length !== 1;
      entity = ret[0];
    } else {
      entity = await this.findOne(entityName, where, options);
    }

    if (!entity || isStrictViolation) {
      const key = options.strict ? 'findExactlyOneOrFailHandler' : 'findOneOrFailHandler';
      options.failHandler ??= this.config.get(key);
      entityName = Utils.className(entityName);
      throw options.failHandler!(entityName, where);
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
  async upsert<T extends object>(entityNameOrEntity: EntityName<T> | T, data?: EntityData<T> | T, options: NativeInsertUpdateOptions<T> = {}): Promise<T> {
    const em = this.getContext(false);

    let entityName: EntityName<T>;
    let where: FilterQuery<T>;
    let entity: T;

    if (data === undefined) {
      entityName = (entityNameOrEntity as Dictionary).constructor.name;
      data = entityNameOrEntity as T;
    } else {
      entityName = Utils.className(entityNameOrEntity as EntityName<T>);
    }

    const meta = this.metadata.get(entityName);

    if (Utils.isEntity(data)) {
      entity = data as T;

      if (helper(entity).__managed && helper(entity).__em === em) {
        em.entityFactory.mergeData(meta, entity, data);
        return entity;
      }

      where = helper(entity).getPrimaryKey() as FilterQuery<T>;
      data = em.comparator.prepareEntity(entity);
    } else {
      where = Utils.extractPK(data, meta) as FilterQuery<T>;

      if (where) {
        const exists = em.unitOfWork.getById<T>(entityName, where as Primary<T>, options.schema);
        if (exists) {
          em.entityFactory.mergeData(meta, exists, where);
          return exists;
        }
      }
    }

    const unique = meta.props.filter(p => p.unique).map(p => p.name);
    const propIndex = unique.findIndex(p => data![p] != null);

    if (where == null && propIndex >= 0) {
      where = { [unique[propIndex]]: data[unique[propIndex]] } as FilterQuery<T>;
    }

    if (where == null) {
      throw new Error(`Unique property value required for upsert, provide one of: ${meta.primaryKeys.concat(...unique)}`);
    }

    data = QueryHelper.processObjectParams(data) as EntityData<T>;
    em.validator.validateParams(data, 'insert data');
    const ret = await em.driver.nativeUpdate(entityName, where, data, { ctx: em.transactionContext, upsert: true, ...options });

    if (ret.row) {
      const prop = meta.getPrimaryProps()[0];
      const value = ret.row[prop.fieldNames[0]];
      data[prop.name] = prop.customType ? prop.customType.convertToJSValue(value, this.getPlatform()) : value;
    }

    entity ??= em.entityFactory.create(entityName, data, {
      refresh: true,
      initialized: true,
      schema: options.schema,
      convertCustomTypes: true,
    });

    if (!helper(entity).hasPrimaryKey()) {
      const pk = await this.driver.findOne(meta.className, where, {
        fields: meta.primaryKeys as [],
        ctx: em.transactionContext,
        convertCustomTypes: true,
      });
      em.entityFactory.mergeData(meta, entity, pk!);
    }

    em.unitOfWork.registerManaged(entity, data, { refresh: true });

    return entity;
  }

  /**
   * Runs your callback wrapped inside a database transaction.
   */
  async transactional<T>(cb: (em: D[typeof EntityManagerType]) => Promise<T>, options: TransactionOptions = {}): Promise<T> {
    const em = this.getContext(false);
    const fork = em.fork({
      clear: false, // state will be merged once resolves
      flushMode: options.flushMode,
      freshEventManager: true,
    });
    options.ctx ??= em.transactionContext;

    return TransactionContext.createAsync(fork, async () => {
      return fork.getConnection().transactional(async trx => {
        fork.transactionContext = trx;
        fork.eventManager.registerSubscriber({
          afterFlush(args: FlushEventArgs) {
            args.uow.getChangeSets()
              .filter(cs => [ChangeSetType.DELETE, ChangeSetType.DELETE_EARLY].includes(cs.type))
              .forEach(cs => em.unitOfWork.unsetIdentity(cs.entity));
          },
        });
        const ret = await cb(fork);
        await fork.flush();

        // ensure all entities from inner context are merged to the upper one
        for (const entity of fork.unitOfWork.getIdentityMap()) {
          em.unitOfWork.registerManaged(entity);
          entity.__helper!.__em = em;
        }

        return ret;
      }, { ...options, eventBroadcaster: new TransactionEventBroadcaster(fork) });
    });
  }

  /**
   * Starts new transaction bound to this EntityManager. Use `ctx` parameter to provide the parent when nesting transactions.
   */
  async begin(options: TransactionOptions = {}): Promise<void> {
    const em = this.getContext(false);
    em.transactionContext = await em.getConnection('write').begin({ ...options, eventBroadcaster: new TransactionEventBroadcaster(em) });
  }

  /**
   * Commits the transaction bound to this EntityManager. Flushes before doing the actual commit query.
   */
  async commit(): Promise<void> {
    const em = this.getContext(false);

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
  async nativeInsert<T extends object>(entityNameOrEntity: EntityName<T> | T, data?: EntityData<T> | T, options: NativeInsertUpdateOptions<T> = {}): Promise<Primary<T>> {
    const em = this.getContext(false);

    let entityName;

    if (data === undefined) {
      entityName = (entityNameOrEntity as Dictionary).constructor.name;
      data = entityNameOrEntity as T;
    } else {
      entityName = Utils.className(entityNameOrEntity as EntityName<T>);
    }

    if (Utils.isEntity(data)) {
      data = em.comparator.prepareEntity(data as T);
    }

    data = QueryHelper.processObjectParams(data) as EntityData<T>;
    em.validator.validateParams(data, 'insert data');
    const res = await em.driver.nativeInsert(entityName, data, { ctx: em.transactionContext, ...options });

    return res.insertId as Primary<T>;
  }

  /**
   * Fires native update query. Calling this has no side effects on the context (identity map).
   */
  async nativeUpdate<T extends object>(entityName: EntityName<T>, where: FilterQuery<T>, data: EntityData<T>, options: UpdateOptions<T> = {}): Promise<number> {
    const em = this.getContext(false);

    entityName = Utils.className(entityName);
    data = QueryHelper.processObjectParams(data);
    where = await em.processWhere(entityName, where, options, 'update');
    em.validator.validateParams(data, 'update data');
    em.validator.validateParams(where, 'update condition');
    const res = await em.driver.nativeUpdate(entityName, where, data, { ctx: em.transactionContext, ...options });

    return res.affectedRows;
  }

  /**
   * Fires native delete query. Calling this has no side effects on the context (identity map).
   */
  async nativeDelete<T extends object>(entityName: EntityName<T>, where: FilterQuery<T>, options: DeleteOptions<T> = {}): Promise<number> {
    const em = this.getContext(false);

    entityName = Utils.className(entityName);
    where = await em.processWhere(entityName, where, options, 'delete');
    em.validator.validateParams(where, 'delete condition');
    const res = await em.driver.nativeDelete(entityName, where, { ctx: em.transactionContext, ...options });

    return res.affectedRows;
  }

  /**
   * Maps raw database result to an entity and merges it to this EntityManager.
   */
  map<T extends object>(entityName: EntityName<T>, result: EntityDictionary<T>, options: { schema?: string } = {}): T {
    entityName = Utils.className(entityName);
    const meta = this.metadata.get(entityName);
    const data = this.driver.mapResult(result, meta) as Dictionary;

    Object.keys(data).forEach(k => {
      const prop = meta.properties[k];

      if (prop && prop.reference === ReferenceType.SCALAR && SCALAR_TYPES.includes(prop.type) && (prop.setter || !prop.getter)) {
        data[k] = this.validator.validateProperty(prop, data[k], data);
      }
    });

    return this.merge<T>(entityName, data as EntityData<T>, { convertCustomTypes: true, refresh: true, ...options });
  }

  /**
   * Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
   * via second parameter. By default, it will return already loaded entities without modifying them.
   */
  merge<T extends object>(entity: T, options?: MergeOptions): T;

  /**
   * Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
   * via second parameter. By default, it will return already loaded entities without modifying them.
   */
  merge<T extends object>(entityName: EntityName<T>, data: EntityData<T> | EntityDTO<T>, options?: MergeOptions): T;

  /**
   * Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
   * via second parameter. By default, it will return already loaded entities without modifying them.
   */
  merge<T extends object>(entityName: EntityName<T> | T, data?: EntityData<T> | EntityDTO<T> | MergeOptions, options: MergeOptions = {}): T {
    const em = this.getContext();

    if (Utils.isEntity(entityName)) {
      return em.merge((entityName as Dictionary).constructor.name, entityName as unknown as EntityData<T>, data as MergeOptions);
    }

    entityName = Utils.className(entityName as string);
    em.validator.validatePrimaryKey(data as EntityData<T>, em.metadata.get(entityName));
    let entity = em.unitOfWork.tryGetById<T>(entityName, data as FilterQuery<T>, options.schema, false);

    if (entity && helper(entity).__initialized && !options.refresh) {
      return entity;
    }

    const meta = em.metadata.find(entityName)!;
    const childMeta = em.metadata.getByDiscriminatorColumn(meta, data as EntityData<T>);

    entity = Utils.isEntity<T>(data) ? data : em.entityFactory.create<T>(entityName, data as EntityData<T>, { merge: true, ...options });
    em.validator.validate(entity, data, childMeta ?? meta);
    em.unitOfWork.merge(entity);
    em.unitOfWork.saveSnapshots();

    return entity!;
  }

  /**
   * Creates new instance of given entity and populates it with given data.
   * The entity constructor will be used unless you provide `{ managed: true }` in the options parameter.
   * The constructor will be given parameters based on the defined constructor of the entity. If the constructor
   * parameter matches a property name, its value will be extracted from `data`. If no matching property exists,
   * the whole `data` parameter will be passed. This means we can also define `constructor(data: Partial<T>)` and
   * `em.create()` will pass the data into it (unless we have a property named `data` too).
   */
  create<T extends object>(entityName: EntityName<T>, data: RequiredEntityData<T>, options: CreateOptions = {}): T {
    const em = this.getContext();
    const entity = em.entityFactory.create(entityName, data, {
      ...options,
      newEntity: !options.managed,
      merge: options.managed,
    });
    options.persist ??= em.config.get('persistOnCreate');

    if (options.persist) {
      em.persist(entity);
    }

    return entity;
  }

  /**
   * Shortcut for `wrap(entity).assign(data, { em })`
   */
  assign<T extends object>(entity: T, data: EntityData<T> | Partial<EntityDTO<T>>, options: AssignOptions = {}): T {
    return EntityAssigner.assign(entity, data, { em: this.getContext(), ...options });
  }

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T extends object, PK extends keyof T>(entityName: EntityName<T>, id: Primary<T>, options: Omit<GetReferenceOptions, 'wrapped'> & { wrapped: true }): IdentifiedReference<T, PK>;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T extends object>(entityName: EntityName<T>, id: Primary<T> | Primary<T>[]): T;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T extends object>(entityName: EntityName<T>, id: Primary<T>, options: Omit<GetReferenceOptions, 'wrapped'> & { wrapped: false }): T;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T extends object>(entityName: EntityName<T>, id: Primary<T>, options?: GetReferenceOptions): T | Reference<T>;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T extends object>(entityName: EntityName<T>, id: Primary<T>, options: GetReferenceOptions = {}): T | Reference<T> {
    options.convertCustomTypes ??= false;
    const meta = this.metadata.get(Utils.className(entityName));

    if (Utils.isPrimaryKey(id)) {
      if (meta.compositePK) {
        throw ValidationError.invalidCompositeIdentifier(meta);
      }

      id = [id] as Primary<T>;
    }

    const entity = this.getEntityFactory().createReference<T>(entityName, id, { merge: true, ...options });

    if (options.wrapped) {
      return Reference.create(entity);
    }

    return entity;
  }

  /**
   * Returns total number of entities matching your `where` query.
   */
  async count<T extends object, P extends string = never>(entityName: EntityName<T>, where: FilterQuery<T> = {} as FilterQuery<T>, options: CountOptions<T, P> = {}): Promise<number> {
    const em = this.getContext(false);
    entityName = Utils.className(entityName);
    where = await em.processWhere<T, P>(entityName, where, options as FindOptions<T, P>, 'read');
    options.populate = em.preparePopulate(entityName, options) as unknown as Populate<T>;
    em.validator.validateParams(where);

    const cached = await em.tryCache<T, number>(entityName, options.cache, [entityName, 'em.count', options, where]);

    if (cached?.data) {
      return cached.data as number;
    }

    const count = await em.driver.count<T, P>(entityName, where, { ctx: em.transactionContext, ...options });
    await em.storeCache(options.cache, cached!, () => count);

    return count;
  }

  /**
   * Tells the EntityManager to make an instance managed and persistent.
   * The entity will be entered into the database at or before transaction commit or as a result of the flush operation.
   */
  persist<T extends object>(entity: T | Reference<T> | (T | Reference<T>)[]): this {
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
  async persistAndFlush(entity: AnyEntity | Reference<AnyEntity> | (AnyEntity | Reference<AnyEntity>)[]): Promise<void> {
    await this.persist(entity).flush();
  }

  /**
   * Tells the EntityManager to make an instance managed and persistent.
   * The entity will be entered into the database at or before transaction commit or as a result of the flush operation.
   *
   * @deprecated use `persist()`
   */
  persistLater(entity: AnyEntity | AnyEntity[]): void {
    this.persist(entity);
  }

  /**
   * Marks entity for removal.
   * A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.
   *
   * To remove entities by condition, use `em.nativeDelete()`.
   */
  remove<T extends object>(entity: T | Reference<T> | (T | Reference<T>)[]): this {
    const em = this.getContext();

    if (Utils.isEntity<T>(entity)) {
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
  async removeAndFlush(entity: AnyEntity | Reference<AnyEntity>): Promise<void> {
    await this.remove(entity).flush();
  }

  /**
   * Marks entity for removal.
   * A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.
   *
   * @deprecated use `remove()`
   */
  removeLater(entity: AnyEntity): void {
    this.remove(entity);
  }

  /**
   * Flushes all changes to objects that have been queued up to now to the database.
   * This effectively synchronizes the in-memory state of managed objects with the database.
   */
  async flush(opts?: CommitOptions): Promise<void> {
    await this.getUnitOfWork().commit(opts);
  }

  /**
   * @internal
   */
  async tryFlush<T extends object>(entityName: EntityName<T>, options: { flushMode?: FlushMode }): Promise<void> {
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
  canPopulate<T extends object>(entityName: EntityName<T>, property: string): boolean {
    entityName = Utils.className(entityName);
    const [p, ...parts] = property.split('.');
    const meta = this.metadata.find(entityName);

    if (!meta) {
      return true;
    }

    const ret = p in meta.properties;

    if (!ret) {
      return !!this.metadata.find(property)?.pivotTable;
    }

    if (parts.length > 0) {
      return this.canPopulate((meta.properties)[p].type, parts.join('.'));
    }

    return ret;
  }

  /**
   * Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.
   */
  async populate<T extends object, P extends string = never>(entities: T | T[], populate: AutoPath<T, P>[] | boolean, options: EntityLoaderOptions<T, P> = {}): Promise<Loaded<T, P>[]> {
    entities = Utils.asArray(entities);

    if (entities.length === 0) {
      return entities as Loaded<T, P>[];
    }

    const em = this.getContext();
    const entityName = (entities[0] as Dictionary).constructor.name;
    const preparedPopulate = em.preparePopulate<T>(entityName, { populate: populate as true });
    await em.entityLoader.populate(entityName, entities, preparedPopulate, options);

    return entities as Loaded<T, P>[];
  }

  /**
   * Returns new EntityManager instance with its own identity map
   */
  fork(options: ForkOptions = {}): D[typeof EntityManagerType] {
    const em = options.disableContextResolution ? this : this.getContext(false);
    options.clear ??= true;
    options.useContext ??= false;
    options.freshEventManager ??= false;
    const eventManager = options.freshEventManager ? new EventManager(em.config.get('subscribers')) : em.eventManager;

    // we need to allow global context here as forking from global EM is fine
    const allowGlobalContext = em.config.get('allowGlobalContext');
    em.config.set('allowGlobalContext', true);
    const fork = new (em.constructor as typeof EntityManager)(em.config, em.driver, em.metadata, options.useContext, eventManager);
    fork.setFlushMode(options.flushMode ?? em.flushMode);
    em.config.set('allowGlobalContext', allowGlobalContext);

    fork.filters = { ...em.filters };
    fork.filterParams = Utils.copy(em.filterParams);

    if (!options.clear) {
      for (const entity of em.unitOfWork.getIdentityMap()) {
        fork.unitOfWork.registerManaged(entity);
      }

      for (const entity of em.unitOfWork.getOrphanRemoveStack()) {
        fork.unitOfWork.getOrphanRemoveStack().add(entity);
      }
    }

    return fork;
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
    return !!this.transactionContext;
  }

  /**
   * Gets the transaction context (driver dependent object used to make sure queries are executed on same connection).
   */
  getTransactionContext<T extends Transaction = Transaction>(): T | undefined {
    return this.transactionContext as T;
  }

  /**
   * Sets the transaction context.
   */
  setTransactionContext(ctx: Transaction): void {
    this.transactionContext = ctx;
  }

  /**
   * Resets the transaction context.
   */
  resetTransactionContext(): void {
    delete this.transactionContext;
  }

  /**
   * Gets the MetadataStorage.
   */
  getMetadata(): MetadataStorage {
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

  private async lockAndPopulate<T extends object, P extends string = never>(entityName: string, entity: T, where: FilterQuery<T>, options: FindOneOptions<T, P>): Promise<Loaded<T, P>> {
    if (options.lockMode === LockMode.OPTIMISTIC) {
      await this.lock(entity, options.lockMode, {
        lockVersion: options.lockVersion,
        lockTableAliases: options.lockTableAliases,
      });
    }

    const preparedPopulate = this.preparePopulate<T, P>(entityName, options);
    await this.entityLoader.populate(entityName, [entity], preparedPopulate, {
      ...options as Dictionary,
      ...this.getPopulateWhere(where, options),
      convertCustomTypes: false,
      ignoreLazyScalarProperties: true,
      lookup: false,
    });

    return entity as Loaded<T, P>;
  }

  private buildFields<T extends object, P extends string>(fields: readonly EntityField<T, P>[]): readonly AutoPath<T, P>[] {
    return fields.reduce((ret, f) => {
      if (Utils.isPlainObject(f)) {
        Object.keys(f).forEach(ff => ret.push(...this.buildFields(f[ff]).map(field => `${ff}.${field}` as never)));
      } else {
        ret.push(f as never);
      }

      return ret;
    }, [] as AutoPath<T, P>[]);
  }

  private preparePopulate<T extends object, P extends string = never>(entityName: string, options: Pick<FindOptions<T, P>, 'populate' | 'strategy' | 'fields'>): PopulateOptions<T>[] {
    // infer populate hint if only `fields` are available
    if (!options.populate && options.fields) {
      options.populate = this.buildFields(options.fields);
    }

    if (!options.populate) {
      return this.entityLoader.normalizePopulate<T>(entityName, [], options.strategy);
    }

    if (Array.isArray(options.populate)) {
      options.populate = (options.populate as string[]).map(field => {
        if (Utils.isString(field)) {
          return { field, strategy: options.strategy };
        }

        return field;
      }) as unknown as Populate<T>;
    }

    const ret: PopulateOptions<T>[] = this.entityLoader.normalizePopulate<T>(entityName, options.populate as true, options.strategy);
    const invalid = ret.find(({ field }) => !this.canPopulate(entityName, field));

    if (invalid) {
      throw ValidationError.invalidPropertyName(entityName, invalid.field);
    }

    return ret.map(field => {
      // force select-in strategy when populating all relations as otherwise we could cause infinite loops when self-referencing
      field.strategy = options.populate === true ? LoadStrategy.SELECT_IN : (options.strategy ?? field.strategy);
      return field;
    });
  }

  /**
   * when the entity is found in identity map, we check if it was partially loaded or we are trying to populate
   * some additional lazy properties, if so, we reload and merge the data from database
   */
  protected shouldRefresh<T extends object, P extends string = never>(meta: EntityMetadata<T>, entity: T, options: FindOneOptions<T, P>) {
    if (!helper(entity).__initialized || options.refresh) {
      return true;
    }

    let autoRefresh: boolean;

    if (options.fields) {
      autoRefresh = options.fields.some(field => !helper(entity).__loadedProperties.has(field as string));
    } else {
      autoRefresh = meta.comparableProps.some(prop => !prop.lazy && !helper(entity).__loadedProperties.has(prop.name));
    }

    if (autoRefresh) {
      return true;
    }

    if (Array.isArray(options.populate)) {
      return options.populate.some(field => !helper(entity).__loadedProperties.has(field as string));
    }

    return !!options.populate;
  }

  /**
   * @internal
   */
  async tryCache<T extends object, R>(entityName: string, config: boolean | number | [string, number] | undefined, key: unknown, refresh?: boolean, merge?: boolean): Promise<{ data?: R; key: string } | undefined> {
    if (!config) {
      return undefined;
    }

    const em = this.getContext();
    const cacheKey = Array.isArray(config) ? config[0] : JSON.stringify(key);
    const cached = await em.resultCache.get(cacheKey!);

    if (cached) {
      let data: R;

      if (Array.isArray(cached) && merge) {
        data = cached.map(item => em.entityFactory.create<T>(entityName, item, { merge: true, convertCustomTypes: true, refresh })) as unknown as R;
      } else if (Utils.isObject<EntityData<T>>(cached) && merge) {
        data = em.entityFactory.create<T>(entityName, cached, { merge: true, convertCustomTypes: true, refresh }) as unknown as R;
      } else {
        data = cached;
      }

      await em.unitOfWork.dispatchOnLoadEvent();

      return { key: cacheKey, data };
    }

    return { key: cacheKey };
  }

  /**
   * @internal
   */
  async storeCache(config: boolean | number | [string, number] | undefined, key: { key: string }, data: unknown | (() => unknown)) {
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
   * Returns the ID of this EntityManager. Respects the context, so global EM will give you the contextual ID
   * if executed inside request context handler.
   */
  get id(): number {
    return this.getContext(false)._id;
  }

  /**
   * @internal
   */
  [inspect.custom]() {
    return `[EntityManager<${this.id}>]`;
  }

}

export interface CreateOptions {
  managed?: boolean;
  schema?: string;
  persist?: boolean;
}

export interface MergeOptions {
  refresh?: boolean;
  convertCustomTypes?: boolean;
  schema?: string;
}

export interface ForkOptions {
  /** do we want clear identity map? defaults to true */
  clear?: boolean;
  /** use request context? should be used only for top level request scope EM, defaults to false */
  useContext?: boolean;
  /** do we want to use fresh EventManager instance? defaults to false (global instance) */
  freshEventManager?: boolean;
  /** use this flag to ignore current async context - this is required if we want to call `em.fork()` inside the `getContext` handler */
  disableContextResolution?: boolean;
  flushMode?: FlushMode;
}
