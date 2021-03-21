---
title: EntityRepository API
---

#### `find(where: FilterQuery<T>, options?: FindOptions): Promise<T[]>`

Returns array of entities found for given condition. You can specify `FindOptions` to request
population of referenced entities or control the pagination:

```typescript
export interface FindOptions {
  populate?: string[];
  orderBy?: { [k: string]: QueryOrder };
  limit?: number;
  offset?: number;
  schema?: string;
}
```

---

#### `find(where: FilterQuery<T>, populate?: string[], orderBy?: { [k: string]: QueryOrder }, limit?: number, offset?: number): Promise<T[]>`

Same as previous `find` method, just with dedicated parameters for `populate`, `orderBy`, `limit`
and `offset`.

---

#### `findAndCount(where: FilterQuery<T>, populate?: string[], orderBy?: { [k: string]: QueryOrder }, limit?: number, offset?: number): Promise<T[]>`

Combination of `find` and `count` methods. 

---

#### `findAll(options?: FindOptions): Promise<T[]>`

Returns all entities for given type. 

---

#### `findAll(populate?: string[], orderBy?: { [k: string]: QueryOrder }, limit?: number, offset?: number): Promise<T[]>`

Same as previous `findAll` method, just with dedicated parameters for `populate`, `orderBy`, `limit`
and `offset`.

---

#### `findOne(where: FilterQuery<T> | string, populate?: string[]): Promise<T | null>`

Finds an entity by given `where` condition. You can use primary key as `where` value, then
if the entity is already managed, no database call will be made. 

---

#### `findOneOrFail(where: FilterQuery<T> | string, populate?: string[]): Promise<T>`

Just like `findOne`, but throws when entity not found, so it always resolves to given entity. 
You can customize the error either globally via `findOneOrFailHandler` option, or locally via 
`failHandler` option in `findOneOrFail` call.

---

#### `merge(data: EntityData<T>): T`

Adds given entity to current Identity Map. After merging, entity becomes managed. 
This is useful when you want to work with cached entities. 

---

#### `getReference(id: string): T`

Gets a reference to the entity identified by the given type and identifier without actually 
loading it, if the entity is not yet loaded.

---

#### `count(where?: FilterQuery<T>): Promise<number>`

Gets count of entities matching the `where` condition. 

---

#### `persist(entity: AnyEntity | AnyEntity[]): Promise<void>`

Tells the EntityManager to make an instance managed and persistent. The entity will be 
entered into the database at or before transaction commit or as a result of the flush 
operation. 

---

#### `persistAndFlush(entity: AnyEntity | AnyEntity[]): Promise<void>`

Shortcut for `persist` & `flush`.

---

#### `persistLater(entity: AnyEntity | AnyEntity[]): void`

Shortcut for just `persist`, without flushing. Deprecated, use `em.persist()`.

---

#### `flush(): Promise<void>`

Flushes all changes to objects that have been queued up to now to the database.

---

#### `remove(where: AnyEntity | Reference<AnyEntity> | (AnyEntity | Reference<AnyEntity>)[]): Promise<void>`

It queues entity for removal when flush or commit is called.

This method fires `beforeDelete` and `afterDelete` hooks.

---

#### `removeAndFlush(entity: AnyEntity): Promise<void>`

Shortcut for `remove` & `flush`.

This method fires `beforeDelete` and `afterDelete` hooks. 

---

#### `removeLater(entity: AnyEntity): void`

Shortcut for `remove` without flushing. Deprecated, use `em.remove()`.

This method fires `beforeDelete` and `afterDelete` hooks. 

---

#### `canPopulate(property: string): boolean`

Returns whether given entity has given property which can be populated (is reference or
collection).

---
