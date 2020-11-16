---
id: "mongoconnection"
title: "Class: MongoConnection"
sidebar_label: "MongoConnection"
---

## Hierarchy

* Connection

  ↳ **MongoConnection**

## Constructors

### constructor

\+ **new MongoConnection**(`config`: Configuration, `options?`: ConnectionOptions \| undefined, `type?`: &#34;read&#34; \| &#34;write&#34;): [MongoConnection](mongoconnection.md)

*Inherited from [MongoConnection](mongoconnection.md).[constructor](mongoconnection.md#constructor)*

*Defined in packages/core/dist/connections/Connection.d.ts:11*

#### Parameters:

Name | Type |
------ | ------ |
`config` | Configuration |
`options?` | ConnectionOptions \| undefined |
`type?` | &#34;read&#34; \| &#34;write&#34; |

**Returns:** [MongoConnection](mongoconnection.md)

## Properties

### client

• `Protected` **client**: MongoClient

*Overrides void*

*Defined in [packages/mongodb/src/MongoConnection.ts:13](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L13)*

___

### config

• `Protected` `Readonly` **config**: Configuration

*Inherited from [AbstractSqlConnection](abstractsqlconnection.md).[config](abstractsqlconnection.md#config)*

*Defined in packages/core/dist/connections/Connection.d.ts:6*

___

### db

• `Protected` **db**: Db

*Defined in [packages/mongodb/src/MongoConnection.ts:14](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L14)*

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

• `Protected` **platform**: Platform

*Inherited from [MongoConnection](mongoconnection.md).[platform](mongoconnection.md#platform)*

*Defined in packages/core/dist/connections/Connection.d.ts:10*

___

### type

• `Protected` `Readonly` **type**: &#34;read&#34; \| &#34;write&#34;

*Inherited from [AbstractSqlConnection](abstractsqlconnection.md).[type](abstractsqlconnection.md#type)*

*Defined in packages/core/dist/connections/Connection.d.ts:8*

## Methods

### aggregate

▸ **aggregate**(`collection`: string, `pipeline`: any[], `ctx?`: [Transaction](../index.md#transaction)&#60;ClientSession>): Promise&#60;any[]>

*Defined in [packages/mongodb/src/MongoConnection.ts:136](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L136)*

#### Parameters:

Name | Type |
------ | ------ |
`collection` | string |
`pipeline` | any[] |
`ctx?` | [Transaction](../index.md#transaction)&#60;ClientSession> |

**Returns:** Promise&#60;any[]>

___

### begin

▸ **begin**(`ctx?`: ClientSession): Promise&#60;ClientSession>

*Overrides void*

*Defined in [packages/mongodb/src/MongoConnection.ts:168](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L168)*

#### Parameters:

Name | Type |
------ | ------ |
`ctx?` | ClientSession |

**Returns:** Promise&#60;ClientSession>

___

### bulkUpdateMany

▸ **bulkUpdateMany**&#60;T>(`collection`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>[], `data`: Partial&#60;T>[], `ctx?`: [Transaction](../index.md#transaction)&#60;ClientSession>): Promise&#60;QueryResult>

*Defined in [packages/mongodb/src/MongoConnection.ts:128](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L128)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | { _id: any  } |

#### Parameters:

Name | Type |
------ | ------ |
`collection` | string |
`where` | [FilterQuery](../index.md#filterquery)&#60;T>[] |
`data` | Partial&#60;T>[] |
`ctx?` | [Transaction](../index.md#transaction)&#60;ClientSession> |

**Returns:** Promise&#60;QueryResult>

___

### close

▸ **close**(`force?`: boolean): Promise&#60;void>

*Overrides void*

*Defined in [packages/mongodb/src/MongoConnection.ts:21](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L21)*

#### Parameters:

Name | Type |
------ | ------ |
`force?` | boolean |

**Returns:** Promise&#60;void>

___

### commit

▸ **commit**(`ctx`: ClientSession): Promise&#60;void>

*Overrides void*

*Defined in [packages/mongodb/src/MongoConnection.ts:176](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L176)*

#### Parameters:

Name | Type |
------ | ------ |
`ctx` | ClientSession |

**Returns:** Promise&#60;void>

___

### connect

▸ **connect**(): Promise&#60;void>

*Overrides [AbstractSqlConnection](abstractsqlconnection.md).[connect](abstractsqlconnection.md#connect)*

*Defined in [packages/mongodb/src/MongoConnection.ts:16](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L16)*

**Returns:** Promise&#60;void>

___

### countDocuments

▸ **countDocuments**&#60;T>(`collection`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `ctx?`: [Transaction](../index.md#transaction)&#60;ClientSession>): Promise&#60;number>

*Defined in [packages/mongodb/src/MongoConnection.ts:147](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L147)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | { _id: any  } |

#### Parameters:

Name | Type |
------ | ------ |
`collection` | string |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`ctx?` | [Transaction](../index.md#transaction)&#60;ClientSession> |

**Returns:** Promise&#60;number>

___

### createCollection

▸ **createCollection**(`name`: [EntityName](../index.md#entityname)&#60;[AnyEntity](../index.md#anyentity)>): Promise&#60;Collection>

*Defined in [packages/mongodb/src/MongoConnection.ts:34](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L34)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | [EntityName](../index.md#entityname)&#60;[AnyEntity](../index.md#anyentity)> |

**Returns:** Promise&#60;Collection>

___

### deleteMany

▸ **deleteMany**&#60;T>(`collection`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `ctx?`: [Transaction](../index.md#transaction)&#60;ClientSession>): Promise&#60;QueryResult>

*Defined in [packages/mongodb/src/MongoConnection.ts:132](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L132)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | { _id: any  } |

#### Parameters:

Name | Type |
------ | ------ |
`collection` | string |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`ctx?` | [Transaction](../index.md#transaction)&#60;ClientSession> |

**Returns:** Promise&#60;QueryResult>

___

### dropCollection

▸ **dropCollection**(`name`: [EntityName](../index.md#entityname)&#60;[AnyEntity](../index.md#anyentity)>): Promise&#60;boolean>

*Defined in [packages/mongodb/src/MongoConnection.ts:43](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L43)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | [EntityName](../index.md#entityname)&#60;[AnyEntity](../index.md#anyentity)> |

**Returns:** Promise&#60;boolean>

___

### execute

▸ **execute**(`query`: string): Promise&#60;any>

*Overrides void*

*Defined in [packages/mongodb/src/MongoConnection.ts:75](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L75)*

#### Parameters:

Name | Type |
------ | ------ |
`query` | string |

**Returns:** Promise&#60;any>

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

### find

▸ **find**&#60;T>(`collection`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `orderBy?`: QueryOrderMap, `limit?`: number, `offset?`: number, `fields?`: string[], `ctx?`: [Transaction](../index.md#transaction)&#60;ClientSession>): Promise&#60;[EntityData](../index.md#entitydata)&#60;T>[]>

*Defined in [packages/mongodb/src/MongoConnection.ts:79](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L79)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`collection` | string |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`orderBy?` | QueryOrderMap |
`limit?` | number |
`offset?` | number |
`fields?` | string[] |
`ctx?` | [Transaction](../index.md#transaction)&#60;ClientSession> |

**Returns:** Promise&#60;[EntityData](../index.md#entitydata)&#60;T>[]>

___

### getClientUrl

▸ **getClientUrl**(): string

*Overrides [AbstractSqlConnection](abstractsqlconnection.md).[getClientUrl](abstractsqlconnection.md#getclienturl)*

*Defined in [packages/mongodb/src/MongoConnection.ts:63](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L63)*

**Returns:** string

___

### getCollection

▸ **getCollection**(`name`: [EntityName](../index.md#entityname)&#60;[AnyEntity](../index.md#anyentity)>): Collection

*Defined in [packages/mongodb/src/MongoConnection.ts:30](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L30)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | [EntityName](../index.md#entityname)&#60;[AnyEntity](../index.md#anyentity)> |

**Returns:** Collection

___

### getCollectionName

▸ `Private`**getCollectionName**(`name`: [EntityName](../index.md#entityname)&#60;[AnyEntity](../index.md#anyentity)>): string

*Defined in [packages/mongodb/src/MongoConnection.ts:254](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L254)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | [EntityName](../index.md#entityname)&#60;[AnyEntity](../index.md#anyentity)> |

**Returns:** string

___

### getConnectionOptions

▸ **getConnectionOptions**(): MongoClientOptions & ConnectionConfig

*Overrides [AbstractSqlConnection](abstractsqlconnection.md).[getConnectionOptions](abstractsqlconnection.md#getconnectionoptions)*

*Defined in [packages/mongodb/src/MongoConnection.ts:51](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L51)*

**Returns:** MongoClientOptions & ConnectionConfig

___

### getDb

▸ **getDb**(): Db

*Defined in [packages/mongodb/src/MongoConnection.ts:71](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L71)*

**Returns:** Db

___

### getDefaultClientUrl

▸ **getDefaultClientUrl**(): string

*Overrides [AbstractSqlConnection](abstractsqlconnection.md).[getDefaultClientUrl](abstractsqlconnection.md#getdefaultclienturl)*

*Defined in [packages/mongodb/src/MongoConnection.ts:47](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L47)*

**Returns:** string

___

### insertMany

▸ **insertMany**&#60;T>(`collection`: string, `data`: Partial&#60;T>[], `ctx?`: [Transaction](../index.md#transaction)&#60;ClientSession>): Promise&#60;QueryResult>

*Defined in [packages/mongodb/src/MongoConnection.ts:120](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L120)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | { _id: any  } |

#### Parameters:

Name | Type |
------ | ------ |
`collection` | string |
`data` | Partial&#60;T>[] |
`ctx?` | [Transaction](../index.md#transaction)&#60;ClientSession> |

**Returns:** Promise&#60;QueryResult>

___

### insertOne

▸ **insertOne**&#60;T>(`collection`: string, `data`: Partial&#60;T>, `ctx?`: [Transaction](../index.md#transaction)&#60;ClientSession>): Promise&#60;QueryResult>

*Defined in [packages/mongodb/src/MongoConnection.ts:116](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L116)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | { _id: any  } |

#### Parameters:

Name | Type |
------ | ------ |
`collection` | string |
`data` | Partial&#60;T> |
`ctx?` | [Transaction](../index.md#transaction)&#60;ClientSession> |

**Returns:** Promise&#60;QueryResult>

___

### isConnected

▸ **isConnected**(): Promise&#60;boolean>

*Overrides void*

*Defined in [packages/mongodb/src/MongoConnection.ts:25](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L25)*

**Returns:** Promise&#60;boolean>

___

### listCollections

▸ **listCollections**(): Promise&#60;string[]>

*Defined in [packages/mongodb/src/MongoConnection.ts:38](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L38)*

**Returns:** Promise&#60;string[]>

___

### logObject

▸ `Private`**logObject**(`o`: any): string

*Defined in [packages/mongodb/src/MongoConnection.ts:261](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L261)*

#### Parameters:

Name | Type |
------ | ------ |
`o` | any |

**Returns:** string

___

### logQuery

▸ `Protected`**logQuery**(`query`: string, `took?`: number): void

*Overrides void*

*Defined in [packages/mongodb/src/MongoConnection.ts:186](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L186)*

#### Parameters:

Name | Type |
------ | ------ |
`query` | string |
`took?` | number |

**Returns:** void

___

### rollback

▸ **rollback**(`ctx`: ClientSession): Promise&#60;void>

*Overrides void*

*Defined in [packages/mongodb/src/MongoConnection.ts:181](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L181)*

#### Parameters:

Name | Type |
------ | ------ |
`ctx` | ClientSession |

**Returns:** Promise&#60;void>

___

### runQuery

▸ `Private`**runQuery**&#60;T, U>(`method`: &#34;insertOne&#34; \| &#34;insertMany&#34; \| &#34;updateMany&#34; \| &#34;bulkUpdateMany&#34; \| &#34;deleteMany&#34; \| &#34;countDocuments&#34;, `collection`: string, `data?`: Partial&#60;T> \| Partial&#60;T>[], `where?`: [FilterQuery](../index.md#filterquery)&#60;T> \| [FilterQuery](../index.md#filterquery)&#60;T>[], `ctx?`: [Transaction](../index.md#transaction)&#60;ClientSession>): Promise&#60;U>

*Defined in [packages/mongodb/src/MongoConnection.ts:190](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L190)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | { _id: any  } | - |
`U` | QueryResult \| number | QueryResult |

#### Parameters:

Name | Type |
------ | ------ |
`method` | &#34;insertOne&#34; \| &#34;insertMany&#34; \| &#34;updateMany&#34; \| &#34;bulkUpdateMany&#34; \| &#34;deleteMany&#34; \| &#34;countDocuments&#34; |
`collection` | string |
`data?` | Partial&#60;T> \| Partial&#60;T>[] |
`where?` | [FilterQuery](../index.md#filterquery)&#60;T> \| [FilterQuery](../index.md#filterquery)&#60;T>[] |
`ctx?` | [Transaction](../index.md#transaction)&#60;ClientSession> |

**Returns:** Promise&#60;U>

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

▸ **transactional**&#60;T>(`cb`: (trx: [Transaction](../index.md#transaction)&#60;ClientSession>) => Promise&#60;T>, `ctx?`: [Transaction](../index.md#transaction)&#60;ClientSession>): Promise&#60;T>

*Overrides void*

*Defined in [packages/mongodb/src/MongoConnection.ts:151](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L151)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`cb` | (trx: [Transaction](../index.md#transaction)&#60;ClientSession>) => Promise&#60;T> |
`ctx?` | [Transaction](../index.md#transaction)&#60;ClientSession> |

**Returns:** Promise&#60;T>

___

### transformResult

▸ `Private`**transformResult**(`res`: any): QueryResult

*Defined in [packages/mongodb/src/MongoConnection.ts:245](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L245)*

#### Parameters:

Name | Type |
------ | ------ |
`res` | any |

**Returns:** QueryResult

___

### updateMany

▸ **updateMany**&#60;T>(`collection`: string, `where`: [FilterQuery](../index.md#filterquery)&#60;T>, `data`: Partial&#60;T>, `ctx?`: [Transaction](../index.md#transaction)&#60;ClientSession>): Promise&#60;QueryResult>

*Defined in [packages/mongodb/src/MongoConnection.ts:124](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/mongodb/src/MongoConnection.ts#L124)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | { _id: any  } |

#### Parameters:

Name | Type |
------ | ------ |
`collection` | string |
`where` | [FilterQuery](../index.md#filterquery)&#60;T> |
`data` | Partial&#60;T> |
`ctx?` | [Transaction](../index.md#transaction)&#60;ClientSession> |

**Returns:** Promise&#60;QueryResult>
