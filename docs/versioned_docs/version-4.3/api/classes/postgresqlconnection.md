---
id: "postgresqlconnection"
title: "Class: PostgreSqlConnection"
sidebar_label: "PostgreSqlConnection"
---

## Hierarchy

* AbstractSqlConnection

  ↳ **PostgreSqlConnection**

## Constructors

### constructor

\+ **new PostgreSqlConnection**(`config`: Configuration, `options?`: ConnectionOptions, `type?`: &#34;read&#34; \| &#34;write&#34;): [PostgreSqlConnection](postgresqlconnection.md)

*Inherited from [MariaDbConnection](mariadbconnection.md).[constructor](mariadbconnection.md#constructor)*

*Overrides [MongoConnection](mongoconnection.md).[constructor](mongoconnection.md#constructor)*

*Defined in packages/knex/dist/AbstractSqlConnection.d.ts:6*

#### Parameters:

Name | Type |
------ | ------ |
`config` | Configuration |
`options?` | ConnectionOptions |
`type?` | &#34;read&#34; \| &#34;write&#34; |

**Returns:** [PostgreSqlConnection](postgresqlconnection.md)

## Properties

### client

• `Protected` **client**: Knex

*Inherited from [MariaDbConnection](mariadbconnection.md).[client](mariadbconnection.md#client)*

*Overrides void*

*Defined in packages/knex/dist/AbstractSqlConnection.d.ts:6*

___

### config

• `Protected` `Readonly` **config**: Configuration

*Inherited from [AbstractSqlConnection](abstractsqlconnection.md).[config](abstractsqlconnection.md#config)*

*Defined in packages/core/dist/connections/Connection.d.ts:6*

___

### metadata

• `Protected` **metadata**: MetadataStorage

*Inherited from [AbstractSqlConnection](abstractsqlconnection.md).[metadata](abstractsqlconnection.md#metadata)*

*Defined in packages/core/dist/connections/Connection.d.ts:9*

___

### options

• `Protected` `Optional` `Readonly` **options**: ConnectionOptions \| undefined

*Inherited from [AbstractSqlConnection](abstractsqlconnection.md).[options](abstractsqlconnection.md#options)*

*Defined in packages/core/dist/connections/Connection.d.ts:7*

___

### platform

• `Protected` **platform**: AbstractSqlPlatform

*Inherited from [MariaDbConnection](mariadbconnection.md).[platform](mariadbconnection.md#platform)*

*Overrides [MongoConnection](mongoconnection.md).[platform](mongoconnection.md#platform)*

*Defined in packages/knex/dist/AbstractSqlConnection.d.ts:5*

___

### type

• `Protected` `Readonly` **type**: &#34;read&#34; \| &#34;write&#34;

*Inherited from [AbstractSqlConnection](abstractsqlconnection.md).[type](abstractsqlconnection.md#type)*

*Defined in packages/core/dist/connections/Connection.d.ts:8*

## Methods

### addColumn

▸ `Private`**addColumn**(`this`: any, `col`: [Dictionary](../index.md#dictionary), `that`: [PostgreSqlConnection](postgresqlconnection.md)): void

*Defined in [packages/postgresql/src/PostgreSqlConnection.ts:65](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/postgresql/src/PostgreSqlConnection.ts#L65)*

#### Parameters:

Name | Type |
------ | ------ |
`this` | any |
`col` | [Dictionary](../index.md#dictionary) |
`that` | [PostgreSqlConnection](postgresqlconnection.md) |

**Returns:** void

___

### alterColumnDefault

▸ `Private`**alterColumnDefault**(`this`: any, `col`: [Dictionary](../index.md#dictionary), `colName`: string): void

*Defined in [packages/postgresql/src/PostgreSqlConnection.ts:98](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/postgresql/src/PostgreSqlConnection.ts#L98)*

#### Parameters:

Name | Type |
------ | ------ |
`this` | any |
`col` | [Dictionary](../index.md#dictionary) |
`colName` | string |

**Returns:** void

___

### alterColumnNullable

▸ `Private`**alterColumnNullable**(`this`: any, `col`: [Dictionary](../index.md#dictionary), `colName`: string): void

*Defined in [packages/postgresql/src/PostgreSqlConnection.ts:83](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/postgresql/src/PostgreSqlConnection.ts#L83)*

#### Parameters:

Name | Type |
------ | ------ |
`this` | any |
`col` | [Dictionary](../index.md#dictionary) |
`colName` | string |

**Returns:** void

___

### begin

▸ **begin**(`ctx?`: KnexTransaction): Promise&#60;KnexTransaction>

*Inherited from [MariaDbConnection](mariadbconnection.md).[begin](mariadbconnection.md#begin)*

*Overrides void*

*Defined in packages/knex/dist/AbstractSqlConnection.d.ts:12*

#### Parameters:

Name | Type |
------ | ------ |
`ctx?` | KnexTransaction |

**Returns:** Promise&#60;KnexTransaction>

___

### close

▸ **close**(`force?`: boolean): Promise&#60;void>

*Inherited from [MariaDbConnection](mariadbconnection.md).[close](mariadbconnection.md#close)*

*Overrides void*

*Defined in packages/knex/dist/AbstractSqlConnection.d.ts:9*

#### Parameters:

Name | Type |
------ | ------ |
`force?` | boolean |

**Returns:** Promise&#60;void>

___

### commit

▸ **commit**(`ctx`: KnexTransaction): Promise&#60;void>

*Inherited from [MariaDbConnection](mariadbconnection.md).[commit](mariadbconnection.md#commit)*

*Overrides void*

*Defined in packages/knex/dist/AbstractSqlConnection.d.ts:13*

#### Parameters:

Name | Type |
------ | ------ |
`ctx` | KnexTransaction |

**Returns:** Promise&#60;void>

___

### connect

▸ **connect**(): Promise&#60;void>

*Overrides [AbstractSqlConnection](abstractsqlconnection.md).[connect](abstractsqlconnection.md#connect)*

*Defined in [packages/postgresql/src/PostgreSqlConnection.ts:7](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/postgresql/src/PostgreSqlConnection.ts#L7)*

**Returns:** Promise&#60;void>

___

### createKnexClient

▸ `Protected`**createKnexClient**(`type`: string): Knex

*Inherited from [MariaDbConnection](mariadbconnection.md).[createKnexClient](mariadbconnection.md#createknexclient)*

*Defined in packages/knex/dist/AbstractSqlConnection.d.ts:21*

#### Parameters:

Name | Type |
------ | ------ |
`type` | string |

**Returns:** Knex

___

### execute

▸ **execute**&#60;T>(`queryOrKnex`: string \| QueryBuilder \| Raw, `params?`: any[], `method?`: &#34;all&#34; \| &#34;get&#34; \| &#34;run&#34;, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;T>

*Inherited from [MariaDbConnection](mariadbconnection.md).[execute](mariadbconnection.md#execute)*

*Overrides void*

*Defined in packages/knex/dist/AbstractSqlConnection.d.ts:15*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | QueryResult \| [EntityData](../index.md#entitydata)&#60;[AnyEntity](../index.md#anyentity)> \| [EntityData](../index.md#entitydata)&#60;[AnyEntity](../index.md#anyentity)>[] | EntityData\&#60;AnyEntity>[] |

#### Parameters:

Name | Type |
------ | ------ |
`queryOrKnex` | string \| QueryBuilder \| Raw |
`params?` | any[] |
`method?` | &#34;all&#34; \| &#34;get&#34; \| &#34;run&#34; |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;T>

___

### executeQuery

▸ `Protected`**executeQuery**&#60;T>(`query`: string, `cb`: () => Promise&#60;T>): Promise&#60;T>

*Inherited from [AbstractSqlConnection](abstractsqlconnection.md).[executeQuery](abstractsqlconnection.md#executequery)*

*Defined in packages/core/dist/connections/Connection.d.ts:38*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`query` | string |
`cb` | () => Promise&#60;T> |

**Returns:** Promise&#60;T>

___

### getClientUrl

▸ **getClientUrl**(): string

*Inherited from [AbstractSqlConnection](abstractsqlconnection.md).[getClientUrl](abstractsqlconnection.md#getclienturl)*

*Defined in packages/core/dist/connections/Connection.d.ts:35*

**Returns:** string

___

### getConnectionOptions

▸ **getConnectionOptions**(): PgConnectionConfig

*Overrides [AbstractSqlConnection](abstractsqlconnection.md).[getConnectionOptions](abstractsqlconnection.md#getconnectionoptions)*

*Defined in [packages/postgresql/src/PostgreSqlConnection.ts:16](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/postgresql/src/PostgreSqlConnection.ts#L16)*

**Returns:** PgConnectionConfig

___

### getDefaultClientUrl

▸ **getDefaultClientUrl**(): string

*Overrides [AbstractSqlConnection](abstractsqlconnection.md).[getDefaultClientUrl](abstractsqlconnection.md#getdefaultclienturl)*

*Defined in [packages/postgresql/src/PostgreSqlConnection.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/postgresql/src/PostgreSqlConnection.ts#L12)*

**Returns:** string

___

### getKnex

▸ **getKnex**(): Knex

*Inherited from [MariaDbConnection](mariadbconnection.md).[getKnex](mariadbconnection.md#getknex)*

*Defined in packages/knex/dist/AbstractSqlConnection.d.ts:8*

**Returns:** Knex

___

### getKnexOptions

▸ `Protected`**getKnexOptions**(`type`: string): Config

*Inherited from [MariaDbConnection](mariadbconnection.md).[getKnexOptions](mariadbconnection.md#getknexoptions)*

*Defined in packages/knex/dist/AbstractSqlConnection.d.ts:22*

#### Parameters:

Name | Type |
------ | ------ |
`type` | string |

**Returns:** Config

___

### isConnected

▸ **isConnected**(): Promise&#60;boolean>

*Inherited from [MariaDbConnection](mariadbconnection.md).[isConnected](mariadbconnection.md#isconnected)*

*Overrides void*

*Defined in packages/knex/dist/AbstractSqlConnection.d.ts:10*

**Returns:** Promise&#60;boolean>

___

### loadFile

▸ **loadFile**(`path`: string): Promise&#60;void>

*Inherited from [MariaDbConnection](mariadbconnection.md).[loadFile](mariadbconnection.md#loadfile)*

*Defined in packages/knex/dist/AbstractSqlConnection.d.ts:19*

Execute raw SQL queries from file

#### Parameters:

Name | Type |
------ | ------ |
`path` | string |

**Returns:** Promise&#60;void>

___

### logQuery

▸ `Protected`**logQuery**(`query`: string, `took?`: number): void

*Inherited from [MariaDbConnection](mariadbconnection.md).[logQuery](mariadbconnection.md#logquery)*

*Overrides void*

*Defined in packages/knex/dist/AbstractSqlConnection.d.ts:20*

#### Parameters:

Name | Type |
------ | ------ |
`query` | string |
`took?` | number |

**Returns:** void

___

### patchKnex

▸ `Private`**patchKnex**(): void

*Defined in [packages/postgresql/src/PostgreSqlConnection.ts:48](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/postgresql/src/PostgreSqlConnection.ts#L48)*

monkey patch knex' postgres dialect so it correctly handles column updates (especially enums)

**Returns:** void

___

### rollback

▸ **rollback**(`ctx`: KnexTransaction): Promise&#60;void>

*Inherited from [MariaDbConnection](mariadbconnection.md).[rollback](mariadbconnection.md#rollback)*

*Overrides void*

*Defined in packages/knex/dist/AbstractSqlConnection.d.ts:14*

#### Parameters:

Name | Type |
------ | ------ |
`ctx` | KnexTransaction |

**Returns:** Promise&#60;void>

___

### setMetadata

▸ **setMetadata**(`metadata`: MetadataStorage): void

*Inherited from [AbstractSqlConnection](abstractsqlconnection.md).[setMetadata](abstractsqlconnection.md#setmetadata)*

*Defined in packages/core/dist/connections/Connection.d.ts:36*

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | MetadataStorage |

**Returns:** void

___

### setPlatform

▸ **setPlatform**(`platform`: Platform): void

*Inherited from [AbstractSqlConnection](abstractsqlconnection.md).[setPlatform](abstractsqlconnection.md#setplatform)*

*Defined in packages/core/dist/connections/Connection.d.ts:37*

#### Parameters:

Name | Type |
------ | ------ |
`platform` | Platform |

**Returns:** void

___

### transactional

▸ **transactional**&#60;T>(`cb`: (trx: Transaction&#60;KnexTransaction>) => Promise&#60;T>, `ctx?`: Transaction&#60;KnexTransaction>): Promise&#60;T>

*Inherited from [MariaDbConnection](mariadbconnection.md).[transactional](mariadbconnection.md#transactional)*

*Overrides void*

*Defined in packages/knex/dist/AbstractSqlConnection.d.ts:11*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`cb` | (trx: Transaction&#60;KnexTransaction>) => Promise&#60;T> |
`ctx?` | Transaction&#60;KnexTransaction> |

**Returns:** Promise&#60;T>

___

### transformRawResult

▸ `Protected`**transformRawResult**&#60;T>(`res`: any, `method`: &#34;all&#34; \| &#34;get&#34; \| &#34;run&#34;): T

*Overrides void*

*Defined in [packages/postgresql/src/PostgreSqlConnection.ts:28](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/postgresql/src/PostgreSqlConnection.ts#L28)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`res` | any |
`method` | &#34;all&#34; \| &#34;get&#34; \| &#34;run&#34; |

**Returns:** T
