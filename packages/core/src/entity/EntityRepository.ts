import type { CreateOptions, EntityManager, MergeOptions } from '../EntityManager';
import type { AssignOptions } from './EntityAssigner';
import type { EntityData, EntityName, AnyEntity, Primary, Loaded, FilterQuery, EntityDictionary, AutoPath, RequiredEntityData, Ref } from '../typings';
import type {
  CountOptions,
  DeleteOptions,
  FindByCursorOptions,
  FindOneOptions,
  FindOneOrFailOptions,
  FindOptions,
  GetReferenceOptions,
  NativeInsertUpdateOptions,
  UpdateOptions,
} from '../drivers/IDatabaseDriver';
import type { Reference } from './Reference';
import type { EntityLoaderOptions } from './EntityLoader';
import type { Cursor } from '../utils/Cursor';

export class EntityRepository<Entity extends object> {

  constructor(protected readonly _em: EntityManager,
              protected readonly entityName: EntityName<Entity>) { }

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
   * Finds first entity matching your `where` query.
   */
  async findOne<
    Hint extends string = never,
    Fields extends string = '*',
  >(where: FilterQuery<Entity>, options?: FindOneOptions<Entity, Hint, Fields>): Promise<Loaded<Entity, Hint, Fields> | null> {
    return this.em.findOne<Entity, Hint, Fields>(this.entityName, where, options);
  }

  /**
   * Finds first entity matching your `where` query. If nothing found, it will throw an error.
   * You can override the factory for creating this method via `options.failHandler` locally
   * or via `Configuration.findOneOrFailHandler` globally.
   */
  async findOneOrFail<
    Hint extends string = never,
    Fields extends string = '*',
  >(where: FilterQuery<Entity>, options?: FindOneOrFailOptions<Entity, Hint, Fields>): Promise<Loaded<Entity, Hint, Fields>> {
    return this.em.findOneOrFail<Entity, Hint, Fields>(this.entityName, where, options);
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
  async upsert(entityOrData?: EntityData<Entity> | Entity, options?: NativeInsertUpdateOptions<Entity>): Promise<Entity> {
    return this.em.upsert<Entity>(this.entityName, entityOrData, options);
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
  async upsertMany(entitiesOrData?: EntityData<Entity>[] | Entity[], options?: NativeInsertUpdateOptions<Entity>): Promise<Entity[]> {
    return this.em.upsertMany<Entity>(this.entityName, entitiesOrData, options);
  }

  /**
   * Finds all entities matching your `where` query. You can pass additional options via the `options` parameter.
   */
  async find<
    Hint extends string = never,
    Fields extends string = '*',
  >(where: FilterQuery<Entity>, options?: FindOptions<Entity, Hint, Fields>): Promise<Loaded<Entity, Hint, Fields>[]> {
    return this.em.find<Entity, Hint, Fields>(this.entityName, where as FilterQuery<Entity>, options);
  }

  /**
   * Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
   * where first element is the array of entities and the second is the count.
   */
  async findAndCount<
    Hint extends string = never,
    Fields extends string = '*',
  >(where: FilterQuery<Entity>, options?: FindOptions<Entity, Hint, Fields>): Promise<[Loaded<Entity, Hint, Fields>[], number]> {
    return this.em.findAndCount<Entity, Hint, Fields>(this.entityName, where, options);
  }

  /**
   * @inheritDoc EntityManager.findByCursor
   */
  async findByCursor<
    Hint extends string = never,
    Fields extends string = '*',
  >(where: FilterQuery<Entity>, options?: FindByCursorOptions<Entity, Hint, Fields>): Promise<Cursor<Entity, Hint, Fields>> {
    return this.em.findByCursor<Entity, Hint, Fields>(this.entityName, where, options);
  }

  /**
   * Finds all entities of given type. You can pass additional options via the `options` parameter.
   */
  async findAll<
    Hint extends string = never,
    Fields extends string = '*',
  >(options?: FindOptions<Entity, Hint, Fields>): Promise<Loaded<Entity, Hint, Fields>[]> {
    return this.em.find<Entity, Hint, Fields>(this.entityName, {} as FilterQuery<Entity>, options);
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
   * Flushes all changes to objects that have been queued up to now to the database.
   * This effectively synchronizes the in-memory state of managed objects with the database.
   * This method is a shortcut for `em.flush()`, in other words, it will flush the whole UoW,
   * not just entities registered via this particular repository.
   */
  async flush(): Promise<void> {
    return this.em.flush();
  }

  /**
   * @inheritDoc EntityManager.insert
   */
  async insert(data: Entity | EntityData<Entity>, options?: NativeInsertUpdateOptions<Entity>): Promise<Primary<Entity>> {
    return this.em.insert<Entity>(this.entityName, data, options);
  }

  /**
   * @inheritDoc EntityManager.insert
   */
  async insertMany(data: Entity[] | EntityData<Entity>[], options?: NativeInsertUpdateOptions<Entity>): Promise<Primary<Entity>[]> {
    return this.em.insertMany<Entity>(this.entityName, data, options);
  }

  /**
   * Fires native update query. Calling this has no side effects on the context (identity map).
   */
  async nativeUpdate(where: FilterQuery<Entity>, data: EntityData<Entity>, options?: UpdateOptions<Entity>): Promise<number> {
    return this.em.nativeUpdate(this.entityName, where, data, options);
  }

  /**
   * Fires native delete query. Calling this has no side effects on the context (identity map).
   */
  async nativeDelete(where: FilterQuery<Entity>, options?: DeleteOptions<Entity>): Promise<number> {
    return this.em.nativeDelete(this.entityName, where, options);
  }

  /**
   * Maps raw database result to an entity and merges it to this EntityManager.
   */
  map(result: EntityDictionary<Entity>, options?: { schema?: string }): Entity {
    return this.em.map(this.entityName, result, options);
  }

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference(id: Primary<Entity>, options: Omit<GetReferenceOptions, 'wrapped'> & { wrapped: true }): Ref<Entity>;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference(id: Primary<Entity> | Primary<Entity>[]): Entity;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference(id: Primary<Entity>, options: Omit<GetReferenceOptions, 'wrapped'> & { wrapped: false }): Entity;

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference(id: Primary<Entity>, options?: GetReferenceOptions): Entity | Reference<Entity> {
    return this.em.getReference<Entity>(this.entityName, id, options);
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
  async populate<
    Hint extends string = never,
    Fields extends string = '*',
  >(entities: Entity | Entity[], populate: AutoPath<Entity, Hint>[] | boolean, options?: EntityLoaderOptions<Entity, Hint, Fields>): Promise<Loaded<Entity, Hint, Fields>[]> {
    return this.em.populate(entities as Entity, populate, options);
  }

  /**
   * Creates new instance of given entity and populates it with given data.
   * The entity constructor will be used unless you provide `{ managed: true }` in the options parameter.
   * The constructor will be given parameters based on the defined constructor of the entity. If the constructor
   * parameter matches a property name, its value will be extracted from `data`. If no matching property exists,
   * the whole `data` parameter will be passed. This means we can also define `constructor(data: Partial<T>)` and
   * `em.create()` will pass the data into it (unless we have a property named `data` too).
   */
  create<Hint = never>(data: RequiredEntityData<Entity>, options?: CreateOptions): Entity {
    return this.em.create(this.entityName, data, options);
  }

  /**
   * Shortcut for `wrap(entity).assign(data, { em })`
   */
  assign(entity: Entity, data: EntityData<Entity>, options?: AssignOptions): Entity {
    return this.em.assign(entity, data, options);
  }

  /**
   * Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
   * via second parameter. By default it will return already loaded entities without modifying them.
   */
  merge(data: Entity | EntityData<Entity>, options?: MergeOptions): Entity {
    return this.em.merge<Entity>(this.entityName, data, options);
  }

  /**
   * Returns total number of entities matching your `where` query.
   */
  async count<Hint extends string = never>(where: FilterQuery<Entity> = {} as FilterQuery<Entity>, options: CountOptions<Entity, Hint> = {}): Promise<number> {
    return this.em.count<Entity, Hint>(this.entityName, where, options);
  }

  protected get em(): EntityManager {
    return this._em;
  }

}
