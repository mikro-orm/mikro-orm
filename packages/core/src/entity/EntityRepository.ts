import { EntityManager, FindOneOrFailOptions } from '../EntityManager';
import { EntityData, EntityName, AnyEntity, Primary } from '../typings';
import { QueryOrderMap } from '../enums';
import { FilterQuery, FindOneOptions, FindOptions, IdentifiedReference, Reference } from '..';

export class EntityRepository<T extends AnyEntity<T>> {

  constructor(protected readonly em: EntityManager,
              protected readonly entityName: EntityName<T>) { }

  persist(entity: AnyEntity | AnyEntity[], flush?: false): void;
  persist(entity: AnyEntity | AnyEntity[], flush: true): Promise<void>;
  persist(entity: AnyEntity | AnyEntity[], flush = false): void | Promise<void> {
    return this.em.persist(entity, flush as true);
  }

  async persistAndFlush(entity: AnyEntity | AnyEntity[]): Promise<void> {
    await this.em.persistAndFlush(entity);
  }

  /**
   * @deprecated use `persist()`
   */
  persistLater(entity: AnyEntity | AnyEntity[]): void {
    this.em.persistLater(entity);
  }

  async findOne(where: FilterQuery<T>, populate?: string[] | boolean, orderBy?: QueryOrderMap): Promise<T | null>;
  async findOne(where: FilterQuery<T>, populate?: FindOneOptions, orderBy?: QueryOrderMap): Promise<T | null>;
  async findOne(where: FilterQuery<T>, populate: string[] | boolean | FindOneOptions = [], orderBy?: QueryOrderMap): Promise<T | null> {
    return this.em.findOne<T>(this.entityName, where, populate as string[], orderBy);
  }

  async findOneOrFail(where: FilterQuery<T>, populate?: string[] | boolean, orderBy?: QueryOrderMap): Promise<T>;
  async findOneOrFail(where: FilterQuery<T>, populate?: FindOneOrFailOptions, orderBy?: QueryOrderMap): Promise<T>;
  async findOneOrFail(where: FilterQuery<T>, populate: string[] | boolean | FindOneOrFailOptions = [], orderBy?: QueryOrderMap): Promise<T> {
    return this.em.findOneOrFail<T>(this.entityName, where, populate as string[], orderBy);
  }

  async find(where: FilterQuery<T>, options?: FindOptions): Promise<T[]>;
  async find(where: FilterQuery<T>, populate?: string[] | boolean, orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<T[]>;
  async find(where: FilterQuery<T>, populate: string[] | boolean | FindOptions = [], orderBy: QueryOrderMap = {}, limit?: number, offset?: number): Promise<T[]> {
    return this.em.find<T>(this.entityName, where as FilterQuery<T>, populate as string[], orderBy, limit, offset);
  }

  async findAndCount(where: FilterQuery<T>, options?: FindOptions): Promise<[T[], number]>;
  async findAndCount(where: FilterQuery<T>, populate?: string[] | boolean, orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<[T[], number]>;
  async findAndCount(where: FilterQuery<T>, populate: string[] | boolean | FindOptions = [], orderBy: QueryOrderMap = {}, limit?: number, offset?: number): Promise<[T[], number]> {
    return this.em.findAndCount<T>(this.entityName, where as FilterQuery<T>, populate as string[], orderBy, limit, offset);
  }

  async findAll(options?: FindOptions): Promise<T[]>;
  async findAll(populate?: string[] | boolean | true, orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<T[]>;
  async findAll(populate: string[] | boolean | true | FindOptions = [], orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<T[]> {
    return this.em.find<T>(this.entityName, {}, populate as string[], orderBy, limit, offset);
  }

  remove(where: T | FilterQuery<T>, flush?: false): void;
  remove(where: T | FilterQuery<T>, flush: true): Promise<number>;
  remove(where: T | FilterQuery<T>, flush = false): void | Promise<number> {
    return this.em.remove(this.entityName, where, flush as true);
  }

  async removeAndFlush(entity: AnyEntity): Promise<void> {
    await this.em.removeAndFlush(entity);
  }

  /**
   * @deprecated use `remove()`
   */
  removeLater(entity: AnyEntity): void {
    this.em.removeLater(entity);
  }

  async flush(): Promise<void> {
    return this.em.flush();
  }

  async nativeInsert(data: EntityData<T>): Promise<Primary<T>> {
    return this.em.nativeInsert<T>(this.entityName, data);
  }

  async nativeUpdate(where: FilterQuery<T>, data: EntityData<T>): Promise<number> {
    return this.em.nativeUpdate(this.entityName, where, data);
  }

  async nativeDelete(where: FilterQuery<T> | any): Promise<number> {
    return this.em.nativeDelete(this.entityName, where);
  }

  map(result: EntityData<T>): T {
    return this.em.map(this.entityName, result);
  }

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<PK extends keyof T>(id: Primary<T>, wrapped: true): IdentifiedReference<T, PK>;
  getReference<PK extends keyof T = keyof T>(id: Primary<T>): T;
  getReference<PK extends keyof T = keyof T>(id: Primary<T>, wrapped: false): T;
  getReference<PK extends keyof T = keyof T>(id: Primary<T>, wrapped: true): Reference<T>;
  getReference<PK extends keyof T = keyof T>(id: Primary<T>, wrapped = false): T | Reference<T> {
    return this.em.getReference<T>(this.entityName, id, wrapped);
  }

  canPopulate(property: string): boolean {
    return this.em.canPopulate(this.entityName, property);
  }

  async populate<A extends T | T[]>(entities: A, populate: string | string[] | boolean, where: FilterQuery<T> = {}, orderBy: QueryOrderMap = {}, refresh = false, validate = true): Promise<A> {
    return this.em.populate(entities, populate, where, orderBy, refresh, validate);
  }

  /**
   * Creates new instance of given entity and populates it with given data
   */
  create(data: EntityData<T>): T {
    return this.em.create<T>(this.entityName, data);
  }

  async count(where: FilterQuery<T> = {}): Promise<number> {
    return this.em.count<T>(this.entityName, where);
  }

}
