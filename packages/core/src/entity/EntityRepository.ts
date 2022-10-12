import type { CreateOptions, EntityManager, MergeOptions } from '../EntityManager';
import type { AssignOptions } from './EntityAssigner';
import type { EntityData, EntityName, AnyEntity, Primary, Loaded, FilterQuery, EntityDictionary, AutoPath, RequiredEntityData } from '../typings';
import type { CountOptions, DeleteOptions, FindOneOptions, FindOneOrFailOptions, FindOptions, GetReferenceOptions, NativeInsertUpdateOptions, UpdateOptions } from '../drivers/IDatabaseDriver';
import type { IdentifiedReference, Reference } from './Reference';
import type { EntityLoaderOptions } from './EntityLoader';
import type { CommitOptions } from '../unit-of-work/UnitOfWork';

// eslint-disable-next-line @typescript-eslint/ban-types
export class EntityRepository<T extends {}> {

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
  async findOne<P extends string = never>(where: FilterQuery<T>, options?: FindOneOptions<T, P>): Promise<Loaded<T, P> | null> {
    return this.em.findOne<T, P>(this.entityName, where, options);
  }

  /**
   * Finds first entity matching your `where` query. If nothing found, it will throw an error.
   * You can override the factory for creating this method via `options.failHandler` locally
   * or via `Configuration.findOneOrFailHandler` globally.
   */
  async findOneOrFail<P extends string = never>(where: FilterQuery<T>, options?: FindOneOrFailOptions<T, P>): Promise<Loaded<T, P>> {
    return this.em.findOneOrFail<T, P>(this.entityName, where, options);
  }

  /**
   * Finds all entities matching your `where` query. You can pass additional options via the `options` parameter.
   */
  async find<P extends string = never>(where: FilterQuery<T>, options?: FindOptions<T, P>): Promise<Loaded<T, P>[]> {
    return this.em.find<T, P>(this.entityName, where as FilterQuery<T>, options);
  }

  /**
   * Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
   * where first element is the array of entities and the second is the count.
   */
  async findAndCount<P extends string = never>(where: FilterQuery<T>, options?: FindOptions<T, P>): Promise<[Loaded<T, P>[], number]> {
    return this.em.findAndCount<T, P>(this.entityName, where, options);
  }

  /**
   * Finds all entities of given type. You can pass additional options via the `options` parameter.
   */
  async findAll<P extends string = never>(options?: FindOptions<T, P>): Promise<Loaded<T, P>[]> {
    return this.em.find<T, P>(this.entityName, {} as FilterQuery<T>, options);
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
  async flush(opts?: CommitOptions): Promise<void> {
    return this.em.flush(opts);
  }

  /**
   * Fires native insert query. Calling this has no side effects on the context (identity map).
   */
  async nativeInsert(data: T | EntityData<T>, options?: NativeInsertUpdateOptions<T>): Promise<Primary<T>> {
    return this.em.nativeInsert<T>(this.entityName, data, options);
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
  map(result: EntityDictionary<T>, options?: { schema?: string }): T {
    return this.em.map(this.entityName, result, options);
  }

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<PK extends keyof T>(id: Primary<T>, options: Omit<GetReferenceOptions, 'wrapped'> & { wrapped: true }): IdentifiedReference<T, PK>;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference(id: Primary<T> | Primary<T>[]): T;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference(id: Primary<T>, options: Omit<GetReferenceOptions, 'wrapped'> & { wrapped: false }): T;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<PK extends keyof T = keyof T>(id: Primary<T>, options?: GetReferenceOptions): T | Reference<T> {
    return this.em.getReference<T>(this.entityName, id, options);
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
  async populate<P extends string = never>(entities: T | T[], populate: AutoPath<T, P>[] | boolean, options?: EntityLoaderOptions<T, P>): Promise<Loaded<T, P>[]> {
    return this.em.populate(entities as T, populate, options);
  }

  /**
   * Creates new instance of given entity and populates it with given data.
   * The entity constructor will be used unless you provide `{ managed: true }` in the options parameter.
   * The constructor will be given parameters based on the defined constructor of the entity. If the constructor
   * parameter matches a property name, its value will be extracted from `data`. If no matching property exists,
   * the whole `data` parameter will be passed. This means we can also define `constructor(data: Partial<T>)` and
   * `em.create()` will pass the data into it (unless we have a property named `data` too).
   */
  create<P = never>(data: RequiredEntityData<T>, options?: CreateOptions): T {
    return this.em.create(this.entityName, data, options);
  }

  /**
   * Shortcut for `wrap(entity).assign(data, { em })`
   */
  assign(entity: T, data: EntityData<T>, options?: AssignOptions): T {
    return this.em.assign(entity, data, options);
  }

  /**
   * Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
   * via second parameter. By default it will return already loaded entities without modifying them.
   */
  merge(data: T | EntityData<T>, options?: MergeOptions): T {
    return this.em.merge<T>(this.entityName, data, options);
  }

  /**
   * Returns total number of entities matching your `where` query.
   */
  async count<P extends string = never>(where: FilterQuery<T> = {} as FilterQuery<T>, options: CountOptions<T, P> = {}): Promise<number> {
    return this.em.count<T, P>(this.entityName, where, options);
  }

  protected get em(): EntityManager {
    return this._em.getContext(false);
  }

}
