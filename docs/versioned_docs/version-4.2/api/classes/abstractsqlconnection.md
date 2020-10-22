---
id: "abstractsqlconnection"
title: "Class: AbstractSqlConnection"
sidebar_label: "AbstractSqlConnection"
---

## Hierarchy

* Connection

  ↳ **AbstractSqlConnection**

## Constructors

### constructor

\+ **new AbstractSqlConnection**(`config`: Configuration, `options?`: ConnectionOptions, `type?`: &#34;read&#34; \| &#34;write&#34;): [AbstractSqlConnection](abstractsqlconnection.md)

*Overrides [MongoConnection](mongoconnection.md).[constructor](mongoconnection.md#constructor)*

*Defined in [packages/knex/src/AbstractSqlConnection.ts:9](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlConnection.ts#L9)*

#### Parameters:

Name | Type |
------ | ------ |
`config` | Configuration |
`options?` | ConnectionOptions |
`type?` | &#34;read&#34; \| &#34;write&#34; |

**Returns:** [AbstractSqlConnection](abstractsqlconnection.md)

## Properties

### client

• `Protected` **client**: Knex

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlConnection.ts:9](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlConnection.ts#L9)*

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

• `Protected` **platform**: [AbstractSqlPlatform](abstractsqlplatform.md)

*Overrides [MongoConnection](mongoconnection.md).[platform](mongoconnection.md#platform)*

*Defined in [packages/knex/src/AbstractSqlConnection.ts:8](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlConnection.ts#L8)*

___

### type

• `Protected` `Readonly` **type**: &#34;read&#34; \| &#34;write&#34;

*Inherited from [AbstractSqlConnection](abstractsqlconnection.md).[type](abstractsqlconnection.md#type)*

*Defined in packages/core/dist/connections/Connection.d.ts:8*

## Methods

### begin

▸ **begin**(`ctx?`: KnexTransaction): Promise&#60;KnexTransaction>

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlConnection.ts:37](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlConnection.ts#L37)*

#### Parameters:

Name | Type |
------ | ------ |
`ctx?` | KnexTransaction |

**Returns:** Promise&#60;KnexTransaction>

___

### close

▸ **close**(`force?`: boolean): Promise&#60;void>

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlConnection.ts:20](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlConnection.ts#L20)*

#### Parameters:

Name | Type |
------ | ------ |
`force?` | boolean |

**Returns:** Promise&#60;void>

___

### commit

▸ **commit**(`ctx`: KnexTransaction): Promise&#60;void>

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlConnection.ts:41](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlConnection.ts#L41)*

#### Parameters:

Name | Type |
------ | ------ |
`ctx` | KnexTransaction |

**Returns:** Promise&#60;void>

___

### connect

▸ `Abstract`**connect**(): Promise&#60;void>

*Inherited from [AbstractSqlConnection](abstractsqlconnection.md).[connect](abstractsqlconnection.md#connect)*

*Defined in packages/core/dist/connections/Connection.d.ts:16*

Establishes connection to database

**Returns:** Promise&#60;void>

___

### createKnexClient

▸ `Protected`**createKnexClient**(`type`: string): Knex

*Defined in [packages/knex/src/AbstractSqlConnection.ts:84](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlConnection.ts#L84)*

#### Parameters:

Name | Type |
------ | ------ |
`type` | string |

**Returns:** Knex

___

### execute

▸ **execute**&#60;T>(`queryOrKnex`: string \| QueryBuilder \| Raw, `params?`: any[], `method?`: &#34;all&#34; \| &#34;get&#34; \| &#34;run&#34;, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;T>

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlConnection.ts:49](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlConnection.ts#L49)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | QueryResult \| [EntityData](../index.md#entitydata)&#60;[AnyEntity](../index.md#anyentity)> \| [EntityData](../index.md#entitydata)&#60;[AnyEntity](../index.md#anyentity)>[] | EntityData\&#60;AnyEntity>[] |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`queryOrKnex` | string \| QueryBuilder \| Raw | - |
`params` | any[] | [] |
`method` | &#34;all&#34; \| &#34;get&#34; \| &#34;run&#34; | "all" |
`ctx?` | [Transaction](../index.md#transaction) | - |

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

▸ **getConnectionOptions**(): ConnectionConfig

*Inherited from [AbstractSqlConnection](abstractsqlconnection.md).[getConnectionOptions](abstractsqlconnection.md#getconnectionoptions)*

*Defined in packages/core/dist/connections/Connection.d.ts:34*

**Returns:** ConnectionConfig

___

### getDefaultClientUrl

▸ `Abstract`**getDefaultClientUrl**(): string

*Inherited from [AbstractSqlConnection](abstractsqlconnection.md).[getDefaultClientUrl](abstractsqlconnection.md#getdefaultclienturl)*

*Defined in packages/core/dist/connections/Connection.d.ts:28*

Returns default client url for given driver (e.g. mongodb://127.0.0.1:27017 for mongodb)

**Returns:** string

___

### getKnex

▸ **getKnex**(): Knex

*Defined in [packages/knex/src/AbstractSqlConnection.ts:16](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlConnection.ts#L16)*

**Returns:** Knex

___

### getKnexOptions

▸ `Protected`**getKnexOptions**(`type`: string): Config

*Defined in [packages/knex/src/AbstractSqlConnection.ts:93](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlConnection.ts#L93)*

#### Parameters:

Name | Type |
------ | ------ |
`type` | string |

**Returns:** Config

___

### getSql

▸ `Private`**getSql**(`query`: string, `formatted`: string): string

*Defined in [packages/knex/src/AbstractSqlConnection.ts:101](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlConnection.ts#L101)*

#### Parameters:

Name | Type |
------ | ------ |
`query` | string |
`formatted` | string |

**Returns:** string

___

### isConnected

▸ **isConnected**(): Promise&#60;boolean>

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlConnection.ts:24](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlConnection.ts#L24)*

**Returns:** Promise&#60;boolean>

___

### loadFile

▸ **loadFile**(`path`: string): Promise&#60;void>

*Defined in [packages/knex/src/AbstractSqlConnection.ts:75](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlConnection.ts#L75)*

Execute raw SQL queries from file

#### Parameters:

Name | Type |
------ | ------ |
`path` | string |

**Returns:** Promise&#60;void>

___

### logQuery

▸ `Protected`**logQuery**(`query`: string, `took?`: number): void

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlConnection.ts:80](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlConnection.ts#L80)*

#### Parameters:

Name | Type |
------ | ------ |
`query` | string |
`took?` | number |

**Returns:** void

___

### patchKnexClient

▸ `Private`**patchKnexClient**(): void

*Defined in [packages/knex/src/AbstractSqlConnection.ts:120](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlConnection.ts#L120)*

do not call `positionBindings` when there are no bindings - it was messing up with
already interpolated strings containing `?`, and escaping that was not enough to
support edge cases like `\\?` strings (as `positionBindings` was removing the `\\`)

**Returns:** void

___

### rollback

▸ **rollback**(`ctx`: KnexTransaction): Promise&#60;void>

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlConnection.ts:45](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlConnection.ts#L45)*

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

*Overrides void*

*Defined in [packages/knex/src/AbstractSqlConnection.ts:33](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlConnection.ts#L33)*

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

▸ `Protected` `Abstract`**transformRawResult**&#60;T>(`res`: any, `method`: &#34;all&#34; \| &#34;get&#34; \| &#34;run&#34;): T

*Defined in [packages/knex/src/AbstractSqlConnection.ts:145](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/knex/src/AbstractSqlConnection.ts#L145)*

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
