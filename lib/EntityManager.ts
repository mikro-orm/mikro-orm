import { Collection as MongoCollection, Db, FilterQuery } from 'mongodb';
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

  async findOne<T extends BaseEntity>(entityName: string, where: FilterQuery<T>, populate: string[] = []): Promise<T> {
    if (Utils.isString(where) && this.identityMap[`${entityName}-${where}`]) {
      // TODO populate missing references
      return this.identityMap[`${entityName}-${where}`] as T;
    }

    if (Utils.isString(where)) {
      where = { _id: where };
    }

    const data = await this.getCollection(entityName).find(where).limit(1).next();
    const entity = this.merge(entityName, data) as T;
    await this.processPopulate(entity, populate);

    return entity;
  }

  merge<T extends BaseEntity>(entityName: string, data: any): T {
    const entity = this.entityFactory.create<T>(entityName, data);
    this.addToIdentityMap(entity);

    return entity;
  }

  getReference<T extends BaseEntity>(entityName: string, id: string): T {
    if (this.identityMap[`${entityName}-${id}`]) {
      return this.identityMap[`${entityName}-${id}`] as T;
    }

    const entity = this.entityFactory.createReference(entityName, id) as T;
    this.addToIdentityMap(entity);

    return entity;
  }

  async remove(entityName: string, where: any): Promise<number> {
    const result = await this.getCollection(this.metadata[entityName].collection).deleteMany(where);
    return result.deletedCount as number;
  }

  async count(entityName: string, where: any): Promise<number> {
    return this.getCollection(this.metadata[entityName].collection).count(where);
  }

  async persist(entity: BaseEntity, flush = false): Promise<void> {
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

  private addToIdentityMap(entity: BaseEntity) {
    this.identityMap[`${entity.constructor.name}-${entity.id}`] = entity;
    this.unitOfWork.addToIdentityMap(entity);
  }

  /**
   * @todo improve this for find() operations
   */
  private async processPopulate(entity: BaseEntity, populate: string[]): Promise<void> {
    for (const field of populate) {
      if (entity['_' + field] instanceof Collection && !entity['_' + field].isInitialized()) {
        await (entity['_' + field] as Collection<BaseEntity>).init(this);
      }

      if (entity[field] instanceof BaseEntity && !entity[field].isInitialized()) {
        await (entity[field] as BaseEntity).init(this);
      }
    }
  }

  create<T extends BaseEntity>(entityName: string, data: any): T {
    const entity = this.entityFactory.create<T>(entityName, data);
    entity['_initialized'] = false;

    return entity;
  }

}
