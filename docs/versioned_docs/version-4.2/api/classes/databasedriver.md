---
id: "databasedriver"
title: "Class: DatabaseDriver<C>"
sidebar_label: "DatabaseDriver"
---

## Type parameters

Name | Type |
------ | ------ |
`C` | [Connection](connection.md) |

## Hierarchy

* **DatabaseDriver**

## Implements

* [IDatabaseDriver](../interfaces/idatabasedriver.md)&#60;C>

## Constructors

### constructor

\+ `Protected`**new DatabaseDriver**(`config`: [Configuration](configuration.md), `dependencies`: string[]): [DatabaseDriver](databasedriver.md)

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:22](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L22)*

#### Parameters:

Name | Type |
------ | ------ |
`config` | [Configuration](configuration.md) |
`dependencies` | string[] |

**Returns:** [DatabaseDriver](databasedriver.md)

## Properties

### [EntityManagerType]

•  **[EntityManagerType]**: [EntityManager](entitymanager.md)&#60;this>

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md).[[EntityManagerType]](../interfaces/idatabasedriver.md#[entitymanagertype])*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:15](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L15)*

___

### comparator

• `Protected` **comparator**: [EntityComparator](entitycomparator.md)

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:21](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L21)*

___

### config

• `Protected` `Readonly` **config**: [Configuration](configuration.md)

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:24](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L24)*

___

### connection

• `Protected` `Readonly` **connection**: C

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:17](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L17)*

___

### dependencies

• `Protected` `Readonly` **dependencies**: string[]

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:25](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L25)*

___

### logger

• `Protected` `Readonly` **logger**: [Logger](logger.md) = this.config.getLogger()

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:20](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L20)*

___

### metadata

• `Protected` **metadata**: [MetadataStorage](metadatastorage.md)

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:22](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L22)*

___

### platform

• `Protected` `Readonly` **platform**: [Platform](platform.md)

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:19](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L19)*

___

### replicas

• `Protected` `Readonly` **replicas**: C[] = []

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:18](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L18)*

## Methods

### aggregate

▸ **aggregate**(`entityName`: string, `pipeline`: any[]): Promise&#60;any[]>

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:49](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L49)*

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`pipeline` | any[] |

**Returns:** Promise&#60;any[]>

___

### close

▸ **close**(`force?`: boolean): Promise&#60;void>

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:93](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L93)*

#### Parameters:

Name | Type |
------ | ------ |
`force?` | boolean |

**Returns:** Promise&#60;void>

___

### connect

▸ **connect**(): Promise&#60;C>

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:71](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L71)*

**Returns:** Promise&#60;C>

___

### convertException

▸ **convertException**(`exception`: [Error](driverexception.md#error)): [DriverException](driverexception.md)

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:226](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L226)*

Converts native db errors to standardized driver exceptions

#### Parameters:

Name | Type |
------ | ------ |
`exception` | [Error](driverexception.md#error) |

**Returns:** [DriverException](driverexception.md)

___

### count

▸ `Abstract`**count**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: [CountOptions](../interfaces/countoptions.md)&#60;T>, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;number>

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:43](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L43)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`options?` | [CountOptions](../interfaces/countoptions.md)&#60;T> |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;number>

___

### createEntityManager

▸ **createEntityManager**&#60;D>(`useContext?`: boolean): D[*typeof* EntityManagerType]

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:45](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L45)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`D` | [IDatabaseDriver](../interfaces/idatabasedriver.md) | IDatabaseDriver |

#### Parameters:

Name | Type |
------ | ------ |
`useContext?` | boolean |

**Returns:** D[*typeof* EntityManagerType]

___

### createReplicas

▸ `Protected`**createReplicas**(`cb`: (c: [ConnectionOptions](../interfaces/connectionoptions.md)) => C): C[]

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:190](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L190)*

#### Parameters:

Name | Type |
------ | ------ |
`cb` | (c: [ConnectionOptions](../interfaces/connectionoptions.md)) => C |

**Returns:** C[]

___

### ensureIndexes

▸ **ensureIndexes**(): Promise&#60;void>

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:117](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L117)*

**Returns:** Promise&#60;void>

___

### find

▸ `Abstract`**find**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: [FindOptions](../interfaces/findoptions.md)&#60;T>, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;[EntityData](../index.md#entitydata)&#60;T>[]>

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:27](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L27)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`options?` | [FindOptions](../interfaces/findoptions.md)&#60;T> |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;[EntityData](../index.md#entitydata)&#60;T>[]>

___

### findOne

▸ `Abstract`**findOne**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: [FindOneOptions](../interfaces/findoneoptions.md)&#60;T>, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;[EntityData](../index.md#entitydata)&#60;T> \| null>

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:29](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L29)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`options?` | [FindOneOptions](../interfaces/findoneoptions.md)&#60;T> |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;[EntityData](../index.md#entitydata)&#60;T> \| null>

___

### getConnection

▸ **getConnection**(`type?`: &#34;read&#34; \| &#34;write&#34;): C

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:83](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L83)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`type` | &#34;read&#34; \| &#34;write&#34; | "write" |

**Returns:** C

___

### getDependencies

▸ **getDependencies**(): string[]

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:113](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L113)*

**Returns:** string[]

___

### getPivotInverseProperty

▸ `Protected`**getPivotInverseProperty**(`prop`: [EntityProperty](../interfaces/entityproperty.md)): [EntityProperty](../interfaces/entityproperty.md)

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:175](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L175)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** [EntityProperty](../interfaces/entityproperty.md)

___

### getPivotOrderBy

▸ `Protected`**getPivotOrderBy**(`prop`: [EntityProperty](../interfaces/entityproperty.md), `orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md)): [QueryOrderMap](../interfaces/queryordermap.md)

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:154](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L154)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`orderBy?` | [QueryOrderMap](../interfaces/queryordermap.md) |

**Returns:** [QueryOrderMap](../interfaces/queryordermap.md)

___

### getPlatform

▸ **getPlatform**(): [Platform](platform.md)

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:98](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L98)*

**Returns:** [Platform](platform.md)

___

### getPrimaryKeyFields

▸ `Protected`**getPrimaryKeyFields**(`entityName`: string): string[]

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:170](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L170)*

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |

**Returns:** string[]

___

### inlineEmbeddables

▸ `Protected`**inlineEmbeddables**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `data`: T, `where?`: boolean): void

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:121](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L121)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`data` | T |
`where?` | boolean |

**Returns:** void

___

### loadFromPivotTable

▸ **loadFromPivotTable**&#60;T, O>(`prop`: [EntityProperty](../interfaces/entityproperty.md), `owners`: [Primary](../index.md#primary)&#60;O>[][], `where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `orderBy?`: [QueryOrderMap](../interfaces/queryordermap.md), `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;[Dictionary](../index.md#dictionary)&#60;T[]>>

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:53](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L53)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |
`O` | [AnyEntity](../index.md#anyentity)&#60;O> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`owners` | [Primary](../index.md#primary)&#60;O>[][] |
`where?` | [FilterQuery](../index.md#filterquery)&#60;T> |
`orderBy?` | [QueryOrderMap](../interfaces/queryordermap.md) |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;[Dictionary](../index.md#dictionary)&#60;T[]>>

___

### lockPessimistic

▸ **lockPessimistic**&#60;T>(`entity`: T, `mode`: [LockMode](../enums/lockmode.md), `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:203](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L203)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`mode` | [LockMode](../enums/lockmode.md) |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;void>

___

### mapResult

▸ **mapResult**&#60;T>(`result`: [EntityData](../index.md#entitydata)&#60;T>, `meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `populate?`: [PopulateOptions](../index.md#populateoptions)&#60;T>[]): [EntityData](../index.md#entitydata)&#60;T> \| null

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:63](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L63)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`result` | [EntityData](../index.md#entitydata)&#60;T> | - |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> | - |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] | [] |

**Returns:** [EntityData](../index.md#entitydata)&#60;T> \| null

___

### nativeDelete

▸ `Abstract`**nativeDelete**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;[QueryResult](../interfaces/queryresult.md)>

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:41](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L41)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;[QueryResult](../interfaces/queryresult.md)>

___

### nativeInsert

▸ `Abstract`**nativeInsert**&#60;T>(`entityName`: string, `data`: [EntityData](../index.md#entitydata)&#60;T>, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;[QueryResult](../interfaces/queryresult.md)>

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:31](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L31)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`data` | [EntityData](../index.md#entitydata)&#60;T> |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;[QueryResult](../interfaces/queryresult.md)>

___

### nativeInsertMany

▸ `Abstract`**nativeInsertMany**&#60;T>(`entityName`: string, `data`: [EntityData](../index.md#entitydata)&#60;T>[], `ctx?`: [Transaction](../index.md#transaction), `processCollections?`: boolean): Promise&#60;[QueryResult](../interfaces/queryresult.md)>

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:33](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L33)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`data` | [EntityData](../index.md#entitydata)&#60;T>[] |
`ctx?` | [Transaction](../index.md#transaction) |
`processCollections?` | boolean |

**Returns:** Promise&#60;[QueryResult](../interfaces/queryresult.md)>

___

### nativeUpdate

▸ `Abstract`**nativeUpdate**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;[QueryResult](../interfaces/queryresult.md)>

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:35](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L35)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`data` | [EntityData](../index.md#entitydata)&#60;T> |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;[QueryResult](../interfaces/queryresult.md)>

___

### nativeUpdateMany

▸ **nativeUpdateMany**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>[], `data`: [EntityData](../index.md#entitydata)&#60;T>[], `ctx?`: [Transaction](../index.md#transaction), `processCollections?`: boolean): Promise&#60;[QueryResult](../interfaces/queryresult.md)>

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:37](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L37)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`where` | [FilterQuery](../index.md#filterquery)&#60;T>[] |
`data` | [EntityData](../index.md#entitydata)&#60;T>[] |
`ctx?` | [Transaction](../index.md#transaction) |
`processCollections?` | boolean |

**Returns:** Promise&#60;[QueryResult](../interfaces/queryresult.md)>

___

### reconnect

▸ **reconnect**(): Promise&#60;C>

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:78](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L78)*

**Returns:** Promise&#60;C>

___

### rethrow

▸ `Protected`**rethrow**&#60;T>(`promise`: Promise&#60;T>): Promise&#60;T>

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:234](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L234)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`promise` | Promise&#60;T> |

**Returns:** Promise&#60;T>

___

### setMetadata

▸ **setMetadata**(`metadata`: [MetadataStorage](metadatastorage.md)): void

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:102](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L102)*

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [MetadataStorage](metadatastorage.md) |

**Returns:** void

___

### shouldHaveColumn

▸ `Protected`**shouldHaveColumn**&#60;T>(`prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;T>, `populate`: [PopulateOptions](../index.md#populateoptions)&#60;T>[], `includeFormulas?`: boolean): boolean

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:207](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L207)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;T> | - |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] | - |
`includeFormulas` | boolean | true |

**Returns:** boolean

___

### syncCollection

▸ **syncCollection**&#60;T, O>(`coll`: [Collection](collection.md)&#60;T, O>, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Implementation of [IDatabaseDriver](../interfaces/idatabasedriver.md)*

*Defined in [packages/core/src/drivers/DatabaseDriver.ts:57](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/DatabaseDriver.ts#L57)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |
`O` | [AnyEntity](../index.md#anyentity)&#60;O> |

#### Parameters:

Name | Type |
------ | ------ |
`coll` | [Collection](collection.md)&#60;T, O> |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;void>
