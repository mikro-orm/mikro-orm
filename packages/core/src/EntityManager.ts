import { inspect } from 'util';

import type { Configuration } from './utils';
import { QueryHelper, TransactionContext, Utils } from './utils';
import type { AssignOptions, EntityLoaderOptions, EntityRepository, IdentifiedReference } from './entity';
import { EntityAssigner, EntityFactory, EntityLoader, EntityValidator, Reference } from './entity';
import { UnitOfWork } from './unit-of-work';
import type { CountOptions, DeleteOptions, EntityManagerType, FindOneOptions, FindOneOrFailOptions, FindOptions, IDatabaseDriver, InsertOptions, LockOptions, UpdateOptions, GetReferenceOptions } from './drivers';
import type { AnyEntity, AutoPath, Dictionary, EntityData, EntityDictionary, EntityDTO, EntityMetadata, EntityName, FilterDef, FilterQuery, GetRepository, Loaded, New, Populate, PopulateOptions, Primary } from './typings';
import type { IsolationLevel, LoadStrategy } from './enums';
import { LockMode, ReferenceType, SCALAR_TYPES } from './enums';
import type { MetadataStorage } from './metadata';
import type { Transaction } from './connections';
import { EventManager, TransactionEventBroadcaster } from './events';
import { EntityComparator } from './utils/EntityComparator';
import { OptimisticLockError, ValidationError } from './errors';

/**
 * The EntityManager is the central access point to ORM functionality. It is a facade to all different ORM subsystems
 * such as UnitOfWork, Query Language and Repository API.
 * @template {D} current driver type
 */
export class EntityManager<D extends IDatabaseDriver = IDatabaseDriver> {

  private static counter = 1;
  readonly id = EntityManager.counter++;
  readonly name = this.config.get('contextName');
  private readonly validator = new EntityValidator(this.config.get('strict'));
  private readonly repositoryMap: Dictionary<EntityRepository<AnyEntity>> = {};
  private readonly entityLoader: EntityLoader = new EntityLoader(this);
  private readonly comparator = new EntityComparator(this.metadata, this.driver.getPlatform());
  private readonly unitOfWork: UnitOfWork = new UnitOfWork(this);
  private readonly entityFactory: EntityFactory = new EntityFactory(this.unitOfWork, this);
  private readonly resultCache = this.config.getResultCacheAdapter();
  private filters: Dictionary<FilterDef<any>> = {};
  private filterParams: Dictionary<Dictionary> = {};
  private transactionContext?: Transaction;

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
  getConnection(type?: 'read' | 'write'): ReturnType<D['getConnection']> {
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
  getRepository<T extends AnyEntity<T>, U extends EntityRepository<T> = EntityRepository<T>>(entityName: EntityName<T>): GetRepository<T, U> {
    entityName = Utils.className(entityName);

    if (!this.repositoryMap[entityName]) {
      const meta = this.metadata.get(entityName);
      const RepositoryClass = this.config.getRepositoryClass(meta.customRepository)!;
      this.repositoryMap[entityName] = new RepositoryClass(this, entityName);
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
  async find<T extends AnyEntity<T>, P extends string = never>(entityName: EntityName<T>, where: FilterQuery<T>, options: FindOptions<T, P> = {}): Promise<Loaded<T, P>[]> {
    if (options.disableIdentityMap) {
      const fork = this.fork({ clear: false });
      const ret = await fork.find<T, P>(entityName, where, { ...options, disableIdentityMap: false });
      fork.clear();

      return ret;
    }

    entityName = Utils.className(entityName);
    where = await this.processWhere<T, P>(entityName, where, options, 'read');
    this.validator.validateParams(where);
    options.orderBy = options.orderBy || {};
    options.populate = this.preparePopulate<T>(entityName, options.populate, options.strategy) as unknown as Populate<T, P>;
    const cached = await this.tryCache<T, Loaded<T, P>[]>(entityName, options.cache, [entityName, 'em.find', options, where], options.refresh, true);

    if (cached?.data) {
      await this.entityLoader.populate<T, P>(entityName, cached.data as T[], options.populate as unknown as PopulateOptions<T>[], { ...options, where, convertCustomTypes: false, lookup: false });
      return cached.data;
    }

    const results = await this.driver.find<T, P>(entityName, where, { ctx: this.transactionContext, ...options });

    if (results.length === 0) {
      await this.storeCache(options.cache, cached!, []);
      return [];
    }

    const ret: T[] = [];

    for (const data of results) {
      const entity = this.getEntityFactory().create(entityName, data as EntityData<T>, { merge: true, refresh: options.refresh, convertCustomTypes: true }) as T;
      this.getUnitOfWork().registerManaged(entity, data, options.refresh);
      ret.push(entity);
    }

    const unique = Utils.unique(ret);
    await this.entityLoader.populate<T, P>(entityName, unique, options.populate as unknown as PopulateOptions<T>[], { ...options, where, convertCustomTypes: false, lookup: false });
    await this.storeCache(options.cache, cached!, () => unique.map(e => e.__helper!.toPOJO()));

    return unique as Loaded<T, P>[];
  }

  /**
   * Registers global filter to this entity manager. Global filters are enabled by default (unless disabled via last parameter).
   */
  addFilter<T1 extends AnyEntity<T1>>(name: string, cond: FilterQuery<T1> | ((args: Dictionary) => FilterQuery<T1>), entityName?: EntityName<T1> | [EntityName<T1>], enabled?: boolean): void;

  /**
   * Registers global filter to this entity manager. Global filters are enabled by default (unless disabled via last parameter).
   */
  addFilter<T1 extends AnyEntity<T1>, T2 extends AnyEntity<T2>>(name: string, cond: FilterQuery<T1 | T2> | ((args: Dictionary) => FilterQuery<T1 | T2>), entityName?: [EntityName<T1>, EntityName<T2>], enabled?: boolean): void;

  /**
   * Registers global filter to this entity manager. Global filters are enabled by default (unless disabled via last parameter).
   */
  addFilter<T1 extends AnyEntity<T1>, T2 extends AnyEntity<T2>, T3 extends AnyEntity<T3>>(name: string, cond: FilterQuery<T1 | T2 | T3> | ((args: Dictionary) => FilterQuery<T1 | T2 | T3>), entityName?: [EntityName<T1>, EntityName<T2>, EntityName<T3>], enabled?: boolean): void;

  /**
   * Registers global filter to this entity manager. Global filters are enabled by default (unless disabled via last parameter).
   */
  addFilter(name: string, cond: FilterQuery<AnyEntity> | ((args: Dictionary) => FilterQuery<AnyEntity>), entityName?: EntityName<AnyEntity> | EntityName<AnyEntity>[], enabled = true): void {
    const options: FilterDef<AnyEntity> = { name, cond, default: enabled };

    if (entityName) {
      options.entity = Utils.asArray(entityName).map(n => Utils.className(n));
    }

    this.filters[name] = options;
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

  protected async processWhere<T extends AnyEntity<T>, P extends string = never>(entityName: string, where: FilterQuery<T>, options: FindOptions<T, P> | FindOneOptions<T, P>, type: 'read' | 'update' | 'delete'): Promise<FilterQuery<T>> {
    where = QueryHelper.processWhere(where as FilterQuery<T>, entityName, this.metadata, this.driver.getPlatform(), options.convertCustomTypes);
    where = await this.applyFilters(entityName, where, options.filters ?? {}, type);
    where = await this.applyDiscriminatorCondition(entityName, where);

    return where;
  }

  protected applyDiscriminatorCondition<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>): FilterQuery<T> {
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
  async applyFilters<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, options: Dictionary<boolean | Dictionary> | string[] | boolean, type: 'read' | 'update' | 'delete'): Promise<FilterQuery<T>> {
    const meta = this.metadata.find<T>(entityName);
    const filters: FilterDef<any>[] = [];
    const ret: Dictionary[] = [];

    if (!meta) {
      return where;
    }

    const active = new Set<string>();
    const push = (source: Dictionary<FilterDef<any>>) => {
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

      ret.push(QueryHelper.processWhere(cond, entityName, this.metadata, this.driver.getPlatform()));
    }

    const conds = [...ret, where as Dictionary].filter(c => Utils.hasObjectKeys(c)) as FilterQuery<T>[];

    return conds.length > 1 ? { $and: conds } as FilterQuery<T> : conds[0];
  }

  /**
   * Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
   * where first element is the array of entities and the second is the count.
   */
  async findAndCount<T extends AnyEntity<T>, P extends string = never>(entityName: EntityName<T>, where: FilterQuery<T>, options: FindOptions<T, P> = {}): Promise<[Loaded<T, P>[], number]> {
    const [entities, count] = await Promise.all([
      this.find<T, P>(entityName, where, options),
      this.count(entityName, where, options),
    ]);

    return [entities, count];
  }

  /**
   * Finds first entity matching your `where` query.
   */
  async findOne<T extends AnyEntity<T>, P extends string = never>(entityName: EntityName<T>, where: FilterQuery<T>, options: FindOneOptions<T, P> = {}): Promise<Loaded<T, P> | null> {
    if (options.disableIdentityMap) {
      const fork = this.fork({ clear: false });
      const ret = await fork.findOne<T, P>(entityName, where, { ...options, disableIdentityMap: false });
      fork.clear();

      return ret;
    }

    entityName = Utils.className(entityName);
    const meta = this.metadata.get<T>(entityName);
    where = await this.processWhere(entityName, where, options, 'read');
    this.validator.validateEmptyWhere(where);
    this.checkLockRequirements(options.lockMode, meta);
    let entity = this.getUnitOfWork().tryGetById<T>(entityName, where, options.schema);
    const isOptimisticLocking = !Utils.isDefined(options.lockMode) || options.lockMode === LockMode.OPTIMISTIC;

    if (entity && !this.shouldRefresh<T>(meta, entity, options) && isOptimisticLocking) {
      return this.lockAndPopulate<T, P>(entityName, entity, where, options);
    }

    this.validator.validateParams(where);
    options.populate = this.preparePopulate<T>(entityName, options.populate as true, options.strategy) as unknown as Populate<T, P>;
    const cached = await this.tryCache<T, Loaded<T, P>>(entityName, options.cache, [entityName, 'em.findOne', options, where], options.refresh, true);

    if (cached?.data) {
      await this.entityLoader.populate<T, P>(entityName, [cached.data as T], options.populate as unknown as PopulateOptions<T>[], { ...options, where, convertCustomTypes: false, lookup: false });
      return cached.data;
    }

    const data = await this.driver.findOne<T, P>(entityName, where, { ctx: this.transactionContext, ...options });

    if (!data) {
      await this.storeCache(options.cache, cached!, null);
      return null;
    }

    entity = this.getEntityFactory().create<T>(entityName, data as EntityData<T>, { refresh: options.refresh, merge: true, convertCustomTypes: true });
    this.getUnitOfWork().registerManaged(entity, data as EntityData<T>, options.refresh);
    await this.lockAndPopulate(entityName, entity, where, options);
    await this.storeCache(options.cache, cached!, () => entity!.__helper!.toPOJO());

    return entity as Loaded<T, P>;
  }

  /**
   * Finds first entity matching your `where` query. If nothing found, it will throw an error.
   * You can override the factory for creating this method via `options.failHandler` locally
   * or via `Configuration.findOneOrFailHandler` globally.
   */
  async findOneOrFail<T extends AnyEntity<T>, P extends string = never>(entityName: EntityName<T>, where: FilterQuery<T>, options: FindOneOrFailOptions<T, P> = {}): Promise<Loaded<T, P>> {
    const entity = await this.findOne(entityName, where, options);

    if (!entity) {
      options.failHandler = options.failHandler || this.config.get('findOneOrFailHandler');
      entityName = Utils.className(entityName);
      throw options.failHandler!(entityName, where);
    }

    return entity as Loaded<T, P>;
  }

  /**
   * Runs your callback wrapped inside a database transaction.
   */
  async transactional<T>(cb: (em: D[typeof EntityManagerType]) => Promise<T>, options: { ctx?: Transaction; isolationLevel?: IsolationLevel } = {}): Promise<T> {
    const em = this.fork({ clear: false });
    /* istanbul ignore next */
    options.ctx = options.ctx ?? this.transactionContext;

    return TransactionContext.createAsync(em, async () => {
      return em.getConnection().transactional(async trx => {
        em.transactionContext = trx;
        const ret = await cb(em);
        await em.flush();

        return ret;
      }, { ...options, eventBroadcaster: new TransactionEventBroadcaster(em) });
    });
  }

  /**
   * Starts new transaction bound to this EntityManager. Use `ctx` parameter to provide the parent when nesting transactions.
   */
  async begin(options: { ctx?: Transaction; isolationLevel?: IsolationLevel } = {}): Promise<void> {
    this.transactionContext = await this.getConnection('write').begin({ ...options, eventBroadcaster: new TransactionEventBroadcaster(this) });
  }

  /**
   * Commits the transaction bound to this EntityManager. Flushes before doing the actual commit query.
   */
  async commit(): Promise<void> {
    await this.flush();
    await this.getConnection('write').commit(this.transactionContext, new TransactionEventBroadcaster(this));
    delete this.transactionContext;
  }

  /**
   * Rollbacks the transaction bound to this EntityManager.
   */
  async rollback(): Promise<void> {
    await this.getConnection('write').rollback(this.transactionContext, new TransactionEventBroadcaster(this));
    delete this.transactionContext;
  }

  /**
   * Runs your callback wrapped inside a database transaction.
   */
  async lock<T>(entity: T, lockMode: LockMode, options: LockOptions | number | Date = {}): Promise<void> {
    options = Utils.isPlainObject(options) ? options as LockOptions : { lockVersion: options };
    await this.getUnitOfWork().lock(entity, { lockMode, ...options });
  }

  /**
   * Fires native insert query. Calling this has no side effects on the context (identity map).
   */
  async nativeInsert<T extends AnyEntity<T>>(entity: T): Promise<Primary<T>>;

  /**
   * Fires native insert query. Calling this has no side effects on the context (identity map).
   */
  async nativeInsert<T extends AnyEntity<T>>(entityName: EntityName<T>, data: EntityData<T>): Promise<Primary<T>>;

  /**
   * Fires native insert query. Calling this has no side effects on the context (identity map).
   */
  async nativeInsert<T extends AnyEntity<T>>(entityNameOrEntity: EntityName<T> | T, data?: EntityData<T>, options: InsertOptions<T> = {}): Promise<Primary<T>> {
    let entityName;

    if (data === undefined) {
      entityName = entityNameOrEntity.constructor.name;
      data = this.comparator.prepareEntity(entityNameOrEntity as T);
    } else {
      entityName = Utils.className(entityNameOrEntity as EntityName<T>);
    }

    data = QueryHelper.processObjectParams(data) as EntityData<T>;
    this.validator.validateParams(data, 'insert data');
    const res = await this.driver.nativeInsert(entityName, data, { ctx: this.transactionContext, ...options });

    return res.insertId as Primary<T>;
  }

  /**
   * Fires native update query. Calling this has no side effects on the context (identity map).
   */
  async nativeUpdate<T extends AnyEntity<T>>(entityName: EntityName<T>, where: FilterQuery<T>, data: EntityData<T>, options: UpdateOptions<T> = {}): Promise<number> {
    entityName = Utils.className(entityName);
    data = QueryHelper.processObjectParams(data);
    where = await this.processWhere(entityName, where, options, 'update');
    this.validator.validateParams(data, 'update data');
    this.validator.validateParams(where, 'update condition');
    const res = await this.driver.nativeUpdate(entityName, where, data, { ctx: this.transactionContext, ...options });

    return res.affectedRows;
  }

  /**
   * Fires native delete query. Calling this has no side effects on the context (identity map).
   */
  async nativeDelete<T extends AnyEntity<T>>(entityName: EntityName<T>, where: FilterQuery<T>, options: DeleteOptions<T> = {}): Promise<number> {
    entityName = Utils.className(entityName);
    where = await this.processWhere(entityName, where, options, 'delete');
    this.validator.validateParams(where, 'delete condition');
    const res = await this.driver.nativeDelete(entityName, where, { ctx: this.transactionContext, ...options });

    return res.affectedRows;
  }

  /**
   * Maps raw database result to an entity and merges it to this EntityManager.
   */
  map<T extends AnyEntity<T>>(entityName: EntityName<T>, result: EntityDictionary<T>, options: { schema?: string } = {}): T {
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
   * via second parameter. By default it will return already loaded entities without modifying them.
   */
  merge<T extends AnyEntity<T>>(entity: T, options?: MergeOptions): T;

  /**
   * Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
   * via second parameter. By default it will return already loaded entities without modifying them.
   */
  merge<T extends AnyEntity<T>>(entityName: EntityName<T>, data: EntityData<T> | EntityDTO<T>, options?: MergeOptions): T;

  /**
   * Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
   * via second parameter. By default it will return already loaded entities without modifying them.
   */
  merge<T extends AnyEntity<T>>(entityName: EntityName<T> | T, data?: EntityData<T> | EntityDTO<T> | MergeOptions, options: MergeOptions = {}): T {
    if (Utils.isEntity(entityName)) {
      return this.merge(entityName.constructor.name, entityName as unknown as EntityData<T>, data as MergeOptions);
    }

    entityName = Utils.className(entityName as string);
    this.validator.validatePrimaryKey(data as EntityData<T>, this.metadata.get(entityName));
    let entity = this.getUnitOfWork().tryGetById<T>(entityName, data as FilterQuery<T>, options.schema, false);

    if (entity && entity.__helper!.__initialized && !options.refresh) {
      return entity;
    }

    const meta = this.metadata.find(entityName)!;
    const childMeta = this.metadata.getByDiscriminatorColumn(meta, data as EntityData<T>);

    entity = Utils.isEntity<T>(data) ? data : this.getEntityFactory().create<T>(entityName, data as EntityData<T>, { merge: true, ...options });
    this.validator.validate(entity, data, childMeta ?? meta);
    this.getUnitOfWork().merge(entity);

    return entity;
  }

  /**
   * Creates new instance of given entity and populates it with given data.
   * The entity constructor will be used unless you provide `{ managed: true }` in the options parameter.
   * The constructor will be given parameters based on the defined constructor of the entity. If the constructor
   * parameter matches a property name, its value will be extracted from `data`. If no matching property exists,
   * the whole `data` parameter will be passed. This means we can also define `constructor(data: Partial<T>)` and
   * `em.create()` will pass the data into it (unless we have a property named `data` too).
   */
  create<T extends AnyEntity<T>, P extends string = never>(entityName: EntityName<T>, data: EntityData<T>, options: { managed?: boolean; schema?: string } = {}): New<T, P> {
    return this.getEntityFactory().create<T, P>(entityName, data, { ...options, newEntity: !options.managed });
  }

  /**
   * Shortcut for `wrap(entity).assign(data, { em })`
   */
  assign<T extends AnyEntity<T>>(entity: T, data: EntityData<T> | Partial<EntityDTO<T>>, options: AssignOptions = {}): T {
    return EntityAssigner.assign(entity, data, { em: this, ...options });
  }

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T extends AnyEntity<T>, PK extends keyof T>(entityName: EntityName<T>, id: Primary<T>, options: Omit<GetReferenceOptions, 'wrapped'> & { wrapped: true }): IdentifiedReference<T, PK>;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T extends AnyEntity<T>>(entityName: EntityName<T>, id: Primary<T> | Primary<T>[]): T;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T extends AnyEntity<T>>(entityName: EntityName<T>, id: Primary<T>, options: Omit<GetReferenceOptions, 'wrapped'> & { wrapped: false }): T;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T extends AnyEntity<T>>(entityName: EntityName<T>, id: Primary<T>, options?: GetReferenceOptions): T | Reference<T>;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T extends AnyEntity<T>>(entityName: EntityName<T>, id: Primary<T>, options: GetReferenceOptions = {}): T | Reference<T> {
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
  async count<T, P extends string = never>(entityName: EntityName<T>, where: FilterQuery<T> = {} as FilterQuery<T>, options: CountOptions<T, P> = {}): Promise<number> {
    entityName = Utils.className(entityName);
    where = await this.processWhere<T, P>(entityName, where, options as FindOptions<T, P>, 'read');
    options.populate = this.preparePopulate(entityName, options.populate) as unknown as Populate<T>;
    this.validator.validateParams(where);

    const cached = await this.tryCache<T, number>(entityName, options.cache, [entityName, 'em.count', options, where]);

    if (cached?.data) {
      return cached.data as number;
    }

    const count = await this.driver.count<T, P>(entityName, where, { ctx: this.transactionContext, ...options });
    await this.storeCache(options.cache, cached!, () => count);

    return count;
  }

  /**
   * Tells the EntityManager to make an instance managed and persistent.
   * The entity will be entered into the database at or before transaction commit or as a result of the flush operation.
   */
  persist(entity: AnyEntity | Reference<AnyEntity> | (AnyEntity | Reference<AnyEntity>)[]): this {
    if (Utils.isEntity(entity)) {
      // do not cascade just yet, cascading of entities in persist stack is done when flushing
      this.getUnitOfWork().persist(entity, new WeakSet([entity]));
      return this;
    }

    const entities = Utils.asArray(entity);

    for (const ent of entities) {
      if (!Utils.isEntity(ent, true)) {
        /* istanbul ignore next */
        const meta = typeof ent === 'object' ? this.metadata.find(ent.constructor.name) : undefined;
        throw ValidationError.notDiscoveredEntity(ent, meta);
      }

      // do not cascade just yet, cascading of entities in persist stack is done when flushing
      this.getUnitOfWork().persist(Reference.unwrapReference(ent), new WeakSet([entity]));
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
  remove<T extends AnyEntity<T>>(entity: T | Reference<T> | (T | Reference<T>)[]): this {
    const entities = Utils.asArray(entity, true);

    for (const ent of entities) {
      if (!Utils.isEntity(ent, true)) {
        throw new Error(`You need to pass entity instance or reference to 'em.remove()'. To remove entities by condition, use 'em.nativeDelete()'.`);
      }

      this.getUnitOfWork().remove(Reference.unwrapReference(ent));
    }

    return this;
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
  async flush(): Promise<void> {
    await this.getUnitOfWork().commit();
  }

  /**
   * Clears the EntityManager. All entities that are currently managed by this EntityManager become detached.
   */
  clear(): void {
    this.getUnitOfWork().clear();
  }

  /**
   * Checks whether given property can be populated on the entity.
   */
  canPopulate<T extends AnyEntity<T>>(entityName: EntityName<T>, property: string): boolean {
    entityName = Utils.className(entityName);
    const [p, ...parts] = property.split('.');
    const props = this.metadata.get(entityName).properties;
    const ret = p in props && (props[p].reference !== ReferenceType.SCALAR || props[p].lazy);

    if (!ret) {
      return false;
    }

    if (parts.length > 0) {
      return this.canPopulate(props[p].type, parts.join('.'));
    }

    return ret;
  }

  /**
   * Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.
   */
  async populate<T extends AnyEntity<T>, P extends string = never>(entities: T, populate: AutoPath<T, P>[] | boolean, options?: EntityLoaderOptions<T>): Promise<Loaded<T, P>>;

  /**
   * Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.
   */
  async populate<T extends AnyEntity<T>, P extends string = never>(entities: T[], populate: AutoPath<T, P>[] | boolean, options?: EntityLoaderOptions<T>): Promise<Loaded<T, P>[]>;

  /**
   * Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.
   */
  async populate<T extends AnyEntity<T>, P extends string = never>(entities: T | T[], populate: AutoPath<T, P>[] | boolean, options: EntityLoaderOptions<T> = {}): Promise<Loaded<T, P> | Loaded<T, P>[]> {
    const entitiesArray = Utils.asArray(entities);

    if (entitiesArray.length === 0) {
      return entities as Loaded<T, P>[];
    }

    const entityName = entitiesArray[0].constructor.name;
    const preparedPopulate = this.preparePopulate<T>(entityName, populate as true);
    await this.entityLoader.populate(entityName, entitiesArray, preparedPopulate, options);

    return entities as Loaded<T, P>[];
  }

  /**
   * Returns new EntityManager instance with its own identity map
   */
  fork(options: ForkOptions = {}): D[typeof EntityManagerType] {
    options.clear = options.clear ?? true;
    options.useContext = options.useContext ?? false;
    options.freshEventManager = options.freshEventManager ?? false;

    const eventManager = options.freshEventManager ? new EventManager(this.config.get('subscribers')) : this.eventManager;
    const em = new (this.constructor as typeof EntityManager)(this.config, this.driver, this.metadata, options.useContext, eventManager);
    em.filters = { ...this.filters };
    em.filterParams = Utils.copy(this.filterParams);

    if (!options.clear) {
      for (const entity of this.getUnitOfWork().getIdentityMap()) {
        em.getUnitOfWork().registerManaged(entity);
      }
    }

    return em;
  }

  /**
   * Gets the UnitOfWork used by the EntityManager to coordinate operations.
   */
  getUnitOfWork(): UnitOfWork {
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
   */
  getContext(): EntityManager {
    let em = TransactionContext.getEntityManager(); // prefer the tx context

    if (!em) {
      // no explicit tx started
      em = this.useContext ? (this.config.get('context')(this.name) || this) : this;
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

  private async lockAndPopulate<T extends AnyEntity<T>, P extends string = never>(entityName: string, entity: T, where: FilterQuery<T>, options: FindOneOptions<T>): Promise<Loaded<T, P>> {
    if (options.lockMode === LockMode.OPTIMISTIC) {
      await this.lock(entity, options.lockMode, {
        lockVersion: options.lockVersion,
        lockTableAliases: options.lockTableAliases,
      });
    }

    const preparedPopulate = this.preparePopulate<T>(entityName, options.populate, options.strategy);
    await this.entityLoader.populate<T>(entityName, [entity], preparedPopulate, { ...options, where, convertCustomTypes: false, lookup: false });

    return entity as Loaded<T, P>;
  }

  private preparePopulate<T extends AnyEntity<T>>(entityName: string, populate?: Populate<T, any>, strategy?: LoadStrategy): PopulateOptions<T>[] {
    if (!populate) {
      return this.entityLoader.normalizePopulate<T>(entityName, [], strategy);
    }

    if (Array.isArray(populate)) {
      populate = (populate as string[]).map(field => {
        if (Utils.isString(field)) {
          return { field, strategy };
        }

        return field;
      }) as unknown as Populate<T>;
    }

    const ret: PopulateOptions<T>[] = this.entityLoader.normalizePopulate<T>(entityName, populate as true, strategy);

    return ret.map(field => {
      field.strategy = strategy ?? field.strategy ?? this.config.get('loadStrategy');
      return field;
    });
  }

  /**
   * when the entity is found in identity map, we check if it was partially loaded or we are trying to populate
   * some additional lazy properties, if so, we reload and merge the data from database
   */
  protected shouldRefresh<T extends AnyEntity<T>>(meta: EntityMetadata<T>, entity: T, options: FindOneOptions<T>) {
    if (!entity.__helper!.__initialized || options.refresh) {
      return true;
    }

    let autoRefresh: boolean;

    if (options.fields) {
      autoRefresh = options.fields.some(field => !entity!.__helper!.__loadedProperties.has(field as string));
    } else {
      autoRefresh = meta.comparableProps.some(prop => !prop.lazy && !entity!.__helper!.__loadedProperties.has(prop.name));
    }

    if (autoRefresh) {
      return true;
    }

    if (Array.isArray(options.populate)) {
      return options.populate.some(field => !entity!.__helper!.__loadedProperties.has(field as string));
    }

    return !!options.populate;
  }

  /**
   * @internal
   */
  async tryCache<T extends AnyEntity, R>(entityName: string, config: boolean | number | [string, number] | undefined, key: unknown, refresh?: boolean, merge?: boolean): Promise<{ data?: R; key: string } | undefined> {
    if (!config) {
      return undefined;
    }

    const cacheKey = Array.isArray(config) ? config[0] : JSON.stringify(key);
    const cached = await this.resultCache.get(cacheKey!);

    if (cached) {
      let data: R;

      if (Array.isArray(cached) && merge) {
        data = cached.map(item => this.getEntityFactory().create<T>(entityName, item, { merge: true, convertCustomTypes: true, refresh })) as unknown as R;
      } else if (Utils.isObject<EntityData<T>>(cached) && merge) {
        data = this.getEntityFactory().create<T>(entityName, cached, { merge: true, convertCustomTypes: true, refresh }) as unknown as R;
      } else {
        data = cached;
      }

      return { key: cacheKey, data };
    }

    return { key: cacheKey };
  }

  /**
   * @internal
   */
  async storeCache(config: boolean | number | [string, number] | undefined, key: { key: string }, data: unknown | (() => unknown)) {
    if (config) {
      /* istanbul ignore next */
      const expiration = Array.isArray(config) ? config[1] : (Utils.isNumber(config) ? config : undefined);
      await this.resultCache.set(key.key, data instanceof Function ? data() : data, '', expiration);
    }
  }

  /**
   * @internal
   */
  [inspect.custom]() {
    return `[EntityManager<${this.id}>]`;
  }

}

export interface MergeOptions {
  refresh?: boolean;
  convertCustomTypes?: boolean;
  schema?: string;
}

interface ForkOptions {
  /** do we want clear identity map? defaults to true */
  clear?: boolean;
  /** use request context? should be used only for top level request scope EM, defaults to false */
  useContext?: boolean;
  /** do we want to use fresh EventManager instance? defaults to false (global instance) */
  freshEventManager?: boolean;
}
