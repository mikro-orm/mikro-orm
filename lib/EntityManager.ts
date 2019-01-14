import { BaseEntity, EntityMetadata, ReferenceType } from './BaseEntity';
import { EntityRepository } from './EntityRepository';
import { EntityFactory } from './EntityFactory';
import { UnitOfWork } from './UnitOfWork';
import { Utils } from './Utils';
import { getMetadataStorage, Options } from './MikroORM';
import { Collection } from './Collection';
import { Validator } from './Validator';
import { RequestContext } from './RequestContext';
import { FilterQuery } from './drivers/DatabaseDriver';
import { IDatabaseDriver } from './drivers/IDatabaseDriver';
import { IPrimaryKey } from './decorators/PrimaryKey';
import { QueryBuilder } from './QueryBuilder';

export class EntityManager {

  public entityFactory: EntityFactory = new EntityFactory(this);
  public readonly validator = new Validator(this.options.strict);

  private readonly identityMap: { [k: string]: BaseEntity } = {};
  private readonly _unitOfWork = new UnitOfWork(this);
  private readonly repositoryMap: { [k: string]: EntityRepository<BaseEntity> } = {};
  private readonly metadata: { [k: string]: EntityMetadata } = {};

  constructor(private driver: IDatabaseDriver, public options: Options) {
    this.metadata = getMetadataStorage();
  }

  getIdentity<T extends BaseEntity>(entityName: string, id: IPrimaryKey): T {
    const em = RequestContext.getEntityManager() || this;
    const token = `${entityName}-${id}`;

    return em.identityMap[token] as T;
  }

  setIdentity(entity: BaseEntity, id: IPrimaryKey = null): void {
    const em = RequestContext.getEntityManager() || this;
    const token = `${entity.constructor.name}-${id || entity.id}`;
    em.identityMap[token] = entity;
  }

  unsetIdentity(entity: BaseEntity): void {
    const em = RequestContext.getEntityManager() || this;
    const token = `${entity.constructor.name}-${entity.id}`;
    delete em.identityMap[token];
    this.unitOfWork.remove(entity);
  }

  getIdentityMap(): { [k: string]: BaseEntity } {
    const em = RequestContext.getEntityManager() || this;
    return em.identityMap;
  }

  getDriver<D extends IDatabaseDriver = IDatabaseDriver>(): D {
    return this.driver as D;
  }

  getRepository<T extends BaseEntity>(entityName: string): EntityRepository<T> {
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

  async find<T extends BaseEntity>(entityName: string, where = {} as FilterQuery<T>, populate: string[] = [], orderBy: { [k: string]: 1 | -1 } = {}, limit: number = null, offset: number = null): Promise<T[]> {
    const results = await this.driver.find(entityName, where, populate, orderBy, limit, offset);

    if (results.length === 0) {
      return [];
    }

    const ret: T[] = [];

    for (const data of results) {
      const entity = this.merge<T>(entityName, data);
      ret.push(entity);
    }

    for (const field of populate) {
      await this.populateMany(entityName, ret, field);
    }

    return ret;
  }

  async findOne<T extends BaseEntity>(entityName: string, where: FilterQuery<T> | IPrimaryKey, populate: string[] = []): Promise<T> {
    if (!where || (typeof where === 'object' && Object.keys(where).length === 0)) {
      throw new Error(`You cannot call 'EntityManager.findOne()' with empty 'where' parameter`);
    }

    where = this.driver.normalizePrimaryKey(where);

    if (Utils.isPrimaryKey(where) && this.getIdentity(entityName, where) && this.getIdentity(entityName, where).isInitialized()) {
      await this.populateOne(entityName, this.getIdentity(entityName, where), populate);
      return this.getIdentity<T>(entityName, where);
    }

    const data = await this.driver.findOne(entityName, where, populate);

    if (!data) {
      return null;
    }

    const entity = this.merge(entityName, data) as T;
    await this.populateOne(entityName, entity, populate);

    return entity;
  }

  async begin(): Promise<void> {
    await this.getDriver().begin();
  }

  async commit(): Promise<void> {
    await this.getDriver().commit();
  }

  async rollback(): Promise<void> {
    await this.getDriver().rollback();
  }

  async transactional(cb: () => Promise<any>): Promise<any> {
    try {
      await this.begin();
      const ret = await cb();
      await this.flush();
      await this.commit();

      return ret;
    } catch (e) {
      await this.rollback();
      throw e;
    }
  }

  async nativeInsert(entityName: string, data: any): Promise<IPrimaryKey> {
    if (!data.createdAt) {
      data.createdAt = new Date();
    }

    if (!data.updatedAt) {
      data.updatedAt = new Date();
    }

    return this.driver.nativeInsert(entityName, data);
  }

  async nativeUpdate(entityName: string, where: FilterQuery<BaseEntity>, data: any): Promise<number> {
    if (!data.updatedAt) {
      data.updatedAt = new Date();
    }

    return this.driver.nativeUpdate(entityName, where, data);
  }

  async nativeDelete(entityName: string, where: FilterQuery<BaseEntity> | string | any): Promise<number> {
    return this.driver.nativeDelete(entityName, where);
  }

  /**
   * Shortcut to driver's aggregate method. Available in MongoDriver only.
   */
  async aggregate(entityName: string, pipeline: any[]): Promise<any[]> {
    return this.driver.aggregate(entityName, pipeline);
  }

  merge<T extends BaseEntity>(entityName: string, data: any): T {
    if (!data || (!data.id && !data._id)) {
      throw new Error('You cannot merge entity without id!');
    }

    const entity = data instanceof BaseEntity ? data : this.entityFactory.create(entityName, data, true);
    entity.setEntityManager(this);

    if (this.getIdentity(entityName, entity.id)) {
      entity.assign(data);
      this.unitOfWork.addToIdentityMap(entity);
    } else {
      this.addToIdentityMap(entity);
    }

    return entity as T;
  }

  /**
   * Creates new instance of given entity and populates it with given data
   */
  create<T extends BaseEntity>(entityName: string, data: any): T {
    return this.entityFactory.create<T>(entityName, data, false);
  }

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T extends BaseEntity>(entityName: string, id: IPrimaryKey): T {
    if (this.getIdentity(entityName, id)) {
      return this.getIdentity<T>(entityName, id);
    }

    return this.entityFactory.createReference<T>(entityName, id);
  }

  async remove(entityName: string, where: BaseEntity | any): Promise<number> {
    if (where instanceof BaseEntity) {
      return this.removeEntity(where);
    }

    return this.nativeDelete(entityName, where);
  }

  async removeEntity(entity: BaseEntity): Promise<number> {
    this.runHooks('beforeDelete', entity);
    const entityName = entity.constructor.name;
    const count = await this.driver.nativeDelete(entityName, entity.id);
    this.unsetIdentity(entity);
    this.runHooks('afterDelete', entity);

    return count;
  }

  async count(entityName: string, where: any): Promise<number> {
    return this.driver.count(entityName, where);
  }

  async persist(entity: BaseEntity | BaseEntity[], flush = true): Promise<void> {
    if (entity instanceof BaseEntity) {
      entity.setEntityManager(this);
      await this.unitOfWork.persist(entity);
    } else {
      for (const e of entity) {
        e.setEntityManager(this);
        await this.unitOfWork.persist(e);
      }
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

  addToIdentityMap(entity: BaseEntity) {
    this.setIdentity(entity);
    this.unitOfWork.addToIdentityMap(entity);
  }

  canPopulate(entityName: string, property: string): boolean {
    const props = this.metadata[entityName].properties;
    return property in props && !!props[property].reference;
  }

  fork(): EntityManager {
    const em = Object.create(EntityManager.prototype);
    const ef = Object.create(EntityFactory.prototype);

    Object.assign(ef, {
      em,
      options: this.options,
      metadata: this.metadata,
      logger: this.options.logger,
    });

    Object.assign(em, {
      driver: this.driver,
      options: this.options,
      entityFactory: ef,
      identityMap: {},
      validator: this.validator,
      repositoryMap: {},
      metadata: this.metadata,
    });

    Object.assign(em, {
      _unitOfWork: new UnitOfWork(em),
    });

    return em;
  }

  private async populateOne(entityName: string, entity: BaseEntity, populate: string[]): Promise<void> {
    for (const field of populate) {
      if (!this.canPopulate(entityName, field)) {
        throw new Error(`Entity '${entityName}' does not have property '${field}'`);
      }

      if (entity[field] instanceof Collection && !entity[field].isInitialized(true)) {
        await (entity[field] as Collection<BaseEntity>).init();
      }

      if (entity[field] instanceof BaseEntity && !entity[field].isInitialized()) {
        await (entity[field] as BaseEntity).init();
      }

      if (entity[field]) {
        entity[field].populated();
      }
    }
  }

  /**
   * preload everything in one call (this will update already existing references in IM)
   */
  private async populateMany(entityName: string, entities: BaseEntity[], field: string): Promise<void> {
    if (!this.canPopulate(entityName, field)) {
      throw new Error(`Entity '${entityName}' does not have property '${field}'`);
    }

    // set populate flag
    entities.forEach(entity => {
      if (entity[field] instanceof BaseEntity || entity[field] instanceof Collection) {
        entity[field].populated();
      }
    });

    const meta = this.metadata[entityName].properties[field];

    // TODO we could probably improve M:N owner collection init for mysql driver
    if (meta.reference === ReferenceType.MANY_TO_MANY && (!meta.owner || this.driver.usesPivotTable())) {
      for (const entity of entities) {
        if (!entity[field].isInitialized()) {
          await (entity[field] as Collection<BaseEntity>).init();
        }
      }

      return;
    }

    const children: BaseEntity[] = [];
    let fk = this.driver.getDefaultForeignKey();

    if (meta.reference === ReferenceType.ONE_TO_MANY) {
      const filtered = entities.filter(e => e[field] instanceof Collection);
      children.push(...filtered.map(e => e[field].owner));
      fk = meta.fk;
    } else if (meta.reference === ReferenceType.MANY_TO_MANY) {
      const filtered = entities.filter(e => e[field] instanceof Collection && !e[field].isInitialized(true));
      children.push(...filtered.reduce((a, b) => [...a, ...b[field].getItems()], []));
    } else {
      children.push(...entities.filter(e => e[field] instanceof BaseEntity && !e[field].isInitialized()).map(e => e[field]));
    }

    if (children.length === 0) {
      return;
    }

    const ids = Utils.unique(children.map(e => e.id));
    const data = await this.find<BaseEntity>(meta.type, { [fk]: { $in: ids } });

    // initialize collections for one to many
    if (meta.reference === ReferenceType.ONE_TO_MANY) {
      for (const entity of entities) {
        const items = data.filter(child => child[fk] === entity);
        (entity[field] as Collection<BaseEntity>).set(items, true);
      }
    }
  }

  private runHooks(type: string, entity: BaseEntity) {
    const hooks = this.metadata[entity.constructor.name].hooks;

    if (hooks && hooks[type] && hooks[type].length > 0) {
      hooks[type].forEach(hook => entity[hook]());
    }
  }

  private get unitOfWork(): UnitOfWork {
    const em = RequestContext.getEntityManager() || this;
    return em._unitOfWork;
  }

}
