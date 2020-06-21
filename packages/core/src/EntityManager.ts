import { v4 as uuid } from 'uuid';
import { inspect } from 'util';

import { Configuration, RequestContext, SmartQueryHelper, Utils, ValidationError } from './utils';
import { EntityAssigner, EntityFactory, EntityLoader, EntityRepository, EntityValidator, IdentifiedReference, LoadStrategy, Reference, ReferenceType, wrap } from './entity';
import { LockMode, UnitOfWork } from './unit-of-work';
import { EntityManagerType, FindOneOptions, FindOptions, IDatabaseDriver, Populate, PopulateMap, PopulateOptions } from './drivers';
import { AnyEntity, Constructor, Dictionary, EntityData, EntityMetadata, EntityName, FilterQuery, IPrimaryKey, Primary } from './typings';
import { QueryOrderMap } from './enums';
import { MetadataStorage } from './metadata';
import { Transaction } from './connections';
import { EventManager } from './events';

/**
 * The EntityManager is the central access point to ORM functionality. It is a facade to all different ORM subsystems
 * such as UnitOfWork, Query Language and Repository API.
 */
export class EntityManager<D extends IDatabaseDriver = IDatabaseDriver> {

  readonly id = uuid();
  private readonly validator = new EntityValidator(this.config.get('strict'));
  private readonly repositoryMap: Dictionary<EntityRepository<AnyEntity>> = {};
  private readonly entityLoader: EntityLoader = new EntityLoader(this);
  private readonly unitOfWork = new UnitOfWork(this);
  private readonly entityFactory = new EntityFactory(this.unitOfWork, this);
  private readonly eventManager = new EventManager(this.config.get('subscribers'));
  private transactionContext?: Transaction;

  constructor(readonly config: Configuration,
              private readonly driver: D,
              private readonly metadata: MetadataStorage,
              private readonly useContext = true) { }

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
  getRepository<T extends AnyEntity<T>, U extends EntityRepository<T> = EntityRepository<T>>(entityName: EntityName<T>): U {
    entityName = Utils.className(entityName);

    if (!this.repositoryMap[entityName]) {
      const meta = this.metadata.get(entityName);
      const RepositoryClass = this.config.getRepositoryClass(meta.customRepository)!;
      this.repositoryMap[entityName] = new RepositoryClass(this, entityName);
    }

    return this.repositoryMap[entityName] as unknown as U;
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
  async find<T>(entityName: EntityName<T>, where: FilterQuery<T>, options?: FindOptions<T>): Promise<T[]>;

  /**
   * Finds all entities matching your `where` query.
   */
  async find<T>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: Populate<T>, orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<T[]>;

  /**
   * Finds all entities matching your `where` query.
   */
  async find<T>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: Populate<T> | FindOptions<T>, orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<T[]> {
    entityName = Utils.className(entityName);
    where = SmartQueryHelper.processWhere(where, entityName, this.metadata);
    this.validator.validateParams(where);
    const options = Utils.isObject<FindOptions<T>>(populate) ? populate : { populate, orderBy, limit, offset };
    options.orderBy = options.orderBy || {};
    options.populate = this.preparePopulate<T>(entityName, options.populate, options.strategy);
    const results = await this.driver.find<T>(entityName, where, options, this.transactionContext);

    if (results.length === 0) {
      return [];
    }

    const ret: T[] = [];

    for (const data of results) {
      const entity = this.merge<T>(entityName, data, options.refresh);
      ret.push(entity);
    }

    const unique = Utils.unique(ret);
    await this.entityLoader.populate<T>(entityName, unique, options.populate as PopulateOptions<T>[], where, options.orderBy, options.refresh);

    return unique;
  }

  /**
   * Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
   * where first element is the array of entities and the second is the count.
   */
  async findAndCount<T>(entityName: EntityName<T>, where: FilterQuery<T>, options?: FindOptions<T>): Promise<[T[], number]>;

  /**
   * Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
   * where first element is the array of entities and the second is the count.
   */
  async findAndCount<T>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: Populate<T>, orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<[T[], number]>;

  /**
   * Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
   * where first element is the array of entities and the second is the count.
   */
  async findAndCount<T>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: Populate<T> | FindOptions<T>, orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<[T[], number]> {
    const [entities, count] = await Promise.all([
      this.find(entityName, where, populate as string[], orderBy, limit, offset),
      this.count(entityName, where),
    ]);

    return [entities, count];
  }

  /**
   * Finds first entity matching your `where` query.
   */
  async findOne<T>(entityName: EntityName<T>, where: FilterQuery<T>, options?: FindOneOptions<T>): Promise<T | null>;

  /**
   * Finds first entity matching your `where` query.
   */
  async findOne<T>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: Populate<T>, orderBy?: QueryOrderMap): Promise<T | null>;

  /**
   * Finds first entity matching your `where` query.
   */
  async findOne<T>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: Populate<T> | FindOneOptions<T>, orderBy?: QueryOrderMap): Promise<T | null> {
    entityName = Utils.className(entityName);
    const options = Utils.isObject<FindOneOptions<T>>(populate) ? populate : { populate, orderBy };
    const meta = this.metadata.get<T>(entityName);
    this.validator.validateEmptyWhere(where);
    where = SmartQueryHelper.processWhere(where as FilterQuery<T>, entityName, this.metadata);
    this.checkLockRequirements(options.lockMode, meta);
    let entity = this.getUnitOfWork().tryGetById<T>(entityName, where);
    const isOptimisticLocking = !Utils.isDefined(options.lockMode) || options.lockMode === LockMode.OPTIMISTIC;

    if (entity && wrap(entity).isInitialized() && !options.refresh && isOptimisticLocking) {
      return this.lockAndPopulate(entityName, entity, where, options);
    }

    this.validator.validateParams(where);
    options.populate = this.preparePopulate<T>(entityName, options.populate, options.strategy);
    const data = await this.driver.findOne(entityName, where, options, this.transactionContext);

    if (!data) {
      return null;
    }

    entity = this.merge(entityName, data as EntityData<T>, options.refresh) as T;
    await this.lockAndPopulate(entityName, entity, where, options);

    return entity;
  }

  /**
   * Finds first entity matching your `where` query. If nothing found, it will throw an error.
   * You can override the factory for creating this method via `options.failHandler` locally
   * or via `Configuration.findOneOrFailHandler` globally.
   */
  async findOneOrFail<T>(entityName: EntityName<T>, where: FilterQuery<T>, options?: FindOneOrFailOptions<T>): Promise<T>;

  /**
   * Finds first entity matching your `where` query. If nothing found, it will throw an error.
   * You can override the factory for creating this method via `options.failHandler` locally
   * or via `Configuration.findOneOrFailHandler` globally.
   */
  async findOneOrFail<T>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: Populate<T>, orderBy?: QueryOrderMap): Promise<T>;

  /**
   * Finds first entity matching your `where` query. If nothing found, it will throw an error.
   * You can override the factory for creating this method via `options.failHandler` locally
   * or via `Configuration.findOneOrFailHandler` globally.
   */
  async findOneOrFail<T>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: Populate<T> | FindOneOrFailOptions<T>, orderBy?: QueryOrderMap): Promise<T> {
    const entity = await this.findOne(entityName, where, populate as string[], orderBy);

    if (!entity) {
      const options = Utils.isObject<FindOneOrFailOptions<T>>(populate) ? populate : {};
      options.failHandler = options.failHandler || this.config.get('findOneOrFailHandler');
      entityName = Utils.className(entityName);
      throw options.failHandler!(entityName, where);
    }

    return entity;
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
   * Runs your callback wrapped inside a database transaction.
   */
  async lock(entity: AnyEntity, lockMode: LockMode, lockVersion?: number | Date): Promise<void> {
    await this.getUnitOfWork().lock(entity, lockMode, lockVersion);
  }

  /**
   * Fires native insert query. Calling this has no side effects on the context (identity map).
   */
  async nativeInsert<T>(entityName: EntityName<T>, data: EntityData<T>): Promise<Primary<T>> {
    entityName = Utils.className(entityName);
    data = SmartQueryHelper.processParams(data);
    this.validator.validateParams(data, 'insert data');
    const res = await this.driver.nativeInsert(entityName, data, this.transactionContext);

    return res.insertId as Primary<T>;
  }

  /**
   * Fires native update query. Calling this has no side effects on the context (identity map).
   */
  async nativeUpdate<T>(entityName: EntityName<T>, where: FilterQuery<T>, data: EntityData<T>): Promise<number> {
    entityName = Utils.className(entityName);
    data = SmartQueryHelper.processParams(data);
    where = SmartQueryHelper.processWhere(where as FilterQuery<T>, entityName, this.metadata);
    this.validator.validateParams(data, 'update data');
    this.validator.validateParams(where, 'update condition');
    const res = await this.driver.nativeUpdate(entityName, where, data, this.transactionContext);

    return res.affectedRows;
  }

  /**
   * Fires native delete query. Calling this has no side effects on the context (identity map).
   */
  async nativeDelete<T>(entityName: EntityName<T>, where: FilterQuery<T>): Promise<number> {
    entityName = Utils.className(entityName);
    where = SmartQueryHelper.processWhere(where as FilterQuery<T>, entityName, this.metadata);
    this.validator.validateParams(where, 'delete condition');
    const res = await this.driver.nativeDelete(entityName, where, this.transactionContext);

    return res.affectedRows;
  }

  /**
   * Maps raw database result to an entity and merges it to this EntityManager.
   */
  map<T>(entityName: EntityName<T>, result: EntityData<T>): T {
    entityName = Utils.className(entityName);
    const meta = this.metadata.get(entityName);
    const data = this.driver.mapResult(result, meta)!;

    return this.merge<T>(entityName, data, true);
  }

  /**
   * Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
   * via second parameter. By default it will return already loaded entities without modifying them.
   */
  merge<T>(entity: T, refresh?: boolean): T;

  /**
   * Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
   * via second parameter. By default it will return already loaded entities without modifying them.
   */
  merge<T>(entityName: EntityName<T>, data: EntityData<T>, refresh?: boolean): T;

  /**
   * Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
   * via second parameter. By default it will return already loaded entities without modifying them.
   */
  merge<T>(entityName: EntityName<T> | T, data?: EntityData<T> | boolean, refresh?: boolean): T {
    if (Utils.isEntity(entityName)) {
      return this.merge(entityName.constructor.name, entityName as EntityData<T>, data as boolean);
    }

    entityName = Utils.className(entityName as string);
    this.validator.validatePrimaryKey(data as EntityData<T>, this.metadata.get(entityName));
    let entity = this.getUnitOfWork().tryGetById<T>(entityName, data as FilterQuery<T>);

    if (entity && wrap(entity).isInitialized() && !refresh) {
      return entity;
    }

    entity = Utils.isEntity<T>(data) ? data : this.getEntityFactory().create<T>(entityName, data as EntityData<T>);

    // add to IM immediately - needed for self-references that can be part of `data` (do not trigger cascade merge)
    this.getUnitOfWork().merge(entity, [entity]);
    EntityAssigner.assign(entity, data as EntityData<T>, { onlyProperties: true, merge: true });
    this.getUnitOfWork().merge(entity); // add to IM again so we have correct payload saved for change set computation

    return entity;
  }

  /**
   * Creates new instance of given entity and populates it with given data
   */
  create<T>(entityName: EntityName<T>, data: EntityData<T>): T {
    return this.getEntityFactory().create(entityName, data, true, true);
  }

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T, PK extends keyof T>(entityName: EntityName<T>, id: Primary<T> | Primary<T>[], wrapped: true): IdentifiedReference<T, PK>;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T>(entityName: EntityName<T>, id: Primary<T> | Primary<T>[]): T;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T>(entityName: EntityName<T>, id: Primary<T> | Primary<T>[], wrapped: false): T;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T>(entityName: EntityName<T>, id: Primary<T> | Primary<T>[], wrapped: boolean): T | Reference<T>;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T>(entityName: EntityName<T>, id: Primary<T> | Primary<T>[], wrapped = false): T | Reference<T> {
    const meta = this.metadata.get(Utils.className(entityName));

    if (Utils.isPrimaryKey(id)) {
      if (meta.compositePK) {
        throw ValidationError.invalidCompositeIdentifier(meta);
      }

      id = [id];
    }

    const entity = this.getEntityFactory().createReference<T>(entityName, id);
    this.getUnitOfWork().merge(entity, [entity], false);

    if (wrapped) {
      return Reference.create(entity);
    }

    return entity;
  }

  /**
   * Returns total number of entities matching your `where` query.
   */
  async count<T>(entityName: EntityName<T>, where: FilterQuery<T> = {}): Promise<number> {
    entityName = Utils.className(entityName);
    where = SmartQueryHelper.processWhere(where, entityName, this.metadata);
    this.validator.validateParams(where);

    return this.driver.count(entityName, where, this.transactionContext);
  }

  /**
   * Tells the EntityManager to make an instance managed and persistent. You can force flushing via second parameter.
   * The entity will be entered into the database at or before transaction commit or as a result of the flush operation.
   */
  persist(entity: AnyEntity | AnyEntity[], flush?: false): void;
  persist(entity: AnyEntity | AnyEntity[], flush: true): Promise<void>;
  persist(entity: AnyEntity | AnyEntity[], flush = false): void | Promise<void> {
    const entities = Utils.asArray(entity);

    for (const ent of entities) {
      this.getUnitOfWork().persist(ent);
    }

    if (flush) {
      return this.flush();
    }
  }

  /**
   * Persists your entity immediately, flushing all not yet persisted changes to the database too.
   * Equivalent to `em.persistLater(e) && em.flush()`.
   */
  async persistAndFlush(entity: AnyEntity | AnyEntity[]): Promise<void> {
    this.persist(entity);
    await this.flush();
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
   * Removes an entity instance or all entities matching your `where` query. When deleting entity by instance, you
   * will need to flush your changes. You can force flushing via third parameter.
   */
  remove<T>(entityName: EntityName<T>, where: FilterQuery<T> | T, flush?: false): void;
  remove<T>(entityName: EntityName<T>, where: FilterQuery<T> | T, flush: true): Promise<number>;
  remove<T>(entityName: EntityName<T>, where: FilterQuery<T> | T, flush = false): void | Promise<number> {
    entityName = Utils.className(entityName);

    if (Utils.isEntity(where)) {
      const ret = this.removeEntity(where as T, flush as true);
      return ret ? ret.then(() => 1) : ret;
    }

    this.validator.validateRemoveEmptyWhere(entityName, where);

    return this.nativeDelete(entityName, where);
  }

  /**
   * Removes an entity instance. You can force flushing via second parameter.
   * A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.
   */
  removeEntity<T>(entity: T, flush?: false): void;
  removeEntity<T>(entity: T, flush: true): Promise<void>;
  removeEntity<T>(entity: T, flush = false): void | Promise<void> {
    this.getUnitOfWork().remove(entity);

    if (flush) {
      return this.flush();
    }
  }

  /**
   * Removes an entity instance immediately, flushing all not yet persisted changes to the database too.
   * Equivalent to `em.removeLater(e) && em.flush()`
   */
  async removeAndFlush(entity: AnyEntity): Promise<void> {
    this.getUnitOfWork().remove(entity);
    await this.flush();
  }

  /**
   * Removes an entity instance.
   * A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.
   *
   * @deprecated use `removeEntity()`
   */
  removeLater(entity: AnyEntity): void {
    this.getUnitOfWork().remove(entity);
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
  canPopulate<T>(entityName: EntityName<T>, property: string): boolean {
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

  async populate<T>(entities: T, populate: string | Populate<T>, where?: FilterQuery<T>, orderBy?: QueryOrderMap, refresh?: boolean, validate?: boolean): Promise<T>;
  async populate<T>(entities: T[], populate: string | Populate<T>, where?: FilterQuery<T>, orderBy?: QueryOrderMap, refresh?: boolean, validate?: boolean): Promise<T[]>;
  async populate<T>(entities: T | T[], populate: string | Populate<T>, where: FilterQuery<T> = {}, orderBy: QueryOrderMap = {}, refresh = false, validate = true): Promise<T | T[]> {
    const entitiesArray = Utils.asArray(entities);

    if (entitiesArray.length === 0) {
      return entities;
    }

    populate = Utils.isString(populate) ? Utils.asArray(populate) : populate;

    const entityName = (entitiesArray[0] as unknown as Constructor<any>).constructor.name;
    const preparedPopulate = this.preparePopulate<T>(entityName, populate);
    await this.entityLoader.populate(entityName, entitiesArray, preparedPopulate, where, orderBy, refresh, validate);

    return entities;
  }

  /**
   * Returns new EntityManager instance with its own identity map
   *
   * @param clear do we want clear identity map? defaults to true
   * @param useContext use request context? should be used only for top level request scope EM, defaults to false
   */
  fork(clear = true, useContext = false): D[typeof EntityManagerType] {
    const em = new (this.constructor as typeof EntityManager)(this.config, this.driver, this.metadata, useContext);

    if (!clear) {
      Object.values(this.getUnitOfWork().getIdentityMap()).forEach(entity => em.merge(entity));
    }

    return em;
  }

  /**
   * Gets the UnitOfWork used by the EntityManager to coordinate operations.
   */
  getUnitOfWork(): UnitOfWork {
    const em = this.useContext ? (RequestContext.getEntityManager() || this) : this;
    return em.unitOfWork;
  }

  /**
   * Gets the EntityFactory used by the EntityManager.
   */
  getEntityFactory(): EntityFactory {
    const em = this.useContext ? (RequestContext.getEntityManager() || this) : this;
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

  private checkLockRequirements(mode: LockMode | undefined, meta: EntityMetadata): void {
    if (!mode) {
      return;
    }

    if (mode === LockMode.OPTIMISTIC && !meta.versionProperty) {
      throw ValidationError.notVersioned(meta);
    }

    if ([LockMode.PESSIMISTIC_READ, LockMode.PESSIMISTIC_WRITE].includes(mode) && !this.isInTransaction()) {
      throw ValidationError.transactionRequired();
    }
  }

  private async lockAndPopulate<T>(entityName: string, entity: T, where: FilterQuery<T>, options: FindOneOptions<T>): Promise<T> {
    if (options.lockMode === LockMode.OPTIMISTIC) {
      await this.lock(entity, options.lockMode, options.lockVersion);
    }

    const preparedPopulate = this.preparePopulate(entityName, options.populate, options.strategy);
    await this.entityLoader.populate(entityName, [entity], preparedPopulate, where, options.orderBy || {}, options.refresh);

    return entity;
  }

  private preparePopulate<T>(entityName: string, populate?: Populate<T>, strategy?: LoadStrategy): PopulateOptions<T>[] {
    if (!populate) {
      return [];
    }

    const meta = this.metadata.get(entityName);

    if (Utils.isPlainObject(populate)) {
      return this.preparePopulateObject(meta, populate as PopulateMap<T>, strategy);
    }

    if (Array.isArray(populate)) {
      populate = (populate as string[]).map(field => {
        if (Utils.isString(field)) {
          return { field };
        }

        return field;
      });
    }

    const ret: PopulateOptions<T>[] = this.entityLoader.normalizePopulate<T>(entityName, populate as true);

    return ret.map(field => {
      field.strategy = strategy ?? field.strategy;
      return field;
    });
  }

  private preparePopulateObject<T>(meta: EntityMetadata<T>, populate: PopulateMap<T>, strategy?: LoadStrategy): PopulateOptions<T>[] {
    return Object.keys(populate).map(field => {
      const prop = meta.properties[field];
      const fieldStrategy = strategy ?? (Utils.isString(populate[field]) ? populate[field] : prop.strategy);

      if (populate[field] === true) {
        return { field, strategy: fieldStrategy };
      }

      if (Array.isArray(populate[field])) {
        const meta2 = this.metadata.get(prop!.type);
        return { field, strategy: populate[field][0], children: this.preparePopulateObject(meta2, populate[field][1], strategy) };
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

export interface FindOneOrFailOptions<T> extends FindOneOptions<T> {
  failHandler?: (entityName: string, where: Dictionary | IPrimaryKey | any) => Error;
}
