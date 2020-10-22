---
id: "mongoentitymanager"
title: "Class: MongoEntityManager<D>"
sidebar_label: "MongoEntityManager"
---

**`inheritdoc`** 

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`D` | [MongoDriver](mongodriver.md) | MongoDriver |

## Hierarchy

* EntityManager&#60;D>

  ↳ **MongoEntityManager**

## Constructors

### constructor

\+ **new MongoEntityManager**(`config`: Configuration, `driver`: D, `metadata`: MetadataStorage, `useContext?`: boolean, `eventManager?`: EventManager): [MongoEntityManager](mongoentitymanager.md)

*Inherited from [SqlEntityManager](sqlentitymanager.md).[constructor](sqlentitymanager.md#constructor)*

*Defined in packages/core/dist/EntityManager.d.ts:34*

#### Parameters:

Name | Type |
------ | ------ |
`config` | Configuration |
`driver` | D |
`metadata` | MetadataStorage |
`useContext?` | boolean |
`eventManager?` | EventManager |

**Returns:** [MongoEntityManager](mongoentitymanager.md)

## Properties

### config

• `Readonly` **config**: Configuration

*Inherited from [SqlEntityManager](sqlentitymanager.md).[config](sqlentitymanager.md#config)*

*Defined in packages/core/dist/EntityManager.d.ts:18*

___

### id

• `Readonly` **id**: number

*Inherited from [SqlEntityManager](sqlentitymanager.md).[id](sqlentitymanager.md#id)*

*Defined in packages/core/dist/EntityManager.d.ts:24*

## Methods

### [inspect.custom]

▸ **[inspect.custom]**(): string

*Inherited from [SqlEntityManager](sqlentitymanager.md).[[inspect.custom]](sqlentitymanager.md#[inspect.custom])*

*Defined in packages/core/dist/EntityManager.d.ts:302*

**Returns:** string

___

### addFilter

▸ **addFilter**&#60;T1>(`name`: string, `cond`: [FilterQuery](../index.md#filterquery)&#60;T1> \| (args: [Dictionary](../index.md#dictionary)) => [FilterQuery](../index.md#filterquery)&#60;T1>, `entityName?`: [EntityName](../index.md#entityname)&#60;T1> \| [[EntityName](../index.md#entityname)&#60;T1>], `enabled?`: boolean): void

*Inherited from [SqlEntityManager](sqlentitymanager.md).[addFilter](sqlentitymanager.md#addfilter)*

*Defined in packages/core/dist/EntityManager.d.ts:63*

Registers global filter to this entity manager. Global filters are enabled by default (unless disabled via last parameter).

#### Type parameters:

Name | Type |
------ | ------ |
`T1` | [AnyEntity](../index.md#anyentity)&#60;T1> |

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |
`cond` | [FilterQuery](../index.md#filterquery)&#60;T1> \| (args: [Dictionary](../index.md#dictionary)) => [FilterQuery](../index.md#filterquery)&#60;T1> |
`entityName?` | [EntityName](../index.md#entityname)&#60;T1> \| [[EntityName](../index.md#entityname)&#60;T1>] |
`enabled?` | boolean |

**Returns:** void

▸ **addFilter**&#60;T1, T2>(`name`: string, `cond`: [FilterQuery](../index.md#filterquery)&#60;T1 \| T2> \| (args: [Dictionary](../index.md#dictionary)) => [FilterQuery](../index.md#filterquery)&#60;T1 \| T2>, `entityName?`: [[EntityName](../index.md#entityname)&#60;T1>, [EntityName](../index.md#entityname)&#60;T2>], `enabled?`: boolean): void

*Inherited from [SqlEntityManager](sqlentitymanager.md).[addFilter](sqlentitymanager.md#addfilter)*

*Defined in packages/core/dist/EntityManager.d.ts:67*

Registers global filter to this entity manager. Global filters are enabled by default (unless disabled via last parameter).

#### Type parameters:

Name | Type |
------ | ------ |
`T1` | [AnyEntity](../index.md#anyentity)&#60;T1> |
`T2` | [AnyEntity](../index.md#anyentity)&#60;T2> |

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |
`cond` | [FilterQuery](../index.md#filterquery)&#60;T1 \| T2> \| (args: [Dictionary](../index.md#dictionary)) => [FilterQuery](../index.md#filterquery)&#60;T1 \| T2> |
`entityName?` | [[EntityName](../index.md#entityname)&#60;T1>, [EntityName](../index.md#entityname)&#60;T2>] |
`enabled?` | boolean |

**Returns:** void

▸ **addFilter**&#60;T1, T2, T3>(`name`: string, `cond`: [FilterQuery](../index.md#filterquery)&#60;T1 \| T2 \| T3> \| (args: [Dictionary](../index.md#dictionary)) => [FilterQuery](../index.md#filterquery)&#60;T1 \| T2 \| T3>, `entityName?`: [[EntityName](../index.md#entityname)&#60;T1>, [EntityName](../index.md#entityname)&#60;T2>, [EntityName](../index.md#entityname)&#60;T3>], `enabled?`: boolean): void

*Inherited from [SqlEntityManager](sqlentitymanager.md).[addFilter](sqlentitymanager.md#addfilter)*

*Defined in packages/core/dist/EntityManager.d.ts:71*

Registers global filter to this entity manager. Global filters are enabled by default (unless disabled via last parameter).

#### Type parameters:

Name | Type |
------ | ------ |
`T1` | [AnyEntity](../index.md#anyentity)&#60;T1> |
`T2` | [AnyEntity](../index.md#anyentity)&#60;T2> |
`T3` | [AnyEntity](../index.md#anyentity)&#60;T3> |

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |
`cond` | [FilterQuery](../index.md#filterquery)&#60;T1 \| T2 \| T3> \| (args: [Dictionary](../index.md#dictionary)) => [FilterQuery](../index.md#filterquery)&#60;T1 \| T2 \| T3> |
`entityName?` | [[EntityName](../index.md#entityname)&#60;T1>, [EntityName](../index.md#entityname)&#60;T2>, [EntityName](../index.md#entityname)&#60;T3>] |
`enabled?` | boolean |

**Returns:** void

___

### aggregate

▸ **aggregate**(`entityName`: [EntityName](../index.md#entityname)&#60;any>, `pipeline`: any[]): Promise&#60;any[]>

*Defined in [packages/mongodb/src/MongoEntityManager.ts:14](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/mongodb/src/MongoEntityManager.ts#L14)*

Shortcut to driver's aggregate method. Available in MongoDriver only.

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;any> |
`pipeline` | any[] |

**Returns:** Promise&#60;any[]>

___

### applyFilters

▸ `Protected`**applyFilters**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options`: [Dictionary](../index.md#dictionary)&#60;boolean \| [Dictionary](../index.md#dictionary)> \| string[] \| boolean, `type`: &#34;read&#34; \| &#34;update&#34; \| &#34;delete&#34;): Promise&#60;[FilterQuery](../index.md#filterquery)&#60;T>>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[applyFilters](sqlentitymanager.md#applyfilters)*

*Defined in packages/core/dist/EntityManager.d.ts:81*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`options` | [Dictionary](../index.md#dictionary)&#60;boolean \| [Dictionary](../index.md#dictionary)> \| string[] \| boolean |
`type` | &#34;read&#34; \| &#34;update&#34; \| &#34;delete&#34; |

**Returns:** Promise&#60;[FilterQuery](../index.md#filterquery)&#60;T>>

___

### assign

▸ **assign**&#60;T>(`entity`: T, `data`: [EntityData](../index.md#entitydata)&#60;T>, `options?`: AssignOptions): T

*Inherited from [SqlEntityManager](sqlentitymanager.md).[assign](sqlentitymanager.md#assign)*

*Defined in packages/core/dist/EntityManager.d.ts:171*

Shortcut for `wrap(entity).assign(data, { em })`

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`data` | [EntityData](../index.md#entitydata)&#60;T> |
`options?` | AssignOptions |

**Returns:** T

___

### begin

▸ **begin**(`ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[begin](sqlentitymanager.md#begin)*

*Defined in packages/core/dist/EntityManager.d.ts:119*

Starts new transaction bound to this EntityManager. Use `ctx` parameter to provide the parent when nesting transactions.

#### Parameters:

Name | Type |
------ | ------ |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;void>

___

### canPopulate

▸ **canPopulate**&#60;T>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `property`: string): boolean

*Inherited from [SqlEntityManager](sqlentitymanager.md).[canPopulate](sqlentitymanager.md#canpopulate)*

*Defined in packages/core/dist/EntityManager.d.ts:240*

Checks whether given property can be populated on the entity.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |
`property` | string |

**Returns:** boolean

___

### clear

▸ **clear**(): void

*Inherited from [SqlEntityManager](sqlentitymanager.md).[clear](sqlentitymanager.md#clear)*

*Defined in packages/core/dist/EntityManager.d.ts:236*

Clears the EntityManager. All entities that are currently managed by this EntityManager become detached.

**Returns:** void

___

### commit

▸ **commit**(): Promise&#60;void>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[commit](sqlentitymanager.md#commit)*

*Defined in packages/core/dist/EntityManager.d.ts:123*

Commits the transaction bound to this EntityManager. Flushes before doing the actual commit query.

**Returns:** Promise&#60;void>

___

### count

▸ **count**&#60;T>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: CountOptions&#60;T>): Promise&#60;number>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[count](sqlentitymanager.md#count)*

*Defined in packages/core/dist/EntityManager.d.ts:191*

Returns total number of entities matching your `where` query.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |
`where?` | [FilterQuery](../index.md#filterquery)&#60;T> |
`options?` | CountOptions&#60;T> |

**Returns:** Promise&#60;number>

___

### create

▸ **create**&#60;T, P>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>, `options?`: { managed?: boolean  }): [New](../index.md#new)&#60;T, P>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[create](sqlentitymanager.md#create)*

*Defined in packages/core/dist/EntityManager.d.ts:165*

Creates new instance of given entity and populates it with given data

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | - |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |
`data` | [EntityData](../index.md#entitydata)&#60;T> |
`options?` | { managed?: boolean  } |

**Returns:** [New](../index.md#new)&#60;T, P>

___

### find

▸ **find**&#60;T, P>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: FindOptions&#60;T, P>): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[find](sqlentitymanager.md#find)*

*Defined in packages/core/dist/EntityManager.d.ts:55*

Finds all entities matching your `where` query. You can pass additional options via the `options` parameter.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | - |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`options?` | FindOptions&#60;T, P> |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

▸ **find**&#60;T, P>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `populate?`: P, `orderBy?`: QueryOrderMap, `limit?`: number, `offset?`: number): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[find](sqlentitymanager.md#find)*

*Defined in packages/core/dist/EntityManager.d.ts:59*

Finds all entities matching your `where` query.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | - |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`populate?` | P |
`orderBy?` | QueryOrderMap |
`limit?` | number |
`offset?` | number |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

___

### findAndCount

▸ **findAndCount**&#60;T, P>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: FindOptions&#60;T, P>): Promise&#60;[[Loaded](../index.md#loaded)&#60;T, P>[], number]>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[findAndCount](sqlentitymanager.md#findandcount)*

*Defined in packages/core/dist/EntityManager.d.ts:86*

Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
where first element is the array of entities and the second is the count.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | - |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`options?` | FindOptions&#60;T, P> |

**Returns:** Promise&#60;[[Loaded](../index.md#loaded)&#60;T, P>[], number]>

▸ **findAndCount**&#60;T, P>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `populate?`: P, `orderBy?`: QueryOrderMap, `limit?`: number, `offset?`: number): Promise&#60;[[Loaded](../index.md#loaded)&#60;T, P>[], number]>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[findAndCount](sqlentitymanager.md#findandcount)*

*Defined in packages/core/dist/EntityManager.d.ts:91*

Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
where first element is the array of entities and the second is the count.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | - |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`populate?` | P |
`orderBy?` | QueryOrderMap |
`limit?` | number |
`offset?` | number |

**Returns:** Promise&#60;[[Loaded](../index.md#loaded)&#60;T, P>[], number]>

___

### findOne

▸ **findOne**&#60;T, P>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: FindOneOptions&#60;T, P>): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| null>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[findOne](sqlentitymanager.md#findone)*

*Defined in packages/core/dist/EntityManager.d.ts:95*

Finds first entity matching your `where` query.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | - |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`options?` | FindOneOptions&#60;T, P> |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| null>

▸ **findOne**&#60;T, P>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `populate?`: P, `orderBy?`: QueryOrderMap): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| null>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[findOne](sqlentitymanager.md#findone)*

*Defined in packages/core/dist/EntityManager.d.ts:99*

Finds first entity matching your `where` query.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | - |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`populate?` | P |
`orderBy?` | QueryOrderMap |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| null>

___

### findOneOrFail

▸ **findOneOrFail**&#60;T, P>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: FindOneOrFailOptions&#60;T, P>): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[findOneOrFail](sqlentitymanager.md#findoneorfail)*

*Defined in packages/core/dist/EntityManager.d.ts:105*

Finds first entity matching your `where` query. If nothing found, it will throw an error.
You can override the factory for creating this method via `options.failHandler` locally
or via `Configuration.findOneOrFailHandler` globally.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | - |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`options?` | FindOneOrFailOptions&#60;T, P> |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

▸ **findOneOrFail**&#60;T, P>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `populate?`: P, `orderBy?`: QueryOrderMap): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[findOneOrFail](sqlentitymanager.md#findoneorfail)*

*Defined in packages/core/dist/EntityManager.d.ts:111*

Finds first entity matching your `where` query. If nothing found, it will throw an error.
You can override the factory for creating this method via `options.failHandler` locally
or via `Configuration.findOneOrFailHandler` globally.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | - |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`populate?` | P |
`orderBy?` | QueryOrderMap |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

___

### flush

▸ **flush**(): Promise&#60;void>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[flush](sqlentitymanager.md#flush)*

*Defined in packages/core/dist/EntityManager.d.ts:232*

Flushes all changes to objects that have been queued up to now to the database.
This effectively synchronizes the in-memory state of managed objects with the database.

**Returns:** Promise&#60;void>

___

### fork

▸ **fork**(`clear?`: boolean, `useContext?`: boolean): D[*typeof* EntityManagerType]

*Inherited from [SqlEntityManager](sqlentitymanager.md).[fork](sqlentitymanager.md#fork)*

*Defined in packages/core/dist/EntityManager.d.ts:259*

Returns new EntityManager instance with its own identity map

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`clear?` | boolean | do we want clear identity map? defaults to true |
`useContext?` | boolean | use request context? should be used only for top level request scope EM, defaults to false  |

**Returns:** D[*typeof* EntityManagerType]

___

### getCollection

▸ **getCollection**(`entityName`: [EntityName](../index.md#entityname)&#60;any>): Collection

*Defined in [packages/mongodb/src/MongoEntityManager.ts:19](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/mongodb/src/MongoEntityManager.ts#L19)*

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;any> |

**Returns:** Collection

___

### getComparator

▸ **getComparator**(): EntityComparator

*Inherited from [SqlEntityManager](sqlentitymanager.md).[getComparator](sqlentitymanager.md#getcomparator)*

*Defined in packages/core/dist/EntityManager.d.ts:284*

Gets the EntityComparator.

**Returns:** EntityComparator

___

### getConnection

▸ **getConnection**(`type?`: &#34;read&#34; \| &#34;write&#34;): ReturnType&#60;D[&#34;getConnection&#34;]>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[getConnection](sqlentitymanager.md#getconnection)*

*Defined in packages/core/dist/EntityManager.d.ts:43*

Gets the Connection instance, by default returns write connection

#### Parameters:

Name | Type |
------ | ------ |
`type?` | &#34;read&#34; \| &#34;write&#34; |

**Returns:** ReturnType&#60;D[&#34;getConnection&#34;]>

___

### getDriver

▸ **getDriver**(): D

*Inherited from [SqlEntityManager](sqlentitymanager.md).[getDriver](sqlentitymanager.md#getdriver)*

*Defined in packages/core/dist/EntityManager.d.ts:39*

Gets the Driver instance used by this EntityManager

**Returns:** D

___

### getEntityFactory

▸ **getEntityFactory**(): EntityFactory

*Inherited from [SqlEntityManager](sqlentitymanager.md).[getEntityFactory](sqlentitymanager.md#getentityfactory)*

*Defined in packages/core/dist/EntityManager.d.ts:267*

Gets the EntityFactory used by the EntityManager.

**Returns:** EntityFactory

___

### getEventManager

▸ **getEventManager**(): EventManager

*Inherited from [SqlEntityManager](sqlentitymanager.md).[getEventManager](sqlentitymanager.md#geteventmanager)*

*Defined in packages/core/dist/EntityManager.d.ts:268*

**Returns:** EventManager

___

### getFilterParams

▸ **getFilterParams**&#60;T>(`name`: string): T

*Inherited from [SqlEntityManager](sqlentitymanager.md).[getFilterParams](sqlentitymanager.md#getfilterparams)*

*Defined in packages/core/dist/EntityManager.d.ts:80*

Returns filter parameters for given filter set in this context.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [Dictionary](../index.md#dictionary) | Dictionary |

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** T

___

### getMetadata

▸ **getMetadata**(): MetadataStorage

*Inherited from [SqlEntityManager](sqlentitymanager.md).[getMetadata](sqlentitymanager.md#getmetadata)*

*Defined in packages/core/dist/EntityManager.d.ts:280*

Gets the MetadataStorage.

**Returns:** MetadataStorage

___

### getReference

▸ **getReference**&#60;T, PK>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `id`: [Primary](../index.md#primary)&#60;T>, `wrapped`: true, `convertCustomTypes?`: boolean): [IdentifiedReference](../index.md#identifiedreference)&#60;T, PK>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[getReference](sqlentitymanager.md#getreference)*

*Defined in packages/core/dist/EntityManager.d.ts:175*

Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |
`PK` | keyof T |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |
`id` | [Primary](../index.md#primary)&#60;T> |
`wrapped` | true |
`convertCustomTypes?` | boolean |

**Returns:** [IdentifiedReference](../index.md#identifiedreference)&#60;T, PK>

▸ **getReference**&#60;T>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `id`: [Primary](../index.md#primary)&#60;T> \| [Primary](../index.md#primary)&#60;T>[]): T

*Inherited from [SqlEntityManager](sqlentitymanager.md).[getReference](sqlentitymanager.md#getreference)*

*Defined in packages/core/dist/EntityManager.d.ts:179*

Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |
`id` | [Primary](../index.md#primary)&#60;T> \| [Primary](../index.md#primary)&#60;T>[] |

**Returns:** T

▸ **getReference**&#60;T>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `id`: [Primary](../index.md#primary)&#60;T>, `wrapped`: false, `convertCustomTypes?`: boolean): T

*Inherited from [SqlEntityManager](sqlentitymanager.md).[getReference](sqlentitymanager.md#getreference)*

*Defined in packages/core/dist/EntityManager.d.ts:183*

Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |
`id` | [Primary](../index.md#primary)&#60;T> |
`wrapped` | false |
`convertCustomTypes?` | boolean |

**Returns:** T

▸ **getReference**&#60;T>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `id`: [Primary](../index.md#primary)&#60;T>, `wrapped?`: boolean, `convertCustomTypes?`: boolean): T \| Reference&#60;T>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[getReference](sqlentitymanager.md#getreference)*

*Defined in packages/core/dist/EntityManager.d.ts:187*

Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |
`id` | [Primary](../index.md#primary)&#60;T> |
`wrapped?` | boolean |
`convertCustomTypes?` | boolean |

**Returns:** T \| Reference&#60;T>

___

### getRepository

▸ **getRepository**&#60;T, U>(`entityName`: [EntityName](../index.md#entityname)&#60;T>): [GetRepository](../index.md#getrepository)&#60;T, U>

*Overrides void*

*Defined in [packages/mongodb/src/MongoEntityManager.ts:23](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/mongodb/src/MongoEntityManager.ts#L23)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | - |
`U` | EntityRepository&#60;T> | MongoEntityRepository\&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |

**Returns:** [GetRepository](../index.md#getrepository)&#60;T, U>

___

### getTransactionContext

▸ **getTransactionContext**&#60;T>(): T \| undefined

*Inherited from [SqlEntityManager](sqlentitymanager.md).[getTransactionContext](sqlentitymanager.md#gettransactioncontext)*

*Defined in packages/core/dist/EntityManager.d.ts:276*

Gets the transaction context (driver dependent object used to make sure queries are executed on same connection).

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [Transaction](../index.md#transaction) | Transaction |

**Returns:** T \| undefined

___

### getUnitOfWork

▸ **getUnitOfWork**(): UnitOfWork

*Inherited from [SqlEntityManager](sqlentitymanager.md).[getUnitOfWork](sqlentitymanager.md#getunitofwork)*

*Defined in packages/core/dist/EntityManager.d.ts:263*

Gets the UnitOfWork used by the EntityManager to coordinate operations.

**Returns:** UnitOfWork

___

### getValidator

▸ **getValidator**(): EntityValidator

*Inherited from [SqlEntityManager](sqlentitymanager.md).[getValidator](sqlentitymanager.md#getvalidator)*

*Defined in packages/core/dist/EntityManager.d.ts:51*

Gets EntityValidator instance

**Returns:** EntityValidator

___

### isInTransaction

▸ **isInTransaction**(): boolean

*Inherited from [SqlEntityManager](sqlentitymanager.md).[isInTransaction](sqlentitymanager.md#isintransaction)*

*Defined in packages/core/dist/EntityManager.d.ts:272*

Checks whether this EntityManager is currently operating inside a database transaction.

**Returns:** boolean

___

### lock

▸ **lock**(`entity`: [AnyEntity](../index.md#anyentity), `lockMode`: [LockMode](../enums/lockmode.md), `lockVersion?`: number \| Date): Promise&#60;void>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[lock](sqlentitymanager.md#lock)*

*Defined in packages/core/dist/EntityManager.d.ts:131*

Runs your callback wrapped inside a database transaction.

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) |
`lockMode` | [LockMode](../enums/lockmode.md) |
`lockVersion?` | number \| Date |

**Returns:** Promise&#60;void>

___

### map

▸ **map**&#60;T>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `result`: [EntityData](../index.md#entitydata)&#60;T>): T

*Inherited from [SqlEntityManager](sqlentitymanager.md).[map](sqlentitymanager.md#map)*

*Defined in packages/core/dist/EntityManager.d.ts:151*

Maps raw database result to an entity and merges it to this EntityManager.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |
`result` | [EntityData](../index.md#entitydata)&#60;T> |

**Returns:** T

___

### merge

▸ **merge**&#60;T>(`entity`: T, `refresh?`: boolean): T

*Inherited from [SqlEntityManager](sqlentitymanager.md).[merge](sqlentitymanager.md#merge)*

*Defined in packages/core/dist/EntityManager.d.ts:156*

Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
via second parameter. By default it will return already loaded entities without modifying them.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`refresh?` | boolean |

**Returns:** T

▸ **merge**&#60;T>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>, `refresh?`: boolean, `convertCustomTypes?`: boolean): T

*Inherited from [SqlEntityManager](sqlentitymanager.md).[merge](sqlentitymanager.md#merge)*

*Defined in packages/core/dist/EntityManager.d.ts:161*

Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
via second parameter. By default it will return already loaded entities without modifying them.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |
`data` | [EntityData](../index.md#entitydata)&#60;T> |
`refresh?` | boolean |
`convertCustomTypes?` | boolean |

**Returns:** T

___

### nativeDelete

▸ **nativeDelete**&#60;T>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: DeleteOptions&#60;T>): Promise&#60;number>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[nativeDelete](sqlentitymanager.md#nativedelete)*

*Defined in packages/core/dist/EntityManager.d.ts:147*

Fires native delete query. Calling this has no side effects on the context (identity map).

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`options?` | DeleteOptions&#60;T> |

**Returns:** Promise&#60;number>

___

### nativeInsert

▸ **nativeInsert**&#60;T>(`entity`: T): Promise&#60;[Primary](../index.md#primary)&#60;T>>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[nativeInsert](sqlentitymanager.md#nativeinsert)*

*Defined in packages/core/dist/EntityManager.d.ts:135*

Fires native insert query. Calling this has no side effects on the context (identity map).

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |

**Returns:** Promise&#60;[Primary](../index.md#primary)&#60;T>>

▸ **nativeInsert**&#60;T>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>): Promise&#60;[Primary](../index.md#primary)&#60;T>>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[nativeInsert](sqlentitymanager.md#nativeinsert)*

*Defined in packages/core/dist/EntityManager.d.ts:139*

Fires native insert query. Calling this has no side effects on the context (identity map).

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |
`data` | [EntityData](../index.md#entitydata)&#60;T> |

**Returns:** Promise&#60;[Primary](../index.md#primary)&#60;T>>

___

### nativeUpdate

▸ **nativeUpdate**&#60;T>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>, `options?`: UpdateOptions&#60;T>): Promise&#60;number>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[nativeUpdate](sqlentitymanager.md#nativeupdate)*

*Defined in packages/core/dist/EntityManager.d.ts:143*

Fires native update query. Calling this has no side effects on the context (identity map).

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`data` | [EntityData](../index.md#entitydata)&#60;T> |
`options?` | UpdateOptions&#60;T> |

**Returns:** Promise&#60;number>

___

### persist

▸ **persist**(`entity`: [AnyEntity](../index.md#anyentity) \| Reference&#60;[AnyEntity](../index.md#anyentity)> \| ([AnyEntity](../index.md#anyentity) \| Reference&#60;[AnyEntity](../index.md#anyentity)>)[]): this

*Inherited from [SqlEntityManager](sqlentitymanager.md).[persist](sqlentitymanager.md#persist)*

*Defined in packages/core/dist/EntityManager.d.ts:196*

Tells the EntityManager to make an instance managed and persistent.
The entity will be entered into the database at or before transaction commit or as a result of the flush operation.

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) \| Reference&#60;[AnyEntity](../index.md#anyentity)> \| ([AnyEntity](../index.md#anyentity) \| Reference&#60;[AnyEntity](../index.md#anyentity)>)[] |

**Returns:** this

___

### persistAndFlush

▸ **persistAndFlush**(`entity`: [AnyEntity](../index.md#anyentity) \| Reference&#60;[AnyEntity](../index.md#anyentity)> \| ([AnyEntity](../index.md#anyentity) \| Reference&#60;[AnyEntity](../index.md#anyentity)>)[]): Promise&#60;void>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[persistAndFlush](sqlentitymanager.md#persistandflush)*

*Defined in packages/core/dist/EntityManager.d.ts:201*

Persists your entity immediately, flushing all not yet persisted changes to the database too.
Equivalent to `em.persist(e).flush()`.

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) \| Reference&#60;[AnyEntity](../index.md#anyentity)> \| ([AnyEntity](../index.md#anyentity) \| Reference&#60;[AnyEntity](../index.md#anyentity)>)[] |

**Returns:** Promise&#60;void>

___

### persistLater

▸ **persistLater**(`entity`: [AnyEntity](../index.md#anyentity) \| [AnyEntity](../index.md#anyentity)[]): void

*Inherited from [SqlEntityManager](sqlentitymanager.md).[persistLater](sqlentitymanager.md#persistlater)*

*Defined in packages/core/dist/EntityManager.d.ts:208*

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

▸ **populate**&#60;T, P>(`entities`: T, `populate`: P, `where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `orderBy?`: QueryOrderMap, `refresh?`: boolean, `validate?`: boolean): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[populate](sqlentitymanager.md#populate)*

*Defined in packages/core/dist/EntityManager.d.ts:244*

Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |
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

▸ **populate**&#60;T, P>(`entities`: T[], `populate`: P, `where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `orderBy?`: QueryOrderMap, `refresh?`: boolean, `validate?`: boolean): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[populate](sqlentitymanager.md#populate)*

*Defined in packages/core/dist/EntityManager.d.ts:248*

Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |
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

▸ **populate**&#60;T, P>(`entities`: T \| T[], `populate`: P, `where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `orderBy?`: QueryOrderMap, `refresh?`: boolean, `validate?`: boolean): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| [Loaded](../index.md#loaded)&#60;T, P>[]>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[populate](sqlentitymanager.md#populate)*

*Defined in packages/core/dist/EntityManager.d.ts:252*

Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |
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

▸ **remove**&#60;T>(`entity`: T \| Reference&#60;T> \| (T \| Reference&#60;T>)[]): this

*Inherited from [SqlEntityManager](sqlentitymanager.md).[remove](sqlentitymanager.md#remove)*

*Defined in packages/core/dist/EntityManager.d.ts:215*

Marks entity for removal.
A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.

To remove entities by condition, use `em.nativeDelete()`.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T \| Reference&#60;T> \| (T \| Reference&#60;T>)[] |

**Returns:** this

___

### removeAndFlush

▸ **removeAndFlush**(`entity`: [AnyEntity](../index.md#anyentity) \| Reference&#60;[AnyEntity](../index.md#anyentity)>): Promise&#60;void>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[removeAndFlush](sqlentitymanager.md#removeandflush)*

*Defined in packages/core/dist/EntityManager.d.ts:220*

Removes an entity instance immediately, flushing all not yet persisted changes to the database too.
Equivalent to `em.remove(e).flush()`

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) \| Reference&#60;[AnyEntity](../index.md#anyentity)> |

**Returns:** Promise&#60;void>

___

### removeLater

▸ **removeLater**(`entity`: [AnyEntity](../index.md#anyentity)): void

*Inherited from [SqlEntityManager](sqlentitymanager.md).[removeLater](sqlentitymanager.md#removelater)*

*Defined in packages/core/dist/EntityManager.d.ts:227*

Marks entity for removal.
A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.

**`deprecated`** use `remove()`

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) |

**Returns:** void

___

### rollback

▸ **rollback**(): Promise&#60;void>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[rollback](sqlentitymanager.md#rollback)*

*Defined in packages/core/dist/EntityManager.d.ts:127*

Rollbacks the transaction bound to this EntityManager.

**Returns:** Promise&#60;void>

___

### setFilterParams

▸ **setFilterParams**(`name`: string, `args`: [Dictionary](../index.md#dictionary)): void

*Inherited from [SqlEntityManager](sqlentitymanager.md).[setFilterParams](sqlentitymanager.md#setfilterparams)*

*Defined in packages/core/dist/EntityManager.d.ts:76*

Sets filter parameter values globally inside context defined by this entity manager.
If you want to set shared value for all contexts, be sure to use the root entity manager.

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |
`args` | [Dictionary](../index.md#dictionary) |

**Returns:** void

___

### storeCache

▸ **storeCache**(`config`: boolean \| number \| [string, number] \| undefined, `key`: { key: string  }, `data`: unknown \| () => unknown): Promise&#60;void>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[storeCache](sqlentitymanager.md#storecache)*

*Defined in packages/core/dist/EntityManager.d.ts:299*

**`internal`** 

#### Parameters:

Name | Type |
------ | ------ |
`config` | boolean \| number \| [string, number] \| undefined |
`key` | { key: string  } |
`data` | unknown \| () => unknown |

**Returns:** Promise&#60;void>

___

### transactional

▸ **transactional**&#60;T>(`cb`: (em: D[*typeof* EntityManagerType]) => Promise&#60;T>, `ctx?`: any): Promise&#60;T>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[transactional](sqlentitymanager.md#transactional)*

*Defined in packages/core/dist/EntityManager.d.ts:115*

Runs your callback wrapped inside a database transaction.

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`cb` | (em: D[*typeof* EntityManagerType]) => Promise&#60;T> |
`ctx?` | any |

**Returns:** Promise&#60;T>

___

### tryCache

▸ **tryCache**&#60;T, R>(`entityName`: string, `config`: boolean \| number \| [string, number] \| undefined, `key`: unknown, `refresh?`: boolean, `merge?`: boolean): Promise&#60;{ data?: R ; key: string  } \| undefined>

*Inherited from [SqlEntityManager](sqlentitymanager.md).[tryCache](sqlentitymanager.md#trycache)*

*Defined in packages/core/dist/EntityManager.d.ts:292*

**`internal`** 

#### Type parameters:

Name |
------ |
`T` |
`R` |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`config` | boolean \| number \| [string, number] \| undefined |
`key` | unknown |
`refresh?` | boolean |
`merge?` | boolean |

**Returns:** Promise&#60;{ data?: R ; key: string  } \| undefined>
