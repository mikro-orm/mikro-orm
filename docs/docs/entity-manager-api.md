---
title: EntityManager API
---

#### `getDriver(): IDatabaseDriver`

Gets the Driver instance used by this EntityManager

----

#### `getConnection(type?: 'read' | 'write'): ReturnType<D['getConnection']>`

Gets the Connection instance, by default returns write connection

----

#### `getRepository(entityName: EntityName<T>): GetRepository<T, U>`

Returns `EntityRepository` for given entity, respects `customRepository` option of `@Entity`
and `entityRepository` option of `MikroORM.init()`.

----

#### `getValidator(): EntityValidator`

Gets EntityValidator instance

----

#### `find(entityName: EntityName<T>, where: FilterQuery<T>, options?: FindOptions<T, P>): Promise<Loaded<T, P>[]>`

Finds all entities matching your `where` query. You can pass additional options via the `options` parameter.

```typescript
export interface FindOptions<T, P extends Populate<T> = Populate<T>> {
  populate?: P;
  orderBy?: QueryOrderMap;
  limit?: number;
  offset?: number;
  refresh?: boolean;
  convertCustomTypes?: boolean;
  fields?: string[];
  schema?: string;
  flags?: QueryFlag[];
  groupBy?: string | string[];
  having?: QBFilterQuery<T>;
  strategy?: LoadStrategy;
  filters?: Dictionary<boolean | Dictionary> | string[] | boolean;
}
```

----

#### `find(entityName: EntityName<T>, where: FilterQuery<T>, populate?: P, orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<Loaded<T, P>[]>`

Finds all entities matching your `where` query.
Same as previous `find` method, just with dedicated parameters for `populate`, `orderBy`, `limit`
and `offset`.

----

#### `addFilter(name: string, cond: FilterQuery<T> | ((args: Dictionary) => FilterQuery<T>), entityName?: EntityName<T>[], enabled?: boolean): void`

----

#### `setFilterParams(name: string, args: Dictionary): void`

----

#### `getFilterParams<T extends Dictionary = Dictionary>(name: string): T`

----

#### `findAndCount(entityName: EntityName<T>, where: FilterQuery<T>, options?: FindOptions<T, P>): Promise<[Loaded<T, P>[], number]>`

Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
where first element is the array of entities and the second is the count.

----

#### `findAndCount(entityName: EntityName<T>, where: FilterQuery<T>, populate?: P, orderBy?: QueryOrderMap, limit?: number, offset?: number): Promise<[Loaded<T, P>[], number]>`

Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
where first element is the array of entities and the second is the count.

----

#### `findOne(entityName: EntityName<T>, where: FilterQuery<T>, options?: FindOneOptions<T, P>): Promise<Loaded<T, P> | null>`

Finds first entity matching your `where` query.

----

#### `findOne(entityName: EntityName<T>, where: FilterQuery<T>, populate?: P, orderBy?: QueryOrderMap): Promise<Loaded<T, P> | null>`

Finds first entity matching your `where` query.

----

#### `findOneOrFail(entityName: EntityName<T>, where: FilterQuery<T>, options?: FindOneOrFailOptions<T, P>): Promise<Loaded<T, P>>`

Finds first entity matching your `where` query. If nothing found, it will throw an error.
You can override the factory for creating this method via `options.failHandler` locally
or via `Configuration.findOneOrFailHandler` globally.

Finds first entity matching your `where` query. If nothing found, it will throw an error.

----

#### `findOneOrFail(entityName: EntityName<T>, where: FilterQuery<T>, populate?: P, orderBy?: QueryOrderMap): Promise<Loaded<T, P>>`

You can override the factory for creating this method via `options.failHandler` locally
or via `Configuration.findOneOrFailHandler` globally.

----

#### `transactional(cb: (em: D[typeof EntityManagerType]) => Promise<T>, ctx?: any): Promise<T>`

Runs your callback wrapped inside a database transaction.

----

#### `begin(ctx?: Transaction): Promise<void>`

Starts new transaction bound to this EntityManager. Use `ctx` parameter to provide the parent when nesting transactions.

----

#### `commit(): Promise<void>`

Commits the transaction bound to this EntityManager. Flushes before doing the actual commit query.

----

#### `rollback(): Promise<void>`

Rollbacks the transaction bound to this EntityManager.

----

#### `lock(entity: AnyEntity, lockMode: LockMode, lockVersion?: number | Date): Promise<void>`

Runs your callback wrapped inside a database transaction.

----

#### `nativeInsert(entity: T): Promise<Primary<T>>`

Fires native insert query. Calling this has no side effects on the context (identity map).

----

#### `nativeInsert(entityName: EntityName<T>, data: EntityData<T>): Promise<Primary<T>>`

Fires native insert query. Calling this has no side effects on the context (identity map).

----

#### `nativeUpdate(entityName: EntityName<T>, where: FilterQuery<T>, data: EntityData<T>, options?: UpdateOptions<T>): Promise<number>`

Fires native update query. Calling this has no side effects on the context (identity map).

----

#### `nativeDelete(entityName: EntityName<T>, where: FilterQuery<T>, options?: DeleteOptions<T>): Promise<number>`

Fires native delete query. Calling this has no side effects on the context (identity map).

----

#### `map(entityName: EntityName<T>, result: EntityData<T>): T`

Maps raw DB result to entity, adding it to current Identity Map. Equivalent to 
`driver.mapResult()` followed by `em.merge()`.

----

#### `merge(entity: T, refresh?: boolean): T`

Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
via second parameter. By default it will return already loaded entities without modifying them.

This is useful when you want to work with cached entities. 

----

#### `merge(entityName: EntityName<T>, data: EntityData<T>, refresh?: boolean, convertCustomTypes?: boolean): T`

Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
via second parameter. By default it will return already loaded entities without modifying them.

----

#### `create(entityName: EntityName<T>, data: EntityData<T>): New<T, P>`

Creates new instance of given entity and populates it with given data

----

#### `assign(entity: T, data: EntityData<T>, options?: AssignOptions): T`

Shortcut for `wrap(entity).assign(data, { em })`

----

#### `getReference(entityName: EntityName<T>, id: Primary<T>, options?: GetReferenceOptions): T | Reference<T>`

Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded.

----

#### `count(entityName: EntityName<T>, where?: FilterQuery<T>, options?: CountOptions<T>): Promise<number>`

Returns total number of entities matching your `where` query.

----

#### `persist(entity: AnyEntity | Reference<AnyEntity> | (AnyEntity | Reference<AnyEntity>)[]): this`

Tells the EntityManager to make an instance managed and persistent.
The entity will be entered into the database at or before transaction commit or as a result of the flush operation.

----

#### `persistAndFlush(entity: AnyEntity | Reference<AnyEntity> | (AnyEntity | Reference<AnyEntity>)[]): Promise<void>`

Persists your entity immediately, flushing all not yet persisted changes to the database too.
Equivalent to `em.persist(e).flush()`.

----

#### `persistLater(entity: AnyEntity | AnyEntity[]): void`

> deprecated, use `persist()`

Tells the EntityManager to make an instance managed and persistent.
The entity will be entered into the database at or before transaction commit or as a result of the flush operation.

----

#### `remove(entity: T | Reference<T> | (T | Reference<T>)[]): this`

Marks entity for removal.
A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.

This method fires `beforeDelete` and `afterDelete` hooks.  

To remove entities by condition, use `em.nativeDelete()`.

----

#### `removeAndFlush(entity: AnyEntity | Reference<AnyEntity>): Promise<void>`

Removes an entity instance immediately, flushing all not yet persisted changes to the database too.
Equivalent to `em.remove(e).flush()`

This method fires `beforeDelete` and `afterDelete` hooks.  

----

#### `removeLater(entity: AnyEntity): void`

> deprecated use `remove()`

Marks entity for removal.
A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.

----

#### `flush(): Promise<void>`

Flushes all changes to objects that have been queued up to now to the database.
This effectively synchronizes the in-memory state of managed objects with the database.

----

#### `clear(): void`

Clears the EntityManager. All entities that are currently managed by this EntityManager become detached.

----

#### `canPopulate(entityName: EntityName<T>, property: string): boolean`

Checks whether given property can be populated on the entity.

----

#### `populate(entities: T | T[], populate: P, where?: FilterQuery<T>, orderBy?: QueryOrderMap, refresh?: boolean, validate?: boolean): Promise<Loaded<T, P> | Loaded<T, P>[]>`

Populate existing entities. Supports nested (conditional) populating.

----

#### `fork(clear?: boolean, useContext?: boolean): D[typeof EntityManagerType]`

Returns new EntityManager instance with its own identity map

```
@param clear do we want clear identity map? defaults to true
@param useContext use request context? should be used only for top level request scope EM, defaults to false
```

----

#### `getUnitOfWork(): UnitOfWork`

Gets the UnitOfWork used by the EntityManager to coordinate operations.

----

#### `getEntityFactory(): EntityFactory`

Gets the EntityFactory used by the EntityManager.

----

#### `getEventManager(): EventManager`

----

#### `isInTransaction(): boolean`

Checks whether this EntityManager is currently operating inside a database transaction.

----

#### `getTransactionContext<T extends Transaction = Transaction>(): T | undefined`

Gets the transaction context (driver dependent object used to make sure queries are executed on same connection).

----

#### `getMetadata(): MetadataStorage`

Gets the MetadataStorage.

----

#### `getComparator(): EntityComparator`

----
