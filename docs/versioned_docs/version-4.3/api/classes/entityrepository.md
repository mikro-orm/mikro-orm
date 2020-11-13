---
id: "entityrepository"
title: "Class: EntityRepository<T>"
sidebar_label: "EntityRepository"
---

## Type parameters

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

## Hierarchy

* **EntityRepository**

## Constructors

### constructor

\+ **new EntityRepository**(`_em`: [EntityManager](entitymanager.md), `entityName`: [EntityName](../index.md#entityname)&#60;T>): [EntityRepository](entityrepository.md)

*Defined in [packages/core/src/entity/EntityRepository.ts:7](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L7)*

#### Parameters:

Name | Type |
------ | ------ |
`_em` | [EntityManager](entitymanager.md) |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |

**Returns:** [EntityRepository](entityrepository.md)

## Properties

### \_em

• `Protected` `Readonly` **\_em**: [EntityManager](entitymanager.md)

*Defined in [packages/core/src/entity/EntityRepository.ts:9](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L9)*

___

### entityName

• `Protected` `Readonly` **entityName**: [EntityName](../index.md#entityname)&#60;T>

*Defined in [packages/core/src/entity/EntityRepository.ts:10](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L10)*

## Accessors

### em

• `Protected`get **em**(): [EntityManager](entitymanager.md)

*Defined in [packages/core/src/entity/EntityRepository.ts:278](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L278)*

**Returns:** [EntityManager](entitymanager.md)

## Methods

### assign

▸ **assign**(`entity`: T, `data`: [EntityData](../index.md#entitydata)&#60;T>): T

*Defined in [packages/core/src/entity/EntityRepository.ts:259](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L259)*

Shortcut for `wrap(entity).assign(data, { em })`

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`data` | [EntityData](../index.md#entitydata)&#60;T> |

**Returns:** T

___

### canPopulate

▸ **canPopulate**(`property`: string): boolean

*Defined in [packages/core/src/entity/EntityRepository.ts:223](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L223)*

Checks whether given property can be populated on the entity.

#### Parameters:

Name | Type |
------ | ------ |
`property` | string |

**Returns:** boolean

___

### count

▸ **count**(`where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: [CountOptions](../interfaces/countoptions.md)&#60;T>): Promise&#60;number>

*Defined in [packages/core/src/entity/EntityRepository.ts:274](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L274)*

Returns total number of entities matching your `where` query.

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> | {} |
`options` | [CountOptions](../interfaces/countoptions.md)&#60;T> | {} |

**Returns:** Promise&#60;number>

___

### create

▸ **create**&#60;P>(`data`: [EntityData](../index.md#entitydata)&#60;T>): [New](../index.md#new)&#60;T, P>

*Defined in [packages/core/src/entity/EntityRepository.ts:252](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L252)*

Creates new instance of given entity and populates it with given data

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`P` | [Populate](../index.md#populate)&#60;T> | string[] |

#### Parameters:

Name | Type |
------ | ------ |
`data` | [EntityData](../index.md#entitydata)&#60;T> |

**Returns:** [New](../index.md#new)&#60;T, P>

___

### find

▸ **find**&#60;P>(`where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: [FindOptions](../interfaces/findoptions.md)&#60;T, P>): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

*Defined in [packages/core/src/entity/EntityRepository.ts:81](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L81)*

Finds all entities matching your `where` query. You can pass additional options via the `options` parameter.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`options?` | [FindOptions](../interfaces/findoptions.md)&#60;T, P> |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

▸ **find**&#60;P>(`where`: [FilterQuery](../index.md#filterquery)&#60;T>, `populate?`: P, `orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md), `limit?`: number, `offset?`: number): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

*Defined in [packages/core/src/entity/EntityRepository.ts:86](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L86)*

Finds all entities matching your `where` query.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`populate?` | P |
`orderBy?` | [QueryOrderMap](../interfaces/queryordermap.md) |
`limit?` | number |
`offset?` | number |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

___

### findAll

▸ **findAll**&#60;P>(`options?`: [FindOptions](../interfaces/findoptions.md)&#60;T, P>): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

*Defined in [packages/core/src/entity/EntityRepository.ts:118](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L118)*

Finds all entities of given type. You can pass additional options via the `options` parameter.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`options?` | [FindOptions](../interfaces/findoptions.md)&#60;T, P> |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

▸ **findAll**&#60;P>(`populate?`: P, `orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md), `limit?`: number, `offset?`: number): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

*Defined in [packages/core/src/entity/EntityRepository.ts:123](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L123)*

Finds all entities of given type.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`populate?` | P |
`orderBy?` | [QueryOrderMap](../interfaces/queryordermap.md) |
`limit?` | number |
`offset?` | number |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

___

### findAndCount

▸ **findAndCount**&#60;P>(`where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: [FindOptions](../interfaces/findoptions.md)&#60;T>): Promise&#60;[[Loaded](../index.md#loaded)&#60;T, P>[], number]>

*Defined in [packages/core/src/entity/EntityRepository.ts:99](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L99)*

Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
where first element is the array of entities and the second is the count.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`options?` | [FindOptions](../interfaces/findoptions.md)&#60;T> |

**Returns:** Promise&#60;[[Loaded](../index.md#loaded)&#60;T, P>[], number]>

▸ **findAndCount**&#60;P>(`where`: [FilterQuery](../index.md#filterquery)&#60;T>, `populate?`: P, `orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md), `limit?`: number, `offset?`: number): Promise&#60;[[Loaded](../index.md#loaded)&#60;T, P>[], number]>

*Defined in [packages/core/src/entity/EntityRepository.ts:105](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L105)*

Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
where first element is the array of entities and the second is the count.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`populate?` | P |
`orderBy?` | [QueryOrderMap](../interfaces/queryordermap.md) |
`limit?` | number |
`offset?` | number |

**Returns:** Promise&#60;[[Loaded](../index.md#loaded)&#60;T, P>[], number]>

___

### findOne

▸ **findOne**&#60;P>(`where`: [FilterQuery](../index.md#filterquery)&#60;T>, `populate?`: P, `orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md)): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| null>

*Defined in [packages/core/src/entity/EntityRepository.ts:41](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L41)*

Finds first entity matching your `where` query.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`populate?` | P |
`orderBy?` | [QueryOrderMap](../interfaces/queryordermap.md) |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| null>

▸ **findOne**&#60;P>(`where`: [FilterQuery](../index.md#filterquery)&#60;T>, `populate?`: [FindOneOptions](../interfaces/findoneoptions.md)&#60;T, P>, `orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md)): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| null>

*Defined in [packages/core/src/entity/EntityRepository.ts:46](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L46)*

Finds first entity matching your `where` query.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`populate?` | [FindOneOptions](../interfaces/findoneoptions.md)&#60;T, P> |
`orderBy?` | [QueryOrderMap](../interfaces/queryordermap.md) |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| null>

___

### findOneOrFail

▸ **findOneOrFail**&#60;P>(`where`: [FilterQuery](../index.md#filterquery)&#60;T>, `populate?`: P, `orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md)): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

*Defined in [packages/core/src/entity/EntityRepository.ts:60](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L60)*

Finds first entity matching your `where` query. If nothing found, it will throw an error.
You can override the factory for creating this method via `options.failHandler` locally
or via `Configuration.findOneOrFailHandler` globally.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`populate?` | P |
`orderBy?` | [QueryOrderMap](../interfaces/queryordermap.md) |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

▸ **findOneOrFail**&#60;P>(`where`: [FilterQuery](../index.md#filterquery)&#60;T>, `populate?`: [FindOneOrFailOptions](../interfaces/findoneorfailoptions.md)&#60;T, P>, `orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md)): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

*Defined in [packages/core/src/entity/EntityRepository.ts:67](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L67)*

Finds first entity matching your `where` query. If nothing found, it will throw an error.
You can override the factory for creating this method via `options.failHandler` locally
or via `Configuration.findOneOrFailHandler` globally.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`populate?` | [FindOneOrFailOptions](../interfaces/findoneorfailoptions.md)&#60;T, P> |
`orderBy?` | [QueryOrderMap](../interfaces/queryordermap.md) |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

___

### flush

▸ **flush**(): Promise&#60;void>

*Defined in [packages/core/src/entity/EntityRepository.ts:166](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L166)*

Flushes all changes to objects that have been queued up to now to the database.
This effectively synchronizes the in-memory state of managed objects with the database.
This method is a shortcut for `em.flush()`, in other words, it will flush the whole UoW,
not just entities registered via this particular repository.

**Returns:** Promise&#60;void>

___

### getReference

▸ **getReference**&#60;PK>(`id`: [Primary](../index.md#primary)&#60;T>, `wrapped`: true): [IdentifiedReference](../index.md#identifiedreference)&#60;T, PK>

*Defined in [packages/core/src/entity/EntityRepository.ts:201](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L201)*

Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded

#### Type parameters:

Name | Type |
------ | ------ |
`PK` | keyof T |

#### Parameters:

Name | Type |
------ | ------ |
`id` | [Primary](../index.md#primary)&#60;T> |
`wrapped` | true |

**Returns:** [IdentifiedReference](../index.md#identifiedreference)&#60;T, PK>

▸ **getReference**&#60;PK>(`id`: [Primary](../index.md#primary)&#60;T>): T

*Defined in [packages/core/src/entity/EntityRepository.ts:206](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L206)*

Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`PK` | keyof T | keyof T |

#### Parameters:

Name | Type |
------ | ------ |
`id` | [Primary](../index.md#primary)&#60;T> |

**Returns:** T

▸ **getReference**&#60;PK>(`id`: [Primary](../index.md#primary)&#60;T>, `wrapped`: false): T

*Defined in [packages/core/src/entity/EntityRepository.ts:211](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L211)*

Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`PK` | keyof T | keyof T |

#### Parameters:

Name | Type |
------ | ------ |
`id` | [Primary](../index.md#primary)&#60;T> |
`wrapped` | false |

**Returns:** T

___

### map

▸ **map**(`result`: [EntityData](../index.md#entitydata)&#60;T>): T

*Defined in [packages/core/src/entity/EntityRepository.ts:194](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L194)*

Maps raw database result to an entity and merges it to this EntityManager.

#### Parameters:

Name | Type |
------ | ------ |
`result` | [EntityData](../index.md#entitydata)&#60;T> |

**Returns:** T

___

### merge

▸ **merge**(`data`: T \| [EntityData](../index.md#entitydata)&#60;T>, `refresh?`: boolean, `convertCustomTypes?`: boolean): T

*Defined in [packages/core/src/entity/EntityRepository.ts:267](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L267)*

Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
via second parameter. By default it will return already loaded entities without modifying them.

#### Parameters:

Name | Type |
------ | ------ |
`data` | T \| [EntityData](../index.md#entitydata)&#60;T> |
`refresh?` | boolean |
`convertCustomTypes?` | boolean |

**Returns:** T

___

### nativeDelete

▸ **nativeDelete**(`where`: [FilterQuery](../index.md#filterquery)&#60;T> \| any): Promise&#60;number>

*Defined in [packages/core/src/entity/EntityRepository.ts:187](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L187)*

Fires native delete query. Calling this has no side effects on the context (identity map).

#### Parameters:

Name | Type |
------ | ------ |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> \| any |

**Returns:** Promise&#60;number>

___

### nativeInsert

▸ **nativeInsert**(`data`: [EntityData](../index.md#entitydata)&#60;T>): Promise&#60;[Primary](../index.md#primary)&#60;T>>

*Defined in [packages/core/src/entity/EntityRepository.ts:173](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L173)*

Fires native insert query. Calling this has no side effects on the context (identity map).

#### Parameters:

Name | Type |
------ | ------ |
`data` | [EntityData](../index.md#entitydata)&#60;T> |

**Returns:** Promise&#60;[Primary](../index.md#primary)&#60;T>>

___

### nativeUpdate

▸ **nativeUpdate**(`where`: [FilterQuery](../index.md#filterquery)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>): Promise&#60;number>

*Defined in [packages/core/src/entity/EntityRepository.ts:180](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L180)*

Fires native update query. Calling this has no side effects on the context (identity map).

#### Parameters:

Name | Type |
------ | ------ |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`data` | [EntityData](../index.md#entitydata)&#60;T> |

**Returns:** Promise&#60;number>

___

### persist

▸ **persist**(`entity`: [AnyEntity](../index.md#anyentity) \| [AnyEntity](../index.md#anyentity)[]): [EntityManager](entitymanager.md)

*Defined in [packages/core/src/entity/EntityRepository.ts:16](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L16)*

Tells the EntityManager to make an instance managed and persistent.
The entity will be entered into the database at or before transaction commit or as a result of the flush operation.

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) \| [AnyEntity](../index.md#anyentity)[] |

**Returns:** [EntityManager](entitymanager.md)

___

### persistAndFlush

▸ **persistAndFlush**(`entity`: [AnyEntity](../index.md#anyentity) \| [AnyEntity](../index.md#anyentity)[]): Promise&#60;void>

*Defined in [packages/core/src/entity/EntityRepository.ts:24](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L24)*

Persists your entity immediately, flushing all not yet persisted changes to the database too.
Equivalent to `em.persist(e).flush()`.

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) \| [AnyEntity](../index.md#anyentity)[] |

**Returns:** Promise&#60;void>

___

### persistLater

▸ **persistLater**(`entity`: [AnyEntity](../index.md#anyentity) \| [AnyEntity](../index.md#anyentity)[]): void

*Defined in [packages/core/src/entity/EntityRepository.ts:34](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L34)*

Tells the EntityManager to make an instance managed and persistent.
The entity will be entered into the database at or before transaction commit or as a result of the flush operation.

**`deprecated`** use `persist()`

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) \| [AnyEntity](../index.md#anyentity)[] |

**Returns:** void

___

### populate

▸ **populate**&#60;P>(`entities`: T, `populate`: P, `where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md), `refresh?`: boolean, `validate?`: boolean): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

*Defined in [packages/core/src/entity/EntityRepository.ts:230](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L230)*

Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.

#### Type parameters:

Name | Type |
------ | ------ |
`P` | string \| keyof T \| [Populate](../index.md#populate)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entities` | T |
`populate` | P |
`where?` | [FilterQuery](../index.md#filterquery)&#60;T> |
`orderBy?` | [QueryOrderMap](../interfaces/queryordermap.md) |
`refresh?` | boolean |
`validate?` | boolean |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

▸ **populate**&#60;P>(`entities`: T[], `populate`: P, `where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md), `refresh?`: boolean, `validate?`: boolean): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

*Defined in [packages/core/src/entity/EntityRepository.ts:235](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L235)*

Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.

#### Type parameters:

Name | Type |
------ | ------ |
`P` | string \| keyof T \| [Populate](../index.md#populate)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entities` | T[] |
`populate` | P |
`where?` | [FilterQuery](../index.md#filterquery)&#60;T> |
`orderBy?` | [QueryOrderMap](../interfaces/queryordermap.md) |
`refresh?` | boolean |
`validate?` | boolean |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

▸ **populate**&#60;P>(`entities`: T \| T[], `populate`: P, `where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md), `refresh?`: boolean, `validate?`: boolean): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| [Loaded](../index.md#loaded)&#60;T, P>[]>

*Defined in [packages/core/src/entity/EntityRepository.ts:240](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L240)*

Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.

#### Type parameters:

Name | Type |
------ | ------ |
`P` | string \| keyof T \| [Populate](../index.md#populate)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entities` | T \| T[] |
`populate` | P |
`where?` | [FilterQuery](../index.md#filterquery)&#60;T> |
`orderBy?` | [QueryOrderMap](../interfaces/queryordermap.md) |
`refresh?` | boolean |
`validate?` | boolean |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| [Loaded](../index.md#loaded)&#60;T, P>[]>

___

### remove

▸ **remove**(`entity`: [AnyEntity](../index.md#anyentity)): [EntityManager](entitymanager.md)

*Defined in [packages/core/src/entity/EntityRepository.ts:138](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L138)*

Marks entity for removal.
A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.

To remove entities by condition, use `em.nativeDelete()`.

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) |

**Returns:** [EntityManager](entitymanager.md)

___

### removeAndFlush

▸ **removeAndFlush**(`entity`: [AnyEntity](../index.md#anyentity)): Promise&#60;void>

*Defined in [packages/core/src/entity/EntityRepository.ts:146](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L146)*

Removes an entity instance immediately, flushing all not yet persisted changes to the database too.
Equivalent to `em.remove(e).flush()`

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) |

**Returns:** Promise&#60;void>

___

### removeLater

▸ **removeLater**(`entity`: [AnyEntity](../index.md#anyentity)): void

*Defined in [packages/core/src/entity/EntityRepository.ts:156](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/entity/EntityRepository.ts#L156)*

Marks entity for removal.
A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.

**`deprecated`** use `remove()`

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) |

**Returns:** void
