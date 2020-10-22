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

\+ **new EntityRepository**(`em`: [EntityManager](entitymanager.md), `entityName`: [EntityName](../index.md#entityname)&#60;T>): [EntityRepository](entityrepository.md)

*Defined in [packages/core/src/entity/EntityRepository.ts:7](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L7)*

#### Parameters:

Name | Type |
------ | ------ |
`em` | [EntityManager](entitymanager.md) |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |

**Returns:** [EntityRepository](entityrepository.md)

## Properties

### em

• `Protected` `Readonly` **em**: [EntityManager](entitymanager.md)

*Defined in [packages/core/src/entity/EntityRepository.ts:9](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L9)*

___

### entityName

• `Protected` `Readonly` **entityName**: [EntityName](../index.md#entityname)&#60;T>

*Defined in [packages/core/src/entity/EntityRepository.ts:10](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L10)*

## Methods

### assign

▸ **assign**(`entity`: T, `data`: [EntityData](../index.md#entitydata)&#60;T>): T

*Defined in [packages/core/src/entity/EntityRepository.ts:260](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L260)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:224](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L224)*

Checks whether given property can be populated on the entity.

#### Parameters:

Name | Type |
------ | ------ |
`property` | string |

**Returns:** boolean

___

### count

▸ **count**(`where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: [CountOptions](../interfaces/countoptions.md)&#60;T>): Promise&#60;number>

*Defined in [packages/core/src/entity/EntityRepository.ts:275](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L275)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:253](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L253)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:82](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L82)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:87](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L87)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:119](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L119)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:124](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L124)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:100](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L100)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:106](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L106)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:41](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L41)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:46](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L46)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:61](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L61)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:68](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L68)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:167](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L167)*

Flushes all changes to objects that have been queued up to now to the database.
This effectively synchronizes the in-memory state of managed objects with the database.
This method is a shortcut for `em.flush()`, in other words, it will flush the whole UoW,
not just entities registered via this particular repository.

**Returns:** Promise&#60;void>

___

### getReference

▸ **getReference**&#60;PK>(`id`: [Primary](../index.md#primary)&#60;T>, `wrapped`: true): [IdentifiedReference](../index.md#identifiedreference)&#60;T, PK>

*Defined in [packages/core/src/entity/EntityRepository.ts:202](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L202)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:207](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L207)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:212](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L212)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:195](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L195)*

Maps raw database result to an entity and merges it to this EntityManager.

#### Parameters:

Name | Type |
------ | ------ |
`result` | [EntityData](../index.md#entitydata)&#60;T> |

**Returns:** T

___

### merge

▸ **merge**(`data`: T \| [EntityData](../index.md#entitydata)&#60;T>, `refresh?`: boolean, `convertCustomTypes?`: boolean): T

*Defined in [packages/core/src/entity/EntityRepository.ts:268](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L268)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:188](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L188)*

Fires native delete query. Calling this has no side effects on the context (identity map).

#### Parameters:

Name | Type |
------ | ------ |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> \| any |

**Returns:** Promise&#60;number>

___

### nativeInsert

▸ **nativeInsert**(`data`: [EntityData](../index.md#entitydata)&#60;T>): Promise&#60;[Primary](../index.md#primary)&#60;T>>

*Defined in [packages/core/src/entity/EntityRepository.ts:174](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L174)*

Fires native insert query. Calling this has no side effects on the context (identity map).

#### Parameters:

Name | Type |
------ | ------ |
`data` | [EntityData](../index.md#entitydata)&#60;T> |

**Returns:** Promise&#60;[Primary](../index.md#primary)&#60;T>>

___

### nativeUpdate

▸ **nativeUpdate**(`where`: [FilterQuery](../index.md#filterquery)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>): Promise&#60;number>

*Defined in [packages/core/src/entity/EntityRepository.ts:181](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L181)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:16](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L16)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:24](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L24)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:34](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L34)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:231](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L231)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:236](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L236)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:241](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L241)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:139](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L139)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:147](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L147)*

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

*Defined in [packages/core/src/entity/EntityRepository.ts:157](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/entity/EntityRepository.ts#L157)*

Marks entity for removal.
A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.

**`deprecated`** use `remove()`

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) |

**Returns:** void
