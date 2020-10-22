---
id: "mongodriver"
title: "Class: MongoDriver"
sidebar_label: "MongoDriver"
---

## Hierarchy

* DatabaseDriver&#60;[MongoConnection](mongoconnection.md)>

  ↳ **MongoDriver**

## Implements

* IDatabaseDriver&#60;[MongoConnection](mongoconnection.md)>

## Constructors

### constructor

\+ **new MongoDriver**(`config`: Configuration): [MongoDriver](mongodriver.md)

*Overrides void*

*Defined in [packages/mongodb/src/MongoDriver.ts:15](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L15)*

#### Parameters:

Name | Type |
------ | ------ |
`config` | Configuration |

**Returns:** [MongoDriver](mongodriver.md)

## Properties

### [EntityManagerType]

•  **[EntityManagerType]**: [MongoEntityManager](mongoentitymanager.md)&#60;this>

*Overrides void*

*Defined in [packages/mongodb/src/MongoDriver.ts:12](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L12)*

___

### comparator

• `Protected` **comparator**: EntityComparator

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[comparator](abstractsqldriver.md#comparator)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:19*

___

### config

• `Protected` `Readonly` **config**: Configuration

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[config](abstractsqldriver.md#config)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:12*

___

### connection

• `Protected` `Readonly` **connection**: [MongoConnection](mongoconnection.md) = new MongoConnection(this.config)

*Overrides void*

*Defined in [packages/mongodb/src/MongoDriver.ts:14](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L14)*

___

### dependencies

• `Protected` `Readonly` **dependencies**: string[]

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[dependencies](abstractsqldriver.md#dependencies)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:13*

___

### logger

• `Protected` `Readonly` **logger**: Logger

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[logger](abstractsqldriver.md#logger)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:18*

___

### metadata

• `Protected` **metadata**: MetadataStorage

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[metadata](abstractsqldriver.md#metadata)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:20*

___

### platform

• `Protected` `Readonly` **platform**: [MongoPlatform](mongoplatform.md) = new MongoPlatform()

*Overrides void*

*Defined in [packages/mongodb/src/MongoDriver.ts:15](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L15)*

___

### replicas

• `Protected` `Readonly` **replicas**: [MongoConnection](mongoconnection.md)[]

*Inherited from [MongoDriver](mongodriver.md).[replicas](mongodriver.md#replicas)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:16*

## Methods

### aggregate

▸ **aggregate**(`entityName`: string, `pipeline`: any[], `ctx?`: [Transaction](../index.md#transaction)&#60;ClientSession>): Promise&#60;any[]>

*Overrides [AbstractSqlDriver](abstractsqldriver.md).[aggregate](abstractsqldriver.md#aggregate)*

*Defined in [packages/mongodb/src/MongoDriver.ts:86](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L86)*

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`pipeline` | any[] |
`ctx?` | [Transaction](../index.md#transaction)&#60;ClientSession> |

**Returns:** Promise&#60;any[]>

___

### buildFields

▸ `Private`**buildFields**&#60;T>(`entityName`: string, `populate`: [PopulateOptions](../index.md#populateoptions)&#60;T>[], `fields?`: string[]): string[] \| undefined

*Defined in [packages/mongodb/src/MongoDriver.ts:269](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L269)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] |
`fields?` | string[] |

**Returns:** string[] \| undefined

___

### buildFilterById

▸ `Private`**buildFilterById**&#60;T>(`entityName`: string, `id`: string): [FilterQuery](../index.md#filterquery)&#60;T>

*Defined in [packages/mongodb/src/MongoDriver.ts:259](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L259)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`id` | string |

**Returns:** [FilterQuery](../index.md#filterquery)&#60;T>

___

### close

▸ **close**(`force?`: boolean): Promise&#60;void>

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[close](abstractsqldriver.md#close)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:38*

#### Parameters:

Name | Type |
------ | ------ |
`force?` | boolean |

**Returns:** Promise&#60;void>

___

### connect

▸ **connect**(): Promise&#60;[MongoConnection](mongoconnection.md)>

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[connect](abstractsqldriver.md#connect)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:35*

**Returns:** Promise&#60;[MongoConnection](mongoconnection.md)>

___

### convertException

▸ **convertException**(`exception`: [Error](driverexception.md#error)): DriverException

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[convertException](abstractsqldriver.md#convertexception)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:53*

**`inheritdoc`** 

#### Parameters:

Name | Type |
------ | ------ |
`exception` | [Error](driverexception.md#error) |

**Returns:** DriverException

___

### convertObjectIds

▸ `Private`**convertObjectIds**&#60;T>(`data`: T): T

*Defined in [packages/mongodb/src/MongoDriver.ts:237](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L237)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | ObjectId \| [Dictionary](../index.md#dictionary) \| any[] |

#### Parameters:

Name | Type |
------ | ------ |
`data` | T |

**Returns:** T

___

### count

▸ **count**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: CountOptions&#60;T>, `ctx?`: [Transaction](../index.md#transaction)&#60;ClientSession>): Promise&#60;number>

*Overrides void*

*Defined in [packages/mongodb/src/MongoDriver.ts:45](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L45)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | string | - |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> | - |
`options` | CountOptions&#60;T> | {} |
`ctx?` | [Transaction](../index.md#transaction)&#60;ClientSession> | - |

**Returns:** Promise&#60;number>

___

### createCollections

▸ **createCollections**(): Promise&#60;void>

*Defined in [packages/mongodb/src/MongoDriver.ts:90](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L90)*

**Returns:** Promise&#60;void>

___

### createEntityManager

▸ **createEntityManager**&#60;D>(`useContext?`: boolean): D[*typeof* EntityManagerType]

*Overrides void*

*Defined in [packages/mongodb/src/MongoDriver.ts:21](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L21)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`D` | IDatabaseDriver | IDatabaseDriver |

#### Parameters:

Name | Type |
------ | ------ |
`useContext?` | boolean |

**Returns:** D[*typeof* EntityManagerType]

___

### createIndexes

▸ `Private`**createIndexes**(`meta`: EntityMetadata): Promise&#60;string>[]

*Defined in [packages/mongodb/src/MongoDriver.ts:128](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L128)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |

**Returns:** Promise&#60;string>[]

___

### createPropertyIndexes

▸ `Private`**createPropertyIndexes**(`meta`: EntityMetadata, `prop`: EntityProperty, `type`: &#34;index&#34; \| &#34;unique&#34;): Promise&#60;string>[]

*Defined in [packages/mongodb/src/MongoDriver.ts:172](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L172)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |
`prop` | EntityProperty |
`type` | &#34;index&#34; \| &#34;unique&#34; |

**Returns:** Promise&#60;string>[]

___

### createReplicas

▸ `Protected`**createReplicas**(`cb`: (c: ConnectionOptions) => [MongoConnection](mongoconnection.md)): [MongoConnection](mongoconnection.md)[]

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[createReplicas](abstractsqldriver.md#createreplicas)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:47*

#### Parameters:

Name | Type |
------ | ------ |
`cb` | (c: ConnectionOptions) => [MongoConnection](mongoconnection.md) |

**Returns:** [MongoConnection](mongoconnection.md)[]

___

### createUniqueIndexes

▸ `Private`**createUniqueIndexes**(`meta`: EntityMetadata): Promise&#60;string>[]

*Defined in [packages/mongodb/src/MongoDriver.ts:157](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L157)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |

**Returns:** Promise&#60;string>[]

___

### dropCollections

▸ **dropCollections**(): Promise&#60;void>

*Defined in [packages/mongodb/src/MongoDriver.ts:100](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L100)*

**Returns:** Promise&#60;void>

___

### ensureIndexes

▸ **ensureIndexes**(): Promise&#60;void>

*Overrides [AbstractSqlDriver](abstractsqldriver.md).[ensureIndexes](abstractsqldriver.md#ensureindexes)*

*Defined in [packages/mongodb/src/MongoDriver.ts:111](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L111)*

**Returns:** Promise&#60;void>

___

### find

▸ **find**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: FindOptions&#60;T>, `ctx?`: [Transaction](../index.md#transaction)&#60;ClientSession>): Promise&#60;[EntityData](../index.md#entitydata)&#60;T>[]>

*Overrides void*

*Defined in [packages/mongodb/src/MongoDriver.ts:25](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L25)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | string | - |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> | - |
`options` | FindOptions&#60;T> | {} |
`ctx?` | [Transaction](../index.md#transaction)&#60;ClientSession> | - |

**Returns:** Promise&#60;[EntityData](../index.md#entitydata)&#60;T>[]>

___

### findOne

▸ **findOne**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: FindOneOptions&#60;T>, `ctx?`: [Transaction](../index.md#transaction)&#60;ClientSession>): Promise&#60;[EntityData](../index.md#entitydata)&#60;T> \| null>

*Overrides void*

*Defined in [packages/mongodb/src/MongoDriver.ts:33](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L33)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | string | - |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> | - |
`options` | FindOneOptions&#60;T> | { populate: [], orderBy: {} } |
`ctx?` | [Transaction](../index.md#transaction)&#60;ClientSession> | - |

**Returns:** Promise&#60;[EntityData](../index.md#entitydata)&#60;T> \| null>

___

### getConnection

▸ **getConnection**(`type?`: &#34;read&#34; \| &#34;write&#34;): [MongoConnection](mongoconnection.md)

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[getConnection](abstractsqldriver.md#getconnection)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:37*

#### Parameters:

Name | Type |
------ | ------ |
`type?` | &#34;read&#34; \| &#34;write&#34; |

**Returns:** [MongoConnection](mongoconnection.md)

___

### getDependencies

▸ **getDependencies**(): string[]

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[getDependencies](abstractsqldriver.md#getdependencies)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:41*

**Returns:** string[]

___

### getPivotInverseProperty

▸ `Protected`**getPivotInverseProperty**(`prop`: EntityProperty): EntityProperty

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[getPivotInverseProperty](abstractsqldriver.md#getpivotinverseproperty)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:46*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty |

**Returns:** EntityProperty

___

### getPivotOrderBy

▸ `Protected`**getPivotOrderBy**(`prop`: EntityProperty, `orderBy?`: QueryOrderMap): QueryOrderMap

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[getPivotOrderBy](abstractsqldriver.md#getpivotorderby)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:44*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty |
`orderBy?` | QueryOrderMap |

**Returns:** QueryOrderMap

___

### getPlatform

▸ **getPlatform**(): Platform

*Inherited from [MongoDriver](mongodriver.md).[getPlatform](mongodriver.md#getplatform)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:39*

**Returns:** Platform

___

### getPrimaryKeyFields

▸ `Protected`**getPrimaryKeyFields**(`entityName`: string): string[]

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[getPrimaryKeyFields](abstractsqldriver.md#getprimarykeyfields)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:45*

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |

**Returns:** string[]

___

### inlineEmbeddables

▸ `Protected`**inlineEmbeddables**&#60;T>(`meta`: EntityMetadata&#60;T>, `data`: T, `where?`: boolean): void

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[inlineEmbeddables](abstractsqldriver.md#inlineembeddables)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:43*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata&#60;T> |
`data` | T |
`where?` | boolean |

**Returns:** void

___

### loadFromPivotTable

▸ **loadFromPivotTable**&#60;T, O>(`prop`: EntityProperty, `owners`: [Primary](../index.md#primary)&#60;O>[][], `where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `orderBy?`: QueryOrderMap, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;[Dictionary](../index.md#dictionary)&#60;T[]>>

*Inherited from [MongoDriver](mongodriver.md).[loadFromPivotTable](mongodriver.md#loadfrompivottable)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:32*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |
`O` | [AnyEntity](../index.md#anyentity)&#60;O> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty |
`owners` | [Primary](../index.md#primary)&#60;O>[][] |
`where?` | [FilterQuery](../index.md#filterquery)&#60;T> |
`orderBy?` | QueryOrderMap |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;[Dictionary](../index.md#dictionary)&#60;T[]>>

___

### lockPessimistic

▸ **lockPessimistic**&#60;T>(`entity`: T, `mode`: [LockMode](../enums/lockmode.md), `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Inherited from [MongoDriver](mongodriver.md).[lockPessimistic](mongodriver.md#lockpessimistic)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:48*

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

▸ **mapResult**&#60;T>(`result`: [EntityData](../index.md#entitydata)&#60;T>, `meta`: EntityMetadata&#60;T>, `populate?`: [PopulateOptions](../index.md#populateoptions)&#60;T>[]): [EntityData](../index.md#entitydata)&#60;T> \| null

*Inherited from [MongoDriver](mongodriver.md).[mapResult](mongodriver.md#mapresult)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:34*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`result` | [EntityData](../index.md#entitydata)&#60;T> |
`meta` | EntityMetadata&#60;T> |
`populate?` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] |

**Returns:** [EntityData](../index.md#entitydata)&#60;T> \| null

___

### nativeDelete

▸ **nativeDelete**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `ctx?`: [Transaction](../index.md#transaction)&#60;ClientSession>): Promise&#60;QueryResult>

*Overrides void*

*Defined in [packages/mongodb/src/MongoDriver.ts:76](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L76)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`ctx?` | [Transaction](../index.md#transaction)&#60;ClientSession> |

**Returns:** Promise&#60;QueryResult>

___

### nativeInsert

▸ **nativeInsert**&#60;T>(`entityName`: string, `data`: [EntityData](../index.md#entitydata)&#60;T>, `ctx?`: [Transaction](../index.md#transaction)&#60;ClientSession>): Promise&#60;QueryResult>

*Overrides void*

*Defined in [packages/mongodb/src/MongoDriver.ts:50](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L50)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`data` | [EntityData](../index.md#entitydata)&#60;T> |
`ctx?` | [Transaction](../index.md#transaction)&#60;ClientSession> |

**Returns:** Promise&#60;QueryResult>

___

### nativeInsertMany

▸ **nativeInsertMany**&#60;T>(`entityName`: string, `data`: [EntityData](../index.md#entitydata)&#60;T>[], `ctx?`: [Transaction](../index.md#transaction)&#60;ClientSession>, `processCollections?`: boolean): Promise&#60;QueryResult>

*Overrides void*

*Defined in [packages/mongodb/src/MongoDriver.ts:55](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L55)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | string | - |
`data` | [EntityData](../index.md#entitydata)&#60;T>[] | - |
`ctx?` | [Transaction](../index.md#transaction)&#60;ClientSession> | - |
`processCollections` | boolean | true |

**Returns:** Promise&#60;QueryResult>

___

### nativeUpdate

▸ **nativeUpdate**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>, `ctx?`: [Transaction](../index.md#transaction)&#60;ClientSession>): Promise&#60;QueryResult>

*Overrides void*

*Defined in [packages/mongodb/src/MongoDriver.ts:60](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L60)*

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
`ctx?` | [Transaction](../index.md#transaction)&#60;ClientSession> |

**Returns:** Promise&#60;QueryResult>

___

### nativeUpdateMany

▸ **nativeUpdateMany**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>[], `data`: [EntityData](../index.md#entitydata)&#60;T>[], `ctx?`: [Transaction](../index.md#transaction)&#60;ClientSession>, `processCollections?`: boolean): Promise&#60;QueryResult>

*Overrides void*

*Defined in [packages/mongodb/src/MongoDriver.ts:71](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L71)*

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
`ctx?` | [Transaction](../index.md#transaction)&#60;ClientSession> |
`processCollections?` | boolean |

**Returns:** Promise&#60;QueryResult>

___

### reconnect

▸ **reconnect**(): Promise&#60;[MongoConnection](mongoconnection.md)>

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[reconnect](abstractsqldriver.md#reconnect)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:36*

**Returns:** Promise&#60;[MongoConnection](mongoconnection.md)>

___

### renameFields

▸ `Private`**renameFields**&#60;T>(`entityName`: string, `data`: T, `where?`: boolean): T

*Defined in [packages/mongodb/src/MongoDriver.ts:186](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L186)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | string | - |
`data` | T | - |
`where` | boolean | false |

**Returns:** T

___

### rethrow

▸ `Protected`**rethrow**&#60;T>(`promise`: Promise&#60;T>): Promise&#60;T>

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[rethrow](abstractsqldriver.md#rethrow)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:54*

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

▸ **setMetadata**(`metadata`: MetadataStorage): void

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[setMetadata](abstractsqldriver.md#setmetadata)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:40*

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | MetadataStorage |

**Returns:** void

___

### shouldHaveColumn

▸ `Protected`**shouldHaveColumn**&#60;T>(`prop`: EntityProperty&#60;T>, `populate`: [PopulateOptions](../index.md#populateoptions)&#60;T>[]): boolean

*Overrides [AbstractSqlDriver](abstractsqldriver.md).[shouldHaveColumn](abstractsqldriver.md#shouldhavecolumn)*

*Defined in [packages/mongodb/src/MongoDriver.ts:283](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/mongodb/src/MongoDriver.ts#L283)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty&#60;T> |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] |

**Returns:** boolean

___

### syncCollection

▸ **syncCollection**&#60;T, O>(`coll`: Collection&#60;T, O>, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Inherited from [MongoDriver](mongodriver.md).[syncCollection](mongodriver.md#synccollection)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:33*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |
`O` | [AnyEntity](../index.md#anyentity)&#60;O> |

#### Parameters:

Name | Type |
------ | ------ |
`coll` | Collection&#60;T, O> |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;void>
