import { EntityManager, FindOneOptions, FindOptions } from '../EntityManager';
import { EntityData, EntityName, IEntity, IEntityType, IPrimaryKey } from '../decorators';
import { QueryBuilder, QueryOrder } from '../query';
import { FilterQuery } from '..';

export class EntityRepository<T extends IEntityType<T>> {

  constructor(private readonly em: EntityManager,
              protected readonly entityName: EntityName<T>) { }

  async persist(entity: T | IEntity[], flush = this.em.config.get('autoFlush')): Promise<void> {
    await this.em.persist(entity, flush);
  }

  async persistAndFlush(entity: IEntity | IEntity[]): Promise<void> {
    await this.em.persistAndFlush(entity);
  }

  persistLater(entity: IEntity | IEntity[]): void {
    this.em.persistLater(entity);
  }

  createQueryBuilder(alias?: string): QueryBuilder {
    return this.em.createQueryBuilder(this.entityName, alias);
  }

  async findOne(where: FilterQuery<T> | IPrimaryKey, populate?: string[], orderBy?: Record<string, QueryOrder>): Promise<T | null>;
  async findOne(where: FilterQuery<T> | IPrimaryKey, populate?: FindOneOptions, orderBy?: Record<string, QueryOrder>): Promise<T | null>;
  async findOne(where: FilterQuery<T> | IPrimaryKey, populate: string[] | FindOneOptions = [], orderBy?: Record<string, QueryOrder>): Promise<T | null> {
    return this.em.findOne<T>(this.entityName, where, populate as string[], orderBy);
  }

  async find(where: FilterQuery<T> | IPrimaryKey, options?: FindOptions): Promise<T[]>;
  async find(where: FilterQuery<T> | IPrimaryKey, populate?: string[], orderBy?: Record<string, QueryOrder>, limit?: number, offset?: number): Promise<T[]>;
  async find(where: FilterQuery<T> | IPrimaryKey, populate: string[] | FindOptions = [], orderBy: Record<string, QueryOrder> = {}, limit?: number, offset?: number): Promise<T[]> {
    return this.em.find<T>(this.entityName, where as FilterQuery<T>, populate as string[], orderBy, limit, offset);
  }

  async findAll(options?: FindOptions): Promise<T[]>;
  async findAll(populate?: string[], orderBy?: Record<string, QueryOrder>, limit?: number, offset?: number): Promise<T[]>;
  async findAll(populate: string[] | FindOptions = [], orderBy?: Record<string, QueryOrder>, limit?: number, offset?: number): Promise<T[]> {
    return this.em.find<T>(this.entityName, {}, populate as string[], orderBy, limit, offset);
  }

  async remove(where: T | FilterQuery<T> | IPrimaryKey, flush = this.em.config.get('autoFlush')): Promise<number> {
    return this.em.remove(this.entityName, where, flush);
  }

  async removeAndFlush(entity: IEntity): Promise<void> {
    await this.em.removeAndFlush(entity);
  }

  removeLater(entity: IEntity): void {
    this.em.removeLater(entity);
  }

  async flush(): Promise<void> {
    return this.em.flush();
  }

  async nativeInsert(data: EntityData<T>): Promise<IPrimaryKey> {
    return this.em.nativeInsert(this.entityName, data)
  }

  async nativeUpdate(where: FilterQuery<T>, data: EntityData<T>): Promise<number> {
    return this.em.nativeUpdate(this.entityName, where, data)
  }

  async nativeDelete(where: FilterQuery<T> | any): Promise<number> {
    return this.em.nativeDelete(this.entityName, where)
  }

  async aggregate(pipeline: any[]): Promise<any[]> {
    return this.em.aggregate(this.entityName, pipeline)
  }

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference(id: IPrimaryKey): T {
    return this.em.getReference<T>(this.entityName, id);
  }

  canPopulate(property: string): boolean {
    return this.em.canPopulate(this.entityName, property);
  }

  /**
   * Creates new instance of given entity and populates it with given data
   */
  create(data: EntityData<T>): T {
    return this.em.create<T>(this.entityName, data);
  }

  async count(where: FilterQuery<T> = {}): Promise<number> {
    return this.em.count(this.entityName, where);
  }

}
