import {
  Collection as MongoCollection, Db, FilterQuery, ObjectID,
  InsertOneWriteOpResult, UpdateWriteOpResult, DeleteWriteOpResultObject,
} from 'mongodb';
import { BaseEntity, EntityMetadata, ReferenceType } from './BaseEntity';
import { EntityRepository } from './EntityRepository';
import { EntityFactory } from './EntityFactory';
import { UnitOfWork } from './UnitOfWork';
import { Utils } from './Utils';
import { getMetadataStorage, MikroORMOptions } from './MikroORM';
import { Collection } from './Collection';
import { Validator } from './Validator';
import { RequestContext } from './RequestContext';

export class EntityManager {

  public entityFactory = new EntityFactory(this);
  public readonly validator = new Validator(this.options.strict);

  private readonly identityMap: { [k: string]: BaseEntity } = {};
  private readonly _unitOfWork = new UnitOfWork(this);
  private readonly repositoryMap: { [k: string]: EntityRepository<BaseEntity> } = {};
  private readonly metadata: { [k: string]: EntityMetadata } = {};

  constructor(private db: Db, public options: MikroORMOptions) {
    this.metadata = getMetadataStorage();
  }

  getIdentity<T extends BaseEntity>(entityName: string, id: string | ObjectID): T {
    const em = RequestContext.getEntityManager() || this;
    const token = `${entityName}-${id}`;

    return em.identityMap[token] as T;
  }

  setIdentity(entity: BaseEntity, id: string | ObjectID = null): void {
    const em = RequestContext.getEntityManager() || this;
    const token = `${entity.constructor.name}-${id || entity.id}`;
    em.identityMap[token] = entity;
  }

  unsetIdentity(entity: BaseEntity): void {
    const em = RequestContext.getEntityManager() || this;
    const token = `${entity.constructor.name}-${entity.id}`;
    delete em.identityMap[token];
  }

  getIdentityMap(): { [k: string]: BaseEntity } {
    const em = RequestContext.getEntityManager() || this;
    return em.identityMap;
  }

  getCollection(entityName: string): MongoCollection {
    const col = this.metadata[entityName] ? this.metadata[entityName].collection : entityName;
    return this.db.collection(col);
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

  async find<T extends BaseEntity>(entityName: string, where = {} as FilterQuery<T>, populate: string[] = [], orderBy: { [k: string]: 1 | -1 } = {}, limit: number = null, offset: number = null): Promise<T[]> {
    const { query, resultSet } = this.buildQuery<T>(entityName, where, orderBy, limit, offset);
    this.logQuery(`${query}.toArray();`);
    const results = await resultSet.toArray();

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

  async findOne<T extends BaseEntity>(entityName: string, where: FilterQuery<T> | string, populate: string[] = []): Promise<T> {
    if (!where || (typeof where === 'object' && Object.keys(where).length === 0)) {
      throw new Error(`You cannot call 'EntityManager.findOne()' with empty 'where' parameter`);
    }

    if (where instanceof ObjectID) {
      where = where.toHexString();
    }

    if (typeof where === 'string' && this.getIdentity(entityName, where) && this.getIdentity(entityName, where).isInitialized()) {
      await this.populateOne(entityName, this.getIdentity(entityName, where), populate);
      return this.getIdentity<T>(entityName, where);
    }

    if (typeof where === 'string') {
      where = { _id: new ObjectID(where) };
    }

    Utils.renameKey(where, 'id', '_id');
    const query = `db.getCollection("${this.metadata[entityName].collection}").find(${JSON.stringify(where)}).limit(1).next();`;
    this.logQuery(query);
    where = Utils.convertObjectIds(where);
    const data = await this.getCollection(entityName).find(where as FilterQuery<T>).limit(1).next();

    if (!data) {
      return null;
    }

    const entity = this.merge(entityName, data) as T;
    await this.populateOne(entityName, entity, populate);

    return entity;
  }

  async nativeInsert(entityName: string, data: any): Promise<InsertOneWriteOpResult> {
    if (!data.createdAt) {
      data.createdAt = new Date();
    }

    if (!data.updatedAt) {
      data.updatedAt = new Date();
    }

    Utils.renameKey(data, 'id', '_id');
    const query = `db.getCollection("${this.metadata[entityName].collection}").insertOne(${JSON.stringify(data)});`;
    this.logQuery(query);
    data = Utils.convertObjectIds(data);

    return this.getCollection(entityName).insertOne(data);
  }

  async nativeUpdate(entityName: string, where: FilterQuery<BaseEntity>, data: any): Promise<UpdateWriteOpResult> {
    if (!data.updatedAt) {
      data.updatedAt = new Date();
    }

    Utils.renameKey(where, 'id', '_id');
    const query = `db.getCollection("${this.metadata[entityName].collection}").updateMany(${JSON.stringify(where)}, { $set: ${JSON.stringify(data)} });`;
    this.logQuery(query);
    where = Utils.convertObjectIds(where);

    return this.getCollection(entityName).updateMany(where, { $set: data });
  }

  async nativeDelete(entityName: string, where: FilterQuery<BaseEntity> | string | any): Promise<DeleteWriteOpResultObject> {
    if (typeof where === 'string' || where instanceof ObjectID) {
      where = { _id: new ObjectID(where) };
    }

    Utils.renameKey(where, 'id', '_id');
    const query = `db.getCollection("${this.metadata[entityName].collection}").deleteMany(${JSON.stringify(where)});`;
    this.logQuery(query);
    where = Utils.convertObjectIds(where);

    return this.getCollection(this.metadata[entityName].collection).deleteMany(where);
  }

  async aggregate(entityName: string, pipeline: any[]): Promise<any[]> {
    const query = `db.getCollection("${this.metadata[entityName].collection}").aggregate(${JSON.stringify(pipeline)}).toArray();`;
    this.logQuery(query);

    return this.getCollection(this.metadata[entityName].collection).aggregate(pipeline).toArray();
  }

  merge<T extends BaseEntity>(entityName: string, data: any): T {
    if (!data || (!data.id && !data._id)) {
      throw new Error('You cannot merge entity without id!');
    }

    const entity = data instanceof BaseEntity ? data : this.entityFactory.create<T>(entityName, data, true);
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
    return this.entityFactory.create(entityName, data, false);
  }

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T extends BaseEntity>(entityName: string, id: string): T {
    if (this.getIdentity(entityName, id)) {
      return this.getIdentity<T>(entityName, id);
    }

    return this.entityFactory.createReference<T>(entityName, id);
  }

  async remove(entityName: string, where: BaseEntity | any): Promise<number> {
    if (where instanceof BaseEntity) {
      return this.removeEntity(where);
    }

    const result = await this.nativeDelete(entityName, where);
    return result.deletedCount;
  }

  async removeEntity(entity: BaseEntity): Promise<number> {
    this.runHooks('beforeDelete', entity);
    const query = `db.getCollection("${this.metadata[entity.constructor.name].collection}").deleteOne({ _id: ${entity._id} });`;
    this.logQuery(query);
    const result = await this.getCollection(this.metadata[entity.constructor.name].collection).deleteOne({ _id: entity._id });
    this.unsetIdentity(entity);
    this.unitOfWork.remove(entity);
    this.runHooks('afterDelete', entity);

    return result.deletedCount;
  }

  async count(entityName: string, where: any): Promise<number> {
    Utils.renameKey(where, 'id', '_id');
    const query = `db.getCollection("${this.metadata[entityName].collection}").count(${JSON.stringify(where)});`;
    this.logQuery(query);
    where = Utils.convertObjectIds(where);

    return this.getCollection(this.metadata[entityName].collection).countDocuments(where, {});
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

  logQuery(query: string) {
    if (this.options.debug) {
      this.options.logger(`[query-logger] ${query}`);
    }
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
      db: this.db,
      options: this.options,
      entityFactory: ef,
      identityMap: {},
      validator: this.validator,
      repositoryMap: {},
      metadata: this.metadata,
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

    if (meta.reference === ReferenceType.MANY_TO_MANY && !meta.owner) {
      for (const entity of entities) {
        if (!entity[field].isInitialized()) {
          await (entity[field] as Collection<BaseEntity>).init();
        }
      }

      return;
    }

    const children: BaseEntity[] = [];
    let fk = '_id';

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

  private buildQuery<T extends BaseEntity>(entityName: string, where: FilterQuery<T>, orderBy: { [p: string]: 1 | -1 }, limit: number, offset: number): { query: string; resultSet: any } {
    Utils.renameKey(where, 'id', '_id');
    let query = `db.getCollection("${this.metadata[entityName].collection}").find(${JSON.stringify(where)})`;
    where = Utils.convertObjectIds(where);
    const resultSet = this.getCollection(entityName).find(where);

    if (Object.keys(orderBy).length > 0) {
      query += `.sort(${JSON.stringify(orderBy)})`;
      resultSet.sort(orderBy);
    }

    if (limit !== null) {
      query += `.limit(${limit})`;
      resultSet.limit(limit);
    }

    if (offset !== null) {
      query += `.skip(${offset})`;
      resultSet.skip(offset);
    }

    return { query, resultSet };
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
