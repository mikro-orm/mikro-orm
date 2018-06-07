import { Collection as MongoCollection, Db, FilterQuery, ObjectID } from 'mongodb';
import { BaseEntity, EntityMetadata } from './BaseEntity';
import { EntityRepository } from './EntityRepository';
import { EntityFactory } from './EntityFactory';
import { UnitOfWork } from './UnitOfWork';
import { Utils } from './Utils';
import { getMetadataStorage, Options } from './MikroORM';
import { Collection } from './Collection';

export class EntityManager {

  public entityFactory = new EntityFactory(this);
  public readonly identityMap: { [k: string]: BaseEntity } = {};

  private readonly unitOfWork = new UnitOfWork(this);
  private readonly repositoryMap: { [k: string]: EntityRepository<BaseEntity> } = {};
  private readonly metadata: { [k: string]: EntityMetadata } = {};

  constructor(private db: Db, public options = {} as Options) {
    this.metadata = getMetadataStorage();
  }

  getCollection(entityName: string): MongoCollection {
    let col;

    if (Utils.isString(entityName)) {
      col = this.metadata[entityName] ? this.metadata[entityName].collection : entityName;
    } else {
      entityName = entityName.constructor.name;
      col = this.metadata[entityName].collection;
    }

    return this.db.collection(col);
  }

  getRepository<T extends BaseEntity>(entityName: string): EntityRepository<T> {
    if (!this.repositoryMap[entityName]) {
      const meta = this.metadata[entityName];

      if (meta.customRepository) {
        this.repositoryMap[entityName] = new meta.customRepository(this, entityName);
      } else {
        this.repositoryMap[entityName] = new EntityRepository<T>(this, entityName);
      }
    }

    return this.repositoryMap[entityName] as EntityRepository<T>;
  }

  async find<T extends BaseEntity>(entityName: string, where = {} as FilterQuery<T>, populate: string[] = [], orderBy: { [k: string]: 1 | -1 } = {}, limit: number = null, offset = 0): Promise<T[]> {
    const resultSet = this.getCollection(entityName).find(where);

    if (Object.keys(orderBy).length > 0) {
      resultSet.sort(orderBy);
    }

    if (limit !== null) {
      resultSet.limit(limit);
    }

    if (offset !== null) {
      resultSet.skip(offset);
    }

    const results = await resultSet.toArray();
    const ret: T[] = [];

    for (const data of results) {
      const entity = this.merge<T>(entityName, data);
      await this.processPopulate(entity, populate);
      ret.push(entity);
    }

    return ret;
  }

  async findOne<T extends BaseEntity>(entityName: string, where: FilterQuery<T> | string, populate: string[] = []): Promise<T> {
    if (where instanceof ObjectID) {
      where = where.toHexString();
    }

    if (Utils.isString(where) && this.identityMap[`${entityName}-${where}`] && this.identityMap[`${entityName}-${where}`].isInitialized()) {
      return this.identityMap[`${entityName}-${where}`] as T;
    }

    if (Utils.isString(where)) {
      where = { _id: new ObjectID(where as string) };
    }

    const data = await this.getCollection(entityName).find(where as FilterQuery<T>).limit(1).next();

    if (!data) {
      return null;
    }

    const entity = this.merge(entityName, data) as T;
    await this.processPopulate(entity, populate);

    return entity;
  }

  merge<T extends BaseEntity>(entityName: string, data: any): T {
    if (!data || (!data.id && !data._id)) {
      throw new Error('You cannot merge entity without id!');
    }

    const entity = data instanceof BaseEntity ? data : this.entityFactory.create<T>(entityName, data, true);

    if (this.identityMap[`${entityName}-${entity.id}`]) {
      // TODO populate missing references and rehydrate
      // something like Object.assign, but we need to handle references properly
      // entity = Object.assign(this.identityMap[`${entityName}-${entity.id}`] as T, data);

      if (this.identityMap[`${entityName}-${entity.id}`].isInitialized()) {
        delete entity['_initialized'];
      }
    }

    this.addToIdentityMap(entity);

    return entity as T;
  }

  getReference<T extends BaseEntity>(entityName: string, id: string): T {
    if (this.identityMap[`${entityName}-${id}`]) {
      return this.identityMap[`${entityName}-${id}`] as T;
    }

    const entity = this.entityFactory.createReference(entityName, id) as T;
    this.addToIdentityMap(entity);

    return entity;
  }

  async remove(entityName: string, where: BaseEntity | any): Promise<number> {
    if (where instanceof BaseEntity) {
      return this.removeEntity(where);
    }

    const result = await this.getCollection(this.metadata[entityName].collection).deleteMany(where);

    return result.deletedCount;
  }

  async removeEntity(entity: BaseEntity): Promise<number> {
    this.runHooks('beforeDelete', entity);
    const result = await this.getCollection(this.metadata[entity.constructor.name].collection).deleteOne({ _id: entity._id });
    delete this.identityMap[`${entity.constructor.name}-${entity.id}`];
    this.unitOfWork.remove(entity);
    this.runHooks('afterDelete', entity);

    return result.deletedCount;
  }

  async count(entityName: string, where: any): Promise<number> {
    return this.getCollection(this.metadata[entityName].collection).count(where);
  }

  async persist(entity: BaseEntity, flush = true): Promise<void> {
    await this.unitOfWork.persist(entity);

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
    Object.keys(this.identityMap).forEach(key => delete this.identityMap[key]);
    this.unitOfWork.clear();
  }

  addToIdentityMap(entity: BaseEntity) {
    this.identityMap[`${entity.constructor.name}-${entity.id}`] = entity;
    this.unitOfWork.addToIdentityMap(entity);
  }

  canPopulate(entityName: string, property: string): boolean {
    const props = this.metadata[entityName].properties;
    return property in props && !!props[property].reference;
  }

  /**
   * @todo improve this for find() operations
   */
  private async processPopulate(entity: BaseEntity, populate: string[]): Promise<void> {
    for (const field of populate) {
      if (entity[field] instanceof Collection && !entity[field].isInitialized()) {
        await (entity[field] as Collection<BaseEntity>).init();
      }

      if (entity[field] instanceof BaseEntity && !entity[field].isInitialized()) {
        await (entity[field] as BaseEntity).init();
      }
    }
  }

  private runHooks(type: string, entity: BaseEntity) {
    const hooks = this.metadata[entity.constructor.name].hooks;

    if (hooks && hooks[type] && hooks[type].length > 0) {
      hooks[type].forEach(hook => entity[hook]());
    }
  }

}
