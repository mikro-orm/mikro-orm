---
id: "core.entitymanager"
title: "Class: EntityManager<D>"
sidebar_label: "EntityManager"
custom_edit_url: null
hide_title: true
---

# Class: EntityManager<D\>

[core](../modules/core.md).EntityManager

The EntityManager is the central access point to ORM functionality. It is a facade to all different ORM subsystems
such as UnitOfWork, Query Language and Repository API.

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`D` | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md) | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md) |

## Hierarchy

* **EntityManager**

  ↳ [*EntityManager*](knex.entitymanager.md)

  ↳ [*SqlEntityManager*](knex.sqlentitymanager.md)

## Constructors

### constructor

\+ **new EntityManager**<D\>(`config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>, `driver`: D, `metadata`: [*MetadataStorage*](core.metadatastorage.md), `useContext?`: *boolean*, `eventManager?`: [*EventManager*](core.eventmanager.md)): [*EntityManager*](core.entitymanager.md)<D\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`D` | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md), D\> | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\> |

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`config` | [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> | - |
`driver` | D | - |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) | - |
`useContext` | *boolean* | true |
`eventManager` | [*EventManager*](core.eventmanager.md) | - |

**Returns:** [*EntityManager*](core.entitymanager.md)<D\>

Defined in: [packages/core/src/EntityManager.ts:33](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L33)

## Properties

### comparator

• `Private` `Readonly` **comparator**: [*EntityComparator*](core.entitycomparator.md)

Defined in: [packages/core/src/EntityManager.ts:27](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L27)

___

### config

• `Readonly` **config**: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

___

### entityFactory

• `Private` `Readonly` **entityFactory**: [*EntityFactory*](core.entityfactory.md)

Defined in: [packages/core/src/EntityManager.ts:29](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L29)

___

### entityLoader

• `Private` `Readonly` **entityLoader**: [*EntityLoader*](core.entityloader.md)

Defined in: [packages/core/src/EntityManager.ts:26](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L26)

___

### filterParams

• `Private` **filterParams**: [*Dictionary*](../modules/core.md#dictionary)<[*Dictionary*](../modules/core.md#dictionary)<any\>\>

Defined in: [packages/core/src/EntityManager.ts:32](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L32)

___

### filters

• `Private` **filters**: [*Dictionary*](../modules/core.md#dictionary)<FilterDef<any\>\>

Defined in: [packages/core/src/EntityManager.ts:31](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L31)

___

### id

• `Readonly` **id**: *number*

Defined in: [packages/core/src/EntityManager.ts:22](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L22)

___

### name

• `Readonly` **name**: *string*

Defined in: [packages/core/src/EntityManager.ts:23](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L23)

___

### repositoryMap

• `Private` `Readonly` **repositoryMap**: [*Dictionary*](../modules/core.md#dictionary)<[*EntityRepository*](core.entityrepository.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>\>

Defined in: [packages/core/src/EntityManager.ts:25](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L25)

___

### resultCache

• `Private` `Readonly` **resultCache**: [*CacheAdapter*](../interfaces/core.cacheadapter.md)

Defined in: [packages/core/src/EntityManager.ts:30](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L30)

___

### transactionContext

• `Private` `Optional` **transactionContext**: *any*

Defined in: [packages/core/src/EntityManager.ts:33](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L33)

___

### unitOfWork

• `Private` `Readonly` **unitOfWork**: *any*

Defined in: [packages/core/src/EntityManager.ts:28](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L28)

___

### validator

• `Private` `Readonly` **validator**: [*EntityValidator*](core.entityvalidator.md)

Defined in: [packages/core/src/EntityManager.ts:24](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L24)

___

### counter

▪ `Private` `Static` **counter**: *number*= 1

Defined in: [packages/core/src/EntityManager.ts:21](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L21)

## Methods

### [custom]

▸ **[custom]**(): *string*

**Returns:** *string*

Defined in: [packages/core/src/EntityManager.ts:968](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L968)

___

### addFilter

▸ **addFilter**<T1\>(`name`: *string*, `cond`: [*FilterQuery*](../modules/core.md#filterquery)<T1\> \| (`args`: [*Dictionary*](../modules/core.md#dictionary)<any\>) => [*FilterQuery*](../modules/core.md#filterquery)<T1\>, `entityName?`: [*EntityName*](../modules/core.md#entityname)<T1\> \| [[*EntityName*](../modules/core.md#entityname)<T1\>], `enabled?`: *boolean*): *void*

Registers global filter to this entity manager. Global filters are enabled by default (unless disabled via last parameter).

#### Type parameters:

Name | Type |
:------ | :------ |
`T1` | [*AnyEntity*](../modules/core.md#anyentity)<T1\> |

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* |
`cond` | [*FilterQuery*](../modules/core.md#filterquery)<T1\> \| (`args`: [*Dictionary*](../modules/core.md#dictionary)<any\>) => [*FilterQuery*](../modules/core.md#filterquery)<T1\> |
`entityName?` | [*EntityName*](../modules/core.md#entityname)<T1\> \| [[*EntityName*](../modules/core.md#entityname)<T1\>] |
`enabled?` | *boolean* |

**Returns:** *void*

Defined in: [packages/core/src/EntityManager.ts:145](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L145)

▸ **addFilter**<T1, T2\>(`name`: *string*, `cond`: [*FilterQuery*](../modules/core.md#filterquery)<T1 \| T2\> \| (`args`: [*Dictionary*](../modules/core.md#dictionary)<any\>) => [*FilterQuery*](../modules/core.md#filterquery)<T1 \| T2\>, `entityName?`: [[*EntityName*](../modules/core.md#entityname)<T1\>, [*EntityName*](../modules/core.md#entityname)<T2\>], `enabled?`: *boolean*): *void*

Registers global filter to this entity manager. Global filters are enabled by default (unless disabled via last parameter).

#### Type parameters:

Name | Type |
:------ | :------ |
`T1` | [*AnyEntity*](../modules/core.md#anyentity)<T1\> |
`T2` | [*AnyEntity*](../modules/core.md#anyentity)<T2\> |

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* |
`cond` | [*FilterQuery*](../modules/core.md#filterquery)<T1 \| T2\> \| (`args`: [*Dictionary*](../modules/core.md#dictionary)<any\>) => [*FilterQuery*](../modules/core.md#filterquery)<T1 \| T2\> |
`entityName?` | [[*EntityName*](../modules/core.md#entityname)<T1\>, [*EntityName*](../modules/core.md#entityname)<T2\>] |
`enabled?` | *boolean* |

**Returns:** *void*

Defined in: [packages/core/src/EntityManager.ts:150](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L150)

▸ **addFilter**<T1, T2, T3\>(`name`: *string*, `cond`: [*FilterQuery*](../modules/core.md#filterquery)<T1 \| T2 \| T3\> \| (`args`: [*Dictionary*](../modules/core.md#dictionary)<any\>) => [*FilterQuery*](../modules/core.md#filterquery)<T1 \| T2 \| T3\>, `entityName?`: [[*EntityName*](../modules/core.md#entityname)<T1\>, [*EntityName*](../modules/core.md#entityname)<T2\>, [*EntityName*](../modules/core.md#entityname)<T3\>], `enabled?`: *boolean*): *void*

Registers global filter to this entity manager. Global filters are enabled by default (unless disabled via last parameter).

#### Type parameters:

Name | Type |
:------ | :------ |
`T1` | [*AnyEntity*](../modules/core.md#anyentity)<T1\> |
`T2` | [*AnyEntity*](../modules/core.md#anyentity)<T2\> |
`T3` | [*AnyEntity*](../modules/core.md#anyentity)<T3\> |

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* |
`cond` | [*FilterQuery*](../modules/core.md#filterquery)<T1 \| T2 \| T3\> \| (`args`: [*Dictionary*](../modules/core.md#dictionary)<any\>) => [*FilterQuery*](../modules/core.md#filterquery)<T1 \| T2 \| T3\> |
`entityName?` | [[*EntityName*](../modules/core.md#entityname)<T1\>, [*EntityName*](../modules/core.md#entityname)<T2\>, [*EntityName*](../modules/core.md#entityname)<T3\>] |
`enabled?` | *boolean* |

**Returns:** *void*

Defined in: [packages/core/src/EntityManager.ts:155](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L155)

___

### applyDiscriminatorCondition

▸ `Protected`**applyDiscriminatorCondition**<T\>(`entityName`: *string*, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>): [*FilterQuery*](../modules/core.md#filterquery)<T\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |

**Returns:** [*FilterQuery*](../modules/core.md#filterquery)<T\>

Defined in: [packages/core/src/EntityManager.ts:193](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L193)

___

### applyFilters

▸ **applyFilters**<T\>(`entityName`: *string*, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `options`: *boolean* \| *string*[] \| [*Dictionary*](../modules/core.md#dictionary)<boolean \| [*Dictionary*](../modules/core.md#dictionary)<any\>\>, `type`: *read* \| *update* \| *delete*): *Promise*<[*FilterQuery*](../modules/core.md#filterquery)<T\>\>

**`internal`** 

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`options` | *boolean* \| *string*[] \| [*Dictionary*](../modules/core.md#dictionary)<boolean \| [*Dictionary*](../modules/core.md#dictionary)<any\>\> |
`type` | *read* \| *update* \| *delete* |

**Returns:** *Promise*<[*FilterQuery*](../modules/core.md#filterquery)<T\>\>

Defined in: [packages/core/src/EntityManager.ts:218](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L218)

___

### assign

▸ **assign**<T\>(`entity`: T, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `options?`: [*AssignOptions*](../interfaces/core.assignoptions.md)): T

Shortcut for `wrap(entity).assign(data, { em })`

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`options` | [*AssignOptions*](../interfaces/core.assignoptions.md) |

**Returns:** T

Defined in: [packages/core/src/EntityManager.ts:546](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L546)

___

### begin

▸ **begin**(`ctx?`: *any*): *Promise*<void\>

Starts new transaction bound to this EntityManager. Use `ctx` parameter to provide the parent when nesting transactions.

#### Parameters:

Name | Type |
:------ | :------ |
`ctx?` | *any* |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/EntityManager.ts:394](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L394)

___

### canPopulate

▸ **canPopulate**<T\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `property`: *string*): *boolean*

Checks whether given property can be populated on the entity.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`property` | *string* |

**Returns:** *boolean*

Defined in: [packages/core/src/EntityManager.ts:712](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L712)

___

### checkLockRequirements

▸ `Private`**checkLockRequirements**(`mode`: *undefined* \| [*LockMode*](../enums/core.lockmode.md), `meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`mode` | *undefined* \| [*LockMode*](../enums/core.lockmode.md) |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |

**Returns:** *void*

Defined in: [packages/core/src/EntityManager.ts:857](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L857)

___

### clear

▸ **clear**(): *void*

Clears the EntityManager. All entities that are currently managed by this EntityManager become detached.

**Returns:** *void*

Defined in: [packages/core/src/EntityManager.ts:705](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L705)

___

### commit

▸ **commit**(): *Promise*<void\>

Commits the transaction bound to this EntityManager. Flushes before doing the actual commit query.

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/EntityManager.ts:401](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L401)

___

### count

▸ **count**<T\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `where?`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `options?`: [*CountOptions*](../interfaces/core.countoptions.md)<T\>): *Promise*<number\>

Returns total number of entities matching your `where` query.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`options` | [*CountOptions*](../interfaces/core.countoptions.md)<T\> |

**Returns:** *Promise*<number\>

Defined in: [packages/core/src/EntityManager.ts:596](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L596)

___

### create

▸ **create**<T, P\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `options?`: { `managed?`: *boolean*  }): [*Loaded*](../modules/core.md#loaded)<T, P\>

Creates new instance of given entity and populates it with given data

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | - |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`options` | *object* |
`options.managed?` | *boolean* |

**Returns:** [*Loaded*](../modules/core.md#loaded)<T, P\>

Defined in: [packages/core/src/EntityManager.ts:539](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L539)

___

### find

▸ **find**<T, P\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `options?`: [*FindOptions*](../interfaces/core.findoptions.md)<T, P\>): *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>[]\>

Finds all entities matching your `where` query. You can pass additional options via the `options` parameter.

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | - |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`options?` | [*FindOptions*](../interfaces/core.findoptions.md)<T, P\> |

**Returns:** *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>[]\>

Defined in: [packages/core/src/EntityManager.ts:88](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L88)

▸ **find**<T, P\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `populate?`: P, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md), `limit?`: *number*, `offset?`: *number*): *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>[]\>

Finds all entities matching your `where` query.

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | - |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`populate?` | P |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |
`limit?` | *number* |
`offset?` | *number* |

**Returns:** *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>[]\>

Defined in: [packages/core/src/EntityManager.ts:93](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L93)

___

### findAndCount

▸ **findAndCount**<T, P\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `options?`: [*FindOptions*](../interfaces/core.findoptions.md)<T, P\>): *Promise*<[[*Loaded*](../modules/core.md#loaded)<T, P\>[], *number*]\>

Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
where first element is the array of entities and the second is the count.

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | - |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`options?` | [*FindOptions*](../interfaces/core.findoptions.md)<T, P\> |

**Returns:** *Promise*<[[*Loaded*](../modules/core.md#loaded)<T, P\>[], *number*]\>

Defined in: [packages/core/src/EntityManager.ts:261](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L261)

▸ **findAndCount**<T, P\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `populate?`: P, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md), `limit?`: *number*, `offset?`: *number*): *Promise*<[[*Loaded*](../modules/core.md#loaded)<T, P\>[], *number*]\>

Calls `em.find()` and `em.count()` with the same arguments (where applicable) and returns the results as tuple
where first element is the array of entities and the second is the count.

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | - |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`populate?` | P |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |
`limit?` | *number* |
`offset?` | *number* |

**Returns:** *Promise*<[[*Loaded*](../modules/core.md#loaded)<T, P\>[], *number*]\>

Defined in: [packages/core/src/EntityManager.ts:267](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L267)

___

### findOne

▸ **findOne**<T, P\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `options?`: [*FindOneOptions*](../interfaces/core.findoneoptions.md)<T, P\>): *Promise*<*null* \| [*Loaded*](../modules/core.md#loaded)<T, P\>\>

Finds first entity matching your `where` query.

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | - |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`options?` | [*FindOneOptions*](../interfaces/core.findoneoptions.md)<T, P\> |

**Returns:** *Promise*<*null* \| [*Loaded*](../modules/core.md#loaded)<T, P\>\>

Defined in: [packages/core/src/EntityManager.ts:286](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L286)

▸ **findOne**<T, P\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `populate?`: P, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md)): *Promise*<*null* \| [*Loaded*](../modules/core.md#loaded)<T, P\>\>

Finds first entity matching your `where` query.

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | - |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`populate?` | P |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |

**Returns:** *Promise*<*null* \| [*Loaded*](../modules/core.md#loaded)<T, P\>\>

Defined in: [packages/core/src/EntityManager.ts:291](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L291)

___

### findOneOrFail

▸ **findOneOrFail**<T, P\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `options?`: [*FindOneOrFailOptions*](../interfaces/core.findoneorfailoptions.md)<T, P\>): *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>\>

Finds first entity matching your `where` query. If nothing found, it will throw an error.
You can override the factory for creating this method via `options.failHandler` locally
or via `Configuration.findOneOrFailHandler` globally.

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | - |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`options?` | [*FindOneOrFailOptions*](../interfaces/core.findoneorfailoptions.md)<T, P\> |

**Returns:** *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>\>

Defined in: [packages/core/src/EntityManager.ts:347](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L347)

▸ **findOneOrFail**<T, P\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `populate?`: P, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md)): *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>\>

Finds first entity matching your `where` query. If nothing found, it will throw an error.
You can override the factory for creating this method via `options.failHandler` locally
or via `Configuration.findOneOrFailHandler` globally.

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | - |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`populate?` | P |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |

**Returns:** *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>\>

Defined in: [packages/core/src/EntityManager.ts:354](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L354)

___

### flush

▸ **flush**(): *Promise*<void\>

Flushes all changes to objects that have been queued up to now to the database.
This effectively synchronizes the in-memory state of managed objects with the database.

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/EntityManager.ts:698](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L698)

___

### fork

▸ **fork**(`clear?`: *boolean*, `useContext?`: *boolean*): D[*typeof* [*EntityManagerType*](../modules/core.md#entitymanagertype)]

Returns new EntityManager instance with its own identity map

#### Parameters:

Name | Type | Default value | Description |
:------ | :------ | :------ | :------ |
`clear` | *boolean* | true | do we want clear identity map? defaults to true   |
`useContext` | *boolean* | false | use request context? should be used only for top level request scope EM, defaults to false    |

**Returns:** D[*typeof* [*EntityManagerType*](../modules/core.md#entitymanagertype)]

Defined in: [packages/core/src/EntityManager.ts:769](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L769)

___

### getComparator

▸ **getComparator**(): [*EntityComparator*](core.entitycomparator.md)

Gets the EntityComparator.

**Returns:** [*EntityComparator*](core.entitycomparator.md)

Defined in: [packages/core/src/EntityManager.ts:853](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L853)

___

### getConnection

▸ **getConnection**(`type?`: *read* \| *write*): *ReturnType*<D[*getConnection*]\>

Gets the Connection instance, by default returns write connection

#### Parameters:

Name | Type |
:------ | :------ |
`type?` | *read* \| *write* |

**Returns:** *ReturnType*<D[*getConnection*]\>

Defined in: [packages/core/src/EntityManager.ts:52](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L52)

___

### getContext

▸ **getContext**(): [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Gets the EntityManager based on current transaction/request context.

**Returns:** [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Defined in: [packages/core/src/EntityManager.ts:800](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L800)

___

### getDriver

▸ **getDriver**(): D

Gets the Driver instance used by this EntityManager.
Driver is singleton, for one MikroORM instance, only one driver is created.

**Returns:** D

Defined in: [packages/core/src/EntityManager.ts:45](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L45)

___

### getEntityFactory

▸ **getEntityFactory**(): [*EntityFactory*](core.entityfactory.md)

Gets the EntityFactory used by the EntityManager.

**Returns:** [*EntityFactory*](core.entityfactory.md)

Defined in: [packages/core/src/EntityManager.ts:793](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L793)

___

### getEventManager

▸ **getEventManager**(): [*EventManager*](core.eventmanager.md)

**Returns:** [*EventManager*](core.eventmanager.md)

Defined in: [packages/core/src/EntityManager.ts:811](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L811)

___

### getFilterParams

▸ **getFilterParams**<T\>(`name`: *string*): T

Returns filter parameters for given filter set in this context.

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*Dictionary*](../modules/core.md#dictionary)<any\> | [*Dictionary*](../modules/core.md#dictionary)<any\> |

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* |

**Returns:** T

Defined in: [packages/core/src/EntityManager.ts:181](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L181)

___

### getMetadata

▸ **getMetadata**(): [*MetadataStorage*](core.metadatastorage.md)

Gets the MetadataStorage.

**Returns:** [*MetadataStorage*](core.metadatastorage.md)

Defined in: [packages/core/src/EntityManager.ts:846](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L846)

___

### getPlatform

▸ **getPlatform**(): *ReturnType*<D[*getPlatform*]\>

Gets the platform instance. Just like the driver, platform is singleton, one for a MikroORM instance.

**Returns:** *ReturnType*<D[*getPlatform*]\>

Defined in: [packages/core/src/EntityManager.ts:59](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L59)

___

### getReference

▸ **getReference**<T, PK\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `id`: [*Primary*](../modules/core.md#primary)<T\>, `wrapped`: *true*, `convertCustomTypes?`: *boolean*): [*IdentifiedReference*](../modules/core.md#identifiedreference)<T, PK\>

Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |
`PK` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`id` | [*Primary*](../modules/core.md#primary)<T\> |
`wrapped` | *true* |
`convertCustomTypes?` | *boolean* |

**Returns:** [*IdentifiedReference*](../modules/core.md#identifiedreference)<T, PK\>

Defined in: [packages/core/src/EntityManager.ts:553](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L553)

▸ **getReference**<T\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `id`: [*Primary*](../modules/core.md#primary)<T\> \| [*Primary*](../modules/core.md#primary)<T\>[]): T

Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`id` | [*Primary*](../modules/core.md#primary)<T\> \| [*Primary*](../modules/core.md#primary)<T\>[] |

**Returns:** T

Defined in: [packages/core/src/EntityManager.ts:558](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L558)

▸ **getReference**<T\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `id`: [*Primary*](../modules/core.md#primary)<T\>, `wrapped`: *false*, `convertCustomTypes?`: *boolean*): T

Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`id` | [*Primary*](../modules/core.md#primary)<T\> |
`wrapped` | *false* |
`convertCustomTypes?` | *boolean* |

**Returns:** T

Defined in: [packages/core/src/EntityManager.ts:563](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L563)

▸ **getReference**<T\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `id`: [*Primary*](../modules/core.md#primary)<T\>, `wrapped?`: *boolean*, `convertCustomTypes?`: *boolean*): T \| [*Reference*](core.reference.md)<T\>

Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`id` | [*Primary*](../modules/core.md#primary)<T\> |
`wrapped?` | *boolean* |
`convertCustomTypes?` | *boolean* |

**Returns:** T \| [*Reference*](core.reference.md)<T\>

Defined in: [packages/core/src/EntityManager.ts:568](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L568)

___

### getRepository

▸ **getRepository**<T, U\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>): [*GetRepository*](../modules/core.md#getrepository)<T, U\>

Gets repository for given entity. You can pass either string name or entity class reference.

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | - |
`U` | [*EntityRepository*](core.entityrepository.md)<T, U\> | [*EntityRepository*](core.entityrepository.md)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |

**Returns:** [*GetRepository*](../modules/core.md#getrepository)<T, U\>

Defined in: [packages/core/src/EntityManager.ts:66](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L66)

___

### getTransactionContext

▸ **getTransactionContext**<T\>(): *undefined* \| T

Gets the transaction context (driver dependent object used to make sure queries are executed on same connection).

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | *unknown* | *any* |

**Returns:** *undefined* \| T

Defined in: [packages/core/src/EntityManager.ts:825](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L825)

___

### getUnitOfWork

▸ **getUnitOfWork**(): [*UnitOfWork*](core.unitofwork.md)

Gets the UnitOfWork used by the EntityManager to coordinate operations.

**Returns:** [*UnitOfWork*](core.unitofwork.md)

Defined in: [packages/core/src/EntityManager.ts:786](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L786)

___

### getValidator

▸ **getValidator**(): [*EntityValidator*](core.entityvalidator.md)

Gets EntityValidator instance

**Returns:** [*EntityValidator*](core.entityvalidator.md)

Defined in: [packages/core/src/EntityManager.ts:81](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L81)

___

### isInTransaction

▸ **isInTransaction**(): *boolean*

Checks whether this EntityManager is currently operating inside a database transaction.

**Returns:** *boolean*

Defined in: [packages/core/src/EntityManager.ts:818](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L818)

___

### lock

▸ **lock**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<any\>, `lockMode`: [*LockMode*](../enums/core.lockmode.md), `lockVersion?`: *number* \| Date): *Promise*<void\>

Runs your callback wrapped inside a database transaction.

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<any\> |
`lockMode` | [*LockMode*](../enums/core.lockmode.md) |
`lockVersion?` | *number* \| Date |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/EntityManager.ts:418](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L418)

___

### lockAndPopulate

▸ `Private`**lockAndPopulate**<T, P\>(`entityName`: *string*, `entity`: T, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `options`: [*FindOneOptions*](../interfaces/core.findoneoptions.md)<T, readonly *string*[] \| readonly keyof T[] \| boolean \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| PopulateChildren<T\>\>): *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | - |
`P` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`entity` | T |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`options` | [*FindOneOptions*](../interfaces/core.findoneoptions.md)<T, readonly *string*[] \| readonly keyof T[] \| boolean \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| PopulateChildren<T\>\> |

**Returns:** *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>\>

Defined in: [packages/core/src/EntityManager.ts:871](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L871)

___

### map

▸ **map**<T\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `result`: [*EntityData*](../modules/core.md#entitydata)<T\>): T

Maps raw database result to an entity and merges it to this EntityManager.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`result` | [*EntityData*](../modules/core.md#entitydata)<T\> |

**Returns:** T

Defined in: [packages/core/src/EntityManager.ts:481](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L481)

___

### merge

▸ **merge**<T\>(`entity`: T, `refresh?`: *boolean*): T

Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
via second parameter. By default it will return already loaded entities without modifying them.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |
`refresh?` | *boolean* |

**Returns:** T

Defined in: [packages/core/src/EntityManager.ts:501](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L501)

▸ **merge**<T\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `refresh?`: *boolean*, `convertCustomTypes?`: *boolean*): T

Merges given entity to this EntityManager so it becomes managed. You can force refreshing of existing entities
via second parameter. By default it will return already loaded entities without modifying them.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`refresh?` | *boolean* |
`convertCustomTypes?` | *boolean* |

**Returns:** T

Defined in: [packages/core/src/EntityManager.ts:507](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L507)

___

### nativeDelete

▸ **nativeDelete**<T\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `options?`: [*DeleteOptions*](../interfaces/core.deleteoptions.md)<T\>): *Promise*<number\>

Fires native delete query. Calling this has no side effects on the context (identity map).

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`options` | [*DeleteOptions*](../interfaces/core.deleteoptions.md)<T\> |

**Returns:** *Promise*<number\>

Defined in: [packages/core/src/EntityManager.ts:469](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L469)

___

### nativeInsert

▸ **nativeInsert**<T\>(`entity`: T): *Promise*<[*Primary*](../modules/core.md#primary)<T\>\>

Fires native insert query. Calling this has no side effects on the context (identity map).

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T |

**Returns:** *Promise*<[*Primary*](../modules/core.md#primary)<T\>\>

Defined in: [packages/core/src/EntityManager.ts:425](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L425)

▸ **nativeInsert**<T\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>): *Promise*<[*Primary*](../modules/core.md#primary)<T\>\>

Fires native insert query. Calling this has no side effects on the context (identity map).

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |

**Returns:** *Promise*<[*Primary*](../modules/core.md#primary)<T\>\>

Defined in: [packages/core/src/EntityManager.ts:430](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L430)

___

### nativeUpdate

▸ **nativeUpdate**<T\>(`entityName`: [*EntityName*](../modules/core.md#entityname)<T\>, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `options?`: [*UpdateOptions*](../interfaces/core.updateoptions.md)<T\>): *Promise*<number\>

Fires native update query. Calling this has no side effects on the context (identity map).

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | [*EntityName*](../modules/core.md#entityname)<T\> |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`options` | [*UpdateOptions*](../interfaces/core.updateoptions.md)<T\> |

**Returns:** *Promise*<number\>

Defined in: [packages/core/src/EntityManager.ts:455](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L455)

___

### persist

▸ **persist**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<any\> \| [*Reference*](core.reference.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> \| ([*AnyEntity*](../modules/core.md#anyentity)<any\> \| [*Reference*](core.reference.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>)[]): [*EntityManager*](core.entitymanager.md)<D\>

Tells the EntityManager to make an instance managed and persistent.
The entity will be entered into the database at or before transaction commit or as a result of the flush operation.

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<any\> \| [*Reference*](core.reference.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> \| ([*AnyEntity*](../modules/core.md#anyentity)<any\> \| [*Reference*](core.reference.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>)[] |

**Returns:** [*EntityManager*](core.entitymanager.md)<D\>

Defined in: [packages/core/src/EntityManager.ts:617](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L617)

___

### persistAndFlush

▸ **persistAndFlush**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<any\> \| [*Reference*](core.reference.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> \| ([*AnyEntity*](../modules/core.md#anyentity)<any\> \| [*Reference*](core.reference.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>)[]): *Promise*<void\>

Persists your entity immediately, flushing all not yet persisted changes to the database too.
Equivalent to `em.persist(e).flush()`.

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<any\> \| [*Reference*](core.reference.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> \| ([*AnyEntity*](../modules/core.md#anyentity)<any\> \| [*Reference*](core.reference.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>)[] |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/EntityManager.ts:642](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L642)

___

### persistLater

▸ **persistLater**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<any\> \| [*AnyEntity*](../modules/core.md#anyentity)<any\>[]): *void*

Tells the EntityManager to make an instance managed and persistent.
The entity will be entered into the database at or before transaction commit or as a result of the flush operation.

**`deprecated`** use `persist()`

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<any\> \| [*AnyEntity*](../modules/core.md#anyentity)<any\>[] |

**Returns:** *void*

Defined in: [packages/core/src/EntityManager.ts:652](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L652)

___

### populate

▸ **populate**<T, P\>(`entities`: T, `populate`: P, `where?`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md), `refresh?`: *boolean*, `validate?`: *boolean*): *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>\>

Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |
`P` | *string* \| *number* \| *boolean* \| *symbol* \| readonly *string*[] \| readonly keyof T[] \| *PopulateChildren*<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entities` | T |
`populate` | P |
`where?` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |
`refresh?` | *boolean* |
`validate?` | *boolean* |

**Returns:** *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>\>

Defined in: [packages/core/src/EntityManager.ts:732](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L732)

▸ **populate**<T, P\>(`entities`: T[], `populate`: P, `where?`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md), `refresh?`: *boolean*, `validate?`: *boolean*): *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>[]\>

Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |
`P` | *string* \| *number* \| *boolean* \| *symbol* \| readonly *string*[] \| readonly keyof T[] \| *PopulateChildren*<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entities` | T[] |
`populate` | P |
`where?` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |
`refresh?` | *boolean* |
`validate?` | *boolean* |

**Returns:** *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\>[]\>

Defined in: [packages/core/src/EntityManager.ts:737](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L737)

▸ **populate**<T, P\>(`entities`: T \| T[], `populate`: P, `where?`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md), `refresh?`: *boolean*, `validate?`: *boolean*): *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\> \| [*Loaded*](../modules/core.md#loaded)<T, P\>[]\>

Loads specified relations in batch. This will execute one query for each relation, that will populate it on all of the specified entities.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |
`P` | *string* \| *number* \| *boolean* \| *symbol* \| readonly *string*[] \| readonly keyof T[] \| *PopulateChildren*<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entities` | T \| T[] |
`populate` | P |
`where?` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |
`refresh?` | *boolean* |
`validate?` | *boolean* |

**Returns:** *Promise*<[*Loaded*](../modules/core.md#loaded)<T, P\> \| [*Loaded*](../modules/core.md#loaded)<T, P\>[]\>

Defined in: [packages/core/src/EntityManager.ts:742](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L742)

___

### preparePopulate

▸ `Private`**preparePopulate**<T\>(`entityName`: *string*, `populate?`: readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\>, `strategy?`: [*LoadStrategy*](../enums/core.loadstrategy.md)): [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`populate?` | readonly *string*[] \| readonly keyof T[] \| *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> |
`strategy?` | [*LoadStrategy*](../enums/core.loadstrategy.md) |

**Returns:** [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]

Defined in: [packages/core/src/EntityManager.ts:882](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L882)

___

### preparePopulateObject

▸ `Private`**preparePopulateObject**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `populate`: *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\>, `strategy?`: [*LoadStrategy*](../enums/core.loadstrategy.md)): [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`populate` | *boolean* \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| *PopulateChildren*<T\> |
`strategy?` | [*LoadStrategy*](../enums/core.loadstrategy.md) |

**Returns:** [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]

Defined in: [packages/core/src/EntityManager.ts:911](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L911)

___

### processWhere

▸ `Protected`**processWhere**<T\>(`entityName`: *string*, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `options`: [*FindOptions*](../interfaces/core.findoptions.md)<T, readonly *string*[] \| readonly keyof T[] \| boolean \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| PopulateChildren<T\>\>, `type`: *read* \| *update* \| *delete*): *Promise*<[*FilterQuery*](../modules/core.md#filterquery)<T\>\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`options` | [*FindOptions*](../interfaces/core.findoptions.md)<T, readonly *string*[] \| readonly keyof T[] \| boolean \| [*LoadStrategy*](../enums/core.loadstrategy.md) \| PopulateChildren<T\>\> |
`type` | *read* \| *update* \| *delete* |

**Returns:** *Promise*<[*FilterQuery*](../modules/core.md#filterquery)<T\>\>

Defined in: [packages/core/src/EntityManager.ts:185](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L185)

___

### remove

▸ **remove**<T\>(`entity`: T \| [*Reference*](core.reference.md)<T\> \| (T \| [*Reference*](core.reference.md)<T\>)[]): [*EntityManager*](core.entitymanager.md)<D\>

Marks entity for removal.
A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.

To remove entities by condition, use `em.nativeDelete()`.

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | T \| [*Reference*](core.reference.md)<T\> \| (T \| [*Reference*](core.reference.md)<T\>)[] |

**Returns:** [*EntityManager*](core.entitymanager.md)<D\>

Defined in: [packages/core/src/EntityManager.ts:662](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L662)

___

### removeAndFlush

▸ **removeAndFlush**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<any\> \| [*Reference*](core.reference.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>): *Promise*<void\>

Removes an entity instance immediately, flushing all not yet persisted changes to the database too.
Equivalent to `em.remove(e).flush()`

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<any\> \| [*Reference*](core.reference.md)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/EntityManager.ts:680](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L680)

___

### removeLater

▸ **removeLater**(`entity`: [*AnyEntity*](../modules/core.md#anyentity)<any\>): *void*

Marks entity for removal.
A removed entity will be removed from the database at or before transaction commit or as a result of the flush operation.

**`deprecated`** use `remove()`

#### Parameters:

Name | Type |
:------ | :------ |
`entity` | [*AnyEntity*](../modules/core.md#anyentity)<any\> |

**Returns:** *void*

Defined in: [packages/core/src/EntityManager.ts:690](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L690)

___

### resetTransactionContext

▸ **resetTransactionContext**(): *void*

Resets the transaction context.

**Returns:** *void*

Defined in: [packages/core/src/EntityManager.ts:839](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L839)

___

### rollback

▸ **rollback**(): *Promise*<void\>

Rollbacks the transaction bound to this EntityManager.

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/EntityManager.ts:410](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L410)

___

### setFilterParams

▸ **setFilterParams**(`name`: *string*, `args`: [*Dictionary*](../modules/core.md#dictionary)<any\>): *void*

Sets filter parameter values globally inside context defined by this entity manager.
If you want to set shared value for all contexts, be sure to use the root entity manager.

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* |
`args` | [*Dictionary*](../modules/core.md#dictionary)<any\> |

**Returns:** *void*

Defined in: [packages/core/src/EntityManager.ts:174](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L174)

___

### setTransactionContext

▸ **setTransactionContext**(`ctx`: *any*): *void*

Sets the transaction context.

#### Parameters:

Name | Type |
:------ | :------ |
`ctx` | *any* |

**Returns:** *void*

Defined in: [packages/core/src/EntityManager.ts:832](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L832)

___

### storeCache

▸ **storeCache**(`config`: *undefined* \| *number* \| *boolean* \| [*string*, *number*], `key`: { `key`: *string*  }, `data`: *unknown*): *Promise*<void\>

**`internal`** 

#### Parameters:

Name | Type |
:------ | :------ |
`config` | *undefined* \| *number* \| *boolean* \| [*string*, *number*] |
`key` | *object* |
`key.key` | *string* |
`data` | *unknown* |

**Returns:** *Promise*<void\>

Defined in: [packages/core/src/EntityManager.ts:960](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L960)

___

### transactional

▸ **transactional**<T\>(`cb`: (`em`: D[*typeof* [*EntityManagerType*](../modules/core.md#entitymanagertype)]) => *Promise*<T\>, `ctx?`: *any*): *Promise*<T\>

Runs your callback wrapped inside a database transaction.

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`cb` | (`em`: D[*typeof* [*EntityManagerType*](../modules/core.md#entitymanagertype)]) => *Promise*<T\> |
`ctx` | *any* |

**Returns:** *Promise*<T\>

Defined in: [packages/core/src/EntityManager.ts:377](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L377)

___

### tryCache

▸ **tryCache**<T, R\>(`entityName`: *string*, `config`: *undefined* \| *number* \| *boolean* \| [*string*, *number*], `key`: *unknown*, `refresh?`: *boolean*, `merge?`: *boolean*): *Promise*<undefined \| { `data?`: R ; `key`: *string*  }\>

**`internal`** 

#### Type parameters:

Name |
:------ |
`T` |
`R` |

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`config` | *undefined* \| *number* \| *boolean* \| [*string*, *number*] |
`key` | *unknown* |
`refresh?` | *boolean* |
`merge?` | *boolean* |

**Returns:** *Promise*<undefined \| { `data?`: R ; `key`: *string*  }\>

Defined in: [packages/core/src/EntityManager.ts:932](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/EntityManager.ts#L932)
