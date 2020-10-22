---
id: "entitymanager"
title: "Class: EntityManager<D>"
sidebar_label: "EntityManager"
---

The EntityManager is the central access point to ORM functionality. It is a facade to all different ORM subsystems
such as UnitOfWork, Query Language and Repository API.

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`D` | [IDatabaseDriver](../interfaces/idatabasedriver.md) | IDatabaseDriver |

## Hierarchy

* **EntityManager**

## Constructors

### constructor

\+ **new EntityManager**(`config`: [Configuration](configuration.md), `driver`: D, `metadata`: [MetadataStorage](metadatastorage.md), `useContext?`: boolean, `eventManager?`: [EventManager](eventmanager.md)): [EntityManager](entitymanager.md)

*Defined in [packages/core/src/EntityManager.ts:32](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L32)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`config` | [Configuration](configuration.md) | - |
`driver` | D | - |
`metadata` | [MetadataStorage](metadatastorage.md) | - |
`useContext` | boolean | true |
`eventManager` | [EventManager](eventmanager.md) | new EventManager(config.get('subscribers')) |

**Returns:** [EntityManager](entitymanager.md)

## Properties

### comparator

• `Private` `Readonly` **comparator**: [EntityComparator](entitycomparator.md) = new EntityComparator(this.metadata, this.driver.getPlatform())

*Defined in [packages/core/src/EntityManager.ts:26](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L26)*

___

### config

• `Readonly` **config**: [Configuration](configuration.md)

*Defined in [packages/core/src/EntityManager.ts:34](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L34)*

___

### driver

• `Private` `Readonly` **driver**: D

*Defined in [packages/core/src/EntityManager.ts:35](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L35)*

___

### entityFactory

• `Private` `Readonly` **entityFactory**: [EntityFactory](entityfactory.md) = new EntityFactory(this.unitOfWork, this)

*Defined in [packages/core/src/EntityManager.ts:28](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L28)*

___

### entityLoader

• `Private` `Readonly` **entityLoader**: [EntityLoader](entityloader.md) = new EntityLoader(this)

*Defined in [packages/core/src/EntityManager.ts:25](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L25)*

___

### eventManager

• `Private` `Readonly` **eventManager**: [EventManager](eventmanager.md)

*Defined in [packages/core/src/EntityManager.ts:38](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L38)*

___

### filterParams

• `Private` **filterParams**: [Dictionary](../index.md#dictionary)&#60;[Dictionary](../index.md#dictionary)>

*Defined in [packages/core/src/EntityManager.ts:31](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L31)*

___

### filters

• `Private` **filters**: [Dictionary](../index.md#dictionary)&#60;[FilterDef](../index.md#filterdef)&#60;any>>

*Defined in [packages/core/src/EntityManager.ts:30](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L30)*

___

### id

• `Readonly` **id**: number = EntityManager.counter++

*Defined in [packages/core/src/EntityManager.ts:22](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L22)*

___

### metadata

• `Private` `Readonly` **metadata**: [MetadataStorage](metadatastorage.md)

*Defined in [packages/core/src/EntityManager.ts:36](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L36)*

___

### repositoryMap

• `Private` `Readonly` **repositoryMap**: [Dictionary](../index.md#dictionary)&#60;[EntityRepository](entityrepository.md)&#60;[AnyEntity](../index.md#anyentity)>>

*Defined in [packages/core/src/EntityManager.ts:24](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L24)*

___

### resultCache

• `Private` `Readonly` **resultCache**: [CacheAdapter](../interfaces/cacheadapter.md) = this.config.getResultCacheAdapter()

*Defined in [packages/core/src/EntityManager.ts:29](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L29)*

___

### transactionContext

• `Private` `Optional` **transactionContext**: [Transaction](../index.md#transaction)

*Defined in [packages/core/src/EntityManager.ts:32](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L32)*

___

### unitOfWork

• `Private` `Readonly` **unitOfWork**: any = new UnitOfWork(this)

*Defined in [packages/core/src/EntityManager.ts:27](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L27)*

___

### useContext

• `Private` `Readonly` **useContext**: boolean

*Defined in [packages/core/src/EntityManager.ts:37](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L37)*

___

### validator

• `Private` `Readonly` **validator**: [EntityValidator](entityvalidator.md) = new EntityValidator(this.config.get('strict'))

*Defined in [packages/core/src/EntityManager.ts:23](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L23)*

___

### counter

▪ `Static` `Private` **counter**: number = 1

*Defined in [packages/core/src/EntityManager.ts:21](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L21)*

## Methods

### [inspect.custom]

▸ **[inspect.custom]**(): string

*Defined in [packages/core/src/EntityManager.ts:888](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L888)*

**Returns:** string

___

### addFilter

▸ **addFilter**&#60;T1>(`name`: string, `cond`: [FilterQuery](../index.md#filterquery)&#60;T1> \| (args: [Dictionary](../index.md#dictionary)) => [FilterQuery](../index.md#filterquery)&#60;T1>, `entityName?`: [EntityName](../index.md#entityname)&#60;T1> \| [[EntityName](../index.md#entityname)&#60;T1>], `enabled?`: boolean): void

*Defined in [packages/core/src/EntityManager.ts:136](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L136)*

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

*Defined in [packages/core/src/EntityManager.ts:141](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L141)*

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

*Defined in [packages/core/src/EntityManager.ts:146](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L146)*

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

### applyFilters

▸ `Protected`**applyFilters**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options`: [Dictionary](../index.md#dictionary)&#60;boolean \| [Dictionary](../index.md#dictionary)> \| string[] \| boolean, `type`: &#34;read&#34; \| &#34;update&#34; \| &#34;delete&#34;): Promise&#60;[FilterQuery](../index.md#filterquery)&#60;T>>

*Defined in [packages/core/src/EntityManager.ts:176](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L176)*

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

▸ **assign**&#60;T>(`entity`: T, `data`: [EntityData](../index.md#entitydata)&#60;T>, `options?`: [AssignOptions](../interfaces/assignoptions.md)): T

*Defined in [packages/core/src/EntityManager.ts:491](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L491)*

Shortcut for `wrap(entity).assign(data, { em })`

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entity` | T | - |
`data` | [EntityData](../index.md#entitydata)&#60;T> | - |
`options` | [AssignOptions](../interfaces/assignoptions.md) | {} |

**Returns:** T

___

### begin

▸ **begin**(`ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Defined in [packages/core/src/EntityManager.ts:341](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L341)*

Starts new transaction bound to this EntityManager. Use `ctx` parameter to provide the parent when nesting transactions.

#### Parameters:

Name | Type |
------ | ------ |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;void>

___

### canPopulate

▸ **canPopulate**&#60;T>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `property`: string): boolean

*Defined in [packages/core/src/EntityManager.ts:658](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L658)*

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

### checkLockRequirements

▸ `Private`**checkLockRequirements**(`mode`: [LockMode](../enums/lockmode.md) \| undefined, `meta`: [EntityMetadata](entitymetadata.md)): void

*Defined in [packages/core/src/EntityManager.ts:777](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L777)*

#### Parameters:

Name | Type |
------ | ------ |
`mode` | [LockMode](../enums/lockmode.md) \| undefined |
`meta` | [EntityMetadata](entitymetadata.md) |

**Returns:** void

___

### clear

▸ **clear**(): void

*Defined in [packages/core/src/EntityManager.ts:651](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L651)*

Clears the EntityManager. All entities that are currently managed by this EntityManager become detached.

**Returns:** void

___

### commit

▸ **commit**(): Promise&#60;void>

*Defined in [packages/core/src/EntityManager.ts:348](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L348)*

Commits the transaction bound to this EntityManager. Flushes before doing the actual commit query.

**Returns:** Promise&#60;void>

___

### count

▸ **count**&#60;T>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: [CountOptions](../interfaces/countoptions.md)&#60;T>): Promise&#60;number>

*Defined in [packages/core/src/EntityManager.ts:541](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L541)*

Returns total number of entities matching your `where` query.

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> | - |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> | {} |
`options` | [CountOptions](../interfaces/countoptions.md)&#60;T> | {} |

**Returns:** Promise&#60;number>

___

### create

▸ **create**&#60;T, P>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>, `options?`: { managed?: boolean  }): [New](../index.md#new)&#60;T, P>

*Defined in [packages/core/src/EntityManager.ts:484](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L484)*

Creates new instance of given entity and populates it with given data

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | - |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> | - |
`data` | [EntityData](../index.md#entitydata)&#60;T> | - |
`options` | { managed?: boolean  } | {} |

**Returns:** [New](../index.md#new)&#60;T, P>

___

### find

▸ **find**&#60;T, P>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: [FindOptions](../interfaces/findoptions.md)&#60;T, P>): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

*Defined in [packages/core/src/EntityManager.ts:87](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L87)*

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
`options?` | [FindOptions](../interfaces/findoptions.md)&#60;T, P> |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

▸ **find**&#60;T, P>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `populate?`: P, `orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md), `limit?`: number, `offset?`: number): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

*Defined in [packages/core/src/EntityManager.ts:92](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L92)*

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
`orderBy?` | [QueryOrderMap](../interfaces/queryordermap.md) |
`limit?` | number |
`offset?` | number |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

___

### findAndCount

▸ **findAndCount**&#60;T, P>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: [FindOptions](../interfaces/findoptions.md)&#60;T, P>): Promise&#60;[[Loaded](../index.md#loaded)&#60;T, P>[], number]>

*Defined in [packages/core/src/EntityManager.ts:219](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L219)*

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
`options?` | [FindOptions](../interfaces/findoptions.md)&#60;T, P> |

**Returns:** Promise&#60;[[Loaded](../index.md#loaded)&#60;T, P>[], number]>

▸ **findAndCount**&#60;T, P>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `populate?`: P, `orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md), `limit?`: number, `offset?`: number): Promise&#60;[[Loaded](../index.md#loaded)&#60;T, P>[], number]>

*Defined in [packages/core/src/EntityManager.ts:225](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L225)*

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
`orderBy?` | [QueryOrderMap](../interfaces/queryordermap.md) |
`limit?` | number |
`offset?` | number |

**Returns:** Promise&#60;[[Loaded](../index.md#loaded)&#60;T, P>[], number]>

___

### findOne

▸ **findOne**&#60;T, P>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: [FindOneOptions](../interfaces/findoneoptions.md)&#60;T, P>): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| null>

*Defined in [packages/core/src/EntityManager.ts:244](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L244)*

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
`options?` | [FindOneOptions](../interfaces/findoneoptions.md)&#60;T, P> |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| null>

▸ **findOne**&#60;T, P>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `populate?`: P, `orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md)): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| null>

*Defined in [packages/core/src/EntityManager.ts:249](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L249)*

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
`orderBy?` | [QueryOrderMap](../interfaces/queryordermap.md) |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| null>

___

### findOneOrFail

▸ **findOneOrFail**&#60;T, P>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: [FindOneOrFailOptions](../interfaces/findoneorfailoptions.md)&#60;T, P>): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

*Defined in [packages/core/src/EntityManager.ts:297](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L297)*

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
`options?` | [FindOneOrFailOptions](../interfaces/findoneorfailoptions.md)&#60;T, P> |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

▸ **findOneOrFail**&#60;T, P>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `populate?`: P, `orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md)): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

*Defined in [packages/core/src/EntityManager.ts:304](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L304)*

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
`orderBy?` | [QueryOrderMap](../interfaces/queryordermap.md) |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

___

### flush

▸ **flush**(): Promise&#60;void>

*Defined in [packages/core/src/EntityManager.ts:644](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L644)*

Flushes all changes to objects that have been queued up to now to the database.
This effectively synchronizes the in-memory state of managed objects with the database.

**Returns:** Promise&#60;void>

___

### fork

▸ **fork**(`clear?`: boolean, `useContext?`: boolean): D[*typeof* EntityManagerType]

*Defined in [packages/core/src/EntityManager.ts:715](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L715)*

Returns new EntityManager instance with its own identity map

#### Parameters:

Name | Type | Default value | Description |
------ | ------ | ------ | ------ |
`clear` | boolean | true | do we want clear identity map? defaults to true |
`useContext` | boolean | false | use request context? should be used only for top level request scope EM, defaults to false  |

**Returns:** D[*typeof* EntityManagerType]

___

### getComparator

▸ **getComparator**(): [EntityComparator](entitycomparator.md)

*Defined in [packages/core/src/EntityManager.ts:773](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L773)*

Gets the EntityComparator.

**Returns:** [EntityComparator](entitycomparator.md)

___

### getConnection

▸ **getConnection**(`type?`: &#34;read&#34; \| &#34;write&#34;): ReturnType&#60;D[&#34;getConnection&#34;]>

*Defined in [packages/core/src/EntityManager.ts:51](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L51)*

Gets the Connection instance, by default returns write connection

#### Parameters:

Name | Type |
------ | ------ |
`type?` | &#34;read&#34; \| &#34;write&#34; |

**Returns:** ReturnType&#60;D[&#34;getConnection&#34;]>

___

### getDriver

▸ **getDriver**(): D

*Defined in [packages/core/src/EntityManager.ts:44](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L44)*

Gets the Driver instance used by this EntityManager.
Driver is singleton, for one MikroORM instance, only one driver is created.

**Returns:** D

___

### getEntityFactory

▸ **getEntityFactory**(): [EntityFactory](entityfactory.md)

*Defined in [packages/core/src/EntityManager.ts:740](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L740)*

Gets the EntityFactory used by the EntityManager.

**Returns:** [EntityFactory](entityfactory.md)

___

### getEventManager

▸ **getEventManager**(): [EventManager](eventmanager.md)

*Defined in [packages/core/src/EntityManager.ts:745](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L745)*

**Returns:** [EventManager](eventmanager.md)

___

### getFilterParams

▸ **getFilterParams**&#60;T>(`name`: string): T

*Defined in [packages/core/src/EntityManager.ts:172](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L172)*

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

▸ **getMetadata**(): [MetadataStorage](metadatastorage.md)

*Defined in [packages/core/src/EntityManager.ts:766](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L766)*

Gets the MetadataStorage.

**Returns:** [MetadataStorage](metadatastorage.md)

___

### getPlatform

▸ **getPlatform**(): ReturnType&#60;D[&#34;getPlatform&#34;]>

*Defined in [packages/core/src/EntityManager.ts:58](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L58)*

Gets the platform instance. Just like the driver, platform is singleton, one for a MikroORM instance.

**Returns:** ReturnType&#60;D[&#34;getPlatform&#34;]>

___

### getReference

▸ **getReference**&#60;T, PK>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `id`: [Primary](../index.md#primary)&#60;T>, `wrapped`: true, `convertCustomTypes?`: boolean): [IdentifiedReference](../index.md#identifiedreference)&#60;T, PK>

*Defined in [packages/core/src/EntityManager.ts:498](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L498)*

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

*Defined in [packages/core/src/EntityManager.ts:503](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L503)*

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

*Defined in [packages/core/src/EntityManager.ts:508](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L508)*

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

▸ **getReference**&#60;T>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `id`: [Primary](../index.md#primary)&#60;T>, `wrapped?`: boolean, `convertCustomTypes?`: boolean): T \| [Reference](reference.md)&#60;T>

*Defined in [packages/core/src/EntityManager.ts:513](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L513)*

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

**Returns:** T \| [Reference](reference.md)&#60;T>

___

### getRepository

▸ **getRepository**&#60;T, U>(`entityName`: [EntityName](../index.md#entityname)&#60;T>): [GetRepository](../index.md#getrepository)&#60;T, U>

*Defined in [packages/core/src/EntityManager.ts:65](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L65)*

Gets repository for given entity. You can pass either string name or entity class reference.

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | - |
`U` | [EntityRepository](entityrepository.md)&#60;T> | EntityRepository\&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> |

**Returns:** [GetRepository](../index.md#getrepository)&#60;T, U>

___

### getTransactionContext

▸ **getTransactionContext**&#60;T>(): T \| undefined

*Defined in [packages/core/src/EntityManager.ts:759](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L759)*

Gets the transaction context (driver dependent object used to make sure queries are executed on same connection).

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [Transaction](../index.md#transaction) | Transaction |

**Returns:** T \| undefined

___

### getUnitOfWork

▸ **getUnitOfWork**(): [UnitOfWork](unitofwork.md)

*Defined in [packages/core/src/EntityManager.ts:732](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L732)*

Gets the UnitOfWork used by the EntityManager to coordinate operations.

**Returns:** [UnitOfWork](unitofwork.md)

___

### getValidator

▸ **getValidator**(): [EntityValidator](entityvalidator.md)

*Defined in [packages/core/src/EntityManager.ts:80](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L80)*

Gets EntityValidator instance

**Returns:** [EntityValidator](entityvalidator.md)

___

### isInTransaction

▸ **isInTransaction**(): boolean

*Defined in [packages/core/src/EntityManager.ts:752](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L752)*

Checks whether this EntityManager is currently operating inside a database transaction.

**Returns:** boolean

___

### lock

▸ **lock**(`entity`: [AnyEntity](../index.md#anyentity), `lockMode`: [LockMode](../enums/lockmode.md), `lockVersion?`: number \| Date): Promise&#60;void>

*Defined in [packages/core/src/EntityManager.ts:365](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L365)*

Runs your callback wrapped inside a database transaction.

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) |
`lockMode` | [LockMode](../enums/lockmode.md) |
`lockVersion?` | number \| Date |

**Returns:** Promise&#60;void>

___

### lockAndPopulate

▸ `Private`**lockAndPopulate**&#60;T, P>(`entityName`: string, `entity`: T, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options`: [FindOneOptions](../interfaces/findoneoptions.md)&#60;T>): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

*Defined in [packages/core/src/EntityManager.ts:791](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L791)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | - |
`P` | [Populate](../index.md#populate)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`entity` | T |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`options` | [FindOneOptions](../interfaces/findoneoptions.md)&#60;T> |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

___

### map

▸ **map**&#60;T>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `result`: [EntityData](../index.md#entitydata)&#60;T>): T

*Defined in [packages/core/src/EntityManager.ts:430](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L430)*

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

*Defined in [packages/core/src/EntityManager.ts:449](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L449)*

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

*Defined in [packages/core/src/EntityManager.ts:455](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L455)*

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

▸ **nativeDelete**&#60;T>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: [DeleteOptions](../interfaces/deleteoptions.md)&#60;T>): Promise&#60;number>

*Defined in [packages/core/src/EntityManager.ts:417](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L417)*

Fires native delete query. Calling this has no side effects on the context (identity map).

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> | - |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> | - |
`options` | [DeleteOptions](../interfaces/deleteoptions.md)&#60;T> | {} |

**Returns:** Promise&#60;number>

___

### nativeInsert

▸ **nativeInsert**&#60;T>(`entity`: T): Promise&#60;[Primary](../index.md#primary)&#60;T>>

*Defined in [packages/core/src/EntityManager.ts:372](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L372)*

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

*Defined in [packages/core/src/EntityManager.ts:377](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L377)*

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

▸ **nativeUpdate**&#60;T>(`entityName`: [EntityName](../index.md#entityname)&#60;T>, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>, `options?`: [UpdateOptions](../interfaces/updateoptions.md)&#60;T>): Promise&#60;number>

*Defined in [packages/core/src/EntityManager.ts:402](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L402)*

Fires native update query. Calling this has no side effects on the context (identity map).

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | [EntityName](../index.md#entityname)&#60;T> | - |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> | - |
`data` | [EntityData](../index.md#entitydata)&#60;T> | - |
`options` | [UpdateOptions](../interfaces/updateoptions.md)&#60;T> | {} |

**Returns:** Promise&#60;number>

___

### persist

▸ **persist**(`entity`: [AnyEntity](../index.md#anyentity) \| [Reference](reference.md)&#60;[AnyEntity](../index.md#anyentity)> \| ([AnyEntity](../index.md#anyentity) \| [Reference](reference.md)&#60;[AnyEntity](../index.md#anyentity)>)[]): this

*Defined in [packages/core/src/EntityManager.ts:563](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L563)*

Tells the EntityManager to make an instance managed and persistent.
The entity will be entered into the database at or before transaction commit or as a result of the flush operation.

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) \| [Reference](reference.md)&#60;[AnyEntity](../index.md#anyentity)> \| ([AnyEntity](../index.md#anyentity) \| [Reference](reference.md)&#60;[AnyEntity](../index.md#anyentity)>)[] |

**Returns:** this

___

### persistAndFlush

▸ **persistAndFlush**(`entity`: [AnyEntity](../index.md#anyentity) \| [Reference](reference.md)&#60;[AnyEntity](../index.md#anyentity)> \| ([AnyEntity](../index.md#anyentity) \| [Reference](reference.md)&#60;[AnyEntity](../index.md#anyentity)>)[]): Promise&#60;void>

*Defined in [packages/core/src/EntityManager.ts:588](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L588)*

Persists your entity immediately, flushing all not yet persisted changes to the database too.
Equivalent to `em.persist(e).flush()`.

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) \| [Reference](reference.md)&#60;[AnyEntity](../index.md#anyentity)> \| ([AnyEntity](../index.md#anyentity) \| [Reference](reference.md)&#60;[AnyEntity](../index.md#anyentity)>)[] |

**Returns:** Promise&#60;void>

___

### persistLater

▸ **persistLater**(`entity`: [AnyEntity](../index.md#anyentity) \| [AnyEntity](../index.md#anyentity)[]): void

*Defined in [packages/core/src/EntityManager.ts:598](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L598)*

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

▸ **populate**&#60;T, P>(`entities`: T, `populate`: P, `where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md), `refresh?`: boolean, `validate?`: boolean): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

*Defined in [packages/core/src/EntityManager.ts:678](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L678)*

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
`orderBy?` | [QueryOrderMap](../interfaces/queryordermap.md) |
`refresh?` | boolean |
`validate?` | boolean |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>>

▸ **populate**&#60;T, P>(`entities`: T[], `populate`: P, `where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md), `refresh?`: boolean, `validate?`: boolean): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

*Defined in [packages/core/src/EntityManager.ts:683](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L683)*

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
`orderBy?` | [QueryOrderMap](../interfaces/queryordermap.md) |
`refresh?` | boolean |
`validate?` | boolean |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P>[]>

▸ **populate**&#60;T, P>(`entities`: T \| T[], `populate`: P, `where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md), `refresh?`: boolean, `validate?`: boolean): Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| [Loaded](../index.md#loaded)&#60;T, P>[]>

*Defined in [packages/core/src/EntityManager.ts:688](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L688)*

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
`orderBy?` | [QueryOrderMap](../interfaces/queryordermap.md) |
`refresh?` | boolean |
`validate?` | boolean |

**Returns:** Promise&#60;[Loaded](../index.md#loaded)&#60;T, P> \| [Loaded](../index.md#loaded)&#60;T, P>[]>

___

### preparePopulate

▸ `Private`**preparePopulate**&#60;T>(`entityName`: string, `populate?`: [Populate](../index.md#populate)&#60;T>, `strategy?`: [LoadStrategy](../enums/loadstrategy.md)): [PopulateOptions](../index.md#populateoptions)&#60;T>[]

*Defined in [packages/core/src/EntityManager.ts:802](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L802)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`populate?` | [Populate](../index.md#populate)&#60;T> |
`strategy?` | [LoadStrategy](../enums/loadstrategy.md) |

**Returns:** [PopulateOptions](../index.md#populateoptions)&#60;T>[]

___

### preparePopulateObject

▸ `Private`**preparePopulateObject**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `populate`: [PopulateMap](../index.md#populatemap)&#60;T>, `strategy?`: [LoadStrategy](../enums/loadstrategy.md)): [PopulateOptions](../index.md#populateoptions)&#60;T>[]

*Defined in [packages/core/src/EntityManager.ts:831](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L831)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`populate` | [PopulateMap](../index.md#populatemap)&#60;T> |
`strategy?` | [LoadStrategy](../enums/loadstrategy.md) |

**Returns:** [PopulateOptions](../index.md#populateoptions)&#60;T>[]

___

### remove

▸ **remove**&#60;T>(`entity`: T \| [Reference](reference.md)&#60;T> \| (T \| [Reference](reference.md)&#60;T>)[]): this

*Defined in [packages/core/src/EntityManager.ts:608](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L608)*

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
`entity` | T \| [Reference](reference.md)&#60;T> \| (T \| [Reference](reference.md)&#60;T>)[] |

**Returns:** this

___

### removeAndFlush

▸ **removeAndFlush**(`entity`: [AnyEntity](../index.md#anyentity) \| [Reference](reference.md)&#60;[AnyEntity](../index.md#anyentity)>): Promise&#60;void>

*Defined in [packages/core/src/EntityManager.ts:626](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L626)*

Removes an entity instance immediately, flushing all not yet persisted changes to the database too.
Equivalent to `em.remove(e).flush()`

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [AnyEntity](../index.md#anyentity) \| [Reference](reference.md)&#60;[AnyEntity](../index.md#anyentity)> |

**Returns:** Promise&#60;void>

___

### removeLater

▸ **removeLater**(`entity`: [AnyEntity](../index.md#anyentity)): void

*Defined in [packages/core/src/EntityManager.ts:636](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L636)*

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

*Defined in [packages/core/src/EntityManager.ts:357](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L357)*

Rollbacks the transaction bound to this EntityManager.

**Returns:** Promise&#60;void>

___

### setFilterParams

▸ **setFilterParams**(`name`: string, `args`: [Dictionary](../index.md#dictionary)): void

*Defined in [packages/core/src/EntityManager.ts:165](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L165)*

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

*Defined in [packages/core/src/EntityManager.ts:880](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L880)*

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

*Defined in [packages/core/src/EntityManager.ts:327](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L327)*

Runs your callback wrapped inside a database transaction.

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`cb` | (em: D[*typeof* EntityManagerType]) => Promise&#60;T> | - |
`ctx` | any | this.transactionContext |

**Returns:** Promise&#60;T>

___

### tryCache

▸ **tryCache**&#60;T, R>(`entityName`: string, `config`: boolean \| number \| [string, number] \| undefined, `key`: unknown, `refresh?`: boolean, `merge?`: boolean): Promise&#60;{ data?: R ; key: string  } \| undefined>

*Defined in [packages/core/src/EntityManager.ts:852](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/EntityManager.ts#L852)*

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
