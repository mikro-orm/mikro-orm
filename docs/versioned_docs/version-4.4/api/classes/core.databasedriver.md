---
id: "core.databasedriver"
title: "Class: DatabaseDriver<C>"
sidebar_label: "DatabaseDriver"
hide_title: true
---

# Class: DatabaseDriver<C\>

[core](../modules/core.md).DatabaseDriver

## Type parameters

Name | Type |
------ | ------ |
`C` | [*Connection*](core.connection.md) |

## Hierarchy

* **DatabaseDriver**

  ↳ [*AbstractSqlDriver*](knex.abstractsqldriver.md)

## Implements

* [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<C\>

## Constructors

### constructor

\+ `Protected`**new DatabaseDriver**<C\>(`config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>, `dependencies`: *string*[]): [*DatabaseDriver*](core.databasedriver.md)<C\>

#### Type parameters:

Name | Type |
------ | ------ |
`C` | [*Connection*](core.connection.md)<C\> |

#### Parameters:

Name | Type |
------ | ------ |
`config` | [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |
`dependencies` | *string*[] |

**Returns:** [*DatabaseDriver*](core.databasedriver.md)<C\>

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:22](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L22)

## Properties

### \_\_@EntityManagerType@43871

• **\_\_@EntityManagerType@43871**: [*EntityManager*](core.entitymanager.md)<[*DatabaseDriver*](core.databasedriver.md)<C\>\>

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md).[__@EntityManagerType@43871](../interfaces/core.idatabasedriver.md#__@entitymanagertype@43871)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:15](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L15)

___

### comparator

• `Protected` **comparator**: [*EntityComparator*](core.entitycomparator.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:21](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L21)

___

### config

• `Protected` `Readonly` **config**: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

___

### connection

• `Protected` `Readonly` **connection**: C

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:17](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L17)

___

### dependencies

• `Protected` `Readonly` **dependencies**: *string*[]

___

### logger

• `Protected` `Readonly` **logger**: [*Logger*](core.logger.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:20](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L20)

___

### metadata

• `Protected` **metadata**: [*MetadataStorage*](core.metadatastorage.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:22](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L22)

___

### platform

• `Protected` `Readonly` **platform**: [*Platform*](core.platform.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:19](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L19)

___

### replicas

• `Protected` `Readonly` **replicas**: C[]

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:18](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L18)

## Methods

### aggregate

▸ **aggregate**(`entityName`: *string*, `pipeline`: *any*[]): *Promise*<*any*[]\>

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`pipeline` | *any*[] |

**Returns:** *Promise*<*any*[]\>

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:49](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L49)

___

### close

▸ **close**(`force?`: *boolean*): *Promise*<*void*\>

#### Parameters:

Name | Type |
------ | ------ |
`force?` | *boolean* |

**Returns:** *Promise*<*void*\>

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:93](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L93)

___

### connect

▸ **connect**(): *Promise*<C\>

**Returns:** *Promise*<C\>

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:71](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L71)

___

### convertException

▸ **convertException**(`exception`: Error): [*DriverException*](core.driverexception.md)

Converts native db errors to standardized driver exceptions

#### Parameters:

Name | Type |
------ | ------ |
`exception` | Error |

**Returns:** [*DriverException*](core.driverexception.md)

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:244](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L244)

___

### count

▸ `Abstract`**count**<T\>(`entityName`: *string*, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `options?`: [*CountOptions*](../interfaces/core.countoptions.md)<T\>, `ctx?`: *any*): *Promise*<*number*\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`options?` | [*CountOptions*](../interfaces/core.countoptions.md)<T\> |
`ctx?` | *any* |

**Returns:** *Promise*<*number*\>

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:43](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L43)

___

### createEntityManager

▸ **createEntityManager**<D\>(`useContext?`: *boolean*): D[*typeof* [*EntityManagerType*](../modules/core.md#entitymanagertype)]

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`D` | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md), D\> | [*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\\> |

#### Parameters:

Name | Type |
------ | ------ |
`useContext?` | *boolean* |

**Returns:** D[*typeof* [*EntityManagerType*](../modules/core.md#entitymanagertype)]

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:45](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L45)

___

### createReplicas

▸ `Protected`**createReplicas**(`cb`: (`c`: [*ConnectionOptions*](../interfaces/core.connectionoptions.md)) => C): C[]

#### Parameters:

Name | Type |
------ | ------ |
`cb` | (`c`: [*ConnectionOptions*](../interfaces/core.connectionoptions.md)) => C |

**Returns:** C[]

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:205](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L205)

___

### ensureIndexes

▸ **ensureIndexes**(): *Promise*<*void*\>

**Returns:** *Promise*<*void*\>

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:117](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L117)

___

### find

▸ `Abstract`**find**<T\>(`entityName`: *string*, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `options?`: [*FindOptions*](../interfaces/core.findoptions.md)<T, [*Populate*](../modules/core.md#populate)<T\>\>, `ctx?`: *any*): *Promise*<[*EntityData*](../modules/core.md#entitydata)<T\>[]\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`options?` | [*FindOptions*](../interfaces/core.findoptions.md)<T, [*Populate*](../modules/core.md#populate)<T\>\> |
`ctx?` | *any* |

**Returns:** *Promise*<[*EntityData*](../modules/core.md#entitydata)<T\>[]\>

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:27](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L27)

___

### findOne

▸ `Abstract`**findOne**<T\>(`entityName`: *string*, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `options?`: [*FindOneOptions*](../interfaces/core.findoneoptions.md)<T, [*Populate*](../modules/core.md#populate)<T\>\>, `ctx?`: *any*): *Promise*<*null* \| [*EntityData*](../modules/core.md#entitydata)<T\>\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`where` | [*FilterQuery*](../modules/core.md#filterquery)<T\> |
`options?` | [*FindOneOptions*](../interfaces/core.findoneoptions.md)<T, [*Populate*](../modules/core.md#populate)<T\>\> |
`ctx?` | *any* |

**Returns:** *Promise*<*null* \| [*EntityData*](../modules/core.md#entitydata)<T\>\>

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:29](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L29)

___

### getConnection

▸ **getConnection**(`type?`: *read* \| *write*): C

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`type` | *read* \| *write* | 'write' |

**Returns:** C

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:83](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L83)

___

### getDependencies

▸ **getDependencies**(): *string*[]

**Returns:** *string*[]

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:113](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L113)

___

### getPivotInverseProperty

▸ `Protected`**getPivotInverseProperty**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:190](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L190)

___

### getPivotOrderBy

▸ `Protected`**getPivotOrderBy**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md)): [*QueryOrderMap*](../interfaces/core.queryordermap.md)

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |

**Returns:** [*QueryOrderMap*](../interfaces/core.queryordermap.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:169](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L169)

___

### getPlatform

▸ **getPlatform**(): [*Platform*](core.platform.md)

**Returns:** [*Platform*](core.platform.md)

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:98](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L98)

___

### getPrimaryKeyFields

▸ `Protected`**getPrimaryKeyFields**(`entityName`: *string*): *string*[]

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |

**Returns:** *string*[]

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:185](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L185)

___

### inlineEmbeddables

▸ `Protected`**inlineEmbeddables**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `data`: T, `where?`: *boolean*): *void*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`data` | T |
`where?` | *boolean* |

**Returns:** *void*

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:121](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L121)

___

### loadFromPivotTable

▸ **loadFromPivotTable**<T, O\>(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `owners`: [*Primary*](../modules/core.md#primary)<O\>[][], `where?`: { `__@PrimaryKeyType@41543?`: *any*  } \| *NonNullable*<*Query*<T\>\>, `orderBy?`: [*QueryOrderMap*](../interfaces/core.queryordermap.md), `ctx?`: *any*, `options?`: [*FindOptions*](../interfaces/core.findoptions.md)<T, [*Populate*](../modules/core.md#populate)<T\>\>): *Promise*<[*Dictionary*](../modules/core.md#dictionary)<T[]\>\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |
`O` | [*AnyEntity*](../modules/core.md#anyentity)<O\> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`owners` | [*Primary*](../modules/core.md#primary)<O\>[][] |
`where?` | { `__@PrimaryKeyType@41543?`: *any*  } \| *NonNullable*<*Query*<T\>\> |
`orderBy?` | [*QueryOrderMap*](../interfaces/core.queryordermap.md) |
`ctx?` | *any* |
`options?` | [*FindOptions*](../interfaces/core.findoptions.md)<T, [*Populate*](../modules/core.md#populate)<T\>\> |

**Returns:** *Promise*<[*Dictionary*](../modules/core.md#dictionary)<T[]\>\>

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:53](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L53)

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

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:218](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L218)

___

### mapResult

▸ **mapResult**<T\>(`result`: [*EntityData*](../modules/core.md#entitydata)<T\>, `meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `populate?`: [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[]): *null* \| [*EntityData*](../modules/core.md#entitydata)<T\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`result` | [*EntityData*](../modules/core.md#entitydata)<T\> | - |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> | - |
`populate` | [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[] | ... |

**Returns:** *null* \| [*EntityData*](../modules/core.md#entitydata)<T\>

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:63](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L63)

___

### nativeDelete

▸ `Abstract`**nativeDelete**<T\>(`entityName`: *string*, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `ctx?`: *any*): *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

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

**Returns:** *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:41](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L41)

___

### nativeInsert

▸ `Abstract`**nativeInsert**<T\>(`entityName`: *string*, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `ctx?`: *any*, `convertCustomTypes?`: *boolean*): *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

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

**Returns:** *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:31](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L31)

___

### nativeInsertMany

▸ `Abstract`**nativeInsertMany**<T\>(`entityName`: *string*, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>[], `ctx?`: *any*, `processCollections?`: *boolean*, `convertCustomTypes?`: *boolean*): *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

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

**Returns:** *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:33](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L33)

___

### nativeUpdate

▸ `Abstract`**nativeUpdate**<T\>(`entityName`: *string*, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>, `ctx?`: *any*, `convertCustomTypes?`: *boolean*): *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

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

**Returns:** *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:35](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L35)

___

### nativeUpdateMany

▸ **nativeUpdateMany**<T\>(`entityName`: *string*, `where`: [*FilterQuery*](../modules/core.md#filterquery)<T\>[], `data`: [*EntityData*](../modules/core.md#entitydata)<T\>[], `ctx?`: *any*, `processCollections?`: *boolean*, `convertCustomTypes?`: *boolean*): *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

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

**Returns:** *Promise*<[*QueryResult*](../interfaces/core.queryresult.md)\>

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:37](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L37)

___

### reconnect

▸ **reconnect**(): *Promise*<C\>

**Returns:** *Promise*<C\>

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:78](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L78)

___

### rethrow

▸ `Protected`**rethrow**<T\>(`promise`: *Promise*<T\>): *Promise*<T\>

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`promise` | *Promise*<T\> |

**Returns:** *Promise*<T\>

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:252](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L252)

___

### setMetadata

▸ **setMetadata**(`metadata`: [*MetadataStorage*](core.metadatastorage.md)): *void*

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |

**Returns:** *void*

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:102](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L102)

___

### shouldHaveColumn

▸ **shouldHaveColumn**<T\>(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<T\>, `populate`: [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[], `includeFormulas?`: *boolean*): *boolean*

**`internal`** 

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<T\> | - |
`populate` | [*PopulateOptions*](../modules/core.md#populateoptions)<T\>[] | - |
`includeFormulas` | *boolean* | true |

**Returns:** *boolean*

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:225](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L225)

___

### syncCollection

▸ **syncCollection**<T, O\>(`coll`: [*Collection*](core.collection.md)<T, O\>, `ctx?`: *any*): *Promise*<*void*\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> |
`O` | [*AnyEntity*](../modules/core.md#anyentity)<O\> |

#### Parameters:

Name | Type |
------ | ------ |
`coll` | [*Collection*](core.collection.md)<T, O\> |
`ctx?` | *any* |

**Returns:** *Promise*<*void*\>

Implementation of: [IDatabaseDriver](../interfaces/core.idatabasedriver.md)

Defined in: [packages/core/src/drivers/DatabaseDriver.ts:57](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/drivers/DatabaseDriver.ts#L57)
