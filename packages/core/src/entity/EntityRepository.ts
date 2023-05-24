import type { CreateOptions, EntityManager, MergeOptions } from '../EntityManager';
import type { AssignOptions } from './EntityAssigner';
import type { EntityData, EntityName, Primary, Loaded, FilterQuery, EntityDictionary, AutoPath, RequiredEntityData, Ref } from '../typings';
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
import { ValidationError } from '../errors';
import { Utils } from '../utils/Utils';
import type { Cursor } from '../utils/Cursor';

export class EntityRepository<Entity extends object> {

  constructor(protected readonly em: EntityManager,
              protected readonly entityName: EntityName<Entity>) { }

  /**
   * Finds first entity matching your `where` query.
   */
  async findOne<
    Hint extends string = never,
    Fields extends string = never,
  >(where: FilterQuery<Entity>, options?: FindOneOptions<Entity, Hint, Fields>): Promise<Loaded<Entity, Hint, Fields> | null> {
    return this.getEntityManager().findOne<Entity, Hint, Fields>(this.entityName, where, options);
  }

  /**
   * Finds first entity matching your `where` query. If nothing found, it will throw an error.
   * You can override the factory for creating this method via `options.failHandler` locally
   * or via `Configuration.findOneOrFailHandler` globally.
   */
  async findOneOrFail<
    Hint extends string = never,
    Fields extends string = never,
  >(where: FilterQuery<Entity>, options?: FindOneOrFailOptions<Entity, Hint, Fields>): Promise<Loaded<Entity, Hint, Fields>> {
    return this.getEntityManager().findOneOrFail<Entity, Hint, Fields>(this.entityName, where, options);
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
    return this.getEntityManager().upsert<Entity>(this.entityName, entityOrData, options);
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
    return this.getEntityManager().upsertMany<Entity>(this.entityName, entitiesOrData, options);
  }

  /**
   * Finds all entities matching your `where` query. You can pass additional options via the `options` parameter.
   */
  async find<
    Hint extends string = never,
    Fields extends string = never,
  >(where: FilterQuery<Entity>, options?: FindOptions<Entity, Hint, Fields>): Promise<Loaded<Entity, Hint, Fields>[]> {
    return this.getEntityManager().find<Entity, Hint, Fields>(this.entityName, where as FilterQuery<Entity>, options);
  }

  /**
   * Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
   * where first element is the array of entities and the second is the count.
   */
  async findAndCount<
    Hint extends string = never,
    Fields extends string = never,
  >(where: FilterQuery<Entity>, options?: FindOptions<Entity, Hint, Fields>): Promise<[Loaded<Entity, Hint, Fields>[], number]> {
    return this.getEntityManager().findAndCount<Entity, Hint, Fields>(this.entityName, where, options);
  }

  /**
   * @inheritDoc EntityManager.findByCursor
   */
  async findByCursor<
    Hint extends string = never,
    Fields extends string = never,
  >(where: FilterQuery<Entity>, options?: FindByCursorOptions<Entity, Hint, Fields>): Promise<Cursor<Entity, Hint, Fields>> {
    return this.getEntityManager().findByCursor<Entity, Hint, Fields>(this.entityName, where, options);
  }

  /**
   * Finds all entities of given type. You can pass additional options via the `options` parameter.
   */
  async findAll<
    Hint extends string = never,
    Fields extends string = never,
  >(options?: FindOptions<Entity, Hint, Fields>): Promise<Loaded<Entity, Hint, Fields>[]> {
    return this.getEntityManager().find<Entity, Hint, Fields>(this.entityName, {} as FilterQuery<Entity>, options);
  }

  /**
   * @inheritDoc EntityManager.insert
   */
  async insert(data: Entity | EntityData<Entity>, options?: NativeInsertUpdateOptions<Entity>): Promise<Primary<Entity>> {
    return this.getEntityManager().insert<Entity>(this.entityName, data, options);
  }

  /**
   * @inheritDoc EntityManager.insert
   */
  async insertMany(data: Entity[] | EntityData<Entity>[], options?: NativeInsertUpdateOptions<Entity>): Promise<Primary<Entity>[]> {
    return this.getEntityManager().insertMany<Entity>(this.entityName, data, options);
  }

  /**
   * Fires native update query. Calling this has no side effects on the context (identity map).
   */
  async nativeUpdate(where: FilterQuery<Entity>, data: EntityData<Entity>, options?: UpdateOptions<Entity>): Promise<number> {
    return this.getEntityManager().nativeUpdate(this.entityName, where, data, options);
  }

  /**
   * Fires native delete query. Calling this has no side effects on the context (identity map).
   */
  async nativeDelete(where: FilterQuery<Entity>, options?: DeleteOptions<Entity>): Promise<number> {
    return this.getEntityManager().nativeDelete(this.entityName, where, options);
  }

  /**
   * Maps raw database result to an entity and merges it to this EntityManager.
   */
  map(result: EntityDictionary<Entity>, options?: { schema?: string }): Entity {
    return this.getEntityManager().map(this.entityName, result, options);
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
  getReference(id: Primary<Entity>, options?: GetReferenceOptions): Entity | Ref<Entity> | Reference<Entity> {
    return this.getEntityManager().getReference<Entity>(this.entityName, id, options);
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
  async populate<
    Hint extends string = never,
    Fields extends string = never,
  >(entities: Entity | Entity[], populate: AutoPath<Entity, Hint>[] | boolean, options?: EntityLoaderOptions<Entity, Hint, Fields>): Promise<Loaded<Entity, Hint, Fields>[]> {
    this.validateRepositoryType(entities, 'populate');
    return this.getEntityManager().populate(entities as Entity, populate, options);
  }

  /**
   * Creates new instance of given entity and populates it with given data.
   * The entity constructor will be used unless you provide `{ managed: true }` in the options parameter.
   * The constructor will be given parameters based on the defined constructor of the entity. If the constructor
   * parameter matches a property name, its value will be extracted from `data`. If no matching property exists,
   * the whole `data` parameter will be passed. This means we can also define `constructor(data: Partial<Entity>)` and
   * `em.create()` will pass the data into it (unless we have a property named `data` too).
   */
  create<Hint = never>(data: RequiredEntityData<Entity>, options?: CreateOptions): Entity {
    return this.getEntityManager().create(this.entityName, data, options);
  }

  /**
   * Shortcut for `wrap(entity).assign(data, { em })`
   */
  assign(entity: Entity, data: EntityData<Entity>, options?: AssignOptions): Entity {
    this.validateRepositoryType(entity, 'assign');
    return this.getEntityManager().assign(entity, data, options);
  }

  /**
   * Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
   * via second parameter. By default it will return already loaded entities without modifying them.
   */
  merge(data: Entity | EntityData<Entity>, options?: MergeOptions): Entity {
    return this.getEntityManager().merge<Entity>(this.entityName, data, options);
  }

  /**
   * Returns total number of entities matching your `where` query.
   */
  async count<Hint extends string = never>(where: FilterQuery<Entity> = {} as FilterQuery<Entity>, options: CountOptions<Entity, Hint> = {}): Promise<number> {
    return this.getEntityManager().count<Entity, Hint>(this.entityName, where, options);
  }

  /**
   * Returns the underlying EntityManager instance
   */
  getEntityManager(): EntityManager {
    return this.em;
  }

  protected validateRepositoryType(entities: Entity[] | Entity, method: string) {
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
