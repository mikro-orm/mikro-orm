---
id: "idatabasedriver"
title: "Interface: IDatabaseDriver<C>"
sidebar_label: "IDatabaseDriver"
---

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`C` | [Connection](../classes/connection.md) | Connection |

## Hierarchy

* **IDatabaseDriver**

## Implemented by

* [DatabaseDriver](../classes/databasedriver.md)

## Properties

### [EntityManagerType]

•  **[EntityManagerType]**: [EntityManager](../classes/entitymanager.md)&#60;this>

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:14](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L14)*

## Methods

### aggregate

▸ **aggregate**(`entityName`: string, `pipeline`: any[]): Promise&#60;any[]>

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:50](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L50)*

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`pipeline` | any[] |

**Returns:** Promise&#60;any[]>

___

### close

▸ **close**(`force?`: boolean): Promise&#60;void>

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:20](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L20)*

#### Parameters:

Name | Type |
------ | ------ |
`force?` | boolean |

**Returns:** Promise&#60;void>

___

### connect

▸ **connect**(): Promise&#60;C>

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:18](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L18)*

**Returns:** Promise&#60;C>

___

### convertException

▸ **convertException**(`exception`: [Error](../classes/driverexception.md#error)): [DriverException](../classes/driverexception.md)

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:76](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L76)*

Converts native db errors to standardized driver exceptions

#### Parameters:

Name | Type |
------ | ------ |
`exception` | [Error](../classes/driverexception.md#error) |

**Returns:** [DriverException](../classes/driverexception.md)

___

### count

▸ **count**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: [CountOptions](countoptions.md)&#60;T>, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;number>

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:48](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L48)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`options?` | [CountOptions](countoptions.md)&#60;T> |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;number>

___

### createEntityManager

▸ **createEntityManager**&#60;D>(`useContext?`: boolean): D[*typeof* EntityManagerType]

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:16](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L16)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`D` | [IDatabaseDriver](idatabasedriver.md) | IDatabaseDriver |

#### Parameters:

Name | Type |
------ | ------ |
`useContext?` | boolean |

**Returns:** D[*typeof* EntityManagerType]

___

### ensureIndexes

▸ **ensureIndexes**(): Promise&#60;void>

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:63](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L63)*

**Returns:** Promise&#60;void>

___

### find

▸ **find**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: [FindOptions](findoptions.md)&#60;T>, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;[EntityData](../index.md#entitydata)&#60;T>[]>

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:29](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L29)*

Finds selection of entities

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`options?` | [FindOptions](findoptions.md)&#60;T> |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;[EntityData](../index.md#entitydata)&#60;T>[]>

___

### findOne

▸ **findOne**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: [FindOneOptions](findoneoptions.md)&#60;T>, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;[EntityData](../index.md#entitydata)&#60;T> \| null>

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:34](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L34)*

Finds single entity (table row, document)

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`options?` | [FindOneOptions](findoneoptions.md)&#60;T> |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;[EntityData](../index.md#entitydata)&#60;T> \| null>

___

### getConnection

▸ **getConnection**(`type?`: &#34;read&#34; \| &#34;write&#34;): C

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:24](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L24)*

#### Parameters:

Name | Type |
------ | ------ |
`type?` | &#34;read&#34; \| &#34;write&#34; |

**Returns:** C

___

### getDependencies

▸ **getDependencies**(): string[]

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:69](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L69)*

Returns name of the underlying database dependencies (e.g. `mongodb` or `mysql2`)
for SQL drivers it also returns `knex` in the array as connectors are not used directly there

**Returns:** string[]

___

### getPlatform

▸ **getPlatform**(): [Platform](../classes/platform.md)

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:59](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L59)*

**Returns:** [Platform](../classes/platform.md)

___

### loadFromPivotTable

▸ **loadFromPivotTable**&#60;T, O>(`prop`: [EntityProperty](entityproperty.md), `owners`: [Primary](../index.md#primary)&#60;O>[][], `where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `orderBy?`: [QueryOrderMap](queryordermap.md), `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;[Dictionary](../index.md#dictionary)&#60;T[]>>

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:57](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L57)*

When driver uses pivot tables for M:N, this method will load identifiers for given collections from them

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |
`O` | [AnyEntity](../index.md#anyentity)&#60;O> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](entityproperty.md) |
`owners` | [Primary](../index.md#primary)&#60;O>[][] |
`where?` | [FilterQuery](../index.md#filterquery)&#60;T> |
`orderBy?` | [QueryOrderMap](queryordermap.md) |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;[Dictionary](../index.md#dictionary)&#60;T[]>>

___

### lockPessimistic

▸ **lockPessimistic**&#60;T>(`entity`: T, `mode`: [LockMode](../enums/lockmode.md), `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:71](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L71)*

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

▸ **mapResult**&#60;T>(`result`: [EntityData](../index.md#entitydata)&#60;T>, `meta`: [EntityMetadata](../classes/entitymetadata.md), `populate?`: [PopulateOptions](../index.md#populateoptions)&#60;T>[]): [EntityData](../index.md#entitydata)&#60;T> \| null

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:52](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L52)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`result` | [EntityData](../index.md#entitydata)&#60;T> |
`meta` | [EntityMetadata](../classes/entitymetadata.md) |
`populate?` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] |

**Returns:** [EntityData](../index.md#entitydata)&#60;T> \| null

___

### nativeDelete

▸ **nativeDelete**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;[QueryResult](queryresult.md)>

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:44](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L44)*

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

**Returns:** Promise&#60;[QueryResult](queryresult.md)>

___

### nativeInsert

▸ **nativeInsert**&#60;T>(`entityName`: string, `data`: [EntityData](../index.md#entitydata)&#60;T>, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;[QueryResult](queryresult.md)>

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:36](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L36)*

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

**Returns:** Promise&#60;[QueryResult](queryresult.md)>

___

### nativeInsertMany

▸ **nativeInsertMany**&#60;T>(`entityName`: string, `data`: [EntityData](../index.md#entitydata)&#60;T>[], `ctx?`: [Transaction](../index.md#transaction), `processCollections?`: boolean): Promise&#60;[QueryResult](queryresult.md)>

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:38](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L38)*

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

**Returns:** Promise&#60;[QueryResult](queryresult.md)>

___

### nativeUpdate

▸ **nativeUpdate**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;[QueryResult](queryresult.md)>

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:40](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L40)*

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

**Returns:** Promise&#60;[QueryResult](queryresult.md)>

___

### nativeUpdateMany

▸ **nativeUpdateMany**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>[], `data`: [EntityData](../index.md#entitydata)&#60;T>[], `ctx?`: [Transaction](../index.md#transaction), `processCollections?`: boolean): Promise&#60;[QueryResult](queryresult.md)>

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:42](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L42)*

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

**Returns:** Promise&#60;[QueryResult](queryresult.md)>

___

### reconnect

▸ **reconnect**(): Promise&#60;C>

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:22](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L22)*

**Returns:** Promise&#60;C>

___

### setMetadata

▸ **setMetadata**(`metadata`: [MetadataStorage](../classes/metadatastorage.md)): void

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:61](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L61)*

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [MetadataStorage](../classes/metadatastorage.md) |

**Returns:** void

___

### syncCollection

▸ **syncCollection**&#60;T, O>(`collection`: [Collection](../classes/collection.md)&#60;T, O>, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Defined in [packages/core/src/drivers/IDatabaseDriver.ts:46](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/drivers/IDatabaseDriver.ts#L46)*

#### Type parameters:

Name |
------ |
`T` |
`O` |

#### Parameters:

Name | Type |
------ | ------ |
`collection` | [Collection](../classes/collection.md)&#60;T, O> |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;void>
