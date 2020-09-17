import { inspect } from 'util';

import { Configuration, QueryHelper, Utils } from './utils';
import { AssignOptions, EntityAssigner, EntityFactory, EntityLoader, EntityRepository, EntityValidator, IdentifiedReference, Reference } from './entity';
import { UnitOfWork } from './unit-of-work';
import { CountOptions, DeleteOptions, EntityManagerType, FindOneOptions, FindOneOrFailOptions, FindOptions, IDatabaseDriver, UpdateOptions } from './drivers';
import { AnyEntity, Dictionary, EntityData, EntityMetadata, EntityName, FilterDef, FilterQuery, Loaded, Primary, Populate, PopulateMap, PopulateOptions, New, GetRepository } from './typings';
import { LoadStrategy, LockMode, QueryOrderMap, ReferenceType, SCALAR_TYPES } from './enums';
import { MetadataStorage } from './metadata';
import { Transaction } from './connections';
import { EventManager } from './events';
import { EntityComparator } from './utils/EntityComparator';
import { OptimisticLockError, ValidationError } from './errors';

/**
 * The EntityManager is the central access point to ORM functionality. It is a facade to all different ORM subsystems
 * such as UnitOfWork, Query Language and Repository API.
 */
export class EntityManager<D extends IDatabaseDriver = IDatabaseDriver> {

  private static counter = 1;
  readonly id = EntityManager.counter++;
  private readonly validator = new EntityValidator(this.config.get('strict'));
  private readonly repositoryMap: Dictionary<EntityRepository<AnyEntity>> = {};
  private readonly entityLoader: EntityLoader = new EntityLoader(this);
  private readonly comparator = new EntityComparator(this.metadata, this.driver.getPlatform());
  private readonly unitOfWork = new UnitOfWork(this);
  private readonly entityFactory = new EntityFactory(this.unitOfWork, this);
  private filters: Dictionary<FilterDef<any>> = {};
  private filterParams: Dictionary<Dictionary> = {};
  private transactionContext?: Transaction;

  constructor(readonly config: Configuration,
              private readonly driver: D,
              private readonly metadata: MetadataStorage,
              private readonly useContext = true,
              private readonly eventManager = new EventManager(config.get('subscribers'))) { }

  /**
   * Gets the Driver instance used by this EntityManager
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
  async find<T extends AnyEntity<T>, P extends Populate<T> = any>(entityName: EntityName<T>, where: FilterQuery<T>, options?: FindOptions<T, P>): Promise<Loaded<T, P>[]>;

  /**
   * Finds all entities matching your `where` query.
   */
  async find<T extends AnyEntity<T>, P extends Populate<T> = any>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: P, orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<Loaded<T, P>[]>;

  /**
   * Finds all entities matching your `where` query.
   */
  async find<T extends AnyEntity<T>, P extends Populate<T> = any>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: P | FindOptions<T, P>, orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<Loaded<T, P>[]> {
    const options = Utils.isObject<FindOptions<T, P>>(populate) ? populate : { populate, orderBy, limit, offset } as FindOptions<T, P>;
    entityName = Utils.className(entityName);
    where = QueryHelper.processWhere(where, entityName, this.metadata, this.driver.getPlatform(), options.convertCustomTypes);
    where = await this.applyFilters(entityName, where, options.filters ?? {}, 'read');
    this.validator.validateParams(where);
    options.orderBy = options.orderBy || {};
    options.populate = this.preparePopulate<T>(entityName, options.populate, options.strategy) as unknown as P;
    const results = await this.driver.find<T>(entityName, where, options, this.transactionContext);

    if (results.length === 0) {
      return [];
    }

    const ret: T[] = [];

    for (const data of results) {
      const entity = this.getEntityFactory().create(entityName, data as EntityData<T>, { merge: true, convertCustomTypes: true }) as T;
      this.getUnitOfWork().registerManaged(entity, data, options.refresh);
      ret.push(entity);
    }

    const unique = Utils.unique(ret);
    await this.entityLoader.populate<T>(entityName, unique, options.populate as unknown as PopulateOptions<T>[], { ...options, where, convertCustomTypes: false });

    return unique as Loaded<T, P>[];
  }

  addFilter<T1 extends AnyEntity<T1>>(name: string, cond: FilterQuery<T1> | ((args: Dictionary) => FilterQuery<T1>), entityName?: EntityName<T1> | [EntityName<T1>], enabled?: boolean): void;
  addFilter<T1 extends AnyEntity<T1>, T2 extends AnyEntity<T2>>(name: string, cond: FilterQuery<T1 | T2> | ((args: Dictionary) => FilterQuery<T1 | T2>), entityName?: [EntityName<T1>, EntityName<T2>], enabled?: boolean): void;
  addFilter<T1 extends AnyEntity<T1>, T2 extends AnyEntity<T2>, T3 extends AnyEntity<T3>>(name: string, cond: FilterQuery<T1 | T2 | T3> | ((args: Dictionary) => FilterQuery<T1 | T2 | T3>), entityName?: [EntityName<T1>, EntityName<T2>, EntityName<T3>], enabled?: boolean): void;
  addFilter(name: string, cond: FilterQuery<AnyEntity> | ((args: Dictionary) => FilterQuery<AnyEntity>), entityName?: EntityName<AnyEntity> | EntityName<AnyEntity>[], enabled = true): void {
    const options: FilterDef<AnyEntity> = { name, cond, default: enabled };

    if (entityName) {
      options.entity = Utils.asArray(entityName).map(n => Utils.className(n));
    }

    this.filters[name] = options;
  }

  setFilterParams(name: string, args: Dictionary): void {
    this.filterParams[name] = args;
  }

  getFilterParams<T extends Dictionary = Dictionary>(name: string): T {
    return this.filterParams[name] as T;
  }

  protected async applyFilters<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, options: Dictionary<boolean | Dictionary> | string[] | boolean, type: 'read' | 'update' | 'delete'): Promise<FilterQuery<T>> {
    const meta = this.metadata.find<T>(entityName);
    const filters: FilterDef<any>[] = [];
    const ret = {};

    if (!meta) {
      return where;
    }

    filters.push(...QueryHelper.getActiveFilters(entityName, options, this.config.get('filters')));
    filters.push(...QueryHelper.getActiveFilters(entityName, options, this.filters));
    filters.push(...QueryHelper.getActiveFilters(entityName, options, meta.filters));

    if (filters.length === 0) {
      return where;
    }

    for (const filter of filters) {
      let cond: Dictionary;

      if (filter.cond instanceof Function) {
        const args = Utils.isPlainObject(options[filter.name]) ? options[filter.name] : this.filterParams[filter.name];

        if (!args && filter.cond.length > 0) {
          throw new Error(`No arguments provided for filter '${filter.name}'`);
        }

        cond = await filter.cond(args, type);
      } else {
        cond = filter.cond;
      }

      const cond2 = QueryHelper.processWhere(cond, entityName, this.metadata, this.driver.getPlatform());
      Utils.merge(ret, cond2, where);
    }

    return Object.assign(where, ret);
  }

  /**
   * Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
   * where first element is the array of entities and the second is the count.
   */
  async findAndCount<T extends AnyEntity<T>, P extends Populate<T> = any>(entityName: EntityName<T>, where: FilterQuery<T>, options?: FindOptions<T, P>): Promise<[Loaded<T, P>[], number]>;

  /**
   * Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
   * where first element is the array of entities and the second is the count.
   */
  async findAndCount<T extends AnyEntity<T>, P extends Populate<T> = any>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: P, orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<[Loaded<T, P>[], number]>;

  /**
   * Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
   * where first element is the array of entities and the second is the count.
   */
  async findAndCount<T extends AnyEntity<T>, P extends Populate<T> = any>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: P | FindOptions<T, P>, orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<[Loaded<T, P>[], number]> {
    const [entities, count] = await Promise.all([
      this.find<T, P>(entityName, where, populate as P, orderBy, limit, offset),
      this.count(entityName, where),
    ]);

    return [entities, count];
  }

  /**
   * Finds first entity matching your `where` query.
   */
  async findOne<T extends AnyEntity<T>, P extends Populate<T> = any>(entityName: EntityName<T>, where: FilterQuery<T>, options?: FindOneOptions<T, P>): Promise<Loaded<T, P> | null>;

  /**
   * Finds first entity matching your `where` query.
   */
  async findOne<T extends AnyEntity<T>, P extends Populate<T> = any>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: P, orderBy?: QueryOrderMap): Promise<Loaded<T, P> | null>;

  /**
   * Finds first entity matching your `where` query.
   */
  async findOne<T extends AnyEntity<T>, P extends Populate<T> = any>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: P | FindOneOptions<T, P>, orderBy?: QueryOrderMap): Promise<Loaded<T, P> | null> {
    entityName = Utils.className(entityName);
    const options = Utils.isObject<FindOneOptions<T, P>>(populate) ? populate : { populate, orderBy } as FindOneOptions<T, P>;
    const meta = this.metadata.get<T>(entityName);
    where = QueryHelper.processWhere(where as FilterQuery<T>, entityName, this.metadata, this.driver.getPlatform(), options.convertCustomTypes);
    where = await this.applyFilters(entityName, where, options.filters ?? {}, 'read');
    this.validator.validateEmptyWhere(where);
    this.checkLockRequirements(options.lockMode, meta);
    let entity = this.getUnitOfWork().tryGetById<T>(entityName, where);
    const isOptimisticLocking = !Utils.isDefined(options.lockMode) || options.lockMode === LockMode.OPTIMISTIC;

    if (entity && entity.__helper!.__initialized && !options.refresh && isOptimisticLocking) {
      return this.lockAndPopulate<T, P>(entityName, entity, where, options);
    }

    this.validator.validateParams(where);
    options.populate = this.preparePopulate<T>(entityName, options.populate as true, options.strategy) as unknown as P;
    const data = await this.driver.findOne(entityName, where, options, this.transactionContext);

    if (!data) {
      return null;
    }

    entity = this.getEntityFactory().create<T>(entityName, data as EntityData<T>, { refresh: options.refresh, merge: true, convertCustomTypes: true });
    this.getUnitOfWork().registerManaged(entity, data, options.refresh);
    await this.lockAndPopulate(entityName, entity, where, options);

    return entity as Loaded<T, P>;
  }

  /**
   * Finds first entity matching your `where` query. If nothing found, it will throw an error.
   * You can override the factory for creating this method via `options.failHandler` locally
   * or via `Configuration.findOneOrFailHandler` globally.
   */
  async findOneOrFail<T extends AnyEntity<T>, P extends Populate<T> = any>(entityName: EntityName<T>, where: FilterQuery<T>, options?: FindOneOrFailOptions<T, P>): Promise<Loaded<T, P>>;

  /**
   * Finds first entity matching your `where` query. If nothing found, it will throw an error.
   * You can override the factory for creating this method via `options.failHandler` locally
   * or via `Configuration.findOneOrFailHandler` globally.
   */
  async findOneOrFail<T extends AnyEntity<T>, P extends Populate<T> = any>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: P, orderBy?: QueryOrderMap): Promise<Loaded<T, P>>;

  /**
   * Finds first entity matching your `where` query. If nothing found, it will throw an error.
   * You can override the factory for creating this method via `options.failHandler` locally
   * or via `Configuration.findOneOrFailHandler` globally.
   */
  async findOneOrFail<T extends AnyEntity<T>, P extends Populate<T> = any>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: P | FindOneOrFailOptions<T, P>, orderBy?: QueryOrderMap): Promise<Loaded<T, P>> {
    const entity = await this.findOne(entityName, where, populate as string[], orderBy);

    if (!entity) {
      const options = Utils.isObject<FindOneOrFailOptions<T>>(populate) ? populate : {};
      options.failHandler = options.failHandler || this.config.get('findOneOrFailHandler');
      entityName = Utils.className(entityName);
      throw options.failHandler!(entityName, where);
    }

    return entity as Loaded<T, P>;
  }

  /**
   * Runs your callback wrapped inside a database transaction.
   */
  async transactional<T>(cb: (em: D[typeof EntityManagerType]) => Promise<T>, ctx = this.transactionContext): Promise<T> {
    const em = this.fork(false);
    return em.getConnection().transactional(async trx => {
      em.transactionContext = trx;
      const ret = await cb(em);
      await em.flush();

      return ret;
    }, ctx);
  }

  /**
   * Starts new transaction bound to this EntityManager. Use `ctx` parameter to provide the parent when nesting transactions.
   */
  async begin(ctx?: Transaction): Promise<void> {
    this.transactionContext = await this.getConnection('write').begin(ctx);
  }

  /**
   * Commits the transaction bound to this EntityManager. Flushes before doing the actual commit query.
   */
  async commit(): Promise<void> {
    await this.flush();
    await this.getConnection('write').commit(this.transactionContext);
    delete this.transactionContext;
  }

  /**
   * Rollbacks the transaction bound to this EntityManager.
   */
  async rollback(): Promise<void> {
    await this.getConnection('write').rollback(this.transactionContext);
    delete this.transactionContext;
  }

  /**
   * Runs your callback wrapped inside a database transaction.
   */
  async lock(entity: AnyEntity, lockMode: LockMode, lockVersion?: number | Date): Promise<void> {
    await this.getUnitOfWork().lock(entity, lockMode, lockVersion);
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
  async nativeInsert<T extends AnyEntity<T>>(entityNameOrEntity: EntityName<T> | T, data?: EntityData<T>): Promise<Primary<T>> {
    let entityName;

    if (data === undefined) {
      entityName = entityNameOrEntity.constructor.name;
      data = this.comparator.prepareEntity(entityNameOrEntity as T);
    } else {
      entityName = Utils.className(entityNameOrEntity as EntityName<T>);
    }

    data = QueryHelper.processObjectParams(data) as EntityData<T>;
    this.validator.validateParams(data, 'insert data');
    const res = await this.driver.nativeInsert(entityName, data, this.transactionContext);

    return res.insertId as Primary<T>;
  }

  /**
   * Fires native update query. Calling this has no side effects on the context (identity map).
   */
  async nativeUpdate<T extends AnyEntity<T>>(entityName: EntityName<T>, where: FilterQuery<T>, data: EntityData<T>, options: UpdateOptions<T> = {}): Promise<number> {
    entityName = Utils.className(entityName);
    data = QueryHelper.processObjectParams(data);
    where = QueryHelper.processWhere(where as FilterQuery<T>, entityName, this.metadata, this.driver.getPlatform());
    where = await this.applyFilters(entityName, where, options.filters ?? {}, 'update');
    this.validator.validateParams(data, 'update data');
    this.validator.validateParams(where, 'update condition');
    const res = await this.driver.nativeUpdate(entityName, where, data, this.transactionContext);

    return res.affectedRows;
  }

  /**
   * Fires native delete query. Calling this has no side effects on the context (identity map).
   */
  async nativeDelete<T extends AnyEntity<T>>(entityName: EntityName<T>, where: FilterQuery<T>, options: DeleteOptions<T> = {}): Promise<number> {
    entityName = Utils.className(entityName);
    where = QueryHelper.processWhere(where as FilterQuery<T>, entityName, this.metadata, this.driver.getPlatform());
    where = await this.applyFilters(entityName, where, options.filters ?? {}, 'delete');
    this.validator.validateParams(where, 'delete condition');
    const res = await this.driver.nativeDelete(entityName, where, this.transactionContext);

    return res.affectedRows;
  }

  /**
   * Maps raw database result to an entity and merges it to this EntityManager.
   */
  map<T extends AnyEntity<T>>(entityName: EntityName<T>, result: EntityData<T>): T {
    entityName = Utils.className(entityName);
    const meta = this.metadata.get(entityName);
    const data = this.driver.mapResult(result, meta) as Dictionary;

    Object.keys(data).forEach(k => {
      const prop = meta.properties[k];
      if (prop && prop.reference === ReferenceType.SCALAR && SCALAR_TYPES.includes(prop.type) && (prop.setter || !prop.getter)) {
        return data[k] = this.validator.validateProperty(prop, data[k], data);
      }
    });

    return this.merge<T>(entityName, data as EntityData<T>, true, true);
  }

  /**
   * Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
   * via second parameter. By default it will return already loaded entities without modifying them.
   */
  merge<T extends AnyEntity<T>>(entity: T, refresh?: boolean): T;

  /**
   * Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
   * via second parameter. By default it will return already loaded entities without modifying them.
   */
  merge<T extends AnyEntity<T>>(entityName: EntityName<T>, data: EntityData<T>, refresh?: boolean, convertCustomTypes?: boolean): T;

  /**
   * Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
   * via second parameter. By default it will return already loaded entities without modifying them.
   */
  merge<T extends AnyEntity<T>>(entityName: EntityName<T> | T, data?: EntityData<T> | boolean, refresh?: boolean, convertCustomTypes?: boolean): T {
    if (Utils.isEntity(entityName)) {
      return this.merge(entityName.constructor.name, entityName as EntityData<T>, data as boolean);
    }

    entityName = Utils.className(entityName as string);
    this.validator.validatePrimaryKey(data as EntityData<T>, this.metadata.get(entityName));
    let entity = this.getUnitOfWork().tryGetById<T>(entityName, data as FilterQuery<T>, false);

    if (entity && entity.__helper!.__initialized && !refresh) {
      return entity;
    }

    entity = Utils.isEntity<T>(data) ? data : this.getEntityFactory().create<T>(entityName, data as EntityData<T>, { merge: true, convertCustomTypes });
    this.validator.validate(entity, data, this.metadata.find(entityName)!);
    this.getUnitOfWork().merge(entity);

    return entity;
  }

  /**
   * Creates new instance of given entity and populates it with given data
   */
  create<T extends AnyEntity<T>, P extends Populate<T> = any>(entityName: EntityName<T>, data: EntityData<T>): New<T, P> {
    return this.getEntityFactory().create<T, P>(entityName, data, { newEntity: true });
  }

  /**
   * Shortcut for `wrap(entity).assign(data, { em })`
   */
  assign<T extends AnyEntity<T>>(entity: T, data: EntityData<T>, options: AssignOptions = {}): T {
    return EntityAssigner.assign(entity, data, { em: this, ...options });
  }

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T extends AnyEntity<T>, PK extends keyof T>(entityName: EntityName<T>, id: Primary<T>, wrapped: true, convertCustomTypes?: boolean): IdentifiedReference<T, PK>;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T extends AnyEntity<T>>(entityName: EntityName<T>, id: Primary<T> | Primary<T>[]): T;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T extends AnyEntity<T>>(entityName: EntityName<T>, id: Primary<T>, wrapped: false, convertCustomTypes?: boolean): T;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T extends AnyEntity<T>>(entityName: EntityName<T>, id: Primary<T>, wrapped?: boolean, convertCustomTypes?: boolean): T | Reference<T>;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T extends AnyEntity<T>>(entityName: EntityName<T>, id: Primary<T>, wrapped = false, convertCustomTypes = false): T | Reference<T> {
    const meta = this.metadata.get(Utils.className(entityName));

    if (Utils.isPrimaryKey(id)) {
      if (meta.compositePK) {
        throw ValidationError.invalidCompositeIdentifier(meta);
      }

      id = [id] as Primary<T>;
    }

    const entity = this.getEntityFactory().createReference<T>(entityName, id, { merge: true, convertCustomTypes });

    if (wrapped) {
      return Reference.create(entity);
    }

    return entity;
  }

  /**
   * Returns total number of entities matching your `where` query.
   */
  async count<T extends AnyEntity<T>>(entityName: EntityName<T>, where: FilterQuery<T> = {}, options: CountOptions<T> = {}): Promise<number> {
    entityName = Utils.className(entityName);
    where = QueryHelper.processWhere(where, entityName, this.metadata, this.driver.getPlatform());
    where = await this.applyFilters(entityName, where, options.filters ?? {}, 'read');
    this.validator.validateParams(where);

    return this.driver.count(entityName, where, this.transactionContext);
  }

  /**
   * Tells the EntityManager to make an instance managed and persistent.
   * The entity will be entered into the database at or before transaction commit or as a result of the flush operation.
   */
  persist(entity: AnyEntity | Reference<AnyEntity> | (AnyEntity | Reference<AnyEntity>)[]): this {
    if (Utils.isEntity(entity)) {
      this.getUnitOfWork().persist(entity);
      return this;
    }

    const entities = Utils.asArray(entity);

    for (const ent of entities) {
      this.getUnitOfWork().persist(Reference.unwrapReference(ent));
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

  async populate<T extends AnyEntity<T>, P extends string | keyof T | Populate<T>>(entities: T, populate: P, where?: FilterQuery<T>, orderBy?: QueryOrderMap, refresh?: boolean, validate?: boolean): Promise<Loaded<T, P>>;
  async populate<T extends AnyEntity<T>, P extends string | keyof T | Populate<T>>(entities: T[], populate: P, where?: FilterQuery<T>, orderBy?: QueryOrderMap, refresh?: boolean, validate?: boolean): Promise<Loaded<T, P>[]>;
  async populate<T extends AnyEntity<T>, P extends string | keyof T | Populate<T>>(entities: T | T[], populate: P, where?: FilterQuery<T>, orderBy?: QueryOrderMap, refresh?: boolean, validate?: boolean): Promise<Loaded<T, P> | Loaded<T, P>[]>;
  async populate<T extends AnyEntity<T>, P extends string | keyof T | Populate<T>>(entities: T | T[], populate: P, where: FilterQuery<T> = {}, orderBy: QueryOrderMap = {}, refresh = false, validate = true): Promise<Loaded<T, P> | Loaded<T, P>[]> {
    const entitiesArray = Utils.asArray(entities);

    if (entitiesArray.length === 0) {
      return entities as Loaded<T, P>[];
    }

    populate = Utils.isString(populate) ? Utils.asArray(populate) as unknown as P : populate;

    const entityName = entitiesArray[0].constructor.name;
    const preparedPopulate = this.preparePopulate<T>(entityName, populate as true);
    await this.entityLoader.populate(entityName, entitiesArray, preparedPopulate, { where, orderBy, refresh, validate, convertCustomTypes: false });

    return entities as Loaded<T, P>[];
  }

  /**
   * Returns new EntityManager instance with its own identity map
   *
   * @param clear do we want clear identity map? defaults to true
   * @param useContext use request context? should be used only for top level request scope EM, defaults to false
   */
  fork(clear = true, useContext = false): D[typeof EntityManagerType] {
    const em = new (this.constructor as typeof EntityManager)(this.config, this.driver, this.metadata, useContext, this.eventManager);
    em.filters = { ...this.filters };
    em.filterParams = Utils.copy(this.filterParams);

    if (!clear) {
      for (const entity of this.getUnitOfWork().getIdentityMap().values()) {
        em.merge(entity);
      }
    }

    return em;
  }

  /**
   * Gets the UnitOfWork used by the EntityManager to coordinate operations.
   */
  getUnitOfWork(): UnitOfWork {
    const em = this.useContext ? (this.config.get('context')() || this) : this;
    return em.unitOfWork;
  }

  /**
   * Gets the EntityFactory used by the EntityManager.
   */
  getEntityFactory(): EntityFactory {
    const em = this.useContext ? (this.config.get('context')() || this) : this;
    return em.entityFactory;
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
   * Gets the MetadataStorage.
   */
  getMetadata(): MetadataStorage {
    return this.metadata;
  }

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

  private async lockAndPopulate<T extends AnyEntity<T>, P extends Populate<T> = any>(entityName: string, entity: T, where: FilterQuery<T>, options: FindOneOptions<T>): Promise<Loaded<T, P>> {
    if (options.lockMode === LockMode.OPTIMISTIC) {
      await this.lock(entity, options.lockMode, options.lockVersion);
    }

    const preparedPopulate = this.preparePopulate(entityName, options.populate as string[], options.strategy);
    await this.entityLoader.populate<T>(entityName, [entity], preparedPopulate, { ...options, where, convertCustomTypes: false });

    return entity as Loaded<T, P>;
  }

  private preparePopulate<T extends AnyEntity<T>>(entityName: string, populate?: Populate<T>, strategy?: LoadStrategy): PopulateOptions<T>[] {
    if (!populate) {
      return [];
    }

    const meta = this.metadata.get(entityName);

    if (Utils.isPlainObject(populate)) {
      return this.preparePopulateObject(meta, populate as true, strategy);
    }

    if (Array.isArray(populate)) {
      populate = (populate as string[]).map(field => {
        if (Utils.isString(field)) {
          return { field };
        }

        return field;
      }) as unknown as Populate<T>;
    }

    const ret: PopulateOptions<T>[] = this.entityLoader.normalizePopulate<T>(entityName, populate as true);

    return ret.map(field => {
      field.strategy = strategy ?? field.strategy;
      return field;
    });
  }

  private preparePopulateObject<T extends AnyEntity<T>>(meta: EntityMetadata<T>, populate: PopulateMap<T>, strategy?: LoadStrategy): PopulateOptions<T>[] {
    return Object.keys(populate).map(field => {
      const prop = meta.properties[field];
      const fieldStrategy = strategy ?? (Utils.isString(populate[field]) ? populate[field] : prop.strategy);

      if (populate[field] === true) {
        return { field, strategy: fieldStrategy };
      }

      if (Utils.isPlainObject(populate[field])) {
        const meta2 = this.metadata.get(prop!.type);
        return { field, strategy: fieldStrategy, children: this.preparePopulateObject(meta2, populate[field], strategy) };
      }

      return { field, strategy: fieldStrategy };
    });
  }

  [inspect.custom]() {
    return `[EntityManager<${this.id}>]`;
  }

}
