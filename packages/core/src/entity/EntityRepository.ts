import type { CreateOptions, EntityManager, MergeOptions } from '../EntityManager';
import type { AssignOptions } from './EntityAssigner';
import type {
  EntityData,
  EntityName,
  AnyEntity,
  Primary,
  Loaded,
  FilterQuery,
  EntityDictionary,
  AutoPath,
  RequiredEntityData,
  PaginatedResult,
  SimplePaginatedResult,
} from '../typings';
import type {
  CountOptions,
  DeleteOptions,
  FindOneOptions,
  FindOneOrFailOptions,
  FindOptions,
  GetReferenceOptions,
  NativeInsertUpdateOptions,
  PaginateOptions,
  UpdateOptions,
} from '../drivers/IDatabaseDriver';
import type { IdentifiedReference, Reference } from './Reference';
import type { EntityLoaderOptions } from './EntityLoader';
import { ValidationError } from '../errors';
import { Utils } from '../utils/Utils';

export class EntityRepository<T extends object> {

  constructor(protected readonly _em: EntityManager,
              protected readonly entityName: EntityName<T>) { }

  /**
   * Tells the EntityManager to make an instance managed and persistent.
   * The entity will be entered into the database at or before transaction commit or as a result of the flush operation.
   *
   * @deprecated this method will be removed in v6, you should work with the EntityManager instead
   */
  persist(entity: AnyEntity | AnyEntity[]): EntityManager {
    return this.getEntityManager().persist(entity);
  }

  /**
   * Persists your entity immediately, flushing all not yet persisted changes to the database too.
   * Equivalent to `em.persist(e).flush()`.
   *
   * @deprecated this method will be removed in v6, you should work with the EntityManager instead
   */
  async persistAndFlush(entity: AnyEntity | AnyEntity[]): Promise<void> {
    await this.getEntityManager().persistAndFlush(entity);
  }

  /**
   * Tells the EntityManager to make an instance managed and persistent.
   * The entity will be entered into the database at or before transaction commit or as a result of the flush operation.
   *
   * @deprecated use `persist()`
   */
  persistLater(entity: AnyEntity | AnyEntity[]): void {
    this.getEntityManager().persistLater(entity);
  }

  /**
   * Finds first entity matching your `where` query.
   */
  async findOne<P extends string = never>(where: FilterQuery<T>, options?: FindOneOptions<T, P>): Promise<Loaded<T, P> | null> {
    return this.getEntityManager().findOne<T, P>(this.entityName, where, options);
  }

  /**
   * Finds first entity matching your `where` query. If nothing found, it will throw an error.
   * You can override the factory for creating this method via `options.failHandler` locally
   * or via `Configuration.findOneOrFailHandler` globally.
   */
  async findOneOrFail<P extends string = never>(where: FilterQuery<T>, options?: FindOneOrFailOptions<T, P>): Promise<Loaded<T, P>> {
    return this.getEntityManager().findOneOrFail<T, P>(this.entityName, where, options);
  }

  /**
   * Creates or updates the entity, based on whether it is already present in the database.
   * This method performs an `insert on conflict merge` query ensuring the database is in sync, returning a managed
   * entity instance. The method accepts either `entityName` together with the entity `data`, or just entity instance.
   *
   * ```ts
   * // insert into "author" ("age", "email") values (33, 'foo@bar.com') on conflict ("email") do update set "age" = 41
   * const author = await em.getRepository(Author).upsert({ email: 'foo@bar.com', age: 33 });
   * ```
   *
   * The entity data needs to contain either the primary key, or any other unique property. Let's consider the following example, where `Author.email` is a unique property:
   *
   * ```ts
   * // insert into "author" ("age", "email") values (33, 'foo@bar.com') on conflict ("email") do update set "age" = 41
   * // select "id" from "author" where "email" = 'foo@bar.com'
   * const author = await em.getRepository(Author).upsert({ email: 'foo@bar.com', age: 33 });
   * ```
   *
   * Depending on the driver support, this will either use a returning query, or a separate select query, to fetch the primary key if it's missing from the `data`.
   *
   * If the entity is already present in current context, there won't be any queries - instead, the entity data will be assigned and an explicit `flush` will be required for those changes to be persisted.
   */
  async upsert(entityOrData?: EntityData<T> | T, options?: NativeInsertUpdateOptions<T>): Promise<T> {
    return this.getEntityManager().upsert<T>(this.entityName, entityOrData, options);
  }

  /**
   * Creates or updates the entity, based on whether it is already present in the database.
   * This method performs an `insert on conflict merge` query ensuring the database is in sync, returning a managed
   * entity instance.
   *
   * ```ts
   * // insert into "author" ("age", "email") values (33, 'foo@bar.com') on conflict ("email") do update set "age" = 41
   * const authors = await em.getRepository(Author).upsertMany([{ email: 'foo@bar.com', age: 33 }, ...]);
   * ```
   *
   * The entity data needs to contain either the primary key, or any other unique property. Let's consider the following example, where `Author.email` is a unique property:
   *
   * ```ts
   * // insert into "author" ("age", "email") values (33, 'foo@bar.com'), (666, 'lol@lol.lol') on conflict ("email") do update set "age" = excluded."age"
   * // select "id" from "author" where "email" = 'foo@bar.com'
   * const author = await em.getRepository(Author).upsertMany([
   *   { email: 'foo@bar.com', age: 33 },
   *   { email: 'lol@lol.lol', age: 666 },
   * ]);
   * ```
   *
   * Depending on the driver support, this will either use a returning query, or a separate select query, to fetch the primary key if it's missing from the `data`.
   *
   * If the entity is already present in current context, there won't be any queries - instead, the entity data will be assigned and an explicit `flush` will be required for those changes to be persisted.
   */
  async upsertMany(entitiesOrData?: EntityData<T>[] | T[], options?: NativeInsertUpdateOptions<T>): Promise<T[]> {
    return this.getEntityManager().upsertMany<T>(this.entityName, entitiesOrData, options);
  }

  /**
   * Finds all entities matching your `where` query. You can pass additional options via the `options` parameter.
   */
  async find<P extends string = never>(where: FilterQuery<T>, options?: FindOptions<T, P>): Promise<Loaded<T, P>[]> {
    return this.getEntityManager().find<T, P>(this.entityName, where as FilterQuery<T>, options);
  }

  /**
   * Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
   * where first element is the array of entities and the second is the count.
   */
  async findAndCount<P extends string = never>(where: FilterQuery<T>, options?: FindOptions<T, P>): Promise<[Loaded<T, P>[], number]> {
    return this.getEntityManager().findAndCount<T, P>(this.entityName, where, options);
  }

  /**
   * Finds entities matching your `where` query and returns them as a `PaginatedResult` object.
   * It will return total entities count and total pages.
   * Default page is 1 and default per page is 10.
   * To use pagination without counting all the rows and only use the next & previous, then use `repository.simplePaginate()`.
   */
  async paginate<P extends string = never>(where: FilterQuery<T>, paginateOptions?: PaginateOptions<T, P>): Promise<PaginatedResult<T, P>> {
    return this.em.paginate<T, P>(this.entityName, where, paginateOptions);
  }

  /**
   * Finds entities matching your `where` query and returns them as a `SimplePaginatedResult` object.
   * It will return total entities count and total pages.
   * Default page is 1 and default per page is 10.
   * To use pagination without counting all the rows and only use the next & previous, then use `em.simplePaginate()`.
   */
  async simplePaginate<P extends string = never>(where: FilterQuery<T>, paginateOptions?: PaginateOptions<T, P>): Promise<SimplePaginatedResult<T, P>> {
    return this.em.simplePaginate<T, P>(this.entityName, where, paginateOptions);
  }

  /**
   * Finds all entities of given type. You can pass additional options via the `options` parameter.
   */
  async findAll<P extends string = never>(options?: FindOptions<T, P>): Promise<Loaded<T, P>[]> {
    return this.getEntityManager().find<T, P>(this.entityName, {} as FilterQuery<T>, options);
  }

  /**
   * Marks entity for removal.
   * A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.
   *
   * To remove entities by condition, use `em.nativeDelete()`.
   *
   * @deprecated this method will be removed in v6, you should work with the EntityManager instead
   */
  remove(entity: AnyEntity): EntityManager {
    return this.getEntityManager().remove(entity);
  }

  /**
   * Removes an entity instance immediately, flushing all not yet persisted changes to the database too.
   * Equivalent to `em.remove(e).flush()`
   *
   * @deprecated this method will be removed in v6, you should work with the EntityManager instead
   */
  async removeAndFlush(entity: AnyEntity): Promise<void> {
    await this.getEntityManager().removeAndFlush(entity);
  }

  /**
   * Marks entity for removal.
   * A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.
   *
   * @deprecated use `remove()`
   */
  removeLater(entity: AnyEntity): void {
    this.getEntityManager().removeLater(entity);
  }

  /**
   * Flushes all changes to objects that have been queued up to now to the database.
   * This effectively synchronizes the in-memory state of managed objects with the database.
   * This method is a shortcut for `em.flush()`, in other words, it will flush the whole UoW,
   * not just entities registered via this particular repository.
   *
   * @deprecated this method will be removed in v6, you should work with the EntityManager instead
   */
  async flush(): Promise<void> {
    return this.getEntityManager().flush();
  }

  /**
   * Fires native insert query. Calling this has no side effects on the context (identity map).
   */
  async nativeInsert(data: T | EntityData<T>, options?: NativeInsertUpdateOptions<T>): Promise<Primary<T>> {
    return this.getEntityManager().nativeInsert<T>(this.entityName, data, options);
  }

  /**
   * Fires native update query. Calling this has no side effects on the context (identity map).
   */
  async nativeUpdate(where: FilterQuery<T>, data: EntityData<T>, options?: UpdateOptions<T>): Promise<number> {
    return this.getEntityManager().nativeUpdate(this.entityName, where, data, options);
  }

  /**
   * Fires native delete query. Calling this has no side effects on the context (identity map).
   */
  async nativeDelete(where: FilterQuery<T>, options?: DeleteOptions<T>): Promise<number> {
    return this.getEntityManager().nativeDelete(this.entityName, where, options);
  }

  /**
   * Maps raw database result to an entity and merges it to this EntityManager.
   */
  map(result: EntityDictionary<T>, options?: { schema?: string }): T {
    return this.getEntityManager().map(this.entityName, result, options);
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
    return this.getEntityManager().getReference<T>(this.entityName, id, options);
  }

  /**
   * Checks whether given property can be populated on the entity.
   */
  canPopulate(property: string): boolean {
    return this.getEntityManager().canPopulate(this.entityName, property);
  }

  /**
   * Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.
   */
  async populate<P extends string = never>(entities: T | T[], populate: AutoPath<T, P>[] | boolean, options?: EntityLoaderOptions<T, P>): Promise<Loaded<T, P>[]> {
    this.validateRepositoryType(entities, 'populate');
    return this.getEntityManager().populate(entities as T, populate, options);
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
    return this.getEntityManager().create(this.entityName, data, options);
  }

  /**
   * Shortcut for `wrap(entity).assign(data, { em })`
   */
  assign(entity: T, data: EntityData<T>, options?: AssignOptions): T {
    this.validateRepositoryType(entity, 'assign');
    return this.getEntityManager().assign(entity, data, options);
  }

  /**
   * Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
   * via second parameter. By default it will return already loaded entities without modifying them.
   */
  merge(data: T | EntityData<T>, options?: MergeOptions): T {
    return this.getEntityManager().merge<T>(this.entityName, data, options);
  }

  /**
   * Returns total number of entities matching your `where` query.
   */
  async count<P extends string = never>(where: FilterQuery<T> = {} as FilterQuery<T>, options: CountOptions<T, P> = {}): Promise<number> {
    return this.getEntityManager().count<T, P>(this.entityName, where, options);
  }

  /**
   * @deprecated this method will be removed in v6, use the public `getEntityManager()` method instead
   */
  protected get em(): EntityManager {
    return this._em;
  }

  /**
   * Returns the underlying EntityManager instance
   */
  getEntityManager(): EntityManager {
    return this._em;
  }

  protected validateRepositoryType(entities: T[] | T, method: string) {
    entities = Utils.asArray(entities);

    if (entities.length === 0) {
      return;
    }

    const entityName = entities[0].constructor.name;
    const repoType = Utils.className(this.entityName);

    if (entityName && repoType !== entityName) {
      throw ValidationError.fromWrongRepositoryType(entityName, repoType, method);
    }
  }

}
