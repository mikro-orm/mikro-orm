---
id: "connection"
title: "Class: Connection"
sidebar_label: "Connection"
---

## Hierarchy

* **Connection**

## Constructors

### constructor

\+ **new Connection**(`config`: [Configuration](configuration.md), `options?`: [ConnectionOptions](../interfaces/connectionoptions.md), `type?`: &#34;read&#34; \| &#34;write&#34;): [Connection](connection.md)

*Defined in [packages/core/src/connections/Connection.ts:13](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L13)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`config` | [Configuration](configuration.md) | - |
`options?` | [ConnectionOptions](../interfaces/connectionoptions.md) | - |
`type` | &#34;read&#34; \| &#34;write&#34; | "write" |

**Returns:** [Connection](connection.md)

## Properties

### client

• `Protected` `Abstract` **client**: any

*Defined in [packages/core/src/connections/Connection.ts:13](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L13)*

___

### config

• `Protected` `Readonly` **config**: [Configuration](configuration.md)

*Defined in [packages/core/src/connections/Connection.ts:15](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L15)*

___

### metadata

• `Protected` **metadata**: [MetadataStorage](metadatastorage.md)

*Defined in [packages/core/src/connections/Connection.ts:11](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L11)*

___

### options

• `Protected` `Optional` `Readonly` **options**: [ConnectionOptions](../interfaces/connectionoptions.md)

*Defined in [packages/core/src/connections/Connection.ts:16](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L16)*

___

### platform

• `Protected` **platform**: [Platform](platform.md)

*Defined in [packages/core/src/connections/Connection.ts:12](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L12)*

___

### type

• `Protected` `Readonly` **type**: &#34;read&#34; \| &#34;write&#34;

*Defined in [packages/core/src/connections/Connection.ts:17](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L17)*

## Methods

### begin

▸ **begin**(`ctx?`: [Transaction](../index.md#transaction)): Promise&#60;unknown>

*Defined in [packages/core/src/connections/Connection.ts:48](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L48)*

#### Parameters:

Name | Type |
------ | ------ |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;unknown>

___

### close

▸ `Abstract`**close**(`force?`: boolean): Promise&#60;void>

*Defined in [packages/core/src/connections/Connection.ts:37](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L37)*

Closes the database connection (aka disconnect)

#### Parameters:

Name | Type |
------ | ------ |
`force?` | boolean |

**Returns:** Promise&#60;void>

___

### commit

▸ **commit**(`ctx`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Defined in [packages/core/src/connections/Connection.ts:52](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L52)*

#### Parameters:

Name | Type |
------ | ------ |
`ctx` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;void>

___

### connect

▸ `Abstract`**connect**(): Promise&#60;void>

*Defined in [packages/core/src/connections/Connection.ts:27](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L27)*

Establishes connection to database

**Returns:** Promise&#60;void>

___

### execute

▸ `Abstract`**execute**(`query`: string, `params?`: any[], `method?`: &#34;all&#34; \| &#34;get&#34; \| &#34;run&#34;, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;[QueryResult](../interfaces/queryresult.md) \| any \| any[]>

*Defined in [packages/core/src/connections/Connection.ts:60](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L60)*

#### Parameters:

Name | Type |
------ | ------ |
`query` | string |
`params?` | any[] |
`method?` | &#34;all&#34; \| &#34;get&#34; \| &#34;run&#34; |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;[QueryResult](../interfaces/queryresult.md) \| any \| any[]>

___

### executeQuery

▸ `Protected`**executeQuery**&#60;T>(`query`: string, `cb`: () => Promise&#60;T>): Promise&#60;T>

*Defined in [packages/core/src/connections/Connection.ts:89](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L89)*

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

*Defined in [packages/core/src/connections/Connection.ts:74](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L74)*

**Returns:** string

___

### getConnectionOptions

▸ **getConnectionOptions**(): [ConnectionConfig](../interfaces/connectionconfig.md)

*Defined in [packages/core/src/connections/Connection.ts:62](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L62)*

**Returns:** [ConnectionConfig](../interfaces/connectionconfig.md)

___

### getDefaultClientUrl

▸ `Abstract`**getDefaultClientUrl**(): string

*Defined in [packages/core/src/connections/Connection.ts:42](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L42)*

Returns default client url for given driver (e.g. mongodb://127.0.0.1:27017 for mongodb)

**Returns:** string

___

### isConnected

▸ `Abstract`**isConnected**(): Promise&#60;boolean>

*Defined in [packages/core/src/connections/Connection.ts:32](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L32)*

Are we connected to the database

**Returns:** Promise&#60;boolean>

___

### logQuery

▸ `Protected`**logQuery**(`query`: string, `took?`: number): void

*Defined in [packages/core/src/connections/Connection.ts:103](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L103)*

#### Parameters:

Name | Type |
------ | ------ |
`query` | string |
`took?` | number |

**Returns:** void

___

### rollback

▸ **rollback**(`ctx`: [Transaction](../index.md#transaction)): Promise&#60;void>

*Defined in [packages/core/src/connections/Connection.ts:56](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L56)*

#### Parameters:

Name | Type |
------ | ------ |
`ctx` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;void>

___

### setMetadata

▸ **setMetadata**(`metadata`: [MetadataStorage](metadatastorage.md)): void

*Defined in [packages/core/src/connections/Connection.ts:81](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L81)*

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [MetadataStorage](metadatastorage.md) |

**Returns:** void

___

### setPlatform

▸ **setPlatform**(`platform`: [Platform](platform.md)): void

*Defined in [packages/core/src/connections/Connection.ts:85](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L85)*

#### Parameters:

Name | Type |
------ | ------ |
`platform` | [Platform](platform.md) |

**Returns:** void

___

### transactional

▸ **transactional**&#60;T>(`cb`: (trx: [Transaction](../index.md#transaction)) => Promise&#60;T>, `ctx?`: [Transaction](../index.md#transaction)): Promise&#60;T>

*Defined in [packages/core/src/connections/Connection.ts:44](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/connections/Connection.ts#L44)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`cb` | (trx: [Transaction](../index.md#transaction)) => Promise&#60;T> |
`ctx?` | [Transaction](../index.md#transaction) |

**Returns:** Promise&#60;T>
