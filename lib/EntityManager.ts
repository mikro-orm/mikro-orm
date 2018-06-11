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

  constructor(private db: Db, public options: Options) {
    this.metadata = getMetadataStorage();
  }

  getCollection(entityName: string): MongoCollection {
    const col = this.metadata[entityName] ? this.metadata[entityName].collection : entityName;
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

  async find<T extends BaseEntity>(entityName: string, where = {} as FilterQuery<T>, populate: string[] = [], orderBy: { [k: string]: 1 | -1 } = {}, limit: number = null, offset: number = null): Promise<T[]> {
    Utils.prepareQuery(where);
    let query = `db.getCollection("${this.metadata[entityName].collection}").find(${JSON.stringify(where)})`;
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

    this.options.logger(`[query-logger] ${query}.toArray();`);
    const results = await resultSet.toArray();
    const ret: T[] = [];

    for (const data of results) {
      const entity = this.merge<T>(entityName, data);
      ret.push(entity);
    }

    await this.processPopulate(ret, populate);

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

    Utils.prepareQuery(where);

    const query = `db.getCollection("${this.metadata[entityName].collection}").find(${JSON.stringify(where)}).limit(1).next();`;
    this.options.logger(`[query-logger] ${query}`);
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
      entity.assign(data);
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

    const query = `db.getCollection("${this.metadata[entityName].collection}").deleteMany(${JSON.stringify(where)});`;
    this.options.logger(`[query-logger] ${query}`);
    const result = await this.getCollection(this.metadata[entityName].collection).deleteMany(where);

    return result.deletedCount;
  }

  async removeEntity(entity: BaseEntity): Promise<number> {
    this.runHooks('beforeDelete', entity);
    const query = `db.getCollection("${this.metadata[entity.constructor.name].collection}").deleteOne({ _id: ${entity._id} });`;
    this.options.logger(`[query-logger] ${query}`);
    const result = await this.getCollection(this.metadata[entity.constructor.name].collection).deleteOne({ _id: entity._id });
    delete this.identityMap[`${entity.constructor.name}-${entity.id}`];
    this.unitOfWork.remove(entity);
    this.runHooks('afterDelete', entity);

    return result.deletedCount;
  }

  async count(entityName: string, where: any): Promise<number> {
    const query = `db.getCollection("${this.metadata[entityName].collection}").count(${JSON.stringify(where)});`;
    this.options.logger(`[query-logger] ${query}`);
    return this.getCollection(this.metadata[entityName].collection).count(where);
  }

  async persist(entity: BaseEntity | BaseEntity[], flush = true): Promise<void> {
    if (entity instanceof BaseEntity) {
      await this.unitOfWork.persist(entity);
    } else {
      for (const e of entity) {
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

  private async processPopulate(entity: BaseEntity | BaseEntity[], populate: string[]): Promise<void> {
    if (entity instanceof BaseEntity) {
      for (const field of populate) {
        if (entity[field] instanceof Collection && !entity[field].isInitialized()) {
          await (entity[field] as Collection<BaseEntity>).init();
        }

        if (entity[field] instanceof BaseEntity && !entity[field].isInitialized()) {
          await (entity[field] as BaseEntity).init();
        }
      }

      return;
    }

    if (entity.length === 0) {
      return;
    }

    for (const field of populate) {
      await this.populateMany(entity, field);
    }
  }

  private async populateMany(entities: BaseEntity[], field: string): Promise<void> {
    if (entities[0][field] instanceof Collection) {
      for (const entity of entities) {
        if (entity[field] instanceof Collection && !entity[field].isInitialized()) {
          await (entity[field] as Collection<BaseEntity>).init();
        }
      }

      return;
    }

    const children = entities.filter(e => e[field] instanceof BaseEntity && !e[field].isInitialized());

    if (children.length === 0) {
      return;
    }

    // preload everything in one call (this will update already existing references in IM)
    const ids = Utils.unique(children.map(e => e[field].id));
    await this.find<BaseEntity>(entities[0][field].constructor.name, { _id: { $in: ids } });
  }

  private runHooks(type: string, entity: BaseEntity) {
    const hooks = this.metadata[entity.constructor.name].hooks;

    if (hooks && hooks[type] && hooks[type].length > 0) {
      hooks[type].forEach(hook => entity[hook]());
    }
  }

}
