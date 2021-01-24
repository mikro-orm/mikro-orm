---
id: "core.idatabasedriver"
title: "Interface: IDatabaseDriver<C>"
sidebar_label: "IDatabaseDriver"
hide_title: true
---

# Interface: IDatabaseDriver<C\>

[core](../modules/core.md).IDatabaseDriver

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`C` | [*Connection*](../classes/core.connection.md) | [*Connection*](../classes/core.connection.md) |

## Hierarchy

* **IDatabaseDriver**

## Implemented by

* [*DatabaseDriver*](../classes/core.databasedriver.md)

## Properties

### \_\_@EntityManagerType@43871

• **\_\_@EntityManagerType@43871**: [*EntityManager*](../classes/core.entitymanager.md)<[*IDatabaseDriver*](core.idatabasedriver.md)<C\>\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:14](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L14)

## Methods

### aggregate

▸ **aggregate**(`entityName`: *string*, `pipeline`: *any*[]): *Promise*<*any*[]\>

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`pipeline` | *any*[] |

**Returns:** *Promise*<*any*[]\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:50](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L50)

___

### close

▸ **close**(`force?`: *boolean*): *Promise*<*void*\>

#### Parameters:

Name | Type |
------ | ------ |
`force?` | *boolean* |

**Returns:** *Promise*<*void*\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:20](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L20)

___

### connect

▸ **connect**(): *Promise*<C\>

**Returns:** *Promise*<C\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:18](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L18)

___

### convertException

▸ **convertException**(`exception`: Error): [*DriverException*](../classes/core.driverexception.md)

Converts native db errors to standardized driver exceptions

#### Parameters:

Name | Type |
------ | ------ |
`exception` | Error |

**Returns:** [*DriverException*](../classes/core.driverexception.md)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:76](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L76)

___

### count

▸ **count**<T\>(`entityName`: *string*, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `options?`: [*CountOptions*](core.countoptions.md)<T\>, `ctx?`: *any*): *Promise*<*number*\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`options?` | [*CountOptions*](core.countoptions.md)<T\> |
`ctx?` | *any* |

**Returns:** *Promise*<*number*\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:48](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L48)

___

### createEntityManager

▸ **createEntityManager**<D\>(`useContext?`: *boolean*): D[*typeof* [*EntityManagerType*](../modules/core.md#entitymanagertype)]

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`D` | [*IDatabaseDriver*](core.idatabasedriver.md)<[*Connection*](../classes/core.connection.md), D\> | [*IDatabaseDriver*](core.idatabasedriver.md)<[*Connection*](../classes/core.connection.md)\\> |

#### Parameters:

Name | Type |
------ | ------ |
`useContext?` | *boolean* |

**Returns:** D[*typeof* [*EntityManagerType*](../modules/core.md#entitymanagertype)]

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:16](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L16)

___

### ensureIndexes

▸ **ensureIndexes**(): *Promise*<*void*\>

**Returns:** *Promise*<*void*\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:63](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L63)

___

### find

▸ **find**<T\>(`entityName`: *string*, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `options?`: [*FindOptions*](core.findoptions.md)<T, [*Populate*](../modules/core.md#populate)<T\>\>, `ctx?`: *any*): *Promise*<[*EntityData*](../modules/core.md#entitydata)<T\>[]\>

Finds selection of entities

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`options?` | [*FindOptions*](core.findoptions.md)<T, [*Populate*](../modules/core.md#populate)<T\>\> |
`ctx?` | *any* |

**Returns:** *Promise*<[*EntityData*](../modules/core.md#entitydata)<T\>[]\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:29](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L29)

___

### findOne

▸ **findOne**<T\>(`entityName`: *string*, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `options?`: [*FindOneOptions*](core.findoneoptions.md)<T, [*Populate*](../modules/core.md#populate)<T\>\>, `ctx?`: *any*): *Promise*<*null* \| [*EntityData*](../modules/core.md#entitydata)<T\>\>

Finds single entity (table row, document)

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`options?` | [*FindOneOptions*](core.findoneoptions.md)<T, [*Populate*](../modules/core.md#populate)<T\>\> |
`ctx?` | *any* |

**Returns:** *Promise*<*null* \| [*EntityData*](../modules/core.md#entitydata)<T\>\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:34](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L34)

___

### getConnection

▸ **getConnection**(`type?`: *read* \| *write*): C

#### Parameters:

Name | Type |
------ | ------ |
`type?` | *read* \| *write* |

**Returns:** C

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:24](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L24)

___

### getDependencies

▸ **getDependencies**(): *string*[]

Returns name of the underlying database dependencies (e.g. `mongodb` or `mysql2`)
for SQL drivers it also returns `knex` in the array as connectors are not used directly there

**Returns:** *string*[]

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:69](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L69)

___

### getPlatform

▸ **getPlatform**(): [*Platform*](../classes/core.platform.md)

**Returns:** [*Platform*](../classes/core.platform.md)

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:59](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L59)

___

### loadFromPivotTable

▸ **loadFromPivotTable**<T, O\>(`prop`: [*EntityProperty*](core.entityproperty.md)<*any*\>, `owners`: [*Primary*](../modules/core.md#primary)<O\>[][], `where?`: { `__@PrimaryKeyType@41543?`: *any*  } \| *NonNullable*<*Query*<T\>\>, `orderBy?`: [*QueryOrderMap*](core.queryordermap.md), `ctx?`: *any*, `options?`: [*FindOptions*](core.findoptions.md)<T, [*Populate*](../modules/core.md#populate)<T\>\>): *Promise*<[*Dictionary*](../modules/core.md#dictionary)<T[]\>\>

When driver uses pivot tables for M:N, this method will load identifiers for given collections from them

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |
`O` | [*AnyEntity*](../modules/core.md#anyentity)<O\> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](core.entityproperty.md)<*any*\> |
`owners` | [*Primary*](../modules/core.md#primary)<O\>[][] |
`where?` | { `__@PrimaryKeyType@41543?`: *any*  } \| *NonNullable*<*Query*<T\>\> |
`orderBy?` | [*QueryOrderMap*](core.queryordermap.md) |
`ctx?` | *any* |
`options?` | [*FindOptions*](core.findoptions.md)<T, [*Populate*](../modules/core.md#populate)<T\>\> |

**Returns:** *Promise*<[*Dictionary*](../modules/core.md#dictionary)<T[]\>\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:57](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L57)

___

### lockPessimistic

▸ **lockPessimistic**<T\>(`entity`: T, `mode`: [*LockMode*](../enums/core.lockmode.md), `ctx?`: *any*): *Promise*<*void*\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | T |
`mode` | [*LockMode*](../enums/core.lockmode.md) |
`ctx?` | *any* |

**Returns:** *Promise*<*void*\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:71](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L71)

___

### mapResult

▸ **mapResult**<T\>(`result`: [*EntityData*](../modules/core.md#entitydata)<T\>, `meta`: [*EntityMetadata*](../classes/core.entitymetadata.md)<*any*\>, `populate?`: [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]): *null* \| [*EntityData*](../modules/core.md#entitydata)<T\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`result` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`meta` | [*EntityMetadata*](../classes/core.entitymetadata.md)<*any*\> |
`populate?` | [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[] |

**Returns:** *null* \| [*EntityData*](../modules/core.md#entitydata)<T\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:52](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L52)

___

### nativeDelete

▸ **nativeDelete**<T\>(`entityName`: *string*, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `ctx?`: *any*): *Promise*<[*QueryResult*](core.queryresult.md)\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`ctx?` | *any* |

**Returns:** *Promise*<[*QueryResult*](core.queryresult.md)\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:44](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L44)

___

### nativeInsert

▸ **nativeInsert**<T\>(`entityName`: *string*, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `ctx?`: *any*, `convertCustomTypes?`: *boolean*): *Promise*<[*QueryResult*](core.queryresult.md)\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`ctx?` | *any* |
`convertCustomTypes?` | *boolean* |

**Returns:** *Promise*<[*QueryResult*](core.queryresult.md)\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:36](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L36)

___

### nativeInsertMany

▸ **nativeInsertMany**<T\>(`entityName`: *string*, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>[], `ctx?`: *any*, `processCollections?`: *boolean*, `convertCustomTypes?`: *boolean*): *Promise*<[*QueryResult*](core.queryresult.md)\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\>[] |
`ctx?` | *any* |
`processCollections?` | *boolean* |
`convertCustomTypes?` | *boolean* |

**Returns:** *Promise*<[*QueryResult*](core.queryresult.md)\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:38](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L38)

___

### nativeUpdate

▸ **nativeUpdate**<T\>(`entityName`: *string*, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `ctx?`: *any*, `convertCustomTypes?`: *boolean*): *Promise*<[*QueryResult*](core.queryresult.md)\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |
`ctx?` | *any* |
`convertCustomTypes?` | *boolean* |

**Returns:** *Promise*<[*QueryResult*](core.queryresult.md)\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:40](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L40)

___

### nativeUpdateMany

▸ **nativeUpdateMany**<T\>(`entityName`: *string*, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>[], `data`: [*EntityData*](../modules/core.md#entitydata)<T\>[], `ctx?`: *any*, `processCollections?`: *boolean*, `convertCustomTypes?`: *boolean*): *Promise*<[*QueryResult*](core.queryresult.md)\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\>[] |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\>[] |
`ctx?` | *any* |
`processCollections?` | *boolean* |
`convertCustomTypes?` | *boolean* |

**Returns:** *Promise*<[*QueryResult*](core.queryresult.md)\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:42](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L42)

___

### reconnect

▸ **reconnect**(): *Promise*<C\>

**Returns:** *Promise*<C\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:22](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L22)

___

### setMetadata

▸ **setMetadata**(`metadata`: [*MetadataStorage*](../classes/core.metadatastorage.md)): *void*

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [*MetadataStorage*](../classes/core.metadatastorage.md) |

**Returns:** *void*

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:61](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L61)

___

### syncCollection

▸ **syncCollection**<T, O\>(`collection`: [*Collection*](../classes/core.collection.md)<T, O\>, `ctx?`: *any*): *Promise*<*void*\>

#### Type parameters:

Name |
------ |
`T` |
`O` |

#### Parameters:

Name | Type |
------ | ------ |
`collection` | [*Collection*](../classes/core.collection.md)<T, O\> |
`ctx?` | *any* |

**Returns:** *Promise*<*void*\>

Defined in: [packages/core/src/drivers/IDatabaseDriver.ts:46](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/IDatabaseDriver.ts#L46)
