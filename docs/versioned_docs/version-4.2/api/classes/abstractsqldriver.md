---
id: "abstractsqldriver"
title: "Class: AbstractSqlDriver<C>"
sidebar_label: "AbstractSqlDriver"
---

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`C` | [AbstractSqlConnection](abstractsqlconnection.md) | AbstractSqlConnection |

## Hierarchy

* DatabaseDriver&#60;C>

  ↳ **AbstractSqlDriver**

## Implements

* IDatabaseDriver&#60;C>

## Constructors

### constructor

\+ `Protected`**new AbstractSqlDriver**(`config`: Configuration, `platform`: [AbstractSqlPlatform](abstractsqlplatform.md), `connection`: [Constructor](../index.md#constructor)&#60;C>, `connector`: string[]): [AbstractSqlDriver](abstractsqldriver.md)

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlDriver.ts:19](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L19)*

#### Parameters:

Name | Type |
------ | ------ |
`config` | Configuration |
`platform` | [AbstractSqlPlatform](abstractsqlplatform.md) |
`connection` | [Constructor](../index.md#constructor)&#60;C> |
`connector` | string[] |

**Returns:** [AbstractSqlDriver](abstractsqldriver.md)

## Properties

### [EntityManagerType]

•  **[EntityManagerType]**: [SqlEntityManager](sqlentitymanager.md)&#60;this>

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlDriver.ts:15](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L15)*

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

• `Protected` `Readonly` **connection**: C

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlDriver.ts:17](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L17)*

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

• `Protected` `Readonly` **platform**: [AbstractSqlPlatform](abstractsqlplatform.md)

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlDriver.ts:19](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L19)*

___

### replicas

• `Protected` `Readonly` **replicas**: C[] = []

*Overrides [MongoDriver](mongodriver.md).[replicas](mongodriver.md#replicas)*

*Defined in [packages/knex/src/AbstractSqlDriver.ts:18](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L18)*

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

### appendToCollection

▸ `Private`**appendToCollection**&#60;T>(`meta`: EntityMetadata&#60;T>, `collection`: [EntityData](../index.md#entitydata)&#60;T>[], `relationPojo`: [EntityData](../index.md#entitydata)&#60;T>): void

*Defined in [packages/knex/src/AbstractSqlDriver.ts:153](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L153)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata&#60;T> |
`collection` | [EntityData](../index.md#entitydata)&#60;T>[] |
`relationPojo` | [EntityData](../index.md#entitydata)&#60;T> |

**Returns:** void

___

### autoJoinOneToOneOwner

▸ `Protected`**autoJoinOneToOneOwner**&#60;T>(`meta`: EntityMetadata, `populate`: [PopulateOptions](../index.md#populateoptions)&#60;T>[], `fields?`: string[]): [PopulateOptions](../index.md#populateoptions)&#60;T>[]

*Defined in [packages/knex/src/AbstractSqlDriver.ts:417](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L417)*

1:1 owner side needs to be marked for population so QB auto-joins the owner id

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`meta` | EntityMetadata | - |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] | - |
`fields` | string[] | [] |

**Returns:** [PopulateOptions](../index.md#populateoptions)&#60;T>[]

___

### buildFields

▸ `Protected`**buildFields**&#60;T>(`meta`: EntityMetadata&#60;T>, `populate`: [PopulateOptions](../index.md#populateoptions)&#60;T>[], `joinedProps`: [PopulateOptions](../index.md#populateoptions)&#60;T>[], `qb`: [QueryBuilder](querybuilder.md)&#60;T>, `fields?`: [Field](../index.md#field)&#60;T>[]): [Field](../index.md#field)&#60;T>[]

*Defined in [packages/knex/src/AbstractSqlDriver.ts:567](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L567)*

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
`qb` | [QueryBuilder](querybuilder.md)&#60;T> |
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

▸ **connect**(): Promise&#60;C>

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[connect](abstractsqldriver.md#connect)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:35*

**Returns:** Promise&#60;C>

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

### count

▸ **count**&#60;T>(`entityName`: string, `where`: any, `options?`: CountOptions&#60;T>, `ctx?`: Transaction&#60;KnexTransaction>): Promise&#60;number>

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlDriver.ts:167](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L167)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | string | - |
`where` | any | - |
`options` | CountOptions&#60;T> | {} |
`ctx?` | Transaction&#60;KnexTransaction> | - |

**Returns:** Promise&#60;number>

___

### createEntityManager

▸ **createEntityManager**&#60;D>(`useContext?`: boolean): D[*typeof* EntityManagerType]

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlDriver.ts:32](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L32)*

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

▸ `Protected`**createQueryBuilder**&#60;T>(`entityName`: string, `ctx?`: Transaction&#60;KnexTransaction>, `write?`: boolean): [QueryBuilder](querybuilder.md)&#60;T>

*Defined in [packages/knex/src/AbstractSqlDriver.ts:487](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L487)*

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

**Returns:** [QueryBuilder](querybuilder.md)&#60;T>

___

### createReplicas

▸ `Protected`**createReplicas**(`cb`: (c: ConnectionOptions) => C): C[]

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[createReplicas](abstractsqldriver.md#createreplicas)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:47*

#### Parameters:

Name | Type |
------ | ------ |
`cb` | (c: ConnectionOptions) => C |

**Returns:** C[]

___

### ensureIndexes

▸ **ensureIndexes**(): Promise&#60;void>

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[ensureIndexes](abstractsqldriver.md#ensureindexes)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:42*

**Returns:** Promise&#60;void>

___

### execute

▸ **execute**&#60;T>(`queryOrKnex`: string \| KnexQueryBuilder \| Raw, `params?`: any[], `method?`: &#34;all&#34; \| &#34;get&#34; \| &#34;run&#34;, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;T>

*Defined in [packages/knex/src/AbstractSqlDriver.ts:410](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L410)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | QueryResult \| [EntityData](../index.md#entitydata)&#60;[AnyEntity](../index.md#anyentity)> \| [EntityData](../index.md#entitydata)&#60;[AnyEntity](../index.md#anyentity)>[] | EntityData\&#60;AnyEntity>[] |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`queryOrKnex` | string \| KnexQueryBuilder \| Raw | - |
`params` | any[] | [] |
`method` | &#34;all&#34; \| &#34;get&#34; \| &#34;run&#34; | "all" |
`ctx?` | [Transaction](../index.md#transaction) | - |

**Returns:** Promise&#60;T>

___

### extractManyToMany

▸ `Protected`**extractManyToMany**&#60;T>(`entityName`: string, `data`: [EntityData](../index.md#entitydata)&#60;T>): [EntityData](../index.md#entitydata)&#60;T>

*Defined in [packages/knex/src/AbstractSqlDriver.ts:491](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L491)*

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

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlDriver.ts:36](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L36)*

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
`ctx?` | Transaction&#60;KnexTransaction> | - |

**Returns:** Promise&#60;[EntityData](../index.md#entitydata)&#60;T>[]>

___

### findOne

▸ **findOne**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `options?`: FindOneOptions&#60;T>, `ctx?`: Transaction&#60;KnexTransaction>): Promise&#60;[EntityData](../index.md#entitydata)&#60;T> \| null>

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlDriver.ts:70](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L70)*

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

▸ **getConnection**(`type?`: &#34;read&#34; \| &#34;write&#34;): C

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[getConnection](abstractsqldriver.md#getconnection)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:37*

#### Parameters:

Name | Type |
------ | ------ |
`type?` | &#34;read&#34; \| &#34;write&#34; |

**Returns:** C

___

### getDependencies

▸ **getDependencies**(): string[]

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[getDependencies](abstractsqldriver.md#getdependencies)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:41*

**Returns:** string[]

___

### getFieldsForJoinedLoad

▸ `Protected`**getFieldsForJoinedLoad**&#60;T>(`qb`: [QueryBuilder](querybuilder.md)&#60;T>, `meta`: EntityMetadata&#60;T>, `populate?`: [PopulateOptions](../index.md#populateoptions)&#60;T>[], `parentTableAlias?`: string, `parentJoinPath?`: string): [Field](../index.md#field)&#60;T>[]

*Defined in [packages/knex/src/AbstractSqlDriver.ts:450](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L450)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`qb` | [QueryBuilder](querybuilder.md)&#60;T> | - |
`meta` | EntityMetadata&#60;T> | - |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] | [] |
`parentTableAlias?` | string | - |
`parentJoinPath?` | string | - |

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

▸ **getPlatform**(): [AbstractSqlPlatform](abstractsqlplatform.md)

*Overrides [MongoDriver](mongodriver.md).[getPlatform](mongodriver.md#getplatform)*

*Defined in [packages/knex/src/AbstractSqlDriver.ts:28](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L28)*

**Returns:** [AbstractSqlPlatform](abstractsqlplatform.md)

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

*Defined in [packages/knex/src/AbstractSqlDriver.ts:430](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L430)*

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

*Overrides [MongoDriver](mongodriver.md).[loadFromPivotTable](mongodriver.md#loadfrompivottable)*

*Defined in [packages/knex/src/AbstractSqlDriver.ts:380](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L380)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |
`O` | [AnyEntity](../index.md#anyentity)&#60;O> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`prop` | EntityProperty | - |
`owners` | [Primary](../index.md#primary)&#60;O>[][] | - |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> | {} |
`orderBy?` | QueryOrderMap | - |
`ctx?` | [Transaction](../index.md#transaction) | - |

**Returns:** Promise&#60;[Dictionary](../index.md#dictionary)&#60;T[]>>

___

### lockPessimistic

▸ **lockPessimistic**&#60;T>(`entity`: T, `mode`: [LockMode](../enums/lockmode.md), `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Overrides [MongoDriver](mongodriver.md).[lockPessimistic](mongodriver.md#lockpessimistic)*

*Defined in [packages/knex/src/AbstractSqlDriver.ts:559](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L559)*

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

### mapJoinedProps

▸ `Private`**mapJoinedProps**&#60;T>(`result`: [EntityData](../index.md#entitydata)&#60;T>, `meta`: EntityMetadata&#60;T>, `populate`: [PopulateOptions](../index.md#populateoptions)&#60;T>[], `qb`: [QueryBuilder](querybuilder.md)&#60;T>, `root`: [EntityData](../index.md#entitydata)&#60;T>, `map`: [Dictionary](../index.md#dictionary), `parentJoinPath?`: string): void

*Defined in [packages/knex/src/AbstractSqlDriver.ts:100](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L100)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`result` | [EntityData](../index.md#entitydata)&#60;T> |
`meta` | EntityMetadata&#60;T> |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] |
`qb` | [QueryBuilder](querybuilder.md)&#60;T> |
`root` | [EntityData](../index.md#entitydata)&#60;T> |
`map` | [Dictionary](../index.md#dictionary) |
`parentJoinPath?` | string |

**Returns:** void

___

### mapPropToFieldNames

▸ `Protected`**mapPropToFieldNames**&#60;T>(`qb`: [QueryBuilder](querybuilder.md)&#60;T>, `prop`: EntityProperty&#60;T>, `tableAlias?`: string): [Field](../index.md#field)&#60;T>[]

*Defined in [packages/knex/src/AbstractSqlDriver.ts:472](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L472)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`qb` | [QueryBuilder](querybuilder.md)&#60;T> |
`prop` | EntityProperty&#60;T> |
`tableAlias?` | string |

**Returns:** [Field](../index.md#field)&#60;T>[]

___

### mapResult

▸ **mapResult**&#60;T>(`result`: [EntityData](../index.md#entitydata)&#60;T>, `meta`: EntityMetadata&#60;T>, `populate?`: [PopulateOptions](../index.md#populateoptions)&#60;T>[], `qb?`: [QueryBuilder](querybuilder.md)&#60;T>, `map?`: [Dictionary](../index.md#dictionary)): [EntityData](../index.md#entitydata)&#60;T> \| null

*Overrides [MongoDriver](mongodriver.md).[mapResult](mongodriver.md#mapresult)*

*Defined in [packages/knex/src/AbstractSqlDriver.ts:85](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L85)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`result` | [EntityData](../index.md#entitydata)&#60;T> | - |
`meta` | EntityMetadata&#60;T> | - |
`populate` | [PopulateOptions](../index.md#populateoptions)&#60;T>[] | [] |
`qb?` | [QueryBuilder](querybuilder.md)&#60;T> | - |
`map` | [Dictionary](../index.md#dictionary) | {} |

**Returns:** [EntityData](../index.md#entitydata)&#60;T> \| null

___

### mergeJoinedResult

▸ `Protected`**mergeJoinedResult**&#60;T>(`rawResults`: [Dictionary](../index.md#dictionary)[], `meta`: EntityMetadata&#60;T>): [EntityData](../index.md#entitydata)&#60;T>[]

*Defined in [packages/knex/src/AbstractSqlDriver.ts:437](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L437)*

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

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlDriver.ts:334](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L334)*

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

▸ **nativeInsert**&#60;T>(`entityName`: string, `data`: [EntityData](../index.md#entitydata)&#60;T>, `ctx?`: Transaction&#60;KnexTransaction>): Promise&#60;QueryResult>

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlDriver.ts:181](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L181)*

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

**Returns:** Promise&#60;QueryResult>

___

### nativeInsertMany

▸ **nativeInsertMany**&#60;T>(`entityName`: string, `data`: [EntityData](../index.md#entitydata)&#60;T>[], `ctx?`: Transaction&#60;KnexTransaction>, `processCollections?`: boolean): Promise&#60;QueryResult>

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlDriver.ts:203](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L203)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | string | - |
`data` | [EntityData](../index.md#entitydata)&#60;T>[] | - |
`ctx?` | Transaction&#60;KnexTransaction> | - |
`processCollections` | boolean | true |

**Returns:** Promise&#60;QueryResult>

___

### nativeUpdate

▸ **nativeUpdate**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>, `ctx?`: Transaction&#60;KnexTransaction>): Promise&#60;QueryResult>

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlDriver.ts:259](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L259)*

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

**Returns:** Promise&#60;QueryResult>

___

### nativeUpdateMany

▸ **nativeUpdateMany**&#60;T>(`entityName`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>[], `data`: [EntityData](../index.md#entitydata)&#60;T>[], `ctx?`: Transaction&#60;KnexTransaction>, `processCollections?`: boolean): Promise&#60;QueryResult>

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlDriver.ts:284](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L284)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | string | - |
`where` | [FilterQuery](../index.md#filterquery)&#60;T>[] | - |
`data` | [EntityData](../index.md#entitydata)&#60;T>[] | - |
`ctx?` | Transaction&#60;KnexTransaction> | - |
`processCollections` | boolean | true |

**Returns:** Promise&#60;QueryResult>

___

### processManyToMany

▸ `Protected`**processManyToMany**&#60;T>(`meta`: EntityMetadata&#60;T> \| undefined, `pks`: [Primary](../index.md#primary)&#60;T>[], `collections`: [EntityData](../index.md#entitydata)&#60;T>, `clear`: boolean, `ctx?`: Transaction&#60;KnexTransaction>): Promise&#60;void>

*Defined in [packages/knex/src/AbstractSqlDriver.ts:508](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L508)*

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

▸ **reconnect**(): Promise&#60;C>

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[reconnect](abstractsqldriver.md#reconnect)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:36*

**Returns:** Promise&#60;C>

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

▸ `Protected`**shouldHaveColumn**&#60;T>(`prop`: EntityProperty&#60;T>, `populate`: [PopulateOptions](../index.md#populateoptions)&#60;T>[], `includeFormulas?`: boolean): boolean

*Inherited from [AbstractSqlDriver](abstractsqldriver.md).[shouldHaveColumn](abstractsqldriver.md#shouldhavecolumn)*

*Defined in packages/core/dist/drivers/DatabaseDriver.d.ts:49*

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

*Overrides [MongoDriver](mongodriver.md).[syncCollection](mongodriver.md#synccollection)*

*Defined in [packages/knex/src/AbstractSqlDriver.ts:346](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L346)*

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

*Defined in [packages/knex/src/AbstractSqlDriver.ts:520](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlDriver.ts#L520)*

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
