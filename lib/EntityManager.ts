import { EntityRepository } from './EntityRepository';
import { EntityFactory } from './EntityFactory';
import { UnitOfWork } from './UnitOfWork';
import { Utils } from './Utils';
import { getMetadataStorage, MikroORMOptions } from './MikroORM';
import { Collection } from './Collection';
import { Validator } from './Validator';
import { RequestContext } from './RequestContext';
import { FilterQuery } from './drivers/DatabaseDriver';
import { IDatabaseDriver } from './drivers/IDatabaseDriver';
import { IPrimaryKey } from './decorators/PrimaryKey';
import { QueryBuilder } from './QueryBuilder';
import { NamingStrategy } from './naming-strategy/NamingStrategy';
import { EntityMetadata, IEntity, ReferenceType } from './decorators/Entity';

export class EntityManager {

  readonly entityFactory: EntityFactory;
  readonly validator = new Validator(this.options.strict);

  private readonly identityMap: { [k: string]: IEntity } = {};
  private readonly _unitOfWork: UnitOfWork;
  private readonly repositoryMap: { [k: string]: EntityRepository<IEntity> } = {};
  private readonly metadata: { [k: string]: EntityMetadata } = {};
  private readonly namingStrategy: NamingStrategy;

  constructor(private driver: IDatabaseDriver, public options: MikroORMOptions) {
    this.metadata = getMetadataStorage();
    const NamingStrategy = options.namingStrategy || driver.getDefaultNamingStrategy();
    this.namingStrategy = new NamingStrategy();
    this.entityFactory = new EntityFactory(this);
    this._unitOfWork = new UnitOfWork(this);
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

  getNamingStrategy(): NamingStrategy {
    return this.namingStrategy;
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

  async findOne<T extends IEntity>(entityName: string, where: FilterQuery<T> | IPrimaryKey, populate: string[] = []): Promise<T> {
    if (!where || (typeof where === 'object' && Object.keys(where).length === 0)) {
      throw new Error(`You cannot call 'EntityManager.findOne()' with empty 'where' parameter`);
    }

    where = this.driver.normalizePrimaryKey(where as IPrimaryKey);

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
    return this.driver.nativeInsert(entityName, data);
  }

  async nativeUpdate(entityName: string, where: FilterQuery<IEntity>, data: any): Promise<number> {
    return this.driver.nativeUpdate(entityName, where, data);
  }

  async nativeDelete(entityName: string, where: FilterQuery<IEntity> | string | any): Promise<number> {
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
    entity.setEntityManager(this);

    if (this.getIdentity(entityName, entity.id)) {
      entity.assign(data);
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
    return this.driver.count(entityName, where);
  }

  async persist(entity: IEntity | IEntity[], flush = true): Promise<void> {
    if (Array.isArray(entity)) {
      for (const e of entity) {
        e.setEntityManager(this);
        await this.unitOfWork.persist(e);
      }
    } else {
      entity.setEntityManager(this);
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
      options: this.options,
      driver: this.driver,
      namingStrategy: this.namingStrategy,
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

  private async populateOne(entityName: string, entity: IEntity, populate: string[]): Promise<void> {
    for (const field of populate) {
      if (!this.canPopulate(entityName, field)) {
        throw new Error(`Entity '${entityName}' does not have property '${field}'`);
      }

      if (entity[field] instanceof Collection && !entity[field].isInitialized(true)) {
        await (entity[field] as Collection<IEntity>).init();
      }

      if (Utils.isEntity(entity[field]) && !entity[field].isInitialized()) {
        await (entity[field] as IEntity).init();
      }
    }
  }

  /**
   * preload everything in one call (this will update already existing references in IM)
   */
  private async populateMany(entityName: string, entities: IEntity[], field: string): Promise<void> {
    if (!this.canPopulate(entityName, field)) {
      throw new Error(`Entity '${entityName}' does not have property '${field}'`);
    }

    // set populate flag
    entities.forEach(entity => {
      if (Utils.isEntity(entity[field]) || entity[field] instanceof Collection) {
        entity[field].populated();
      }
    });

    const prop = this.metadata[entityName].properties[field];
    const filtered = entities.filter(e => e[field] instanceof Collection && !e[field].isInitialized(true));

    if (prop.reference === ReferenceType.MANY_TO_MANY && this.driver.usesPivotTable()) {
      const map = await this.driver.loadFromPivotTable(prop, filtered.map(e => e.id));

      for (const entity of filtered) {
        const items = map[entity.id as number].map(item => this.entityFactory.createReference(prop.type, item));
        (entity[field] as Collection<IEntity>).set(items, true);
      }
    }

    const children: IEntity[] = [];
    let fk = this.namingStrategy.referenceColumnName();

    if (prop.reference === ReferenceType.ONE_TO_MANY) {
      children.push(...filtered.map(e => e[field].owner));
      fk = this.metadata[prop.type].properties[prop.fk].fieldName;
    } else if (prop.reference === ReferenceType.MANY_TO_MANY && prop.owner) {
      children.push(...filtered.reduce((a, b) => [...a, ...b[field].getItems()], []));
    } else if (prop.reference === ReferenceType.MANY_TO_MANY) { // inversed side
      children.push(...filtered);
      fk = this.metadata[prop.type].properties[prop.mappedBy].fieldName;
    } else {
      children.push(...entities.filter(e => Utils.isEntity(e[field]) && !e[field].isInitialized()).map(e => e[field]));
    }

    if (children.length === 0) {
      return;
    }

    const ids = Utils.unique(children.map(e => e.id));
    const data = await this.find<IEntity>(prop.type, { [fk]: { $in: ids } });

    // initialize collections for one to many
    if (prop.reference === ReferenceType.ONE_TO_MANY) {
      for (const entity of filtered) {
        const items = data.filter(child => child[prop.fk] === entity);
        (entity[field] as Collection<IEntity>).set(items, true);
      }
    }

    if (prop.reference === ReferenceType.MANY_TO_MANY && !prop.owner && !this.driver.usesPivotTable()) {
      for (const entity of filtered) {
        const items = data.filter(child => (child[prop.mappedBy] as Collection<IEntity>).contains(entity));
        (entity[field] as Collection<IEntity>).set(items, true);
      }
    }
  }

  private get unitOfWork(): UnitOfWork {
    const em = RequestContext.getEntityManager() || this;
    return em._unitOfWork;
  }

}
