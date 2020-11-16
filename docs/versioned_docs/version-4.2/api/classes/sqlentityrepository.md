---
id: "sqlentityrepository"
title: "Class: SqlEntityRepository<T>"
sidebar_label: "SqlEntityRepository"
---

## Type parameters

Name |
------ |
`T` |

## Hierarchy

* EntityRepository&#60;T>

  ↳ **SqlEntityRepository**

## Constructors

### constructor

\+ **new SqlEntityRepository**(`em`: [SqlEntityManager](sqlentitymanager.md), `entityName`: [EntityName](../index.md#entityname)&#60;T>): [SqlEntityRepository](sqlentityrepository.md)

*Overrides void*

*Defined in [packages/knex/src/SqlEntityRepository.ts:6](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/SqlEntityRepository.ts#L6)*

#### Parameters:

Name | Type |
------ | ------ |
`em` | [SqlEntityManager](sqlentitymanager.md) |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |

**Returns:** [SqlEntityRepository](sqlentityrepository.md)

## Properties

### em

• `Protected` `Readonly` **em**: [SqlEntityManager](sqlentitymanager.md)

*Overrides void*

*Defined in [packages/knex/src/SqlEntityRepository.ts:8](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/SqlEntityRepository.ts#L8)*

___

### entityName

• `Protected` `Readonly` **entityName**: [EntityName](../index.md#entityname)&#60;T>

*Overrides void*

*Defined in [packages/knex/src/SqlEntityRepository.ts:9](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/SqlEntityRepository.ts#L9)*

## Methods

### assign

▸ **assign**(`entity`: T, `data`: [EntityData](../index.md#entitydata)&#60;T>): T

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[assign](sqlentityrepository.md#assign)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:150*

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

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[canPopulate](sqlentityrepository.md#canpopulate)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:130*

Checks whether given property can be populated on the entity.

#### Parameters:

Name | Type |
------ | ------ |
`property` | string |

**Returns:** boolean

___

### count

▸ **count**(`where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: CountOptions&#60;T>): Promise&#60;number>

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[count](sqlentityrepository.md#count)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:159*

Returns total number of entities matching your `where` query.

#### Parameters:

Name | Type |
------ | ------ |
`where?` | [FilterQuery](../index.md#filterquery)&#60;T> |
`options?` | CountOptions&#60;T> |

**Returns:** Promise&#60;number>

___

### create

▸ **create**&#60;P>(`data`: [EntityData](../index.md#entitydata)&#60;T>): [New](../index.md#new)&#60;T, P>

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[create](sqlentityrepository.md#create)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:146*

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

### createQueryBuilder

▸ **createQueryBuilder**(`alias?`: string): [QueryBuilder](querybuilder.md)&#60;T>

*Defined in [packages/knex/src/SqlEntityRepository.ts:16](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/SqlEntityRepository.ts#L16)*

Creates a QueryBuilder instance

#### Parameters:

Name | Type |
------ | ------ |
`alias?` | string |

**Returns:** [QueryBuilder](querybuilder.md)&#60;T>

___

### find

▸ **find**&#60;P>(`where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: FindOptions&#60;T, P>): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[find](sqlentityrepository.md#find)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:50*

Finds all entities matching your `where` query. You can pass additional options via the `options` parameter.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`options?` | FindOptions&#60;T, P> |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

▸ **find**&#60;P>(`where`: [FilterQuery](../index.md#filterquery)&#60;T>, `populate?`: P, `orderBy?`: QueryOrderMap, `limit?`: number, `offset?`: number): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[find](sqlentityrepository.md#find)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:54*

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
`orderBy?` | QueryOrderMap |
`limit?` | number |
`offset?` | number |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

___

### findAll

▸ **findAll**&#60;P>(`options?`: FindOptions&#60;T, P>): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[findAll](sqlentityrepository.md#findall)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:68*

Finds all entities of given type. You can pass additional options via the `options` parameter.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`options?` | FindOptions&#60;T, P> |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

▸ **findAll**&#60;P>(`populate?`: P, `orderBy?`: QueryOrderMap, `limit?`: number, `offset?`: number): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[findAll](sqlentityrepository.md#findall)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:72*

Finds all entities of given type.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`populate?` | P |
`orderBy?` | QueryOrderMap |
`limit?` | number |
`offset?` | number |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

___

### findAndCount

▸ **findAndCount**&#60;P>(`where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: FindOptions&#60;T>): Promise&#60;[[Loaded](../index.md#loaded)&#60;T, P>[], number]>

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[findAndCount](sqlentityrepository.md#findandcount)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:59*

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
`options?` | FindOptions&#60;T> |

**Returns:** Promise&#60;[[Loaded](../index.md#loaded)&#60;T, P>[], number]>

▸ **findAndCount**&#60;P>(`where`: [FilterQuery](../index.md#filterquery)&#60;T>, `populate?`: P, `orderBy?`: QueryOrderMap, `limit?`: number, `offset?`: number): Promise&#60;[[Loaded](../index.md#loaded)&#60;T, P>[], number]>

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[findAndCount](sqlentityrepository.md#findandcount)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:64*

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
`orderBy?` | QueryOrderMap |
`limit?` | number |
`offset?` | number |

**Returns:** Promise&#60;[[Loaded](../index.md#loaded)&#60;T, P>[], number]>

___

### findOne

▸ **findOne**&#60;P>(`where`: [FilterQuery](../index.md#filterquery)&#60;T>, `populate?`: P, `orderBy?`: QueryOrderMap): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| null>

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[findOne](sqlentityrepository.md#findone)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:30*

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
`orderBy?` | QueryOrderMap |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| null>

▸ **findOne**&#60;P>(`where`: [FilterQuery](../index.md#filterquery)&#60;T>, `populate?`: FindOneOptions&#60;T, P>, `orderBy?`: QueryOrderMap): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| null>

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[findOne](sqlentityrepository.md#findone)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:34*

Finds first entity matching your `where` query.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`populate?` | FindOneOptions&#60;T, P> |
`orderBy?` | QueryOrderMap |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| null>

___

### findOneOrFail

▸ **findOneOrFail**&#60;P>(`where`: [FilterQuery](../index.md#filterquery)&#60;T>, `populate?`: P, `orderBy?`: QueryOrderMap): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[findOneOrFail](sqlentityrepository.md#findoneorfail)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:40*

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
`orderBy?` | QueryOrderMap |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

▸ **findOneOrFail**&#60;P>(`where`: [FilterQuery](../index.md#filterquery)&#60;T>, `populate?`: FindOneOrFailOptions&#60;T, P>, `orderBy?`: QueryOrderMap): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[findOneOrFail](sqlentityrepository.md#findoneorfail)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:46*

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
`populate?` | FindOneOrFailOptions&#60;T, P> |
`orderBy?` | QueryOrderMap |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

___

### flush

▸ **flush**(): Promise&#60;void>

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[flush](sqlentityrepository.md#flush)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:98*

Flushes all changes to objects that have been queued up to now to the database.
This effectively synchronizes the in-memory state of managed objects with the database.
This method is a shortcut for `em.flush()`, in other words, it will flush the whole UoW,
not just entities registered via this particular repository.

**Returns:** Promise&#60;void>

___

### getKnex

▸ **getKnex**(`type?`: &#34;read&#34; \| &#34;write&#34;): Knex

*Defined in [packages/knex/src/SqlEntityRepository.ts:23](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/SqlEntityRepository.ts#L23)*

Returns configured knex instance.

#### Parameters:

Name | Type |
------ | ------ |
`type?` | &#34;read&#34; \| &#34;write&#34; |

**Returns:** Knex

___

### getReference

▸ **getReference**&#60;PK>(`id`: [Primary](../index.md#primary)&#60;T>, `wrapped`: true): [IdentifiedReference](../index.md#identifiedreference)&#60;T, PK>

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[getReference](sqlentityrepository.md#getreference)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:118*

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

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[getReference](sqlentityrepository.md#getreference)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:122*

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

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[getReference](sqlentityrepository.md#getreference)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:126*

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

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[map](sqlentityrepository.md#map)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:114*

Maps raw database result to an entity and merges it to this EntityManager.

#### Parameters:

Name | Type |
------ | ------ |
`result` | [EntityData](../index.md#entitydata)&#60;T> |

**Returns:** T

___

### merge

▸ **merge**(`data`: T \| [EntityData](../index.md#entitydata)&#60;T>, `refresh?`: boolean, `convertCustomTypes?`: boolean): T

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[merge](sqlentityrepository.md#merge)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:155*

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

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[nativeDelete](sqlentityrepository.md#nativedelete)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:110*

Fires native delete query. Calling this has no side effects on the context (identity map).

#### Parameters:

Name | Type |
------ | ------ |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> \| any |

**Returns:** Promise&#60;number>

___

### nativeInsert

▸ **nativeInsert**(`data`: [EntityData](../index.md#entitydata)&#60;T>): Promise&#60;[Primary](../index.md#primary)&#60;T>>

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[nativeInsert](sqlentityrepository.md#nativeinsert)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:102*

Fires native insert query. Calling this has no side effects on the context (identity map).

#### Parameters:

Name | Type |
------ | ------ |
`data` | [EntityData](../index.md#entitydata)&#60;T> |

**Returns:** Promise&#60;[Primary](../index.md#primary)&#60;T>>

___

### nativeUpdate

▸ **nativeUpdate**(`where`: [FilterQuery](../index.md#filterquery)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>): Promise&#60;number>

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[nativeUpdate](sqlentityrepository.md#nativeupdate)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:106*

Fires native update query. Calling this has no side effects on the context (identity map).

#### Parameters:

Name | Type |
------ | ------ |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`data` | [EntityData](../index.md#entitydata)&#60;T> |

**Returns:** Promise&#60;number>

___

### persist

▸ **persist**(`entity`: [AnyEntity](../index.md#anyentity) \| [AnyEntity](../index.md#anyentity)[]): EntityManager

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[persist](sqlentityrepository.md#persist)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:14*

Tells the EntityManager to make an instance managed and persistent.
The entity will be entered into the database at or before transaction commit or as a result of the flush operation.

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) \| [AnyEntity](../index.md#anyentity)[] |

**Returns:** EntityManager

___

### persistAndFlush

▸ **persistAndFlush**(`entity`: [AnyEntity](../index.md#anyentity) \| [AnyEntity](../index.md#anyentity)[]): Promise&#60;void>

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[persistAndFlush](sqlentityrepository.md#persistandflush)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:19*

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

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[persistLater](sqlentityrepository.md#persistlater)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:26*

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

▸ **populate**&#60;P>(`entities`: T, `populate`: P, `where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `orderBy?`: QueryOrderMap, `refresh?`: boolean, `validate?`: boolean): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[populate](sqlentityrepository.md#populate)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:134*

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
`orderBy?` | QueryOrderMap |
`refresh?` | boolean |
`validate?` | boolean |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

▸ **populate**&#60;P>(`entities`: T[], `populate`: P, `where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `orderBy?`: QueryOrderMap, `refresh?`: boolean, `validate?`: boolean): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[populate](sqlentityrepository.md#populate)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:138*

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
`orderBy?` | QueryOrderMap |
`refresh?` | boolean |
`validate?` | boolean |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

▸ **populate**&#60;P>(`entities`: T \| T[], `populate`: P, `where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `orderBy?`: QueryOrderMap, `refresh?`: boolean, `validate?`: boolean): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| [Loaded](../index.md#loaded)&#60;T, P>[]>

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[populate](sqlentityrepository.md#populate)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:142*

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
`orderBy?` | QueryOrderMap |
`refresh?` | boolean |
`validate?` | boolean |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| [Loaded](../index.md#loaded)&#60;T, P>[]>

___

### remove

▸ **remove**(`entity`: [AnyEntity](../index.md#anyentity)): EntityManager

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[remove](sqlentityrepository.md#remove)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:79*

Marks entity for removal.
A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.

To remove entities by condition, use `em.nativeDelete()`.

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) |

**Returns:** EntityManager

___

### removeAndFlush

▸ **removeAndFlush**(`entity`: [AnyEntity](../index.md#anyentity)): Promise&#60;void>

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[removeAndFlush](sqlentityrepository.md#removeandflush)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:84*

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

*Inherited from [SqlEntityRepository](sqlentityrepository.md).[removeLater](sqlentityrepository.md#removelater)*

*Defined in packages/core/dist/entity/EntityRepository.d.ts:91*

Marks entity for removal.
A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.

**`deprecated`** use `remove()`

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) |

**Returns:** void
