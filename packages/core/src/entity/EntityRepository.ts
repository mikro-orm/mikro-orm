import { EntityManager } from '../EntityManager';
import { EntityData, EntityName, AnyEntity, Primary, Populate, Loaded } from '../typings';
import { QueryOrderMap } from '../enums';
import { FilterQuery, FindOneOptions, FindOptions, FindOneOrFailOptions, IdentifiedReference, Reference } from '..';

export class EntityRepository<T extends AnyEntity<T>> {

  constructor(protected readonly em: EntityManager,
              protected readonly entityName: EntityName<T>) { }

  persist(entity: AnyEntity | AnyEntity[]): EntityManager {
    return this.em.persist(entity);
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

  async findOne<P extends Populate<T> = any>(where: FilterQuery<T>, populate?: P, orderBy?: QueryOrderMap): Promise<Loaded<T, P> | null>;
  async findOne<P extends Populate<T> = any>(where: FilterQuery<T>, populate?: FindOneOptions<T, P>, orderBy?: QueryOrderMap): Promise<Loaded<T, P> | null>;
  async findOne<P extends Populate<T> = any>(where: FilterQuery<T>, populate?: P | FindOneOptions<T, P>, orderBy?: QueryOrderMap): Promise<Loaded<T, P> | null> {
    return this.em.findOne<T, P>(this.entityName, where, populate as P, orderBy);
  }

  async findOneOrFail<P extends Populate<T> = any>(where: FilterQuery<T>, populate?: P, orderBy?: QueryOrderMap): Promise<Loaded<T, P>>;
  async findOneOrFail<P extends Populate<T> = any>(where: FilterQuery<T>, populate?: FindOneOrFailOptions<T, P>, orderBy?: QueryOrderMap): Promise<Loaded<T, P>>;
  async findOneOrFail<P extends Populate<T> = any>(where: FilterQuery<T>, populate?: P | FindOneOrFailOptions<T, P>, orderBy?: QueryOrderMap): Promise<Loaded<T, P>> {
    return this.em.findOneOrFail<T, P>(this.entityName, where, populate as P, orderBy);
  }

  async find<P extends Populate<T> = any>(where: FilterQuery<T>, options?: FindOptions<T, P>): Promise<Loaded<T, P>[]>;
  async find<P extends Populate<T> = any>(where: FilterQuery<T>, populate?: string[] | boolean, orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<Loaded<T, P>[]>;
  async find<P extends Populate<T> = any>(where: FilterQuery<T>, populate: string[] | boolean | FindOptions<T, P> = [], orderBy: QueryOrderMap = {}, limit?: number, offset?: number): Promise<Loaded<T, P>[]> {
    return this.em.find<T, P>(this.entityName, where as FilterQuery<T>, populate as P, orderBy, limit, offset);
  }

  async findAndCount<P extends Populate<T> = any>(where: FilterQuery<T>, options?: FindOptions<T>): Promise<[Loaded<T, P>[], number]>;
  async findAndCount<P extends Populate<T> = any>(where: FilterQuery<T>, populate?: string[] | boolean, orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<[Loaded<T, P>[], number]>;
  async findAndCount<P extends Populate<T> = any>(where: FilterQuery<T>, populate: string[] | boolean | FindOptions<T> = [], orderBy: QueryOrderMap = {}, limit?: number, offset?: number): Promise<[Loaded<T, P>[], number]> {
    return this.em.findAndCount<T, P>(this.entityName, where as FilterQuery<T>, populate as P, orderBy, limit, offset);
  }

  async findAll<P extends Populate<T> = any>(options?: FindOptions<T>): Promise<Loaded<T, P>[]>;
  async findAll<P extends Populate<T> = any>(populate?: string[] | boolean | true, orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<Loaded<T, P>[]>;
  async findAll<P extends Populate<T> = any>(populate: string[] | boolean | true | FindOptions<T> = [], orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<Loaded<T, P>[]> {
    return this.em.find<T, P>(this.entityName, {}, populate as string[], orderBy, limit, offset);
  }

  remove(entity: AnyEntity): EntityManager {
    return this.em.remove(entity);
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
  getReference<PK extends keyof T = keyof T>(id: Primary<T>, wrapped = false): T | Reference<T> {
    return this.em.getReference<T>(this.entityName, id, wrapped);
  }

  canPopulate(property: string): boolean {
    return this.em.canPopulate(this.entityName, property);
  }

  async populate<P extends string | keyof T | Populate<T>>(entities: T, populate: P, where?: FilterQuery<T>, orderBy?: QueryOrderMap, refresh?: boolean, validate?: boolean): Promise<Loaded<T, P>>;
  async populate<P extends string | keyof T | Populate<T>>(entities: T[], populate: P, where?: FilterQuery<T>, orderBy?: QueryOrderMap, refresh?: boolean, validate?: boolean): Promise<Loaded<T, P>[]>;
  async populate<P extends string | keyof T | Populate<T>>(entities: T | T[], populate: P, where?: FilterQuery<T>, orderBy?: QueryOrderMap, refresh?: boolean, validate?: boolean): Promise<Loaded<T, P> | T[]>;
  async populate<P extends string | keyof T | Populate<T>>(entities: T | T[], populate: P, where: FilterQuery<T> = {}, orderBy: QueryOrderMap = {}, refresh = false, validate = true): Promise<Loaded<T, P> | T[]> {
    return this.em.populate(entities, populate, where, orderBy, refresh, validate);
  }

  /**
   * Creates new instance of given entity and populates it with given data
   */
  create(data: EntityData<T>): T {
    return this.em.create<T>(this.entityName, data);
  }

  /**
   * Shortcut for `wrap(entity).assign(data, { em })`
   */
  assign(entity: T, data: EntityData<T>): T {
    return this.em.assign(entity, data);
  }

  async count(where: FilterQuery<T> = {}): Promise<number> {
    return this.em.count<T>(this.entityName, where);
  }

}
