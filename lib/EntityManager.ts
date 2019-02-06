import { EntityRepository } from './EntityRepository';
import { EntityFactory } from './EntityFactory';
import { UnitOfWork } from './UnitOfWork';
import { Utils } from './Utils';
import { MikroORMOptions } from './MikroORM';
import { Validator } from './Validator';
import { RequestContext } from './RequestContext';
import { FilterQuery } from './drivers/DatabaseDriver';
import { IDatabaseDriver } from './drivers/IDatabaseDriver';
import { IPrimaryKey } from './decorators/PrimaryKey';
import { QueryBuilder } from './QueryBuilder';
import { IEntity, ReferenceType } from './decorators/Entity';
import { EntityHelper } from './EntityHelper';
import { EntityLoader } from './EntityLoader';
import { MetadataStorage } from './metadata/MetadataStorage';

export class EntityManager {

  readonly validator = new Validator(this.options.strict);

  private readonly identityMap: { [k: string]: IEntity } = {};
  private readonly repositoryMap: { [k: string]: EntityRepository<IEntity> } = {};
  private readonly entityFactory = new EntityFactory(this);
  private readonly entityLoader = new EntityLoader(this);
  private readonly metadata = MetadataStorage.getMetadata();
  private readonly _unitOfWork = new UnitOfWork(this);

  constructor(readonly options: MikroORMOptions,
              private readonly driver: IDatabaseDriver) {
  }

  getIdentity<T extends IEntity>(entityName: string, id: IPrimaryKey): T {
    const em = RequestContext.getEntityManager() || this;
    const token = `${entityName}-${id}`;

    return em.identityMap[token] as T;
  }

  setIdentity(entity: IEntity, id: IPrimaryKey = null): void {
    const em = RequestContext.getEntityManager() || this;
    const token = `${entity.constructor.name}-${id || entity.id}`;
    em.identityMap[token] = entity;
  }

  unsetIdentity(entity: IEntity): void {
    const em = RequestContext.getEntityManager() || this;
    const token = `${entity.constructor.name}-${entity.id}`;
    delete em.identityMap[token];
    this.unitOfWork.unsetIdentity(entity);
  }

  getIdentityMap(): { [k: string]: IEntity } {
    const em = RequestContext.getEntityManager() || this;
    return em.identityMap;
  }

  getDriver<D extends IDatabaseDriver = IDatabaseDriver>(): D {
    return this.driver as D;
  }

  getRepository<T extends IEntity>(entityName: string): EntityRepository<T> {
    if (!this.repositoryMap[entityName]) {
      const meta = this.metadata[entityName];

      if (meta.customRepository) {
        const customRepository = meta.customRepository();
        this.repositoryMap[entityName] = new customRepository(this, entityName);
      } else {
        this.repositoryMap[entityName] = new EntityRepository<T>(this, entityName);
      }
    }

    return this.repositoryMap[entityName] as EntityRepository<T>;
  }

  createQueryBuilder(entityName: string): QueryBuilder {
    return new QueryBuilder(entityName, this.metadata);
  }

  async find<T extends IEntity>(entityName: string, where = {} as FilterQuery<T>, populate: string[] = [], orderBy: { [k: string]: 1 | -1 } = {}, limit: number = null, offset: number = null): Promise<T[]> {
    this.validator.validateParams(where);
    const results = await this.driver.find(entityName, where, populate, orderBy, limit, offset);

    if (results.length === 0) {
      return [];
    }

    const ret: T[] = [];

    for (const data of results) {
      const entity = this.merge<T>(entityName, data);
      ret.push(entity);
    }

    await this.entityLoader.populate(entityName, ret, populate);

    return ret;
  }

  async findOne<T extends IEntity>(entityName: string, where: FilterQuery<T> | IPrimaryKey, populate: string[] = []): Promise<T> {
    if (!where || (typeof where === 'object' && Object.keys(where).length === 0)) {
      throw new Error(`You cannot call 'EntityManager.findOne()' with empty 'where' parameter`);
    }

    where = this.driver.normalizePrimaryKey(where as IPrimaryKey);

    if (Utils.isPrimaryKey(where) && this.getIdentity(entityName, where as IPrimaryKey) && this.getIdentity(entityName, where as IPrimaryKey).isInitialized()) {
      const entity = this.getIdentity<T>(entityName, where as IPrimaryKey);
      await this.entityLoader.populate(entityName, [entity], populate);

      return entity;
    }

    this.validator.validateParams(where);
    const data = await this.driver.findOne(entityName, where, populate);

    if (!data) {
      return null;
    }

    const entity = this.merge(entityName, data) as T;
    await this.entityLoader.populate(entityName, [entity], populate);

    return entity;
  }

  async begin(savepoint?: string): Promise<void> {
    await this.getDriver().begin(savepoint);
  }

  async commit(savepoint?: string): Promise<void> {
    await this.getDriver().commit(savepoint);
  }

  async rollback(savepoint?: string): Promise<void> {
    await this.getDriver().rollback(savepoint);
  }

  async transactional(cb: (em: EntityManager) => Promise<any>): Promise<any> {
    const em = this.fork();

    try {
      await em.begin();
      const ret = await cb(em);
      await em.flush();
      await em.commit();

      return ret;
    } catch (e) {
      await em.rollback();
      throw e;
    }
  }

  async nativeInsert(entityName: string, data: any): Promise<IPrimaryKey> {
    this.validator.validateParams(data, 'insert data');
    return this.driver.nativeInsert(entityName, data);
  }

  async nativeUpdate(entityName: string, where: FilterQuery<IEntity>, data: any): Promise<number> {
    this.validator.validateParams(data, 'update data');
    this.validator.validateParams(where, 'update condition');
    return this.driver.nativeUpdate(entityName, where, data);
  }

  async nativeDelete(entityName: string, where: FilterQuery<IEntity> | string | any): Promise<number> {
    this.validator.validateParams(where, 'delete condition');
    return this.driver.nativeDelete(entityName, where);
  }

  /**
   * Shortcut to driver's aggregate method. Available in MongoDriver only.
   */
  async aggregate(entityName: string, pipeline: any[]): Promise<any[]> {
    return this.driver.aggregate(entityName, pipeline);
  }

  merge<T extends IEntity>(entityName: string, data: any): T {
    if (!data || (!data.id && !data._id)) {
      throw new Error('You cannot merge entity without id!');
    }

    const entity = Utils.isEntity(data) ? data : this.entityFactory.create<T>(entityName, data, true);

    if (this.getIdentity(entityName, entity.id)) {
      EntityHelper.assign(entity, data);
      this.unitOfWork.addToIdentityMap(entity as IEntity);
    } else {
      this.addToIdentityMap(entity as IEntity);
    }

    return entity as T;
  }

  /**
   * Creates new instance of given entity and populates it with given data
   */
  create<T extends IEntity>(entityName: string, data: any): T {
    return this.entityFactory.create<T>(entityName, data, false);
  }

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T extends IEntity>(entityName: string, id: IPrimaryKey): T {
    if (this.getIdentity(entityName, id)) {
      return this.getIdentity<T>(entityName, id);
    }

    return this.entityFactory.createReference<T>(entityName, id);
  }

  async remove(entityName: string, where: IEntity | any, flush = true): Promise<number> {
    if (Utils.isEntity(where)) {
      await this.removeEntity(where, flush);
      return 1;
    }

    return this.nativeDelete(entityName, where);
  }

  async removeEntity(entity: IEntity, flush = true): Promise<void> {
    await this.unitOfWork.remove(entity);
    this.unsetIdentity(entity);

    if (flush) {
      await this.flush();
    }
  }

  async count(entityName: string, where: any): Promise<number> {
    this.validator.validateParams(where);
    return this.driver.count(entityName, where);
  }

  async persist(entity: IEntity | IEntity[], flush = true): Promise<void> {
    if (Array.isArray(entity)) {
      for (const e of entity) {
        await this.unitOfWork.persist(e);
      }
    } else {
      await this.unitOfWork.persist(entity);
    }

    if (flush) {
      await this.flush();
    }
  }

  /**
   * flush changes to database
   */
  async flush(): Promise<void> {
    await this.unitOfWork.commit();
  }

  /**
   * clear identity map, detaching all entities
   */
  clear(): void {
    const map = this.getIdentityMap();
    Object.keys(map).forEach(key => delete map[key]);
    this.unitOfWork.clear();
  }

  addToIdentityMap(entity: IEntity) {
    this.setIdentity(entity);
    this.unitOfWork.addToIdentityMap(entity);
  }

  canPopulate(entityName: string, property: string): boolean {
    const [p, ...parts] = property.split('.');
    const props = this.metadata[entityName].properties;
    const ret = p in props && props[p].reference !== ReferenceType.SCALAR;

    if (!ret) {
      return false;
    }

    if (parts.length > 0) {
      return this.canPopulate(props[p].type, parts.join('.'));
    }

    return ret;
  }

  fork(): EntityManager {
    return new EntityManager(this.options, this.driver);
  }

  private get unitOfWork(): UnitOfWork {
    const em = RequestContext.getEntityManager() || this;
    return em._unitOfWork;
  }

}
