---
id: "mysqldriver"
title: "Class: MySqlDriver"
sidebar_label: "MySqlDriver"
---

## Hierarchy

* AbstractSqlDriver&#60;[MySqlConnection](mysqlconnection.md)>

  ↳ **MySqlDriver**

## Implements

* IDatabaseDriver&#60;[MySqlConnection](mysqlconnection.md)>

## Constructors

### constructor

\+ **new MySqlDriver**(`config`: Configuration): [MySqlDriver](mysqldriver.md)

*Overrides void*

*Defined in [packages/mysql-base/src/MySqlDriver.ts:6](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mysql-base/src/MySqlDriver.ts#L6)*

#### Parameters:

Name | Type |
------ | ------ |
`config` | Configuration |

**Returns:** [MySqlDriver](mysqldriver.md)

## Properties

### [EntityManagerType]

•  **[EntityManagerType]**: SqlEntityManager&#60;this>

*Inherited from [MariaDbDriver](mariadbdriver.md).[[EntityManagerType]](mariadbdriver.md#[entitymanagertype])*

*Overrides void*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:9*

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

• `Protected` `Readonly` **connection**: [MySqlConnection](mysqlconnection.md)

*Inherited from [MariaDbDriver](mariadbdriver.md).[connection](mariadbdriver.md#connection)*

*Overrides void*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:10*

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

• `Protected` `Readonly` **platform**: AbstractSqlPlatform

*Inherited from [MariaDbDriver](mariadbdriver.md).[platform](mariadbdriver.md#platform)*

*Overrides void*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:12*

___

### replicas

• `Protected` `Readonly` **replicas**: [MySqlConnection](mysqlconnection.md)[]

*Inherited from [MariaDbDriver](mariadbdriver.md).[replicas](mariadbdriver.md#replicas)*

*Overrides [MongoDriver](mongodriver.md).[replicas](mongodriver.md#replicas)*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:11*

## Methods

### aggregate

▸ **aggregate**(`entityName`: string, `pipeline`: any[]): Promise&#60;any[]>

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[aggregate](abstractsqldriver.md#aggregate)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:31*

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`pipeline` | any[] |

**Returns:** Promise&#60;any[]>

___

### autoJoinOneToOneOwner

▸ `Protected`**autoJoinOneToOneOwner**&#60;T>(`meta`: EntityMetadata, `populate`: [PopulateOptions](../index.md#populateoptions)&#60;T>[], `fields?`: string[]): [PopulateOptions](../index.md#populateoptions)&#60;T>[]

*Inherited from [MariaDbDriver](mariadbdriver.md).[autoJoinOneToOneOwner](mariadbdriver.md#autojoinonetooneowner)*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:33*

1:1 owner side needs to be marked for population so QB auto-joins the owner id

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] |
`fields?` | string[] |

**Returns:** [PopulateOptions](../index.md#populateoptions)&#60;T>[]

___

### buildFields

▸ `Protected`**buildFields**&#60;T>(`meta`: EntityMetadata&#60;T>, `populate`: [PopulateOptions](../index.md#populateoptions)&#60;T>[], `joinedProps`: [PopulateOptions](../index.md#populateoptions)&#60;T>[], `qb`: QueryBuilder&#60;T>, `fields?`: [Field](../index.md#field)&#60;T>[]): [Field](../index.md#field)&#60;T>[]

*Inherited from [MariaDbDriver](mariadbdriver.md).[buildFields](mariadbdriver.md#buildfields)*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:49*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata&#60;T> |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] |
`joinedProps` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] |
`qb` | QueryBuilder&#60;T> |
`fields?` | [Field](../index.md#field)&#60;T>[] |

**Returns:** [Field](../index.md#field)&#60;T>[]

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

▸ **connect**(): Promise&#60;[MySqlConnection](mysqlconnection.md)>

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[connect](abstractsqldriver.md#connect)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:35*

**Returns:** Promise&#60;[MySqlConnection](mysqlconnection.md)>

___

### convertException

▸ **convertException**(`exception`: [Error](driverexception.md#error)): DriverException

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[convertException](abstractsqldriver.md#convertexception)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:56*

**`inheritdoc`** 

#### Parameters:

Name | Type |
------ | ------ |
`exception` | [Error](driverexception.md#error) |

**Returns:** DriverException

___

### count

▸ **count**&#60;T>(`entityName`: string, `where`: any, `options?`: CountOptions&#60;T>, `ctx?`: Transaction&#60;KnexTransaction>): Promise&#60;number>

*Inherited from [MariaDbDriver](mariadbdriver.md).[count](mariadbdriver.md#count)*

*Overrides void*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:21*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`where` | any |
`options?` | CountOptions&#60;T> |
`ctx?` | Transaction&#60;KnexTransaction> |

**Returns:** Promise&#60;number>

___

### createEntityManager

▸ **createEntityManager**&#60;D>(`useContext?`: boolean): D[*typeof* EntityManagerType]

*Inherited from [MariaDbDriver](mariadbdriver.md).[createEntityManager](mariadbdriver.md#createentitymanager)*

*Overrides void*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:15*

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

### createQueryBuilder

▸ `Protected`**createQueryBuilder**&#60;T>(`entityName`: string, `ctx?`: Transaction&#60;KnexTransaction>, `write?`: boolean, `convertCustomTypes?`: boolean): QueryBuilder&#60;T>

*Inherited from [MariaDbDriver](mariadbdriver.md).[createQueryBuilder](mariadbdriver.md#createquerybuilder)*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:44*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`ctx?` | Transaction&#60;KnexTransaction> |
`write?` | boolean |
`convertCustomTypes?` | boolean |

**Returns:** QueryBuilder&#60;T>

___

### createReplicas

▸ `Protected`**createReplicas**(`cb`: (c: ConnectionOptions) => [MySqlConnection](mysqlconnection.md)): [MySqlConnection](mysqlconnection.md)[]

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[createReplicas](abstractsqldriver.md#createreplicas)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:47*

#### Parameters:

Name | Type |
------ | ------ |
`cb` | (c: ConnectionOptions) => [MySqlConnection](mysqlconnection.md) |

**Returns:** [MySqlConnection](mysqlconnection.md)[]

___

### ensureIndexes

▸ **ensureIndexes**(): Promise&#60;void>

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[ensureIndexes](abstractsqldriver.md#ensureindexes)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:42*

**Returns:** Promise&#60;void>

___

### execute

▸ **execute**&#60;T>(`queryOrKnex`: string \| KnexQueryBuilder \| Raw, `params?`: any[], `method?`: &#34;all&#34; \| &#34;get&#34; \| &#34;run&#34;, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;T>

*Inherited from [MariaDbDriver](mariadbdriver.md).[execute](mariadbdriver.md#execute)*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:29*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | QueryResult \| [EntityData](../index.md#entitydata)&#60;[AnyEntity](../index.md#anyentity)> \| [EntityData](../index.md#entitydata)&#60;[AnyEntity](../index.md#anyentity)>[] | EntityData\&#60;AnyEntity>[] |

#### Parameters:

Name | Type |
------ | ------ |
`queryOrKnex` | string \| KnexQueryBuilder \| Raw |
`params?` | any[] |
`method?` | &#34;all&#34; \| &#34;get&#34; \| &#34;run&#34; |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;T>

___

### extractManyToMany

▸ `Protected`**extractManyToMany**&#60;T>(`entityName`: string, `data`: [EntityData](../index.md#entitydata)&#60;T>): [EntityData](../index.md#entitydata)&#60;T>

*Inherited from [MariaDbDriver](mariadbdriver.md).[extractManyToMany](mariadbdriver.md#extractmanytomany)*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:45*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`data` | [EntityData](../index.md#entitydata)&#60;T> |

**Returns:** [EntityData](../index.md#entitydata)&#60;T>

___

### find

▸ **find**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: FindOptions&#60;T>, `ctx?`: Transaction&#60;KnexTransaction>): Promise&#60;[EntityData](../index.md#entitydata)&#60;T>[]>

*Inherited from [MariaDbDriver](mariadbdriver.md).[find](mariadbdriver.md#find)*

*Overrides void*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:16*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`options?` | FindOptions&#60;T> |
`ctx?` | Transaction&#60;KnexTransaction> |

**Returns:** Promise&#60;[EntityData](../index.md#entitydata)&#60;T>[]>

___

### findOne

▸ **findOne**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: FindOneOptions&#60;T>, `ctx?`: Transaction&#60;KnexTransaction>): Promise&#60;[EntityData](../index.md#entitydata)&#60;T> \| null>

*Inherited from [MariaDbDriver](mariadbdriver.md).[findOne](mariadbdriver.md#findone)*

*Overrides void*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:17*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`options?` | FindOneOptions&#60;T> |
`ctx?` | Transaction&#60;KnexTransaction> |

**Returns:** Promise&#60;[EntityData](../index.md#entitydata)&#60;T> \| null>

___

### getConnection

▸ **getConnection**(`type?`: &#34;read&#34; \| &#34;write&#34;): [MySqlConnection](mysqlconnection.md)

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[getConnection](abstractsqldriver.md#getconnection)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:37*

#### Parameters:

Name | Type |
------ | ------ |
`type?` | &#34;read&#34; \| &#34;write&#34; |

**Returns:** [MySqlConnection](mysqlconnection.md)

___

### getDependencies

▸ **getDependencies**(): string[]

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[getDependencies](abstractsqldriver.md#getdependencies)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:41*

**Returns:** string[]

___

### getFieldsForJoinedLoad

▸ `Protected`**getFieldsForJoinedLoad**&#60;T>(`qb`: QueryBuilder&#60;T>, `meta`: EntityMetadata&#60;T>, `populate?`: [PopulateOptions](../index.md#populateoptions)&#60;T>[], `parentTableAlias?`: string, `parentJoinPath?`: string): [Field](../index.md#field)&#60;T>[]

*Inherited from [MariaDbDriver](mariadbdriver.md).[getFieldsForJoinedLoad](mariadbdriver.md#getfieldsforjoinedload)*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:39*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`qb` | QueryBuilder&#60;T> |
`meta` | EntityMetadata&#60;T> |
`populate?` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] |
`parentTableAlias?` | string |
`parentJoinPath?` | string |

**Returns:** [Field](../index.md#field)&#60;T>[]

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

▸ **getPlatform**(): AbstractSqlPlatform

*Inherited from [MariaDbDriver](mariadbdriver.md).[getPlatform](mariadbdriver.md#getplatform)*

*Overrides [MongoDriver](mongodriver.md).[getPlatform](mongodriver.md#getplatform)*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:14*

**Returns:** AbstractSqlPlatform

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

### joinedProps

▸ `Protected`**joinedProps**&#60;T>(`meta`: EntityMetadata, `populate`: [PopulateOptions](../index.md#populateoptions)&#60;T>[]): [PopulateOptions](../index.md#populateoptions)&#60;T>[]

*Inherited from [MariaDbDriver](mariadbdriver.md).[joinedProps](mariadbdriver.md#joinedprops)*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:34*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] |

**Returns:** [PopulateOptions](../index.md#populateoptions)&#60;T>[]

___

### loadFromPivotTable

▸ **loadFromPivotTable**&#60;T, O>(`prop`: EntityProperty, `owners`: [Primary](../index.md#primary)&#60;O>[][], `where?`: [FilterQuery](../index.md#filterquery)&#60;T>, `orderBy?`: QueryOrderMap, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;[Dictionary](../index.md#dictionary)&#60;T[]>>

*Inherited from [MariaDbDriver](mariadbdriver.md).[loadFromPivotTable](mariadbdriver.md#loadfrompivottable)*

*Overrides [MongoDriver](mongodriver.md).[loadFromPivotTable](mongodriver.md#loadfrompivottable)*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:28*

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

*Inherited from [MariaDbDriver](mariadbdriver.md).[lockPessimistic](mariadbdriver.md#lockpessimistic)*

*Overrides [MongoDriver](mongodriver.md).[lockPessimistic](mongodriver.md#lockpessimistic)*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:48*

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

### mapPropToFieldNames

▸ **mapPropToFieldNames**&#60;T>(`qb`: QueryBuilder&#60;T>, `prop`: EntityProperty&#60;T>, `tableAlias?`: string): [Field](../index.md#field)&#60;T>[]

*Inherited from [MariaDbDriver](mariadbdriver.md).[mapPropToFieldNames](mariadbdriver.md#mapproptofieldnames)*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:43*

**`internal`** 

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`qb` | QueryBuilder&#60;T> |
`prop` | EntityProperty&#60;T> |
`tableAlias?` | string |

**Returns:** [Field](../index.md#field)&#60;T>[]

___

### mapResult

▸ **mapResult**&#60;T>(`result`: [EntityData](../index.md#entitydata)&#60;T>, `meta`: EntityMetadata&#60;T>, `populate?`: [PopulateOptions](../index.md#populateoptions)&#60;T>[], `qb?`: QueryBuilder&#60;T>, `map?`: [Dictionary](../index.md#dictionary)): [EntityData](../index.md#entitydata)&#60;T> \| null

*Inherited from [MariaDbDriver](mariadbdriver.md).[mapResult](mariadbdriver.md#mapresult)*

*Overrides [MongoDriver](mongodriver.md).[mapResult](mongodriver.md#mapresult)*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:18*

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
`qb?` | QueryBuilder&#60;T> |
`map?` | [Dictionary](../index.md#dictionary) |

**Returns:** [EntityData](../index.md#entitydata)&#60;T> \| null

___

### mergeJoinedResult

▸ **mergeJoinedResult**&#60;T>(`rawResults`: [Dictionary](../index.md#dictionary)[], `meta`: EntityMetadata&#60;T>): [EntityData](../index.md#entitydata)&#60;T>[]

*Inherited from [MariaDbDriver](mariadbdriver.md).[mergeJoinedResult](mariadbdriver.md#mergejoinedresult)*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:38*

**`internal`** 

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`rawResults` | [Dictionary](../index.md#dictionary)[] |
`meta` | EntityMetadata&#60;T> |

**Returns:** [EntityData](../index.md#entitydata)&#60;T>[]

___

### nativeDelete

▸ **nativeDelete**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T> \| string \| any, `ctx?`: Transaction&#60;KnexTransaction>): Promise&#60;QueryResult>

*Inherited from [MariaDbDriver](mariadbdriver.md).[nativeDelete](mariadbdriver.md#nativedelete)*

*Overrides void*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:26*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> \| string \| any |
`ctx?` | Transaction&#60;KnexTransaction> |

**Returns:** Promise&#60;QueryResult>

___

### nativeInsert

▸ **nativeInsert**&#60;T>(`entityName`: string, `data`: [EntityData](../index.md#entitydata)&#60;T>, `ctx?`: Transaction&#60;KnexTransaction>, `convertCustomTypes?`: boolean): Promise&#60;QueryResult>

*Inherited from [MariaDbDriver](mariadbdriver.md).[nativeInsert](mariadbdriver.md#nativeinsert)*

*Overrides void*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:22*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`data` | [EntityData](../index.md#entitydata)&#60;T> |
`ctx?` | Transaction&#60;KnexTransaction> |
`convertCustomTypes?` | boolean |

**Returns:** Promise&#60;QueryResult>

___

### nativeInsertMany

▸ **nativeInsertMany**&#60;T>(`entityName`: string, `data`: [EntityData](../index.md#entitydata)&#60;T>[], `ctx?`: Transaction&#60;Transaction>, `processCollections?`: boolean): Promise&#60;QueryResult>

*Overrides [PostgreSqlDriver](postgresqldriver.md).[nativeInsertMany](postgresqldriver.md#nativeinsertmany)*

*Defined in [packages/mysql-base/src/MySqlDriver.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mysql-base/src/MySqlDriver.ts#L12)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | string | - |
`data` | [EntityData](../index.md#entitydata)&#60;T>[] | - |
`ctx?` | Transaction&#60;Transaction> | - |
`processCollections` | boolean | true |

**Returns:** Promise&#60;QueryResult>

___

### nativeUpdate

▸ **nativeUpdate**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>, `ctx?`: Transaction&#60;KnexTransaction>, `convertCustomTypes?`: boolean): Promise&#60;QueryResult>

*Inherited from [MariaDbDriver](mariadbdriver.md).[nativeUpdate](mariadbdriver.md#nativeupdate)*

*Overrides void*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:24*

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
`ctx?` | Transaction&#60;KnexTransaction> |
`convertCustomTypes?` | boolean |

**Returns:** Promise&#60;QueryResult>

___

### nativeUpdateMany

▸ **nativeUpdateMany**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>[], `data`: [EntityData](../index.md#entitydata)&#60;T>[], `ctx?`: Transaction&#60;KnexTransaction>, `processCollections?`: boolean, `convertCustomTypes?`: boolean): Promise&#60;QueryResult>

*Inherited from [MariaDbDriver](mariadbdriver.md).[nativeUpdateMany](mariadbdriver.md#nativeupdatemany)*

*Overrides void*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:25*

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
`ctx?` | Transaction&#60;KnexTransaction> |
`processCollections?` | boolean |
`convertCustomTypes?` | boolean |

**Returns:** Promise&#60;QueryResult>

___

### processManyToMany

▸ `Protected`**processManyToMany**&#60;T>(`meta`: EntityMetadata&#60;T> \| undefined, `pks`: [Primary](../index.md#primary)&#60;T>[], `collections`: [EntityData](../index.md#entitydata)&#60;T>, `clear`: boolean, `ctx?`: Transaction&#60;KnexTransaction>): Promise&#60;void>

*Inherited from [MariaDbDriver](mariadbdriver.md).[processManyToMany](mariadbdriver.md#processmanytomany)*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:46*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata&#60;T> \| undefined |
`pks` | [Primary](../index.md#primary)&#60;T>[] |
`collections` | [EntityData](../index.md#entitydata)&#60;T> |
`clear` | boolean |
`ctx?` | Transaction&#60;KnexTransaction> |

**Returns:** Promise&#60;void>

___

### reconnect

▸ **reconnect**(): Promise&#60;[MySqlConnection](mysqlconnection.md)>

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[reconnect](abstractsqldriver.md#reconnect)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:36*

**Returns:** Promise&#60;[MySqlConnection](mysqlconnection.md)>

___

### rethrow

▸ `Protected`**rethrow**&#60;T>(`promise`: Promise&#60;T>): Promise&#60;T>

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[rethrow](abstractsqldriver.md#rethrow)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:57*

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

▸ **shouldHaveColumn**&#60;T>(`prop`: EntityProperty&#60;T>, `populate`: [PopulateOptions](../index.md#populateoptions)&#60;T>[], `includeFormulas?`: boolean): boolean

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[shouldHaveColumn](abstractsqldriver.md#shouldhavecolumn)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:52*

**`internal`** 

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty&#60;T> |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] |
`includeFormulas?` | boolean |

**Returns:** boolean

___

### syncCollection

▸ **syncCollection**&#60;T, O>(`coll`: Collection&#60;T, O>, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Inherited from [MariaDbDriver](mariadbdriver.md).[syncCollection](mariadbdriver.md#synccollection)*

*Overrides [MongoDriver](mongodriver.md).[syncCollection](mongodriver.md#synccollection)*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:27*

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

___

### updateCollectionDiff

▸ `Protected`**updateCollectionDiff**&#60;T, O>(`meta`: EntityMetadata&#60;O>, `prop`: EntityProperty&#60;T>, `pks`: [Primary](../index.md#primary)&#60;O>[], `deleteDiff`: [Primary](../index.md#primary)&#60;T>[][] \| boolean, `insertDiff`: [Primary](../index.md#primary)&#60;T>[][], `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Inherited from [MariaDbDriver](mariadbdriver.md).[updateCollectionDiff](mariadbdriver.md#updatecollectiondiff)*

*Defined in packages/knex/dist/AbstractSqlDriver.d.ts:47*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |
`O` | [AnyEntity](../index.md#anyentity)&#60;O> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata&#60;O> |
`prop` | EntityProperty&#60;T> |
`pks` | [Primary](../index.md#primary)&#60;O>[] |
`deleteDiff` | [Primary](../index.md#primary)&#60;T>[][] \| boolean |
`insertDiff` | [Primary](../index.md#primary)&#60;T>[][] |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;void>
