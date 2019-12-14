import { v4 as uuid } from 'uuid';

import { Configuration, RequestContext, Utils, ValidationError } from './utils';
import { EntityAssigner, EntityFactory, EntityLoader, EntityRepository, EntityValidator, IdentifiedReference, Reference, ReferenceType, wrap } from './entity';
import { LockMode, UnitOfWork } from './unit-of-work';
import { AbstractSqlDriver, IDatabaseDriver } from './drivers';
import { EntityData, EntityMetadata, EntityName, AnyEntity, IPrimaryKey, FilterQuery, Primary, Dictionary } from './typings';
import { QueryBuilder, QueryOrderMap, SmartQueryHelper } from './query';
import { MetadataStorage } from './metadata';
import { Transaction } from './connections';

export class EntityManager<D extends IDatabaseDriver = IDatabaseDriver> {

  readonly id = uuid();
  private readonly validator = new EntityValidator(this.config.get('strict'));
  private readonly repositoryMap: Record<string, EntityRepository<AnyEntity>> = {};
  private readonly entityLoader: EntityLoader = new EntityLoader(this);
  private readonly unitOfWork = new UnitOfWork(this);
  private readonly entityFactory = new EntityFactory(this.unitOfWork, this);
  private transactionContext?: Transaction;

  constructor(readonly config: Configuration,
              private readonly driver: D,
              private readonly metadata: MetadataStorage,
              private readonly useContext = true) { }

  getDriver(): D {
    return this.driver;
  }

  getConnection(type?: 'read' | 'write'): ReturnType<D['getConnection']> {
    return this.driver.getConnection(type) as ReturnType<D['getConnection']>;
  }

  getRepository<T extends AnyEntity<T>, U extends EntityRepository<T> = EntityRepository<T>>(entityName: EntityName<T>): U;
  getRepository<T extends AnyEntity<T>>(entityName: EntityName<T>): EntityRepository<T> {
    entityName = Utils.className(entityName);

    if (!this.repositoryMap[entityName]) {
      const meta = this.metadata.get(entityName);
      const RepositoryClass = this.config.getRepositoryClass(meta.customRepository);
      this.repositoryMap[entityName] = new RepositoryClass(this, entityName);
    }

    return this.repositoryMap[entityName] as unknown as EntityRepository<T>;
  }

  getValidator(): EntityValidator {
    return this.validator;
  }

  createQueryBuilder<T extends AnyEntity<T>>(entityName: EntityName<T>, alias?: string, type?: 'read' | 'write'): QueryBuilder<T> {
    entityName = Utils.className(entityName);
    const driver = this.driver as object;

    if (!(driver instanceof AbstractSqlDriver)) {
      throw new Error('Not supported by given driver');
    }

    return new QueryBuilder<T>(entityName, this.metadata, driver, this.transactionContext, alias, type, this);
  }

  async find<T extends AnyEntity<T>>(entityName: EntityName<T>, where: FilterQuery<T>, options?: FindOptions): Promise<T[]>;
  async find<T extends AnyEntity<T>>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: string[] | boolean, orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<T[]>;
  async find<T extends AnyEntity<T>>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: string[] | boolean | FindOptions, orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<T[]> {
    entityName = Utils.className(entityName);
    where = SmartQueryHelper.processWhere(where, entityName, this.metadata.get(entityName));
    this.validator.validateParams(where);
    const options = Utils.isObject<FindOptions>(populate) ? populate : { populate, orderBy, limit, offset };
    const results = await this.driver.find(entityName, where, this.preparePopulate(options.populate), options.orderBy || {}, options.fields, options.limit, options.offset, this.transactionContext);

    if (results.length === 0) {
      return [];
    }

    const ret: T[] = [];

    for (const data of results) {
      const entity = this.merge<T>(entityName, data, options.refresh);
      ret.push(entity);
    }

    const unique = Utils.unique(ret);
    await this.entityLoader.populate(entityName, unique, options.populate || [], where, options.orderBy || {}, options.refresh);

    return unique;
  }

  async findAndCount<T extends AnyEntity<T>>(entityName: EntityName<T>, where: FilterQuery<T>, options?: FindOptions): Promise<[T[], number]>;
  async findAndCount<T extends AnyEntity<T>>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: string[] | boolean, orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<[T[], number]>;
  async findAndCount<T extends AnyEntity<T>>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: string[] | boolean | FindOptions, orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<[T[], number]> {
    const entities = await this.find(entityName, where, populate as string[], orderBy, limit, offset);
    const count = await this.count<T>(entityName, where);

    return [entities, count];
  }

  async findOne<T extends AnyEntity<T>>(entityName: EntityName<T>, where: FilterQuery<T>, options?: FindOneOptions): Promise<T | null>;
  async findOne<T extends AnyEntity<T>>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: string[] | boolean, orderBy?: QueryOrderMap): Promise<T | null>;
  async findOne<T extends AnyEntity<T>>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: string[] | boolean | FindOneOptions, orderBy?: QueryOrderMap): Promise<T | null> {
    entityName = Utils.className(entityName);
    const options = Utils.isObject<FindOneOptions>(populate) ? populate : { populate, orderBy };
    const meta = this.metadata.get<T>(entityName);
    this.validator.validateEmptyWhere(where);
    where = SmartQueryHelper.processWhere(where as FilterQuery<T>, entityName, meta);
    this.checkLockRequirements(options.lockMode, meta);
    let entity = this.getUnitOfWork().tryGetById<T>(entityName, where);
    const isOptimisticLocking = !Utils.isDefined(options.lockMode) || options.lockMode === LockMode.OPTIMISTIC;

    if (entity && wrap(entity).isInitialized() && !options.refresh && isOptimisticLocking) {
      return this.lockAndPopulate(entity, where, options);
    }

    this.validator.validateParams(where);
    const data = await this.driver.findOne(entityName, where, this.preparePopulate(options.populate), options.orderBy, options.fields, options.lockMode, this.transactionContext);

    if (!data) {
      return null;
    }

    entity = this.merge(entityName, data as EntityData<T>, options.refresh) as T;
    await this.lockAndPopulate(entity, where, options);

    return entity;
  }

  async findOneOrFail<T extends AnyEntity<T>>(entityName: EntityName<T>, where: FilterQuery<T>, options?: FindOneOrFailOptions): Promise<T>;
  async findOneOrFail<T extends AnyEntity<T>>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: string[] | boolean, orderBy?: QueryOrderMap): Promise<T>;
  async findOneOrFail<T extends AnyEntity<T>>(entityName: EntityName<T>, where: FilterQuery<T>, populate?: string[] | boolean | FindOneOrFailOptions, orderBy?: QueryOrderMap): Promise<T> {
    const entity = await this.findOne(entityName, where, populate as string[], orderBy);

    if (!entity) {
      const options = Utils.isObject<FindOneOrFailOptions>(populate) ? populate : {};
      options.failHandler = options.failHandler || this.config.get('findOneOrFailHandler');
      entityName = Utils.className(entityName);
      throw options.failHandler!(entityName, where);
    }

    return entity;
  }

  async transactional<T>(cb: (em: EntityManager) => Promise<T>, ctx = this.transactionContext): Promise<T> {
    const em = this.fork(false);
    return em.getConnection().transactional(async trx => {
      em.transactionContext = trx;
      const ret = await cb(em);
      await em.flush();

      return ret;
    }, ctx);
  }

  async lock(entity: AnyEntity, lockMode: LockMode, lockVersion?: number | Date): Promise<void> {
    await this.getUnitOfWork().lock(entity, lockMode, lockVersion);
  }

  async nativeInsert<T extends AnyEntity<T>>(entityName: EntityName<T>, data: EntityData<T>): Promise<Primary<T>> {
    entityName = Utils.className(entityName);
    data = SmartQueryHelper.processParams(data);
    this.validator.validateParams(data, 'insert data');
    const res = await this.driver.nativeInsert(entityName, data, this.transactionContext);

    return res.insertId as Primary<T>;
  }

  async nativeUpdate<T extends AnyEntity<T>>(entityName: EntityName<T>, where: FilterQuery<T>, data: EntityData<T>): Promise<number> {
    entityName = Utils.className(entityName);
    data = SmartQueryHelper.processParams(data);
    where = SmartQueryHelper.processWhere(where as FilterQuery<T>, entityName, this.metadata.get(entityName, false, false));
    this.validator.validateParams(data, 'update data');
    this.validator.validateParams(where, 'update condition');
    const res = await this.driver.nativeUpdate(entityName, where, data, this.transactionContext);

    return res.affectedRows;
  }

  async nativeDelete<T extends AnyEntity<T>>(entityName: EntityName<T>, where: FilterQuery<T>): Promise<number> {
    entityName = Utils.className(entityName);
    where = SmartQueryHelper.processWhere(where as FilterQuery<T>, entityName, this.metadata.get(entityName, false, false));
    this.validator.validateParams(where, 'delete condition');
    const res = await this.driver.nativeDelete(entityName, where, this.transactionContext);

    return res.affectedRows;
  }

  map<T extends AnyEntity<T>>(entityName: EntityName<T>, result: EntityData<T>): T {
    entityName = Utils.className(entityName);
    const meta = this.metadata.get(entityName);
    const data = this.driver.mapResult(result, meta)!;

    return this.merge<T>(entityName, data, true);
  }

  /**
   * Shortcut to driver's aggregate method. Available in MongoDriver only.
   */
  async aggregate(entityName: EntityName<AnyEntity>, pipeline: any[]): Promise<any[]> {
    entityName = Utils.className(entityName);
    return this.driver.aggregate(entityName, pipeline);
  }

  merge<T extends AnyEntity<T>>(entity: T, refresh?: boolean): T;
  merge<T extends AnyEntity<T>>(entityName: EntityName<T>, data: EntityData<T>, refresh?: boolean): T;
  merge<T extends AnyEntity<T>>(entityName: EntityName<T> | T, data?: EntityData<T> | boolean, refresh?: boolean): T {
    if (Utils.isEntity(entityName)) {
      return this.merge(entityName.constructor.name, entityName as EntityData<T>, data as boolean);
    }

    entityName = Utils.className(entityName);
    this.validator.validatePrimaryKey(data as EntityData<T>, this.metadata.get(entityName));
    let entity = this.getUnitOfWork().tryGetById<T>(entityName, data as FilterQuery<T>);

    if (entity && wrap(entity).isInitialized() && !refresh) {
      return entity;
    }

    entity = Utils.isEntity<T>(data) ? data : this.getEntityFactory().create<T>(entityName, data as EntityData<T>);

    // add to IM immediately - needed for self-references that can be part of `data` (and do not trigger cascade merge)
    this.getUnitOfWork().merge(entity, [entity]);
    EntityAssigner.assign(entity, data as EntityData<T>, true);
    this.getUnitOfWork().merge(entity); // add to IM again so we have correct payload saved to change set computation

    return entity;
  }

  /**
   * Creates new instance of given entity and populates it with given data
   */
  create<T extends AnyEntity<T>>(entityName: EntityName<T>, data: EntityData<T>): T {
    return this.getEntityFactory().create(entityName, data, true, true);
  }

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T extends AnyEntity<T>, PK extends keyof T>(entityName: EntityName<T>, id: Primary<T>, wrapped: true): IdentifiedReference<T, PK>; // tslint:disable-next-line:lines-between-class-members
  getReference<T extends AnyEntity<T>>(entityName: EntityName<T>, id: Primary<T>): T; // tslint:disable-next-line:lines-between-class-members
  getReference<T extends AnyEntity<T>>(entityName: EntityName<T>, id: Primary<T>, wrapped: false): T; // tslint:disable-next-line:lines-between-class-members
  getReference<T extends AnyEntity<T>>(entityName: EntityName<T>, id: Primary<T>, wrapped: boolean): T | Reference<T>; // tslint:disable-next-line:lines-between-class-members
  getReference<T extends AnyEntity<T>>(entityName: EntityName<T>, id: Primary<T>, wrapped = false): T | Reference<T> {
    const entity = this.getEntityFactory().createReference<T>(entityName, id);
    this.getUnitOfWork().merge(entity, [], false);

    if (wrapped) {
      return Reference.create(entity);
    }

    return entity;
  }

  async count<T extends AnyEntity<T>>(entityName: EntityName<T>, where: FilterQuery<T> = {}): Promise<number> {
    entityName = Utils.className(entityName);
    where = SmartQueryHelper.processWhere(where, entityName, this.metadata.get(entityName));
    this.validator.validateParams(where);

    return this.driver.count(entityName, where, this.transactionContext);
  }

  persist(entity: AnyEntity | AnyEntity[], flush = this.config.get('autoFlush')): void | Promise<void> {
    if (flush) {
      return this.persistAndFlush(entity);
    }

    this.persistLater(entity);
  }

  async persistAndFlush(entity: AnyEntity | AnyEntity[]): Promise<void> {
    this.persistLater(entity);
    await this.flush();
  }

  persistLater(entity: AnyEntity | AnyEntity[]): void {
    const entities = Utils.asArray(entity);

    for (const ent of entities) {
      this.getUnitOfWork().persist(ent);
    }
  }

  remove<T extends AnyEntity<T>>(entityName: EntityName<T>, where: any, flush = this.config.get('autoFlush')): void | Promise<number> {
    entityName = Utils.className(entityName);

    if (Utils.isEntity(where)) {
      const ret = this.removeEntity(where, flush);
      return ret ? ret.then(() => 1) : ret;
    }

    return this.nativeDelete(entityName, where);
  }

  removeEntity<T extends AnyEntity<T>>(entity: T, flush = this.config.get('autoFlush')): void | Promise<void> {
    if (flush) {
      return this.removeAndFlush(entity);
    }

    this.removeLater(entity);
  }

  async removeAndFlush(entity: AnyEntity): Promise<void> {
    this.getUnitOfWork().remove(entity);
    await this.flush();
  }

  removeLater(entity: AnyEntity): void {
    this.getUnitOfWork().remove(entity);
  }

  /**
   * flush changes to database
   */
  async flush(): Promise<void> {
    await this.getUnitOfWork().commit();
  }

  /**
   * clear identity map, detaching all entities
   */
  clear(): void {
    this.getUnitOfWork().clear();
  }

  canPopulate(entityName: string | Function, property: string): boolean {
    entityName = Utils.className(entityName);
    const [p, ...parts] = property.split('.');
    const props = this.metadata.get(entityName).properties;
    const ret = p in props && props[p].reference !== ReferenceType.SCALAR;

    if (!ret) {
      return false;
    }

    if (parts.length > 0) {
      return this.canPopulate(props[p].type, parts.join('.'));
    }

    return ret;
  }

  /**
   * Returns new EntityManager instance with its own identity map
   *
   * @param clear do we want clear identity map? defaults to true
   * @param useContext use request context? should be used only for top level request scope EM, defaults to false
   */
  fork(clear = true, useContext = false): EntityManager {
    const em = new EntityManager(this.config, this.driver, this.metadata, useContext);

    if (!clear) {
      Object.values(this.getUnitOfWork().getIdentityMap()).forEach(entity => em.merge(entity));
    }

    return em;
  }

  getUnitOfWork(): UnitOfWork {
    const em = this.useContext ? (RequestContext.getEntityManager() || this) : this;
    return em.unitOfWork;
  }

  getEntityFactory(): EntityFactory {
    const em = this.useContext ? (RequestContext.getEntityManager() || this) : this;
    return em.entityFactory;
  }

  isInTransaction(): boolean {
    return !!this.transactionContext;
  }

  getTransactionContext<T extends Transaction = Transaction>(): T {
    return this.transactionContext as T;
  }

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

  private async lockAndPopulate<T extends AnyEntity<T>>(entity: T, where: FilterQuery<T>, options: FindOneOptions): Promise<T> {
    if (options.lockMode === LockMode.OPTIMISTIC) {
      await this.lock(entity, options.lockMode, options.lockVersion);
    }

    await this.entityLoader.populate(entity.constructor.name, [entity], options.populate || [], where, options.orderBy || {}, options.refresh);

    return entity;
  }

  private preparePopulate(populate?: string[] | boolean) {
    return Array.isArray(populate) ? populate : [];
  }

}

export interface FindOptions {
  populate?: string[] | boolean;
  orderBy?: QueryOrderMap;
  limit?: number;
  offset?: number;
  refresh?: boolean;
  fields?: string[];
}

export interface FindOneOptions {
  populate?: string[] | boolean;
  orderBy?: QueryOrderMap;
  lockMode?: LockMode;
  lockVersion?: number | Date;
  refresh?: boolean;
  fields?: string[];
}

export interface FindOneOrFailOptions extends FindOneOptions {
  failHandler?: (entityName: string, where: Dictionary | IPrimaryKey | any) => Error;
}
