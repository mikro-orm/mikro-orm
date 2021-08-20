import { EntityManager } from '../EntityManager';
import { EntityData, EntityName, AnyEntity, Primary, Populate, Loaded, New, FilterQuery, EntityDictionary } from '../typings';
import { CountOptions, DeleteOptions, FindOneOptions, FindOneOrFailOptions, FindOptions, UpdateOptions } from '../drivers/IDatabaseDriver';
import { IdentifiedReference, Reference } from './Reference';
import { EntityLoaderOptions } from './EntityLoader';

export class EntityRepository<T extends AnyEntity<T>> {

  constructor(protected readonly _em: EntityManager,
              protected readonly entityName: EntityName<T>) { }

  /**
   * Tells the EntityManager to make an instance managed and persistent.
   * The entity will be entered into the database at or before transaction commit or as a result of the flush operation.
   */
  persist(entity: AnyEntity | AnyEntity[]): EntityManager {
    return this.em.persist(entity);
  }

  /**
   * Persists your entity immediately, flushing all not yet persisted changes to the database too.
   * Equivalent to `em.persist(e).flush()`.
   */
  async persistAndFlush(entity: AnyEntity | AnyEntity[]): Promise<void> {
    await this.em.persistAndFlush(entity);
  }

  /**
   * Tells the EntityManager to make an instance managed and persistent.
   * The entity will be entered into the database at or before transaction commit or as a result of the flush operation.
   *
   * @deprecated use `persist()`
   */
  persistLater(entity: AnyEntity | AnyEntity[]): void {
    this.em.persistLater(entity);
  }

  /**
   * Finds first entity matching your `where` query.
   */
  async findOne<P extends Populate<T> = any>(where: FilterQuery<T>, options?: FindOneOptions<T, P>): Promise<Loaded<T, P> | null> {
    return this.em.findOne<T, P>(this.entityName, where, options);
  }

  /**
   * Finds first entity matching your `where` query. If nothing found, it will throw an error.
   * You can override the factory for creating this method via `options.failHandler` locally
   * or via `Configuration.findOneOrFailHandler` globally.
   */
  async findOneOrFail<P extends Populate<T> = any>(where: FilterQuery<T>, options?: FindOneOrFailOptions<T, P>): Promise<Loaded<T, P>> {
    return this.em.findOneOrFail<T, P>(this.entityName, where, options);
  }

  /**
   * Finds all entities matching your `where` query. You can pass additional options via the `options` parameter.
   */
  async find<P extends Populate<T> = any>(where: FilterQuery<T>, options?: FindOptions<T, P>): Promise<Loaded<T, P>[]> {
    return this.em.find<T, P>(this.entityName, where as FilterQuery<T>, options);
  }

  /**
   * Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
   * where first element is the array of entities and the second is the count.
   */
  async findAndCount<P extends Populate<T> = any>(where: FilterQuery<T>, options?: FindOptions<T, P>): Promise<[Loaded<T, P>[], number]> {
    return this.em.findAndCount<T, P>(this.entityName, where, options);
  }

  /**
   * Finds all entities of given type. You can pass additional options via the `options` parameter.
   */
  async findAll<P extends Populate<T> = any>(options?: FindOptions<T, P>): Promise<Loaded<T, P>[]> {
    return this.em.find<T, P>(this.entityName, {}, options);
  }

  /**
   * Marks entity for removal.
   * A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.
   *
   * To remove entities by condition, use `em.nativeDelete()`.
   */
  remove(entity: AnyEntity): EntityManager {
    return this.em.remove(entity);
  }

  /**
   * Removes an entity instance immediately, flushing all not yet persisted changes to the database too.
   * Equivalent to `em.remove(e).flush()`
   */
  async removeAndFlush(entity: AnyEntity): Promise<void> {
    await this.em.removeAndFlush(entity);
  }

  /**
   * Marks entity for removal.
   * A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.
   *
   * @deprecated use `remove()`
   */
  removeLater(entity: AnyEntity): void {
    this.em.removeLater(entity);
  }

  /**
   * Flushes all changes to objects that have been queued up to now to the database.
   * This effectively synchronizes the in-memory state of managed objects with the database.
   * This method is a shortcut for `em.flush()`, in other words, it will flush the whole UoW,
   * not just entities registered via this particular repository.
   */
  async flush(): Promise<void> {
    return this.em.flush();
  }

  /**
   * Fires native insert query. Calling this has no side effects on the context (identity map).
   */
  async nativeInsert(data: EntityData<T>): Promise<Primary<T>> {
    return this.em.nativeInsert<T>(this.entityName, data);
  }

  /**
   * Fires native update query. Calling this has no side effects on the context (identity map).
   */
  async nativeUpdate(where: FilterQuery<T>, data: EntityData<T>, options?: UpdateOptions<T>): Promise<number> {
    return this.em.nativeUpdate(this.entityName, where, data, options);
  }

  /**
   * Fires native delete query. Calling this has no side effects on the context (identity map).
   */
  async nativeDelete(where: FilterQuery<T>, options?: DeleteOptions<T>): Promise<number> {
    return this.em.nativeDelete(this.entityName, where, options);
  }

  /**
   * Maps raw database result to an entity and merges it to this EntityManager.
   */
  map(result: EntityDictionary<T>): T {
    return this.em.map(this.entityName, result);
  }

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<PK extends keyof T>(id: Primary<T>, wrapped: true): IdentifiedReference<T, PK>;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<PK extends keyof T = keyof T>(id: Primary<T>): T;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<PK extends keyof T = keyof T>(id: Primary<T>, wrapped: false): T;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<PK extends keyof T = keyof T>(id: Primary<T>, wrapped = false): T | Reference<T> {
    return this.em.getReference<T>(this.entityName, id, wrapped);
  }

  /**
   * Checks whether given property can be populated on the entity.
   */
  canPopulate(property: string): boolean {
    return this.em.canPopulate(this.entityName, property);
  }

  /**
   * Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.
   */
  async populate<P extends string | keyof T | Populate<T>>(entities: T, populate: P, options?: EntityLoaderOptions<T>): Promise<Loaded<T, P>>;

  /**
   * Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.
   */
  async populate<P extends string | keyof T | Populate<T>>(entities: T[], populate: P, options?: EntityLoaderOptions<T>): Promise<Loaded<T, P>[]>;

  /**
   * Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.
   */
  async populate<P extends string | keyof T | Populate<T>>(entities: T | T[], populate: P, options?: EntityLoaderOptions<T>): Promise<Loaded<T, P> | Loaded<T, P>[]>;

  /**
   * Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.
   */
  async populate<P extends string | keyof T | Populate<T>>(entities: T | T[], populate: P, options?: EntityLoaderOptions<T>): Promise<Loaded<T, P> | Loaded<T, P>[]> {
    return this.em.populate<T, P>(entities, populate, options);
  }

  /**
   * Creates new instance of given entity and populates it with given data
   */
  create<P extends Populate<T> = string[]>(data: EntityData<T>): New<T, P> {
    return this.em.create<T, P>(this.entityName, data);
  }

  /**
   * Shortcut for `wrap(entity).assign(data, { em })`
   */
  assign(entity: T, data: EntityData<T>): T {
    return this.em.assign(entity, data);
  }

  /**
   * Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
   * via second parameter. By default it will return already loaded entities without modifying them.
   */
  merge(data: T | EntityData<T>, refresh?: boolean, convertCustomTypes?: boolean): T {
    return this.em.merge<T>(this.entityName, data, refresh, convertCustomTypes);
  }

  /**
   * Returns total number of entities matching your `where` query.
   */
  async count(where: FilterQuery<T> = {}, options: CountOptions<T> = {}): Promise<number> {
    return this.em.count<T>(this.entityName, where, options);
  }

  protected get em(): EntityManager {
    return this._em.getContext();
  }

}
