import { EntityRepository } from './EntityRepository';
import { EntityFactory } from './EntityFactory';
import { UnitOfWork } from './UnitOfWork';
import { Utils } from './utils/Utils';
import { MikroORMOptions } from './MikroORM';
import { Validator } from './Validator';
import { RequestContext } from './utils/RequestContext';
import { FilterQuery } from './drivers/DatabaseDriver';
import { IDatabaseDriver } from './drivers/IDatabaseDriver';
import { IPrimaryKey } from './decorators/PrimaryKey';
import { QueryBuilder } from './QueryBuilder';
import { Cascade, EntityClass, EntityData, IEntity, IEntityType, ReferenceType } from './decorators/Entity';
import { EntityHelper } from './utils/EntityHelper';
import { EntityLoader } from './EntityLoader';
import { MetadataStorage } from './metadata/MetadataStorage';
import { Collection } from './Collection';
import { Connection } from './connections/Connection';

export class EntityManager {

  readonly validator = new Validator(this.options.strict);

  private readonly identityMap: { [k: string]: IEntity } = {};
  private readonly repositoryMap: { [k: string]: EntityRepository<IEntity> } = {};
  private readonly entityFactory = new EntityFactory(this);
  private readonly entityLoader = new EntityLoader(this);
  private readonly metadata = MetadataStorage.getMetadata();
  private readonly _unitOfWork = new UnitOfWork(this);

  constructor(readonly options: MikroORMOptions,
              private readonly driver: IDatabaseDriver<Connection>) {
  }

  getIdentity<T extends IEntityType<T>>(entityName: string | EntityClass<T>, id: IPrimaryKey): T {
    entityName = Utils.className(entityName);
    const em = RequestContext.getEntityManager() || this;
    const token = `${entityName}-${id}`;

    return em.identityMap[token] as T;
  }

  setIdentity<T extends IEntityType<T>>(entity: T, id?: IPrimaryKey): void {
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

  getDriver<D extends IDatabaseDriver<Connection> = IDatabaseDriver<Connection>>(): D {
    return this.driver as D;
  }

  getConnection<C extends Connection = Connection>(): C {
    return this.driver.getConnection() as C;
  }

  getRepository<T extends IEntityType<T>>(entityName: string | EntityClass<T>): EntityRepository<T> {
    entityName = Utils.className(entityName);

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

  createQueryBuilder(entityName: string | EntityClass<IEntity>): QueryBuilder {
    entityName = Utils.className(entityName);
    return new QueryBuilder(entityName, this.metadata, this.getConnection());
  }

  async find<T extends IEntityType<T>>(entityName: string | EntityClass<T>, where = {} as FilterQuery<T>, populate: string[] = [], orderBy: { [k: string]: 1 | -1 } = {}, limit?: number, offset?: number): Promise<T[]> {
    entityName = Utils.className(entityName);
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

  async findOne<T extends IEntityType<T>>(entityName: string | EntityClass<T>, where: FilterQuery<T> | IPrimaryKey, populate: string[] = []): Promise<T | null> {
    entityName = Utils.className(entityName);

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

  async beginTransaction(): Promise<void> {
    await this.driver.beginTransaction();
  }

  async commit(): Promise<void> {
    await this.driver.commit();
  }

  async rollback(): Promise<void> {
    await this.driver.rollback();
  }

  async transactional(cb: (em: EntityManager) => Promise<any>): Promise<any> {
    const em = this.fork();
    await em.getDriver().transactional(async () => {
      const ret = await cb(em);
      await em.flush();

      return ret;
    });
  }

  async nativeInsert<T extends IEntityType<T>>(entityName: string | EntityClass<T>, data: EntityData<T>): Promise<IPrimaryKey> {
    entityName = Utils.className(entityName);
    this.validator.validateParams(data, 'insert data');
    return this.driver.nativeInsert(entityName, data);
  }

  async nativeUpdate<T extends IEntityType<T>>(entityName: string | EntityClass<T>, where: FilterQuery<T>, data: EntityData<T>): Promise<number> {
    entityName = Utils.className(entityName);
    this.validator.validateParams(data, 'update data');
    this.validator.validateParams(where, 'update condition');
    return this.driver.nativeUpdate(entityName, where, data);
  }

  async nativeDelete<T extends IEntityType<T>>(entityName: string | EntityClass<T>, where: FilterQuery<T> | string | any): Promise<number> {
    entityName = Utils.className(entityName);
    this.validator.validateParams(where, 'delete condition');
    return this.driver.nativeDelete(entityName, where);
  }

  /**
   * Shortcut to driver's aggregate method. Available in MongoDriver only.
   */
  async aggregate(entityName: string | EntityClass<IEntity>, pipeline: any[]): Promise<any[]> {
    entityName = Utils.className(entityName);
    return this.driver.aggregate(entityName, pipeline);
  }

  merge<T extends IEntityType<T>>(entityName: string | EntityClass<T>, data: EntityData<T>): T {
    entityName = Utils.className(entityName);

    if (!data || (!data.id && !data._id)) {
      throw new Error('You cannot merge entity without id!');
    }

    const entity = Utils.isEntity(data) ? data as T : this.entityFactory.create<T>(entityName, data, true);

    if (this.getIdentity<T>(entityName, entity.id)) {
      EntityHelper.assign(entity, data);
      this.unitOfWork.addToIdentityMap(entity);
    } else {
      this.addToIdentityMap(entity);
    }

    return entity as T;
  }

  /**
   * Creates new instance of given entity and populates it with given data
   */
  create<T extends IEntityType<T>>(entityName: string | EntityClass<T>, data: EntityData<T>): T {
    entityName = Utils.className(entityName);
    return this.entityFactory.create<T>(entityName, data, false);
  }

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T extends IEntityType<T>>(entityName: string | EntityClass<T>, id: IPrimaryKey): T {
    entityName = Utils.className(entityName);

    if (this.getIdentity(entityName, id)) {
      return this.getIdentity<T>(entityName, id);
    }

    return this.entityFactory.createReference<T>(entityName, id);
  }

  async remove<T extends IEntityType<T>>(entityName: string | EntityClass<T>, where: T | any, flush = true): Promise<number> {
    entityName = Utils.className(entityName);

    if (Utils.isEntity(where)) {
      await this.removeEntity(where, flush);
      return 1;
    }

    return this.nativeDelete(entityName, where);
  }

  async removeEntity(entity: IEntity, flush = true): Promise<void> {
    await this.cascade(entity, Cascade.REMOVE, async (e: IEntity) => {
      await this.unitOfWork.remove(e);
      this.unsetIdentity(e);
    });

    if (flush) {
      await this.flush();
    }
  }

  async count<T extends IEntityType<T>>(entityName: string | EntityClass<T>, where: FilterQuery<T>): Promise<number> {
    entityName = Utils.className(entityName);
    this.validator.validateParams(where);
    return this.driver.count(entityName, where);
  }

  async persist(entity: IEntity | IEntity[], flush = true): Promise<void> {
    entity = Array.isArray(entity) ? entity : [entity];

    for (const ent of entity) {
      await this.cascade(ent, Cascade.PERSIST, async (e: IEntity) => {
        await this.unitOfWork.persist(e);
      });
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

  canPopulate(entityName: string | Function, property: string): boolean {
    entityName = Utils.className(entityName);
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

  private async cascade<T extends IEntityType<T>>(entity: T, type: Cascade, cb: (e: IEntity) => Promise<void>, visited: IEntity[] = []): Promise<void> {
    if (visited.includes(entity)) {
      return;
    }

    await cb(entity);
    const meta = this.metadata[entity.constructor.name];
    visited.push(entity);

    for (const prop of Object.values(meta.properties)) {
      if (!prop.cascade || !prop.cascade.includes(type)) {
        continue;
      }

      if (prop.reference === ReferenceType.MANY_TO_ONE && entity[prop.name as keyof T]) {
        await this.cascade(entity[prop.name as keyof T], type, cb, visited);
        continue;
      }

      if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(prop.reference)) {
        const collection = entity[prop.name as keyof T] as Collection<IEntity>;

        if (collection.isInitialized(true)) {
          for (const item of collection.getItems()) {
            await this.cascade(item, type, cb, visited);
          }
        }
      }
    }
  }

  private get unitOfWork(): UnitOfWork {
    const em = RequestContext.getEntityManager() || this;
    return em._unitOfWork;
  }

}
