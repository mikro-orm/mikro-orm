---
id: "core.connection"
title: "Class: Connection"
sidebar_label: "Connection"
hide_title: true
---

# Class: Connection

[core](../modules/core.md).Connection

## Hierarchy

* **Connection**

  ↳ [*AbstractSqlConnection*](knex.abstractsqlconnection.md)

## Constructors

### constructor

\+ **new Connection**(`config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>, `options?`: [*ConnectionOptions*](../interfaces/core.connectionoptions.md), `type?`: *read* \| *write*): [*Connection*](core.connection.md)

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`config` | [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> | - |
`options?` | [*ConnectionOptions*](../interfaces/core.connectionoptions.md) | - |
`type` | *read* \| *write* | 'write' |

**Returns:** [*Connection*](core.connection.md)

Defined in: [packages/core/src/connections/Connection.ts:14](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/connections/Connection.ts#L14)

## Properties

### client

• `Protected` `Abstract` **client**: *any*

Defined in: [packages/core/src/connections/Connection.ts:14](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/connections/Connection.ts#L14)

___

### config

• `Protected` `Readonly` **config**: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

___

### metadata

• `Protected` **metadata**: [*MetadataStorage*](core.metadatastorage.md)

Defined in: [packages/core/src/connections/Connection.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/connections/Connection.ts#L12)

___

### options

• `Protected` `Optional` `Readonly` **options**: *undefined* \| [*ConnectionOptions*](../interfaces/core.connectionoptions.md)

___

### platform

• `Protected` **platform**: [*Platform*](core.platform.md)

Defined in: [packages/core/src/connections/Connection.ts:13](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/connections/Connection.ts#L13)

___

### type

• `Protected` `Readonly` **type**: *read* \| *write*= 'write'

## Methods

### begin

▸ **begin**(`ctx?`: *any*, `eventBroadcaster?`: [*TransactionEventBroadcaster*](core.transactioneventbroadcaster.md)): *Promise*<*unknown*\>

#### Parameters:

Name | Type |
------ | ------ |
`ctx?` | *any* |
`eventBroadcaster?` | [*TransactionEventBroadcaster*](core.transactioneventbroadcaster.md) |

**Returns:** *Promise*<*unknown*\>

Defined in: [packages/core/src/connections/Connection.ts:49](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/connections/Connection.ts#L49)

___

### close

▸ `Abstract`**close**(`force?`: *boolean*): *Promise*<*void*\>

Closes the database connection (aka disconnect)

#### Parameters:

Name | Type |
------ | ------ |
`force?` | *boolean* |

**Returns:** *Promise*<*void*\>

Defined in: [packages/core/src/connections/Connection.ts:38](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/connections/Connection.ts#L38)

___

### commit

▸ **commit**(`ctx`: *any*, `eventBroadcaster?`: [*TransactionEventBroadcaster*](core.transactioneventbroadcaster.md)): *Promise*<*void*\>

#### Parameters:

Name | Type |
------ | ------ |
`ctx` | *any* |
`eventBroadcaster?` | [*TransactionEventBroadcaster*](core.transactioneventbroadcaster.md) |

**Returns:** *Promise*<*void*\>

Defined in: [packages/core/src/connections/Connection.ts:53](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/connections/Connection.ts#L53)

___

### connect

▸ `Abstract`**connect**(): *Promise*<*void*\>

Establishes connection to database

**Returns:** *Promise*<*void*\>

Defined in: [packages/core/src/connections/Connection.ts:28](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/connections/Connection.ts#L28)

___

### execute

▸ `Abstract`**execute**(`query`: *string*, `params?`: *any*[], `method?`: *all* \| *get* \| *run*, `ctx?`: *any*): *Promise*<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`query` | *string* |
`params?` | *any*[] |
`method?` | *all* \| *get* \| *run* |
`ctx?` | *any* |

**Returns:** *Promise*<*any*\>

Defined in: [packages/core/src/connections/Connection.ts:61](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/connections/Connection.ts#L61)

___

### executeQuery

▸ `Protected`**executeQuery**<T\>(`query`: *string*, `cb`: () => *Promise*<T\>): *Promise*<T\>

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`query` | *string* |
`cb` | () => *Promise*<T\> |

**Returns:** *Promise*<T\>

Defined in: [packages/core/src/connections/Connection.ts:90](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/connections/Connection.ts#L90)

___

### getClientUrl

▸ **getClientUrl**(): *string*

**Returns:** *string*

Defined in: [packages/core/src/connections/Connection.ts:75](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/connections/Connection.ts#L75)

___

### getConnectionOptions

▸ **getConnectionOptions**(): [*ConnectionConfig*](../interfaces/core.connectionconfig.md)

**Returns:** [*ConnectionConfig*](../interfaces/core.connectionconfig.md)

Defined in: [packages/core/src/connections/Connection.ts:63](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/connections/Connection.ts#L63)

___

### getDefaultClientUrl

▸ `Abstract`**getDefaultClientUrl**(): *string*

Returns default client url for given driver (e.g. mongodb://127.0.0.1:27017 for mongodb)

**Returns:** *string*

Defined in: [packages/core/src/connections/Connection.ts:43](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/connections/Connection.ts#L43)

___

### isConnected

▸ `Abstract`**isConnected**(): *Promise*<*boolean*\>

Are we connected to the database

**Returns:** *Promise*<*boolean*\>

Defined in: [packages/core/src/connections/Connection.ts:33](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/connections/Connection.ts#L33)

___

### logQuery

▸ `Protected`**logQuery**(`query`: *string*, `took?`: *number*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`query` | *string* |
`took?` | *number* |

**Returns:** *void*

Defined in: [packages/core/src/connections/Connection.ts:104](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/connections/Connection.ts#L104)

___

### rollback

▸ **rollback**(`ctx`: *any*, `eventBroadcaster?`: [*TransactionEventBroadcaster*](core.transactioneventbroadcaster.md)): *Promise*<*void*\>

#### Parameters:

Name | Type |
------ | ------ |
`ctx` | *any* |
`eventBroadcaster?` | [*TransactionEventBroadcaster*](core.transactioneventbroadcaster.md) |

**Returns:** *Promise*<*void*\>

Defined in: [packages/core/src/connections/Connection.ts:57](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/connections/Connection.ts#L57)

___

### setMetadata

▸ **setMetadata**(`metadata`: [*MetadataStorage*](core.metadatastorage.md)): *void*

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |

**Returns:** *void*

Defined in: [packages/core/src/connections/Connection.ts:82](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/connections/Connection.ts#L82)

___

### setPlatform

▸ **setPlatform**(`platform`: [*Platform*](core.platform.md)): *void*

#### Parameters:

Name | Type |
------ | ------ |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *void*

Defined in: [packages/core/src/connections/Connection.ts:86](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/connections/Connection.ts#L86)

___

### transactional

▸ **transactional**<T\>(`cb`: (`trx`: *any*) => *Promise*<T\>, `ctx?`: *any*, `eventBroadcaster?`: [*TransactionEventBroadcaster*](core.transactioneventbroadcaster.md)): *Promise*<T\>

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`cb` | (`trx`: *any*) => *Promise*<T\> |
`ctx?` | *any* |
`eventBroadcaster?` | [*TransactionEventBroadcaster*](core.transactioneventbroadcaster.md) |

**Returns:** *Promise*<T\>

Defined in: [packages/core/src/connections/Connection.ts:45](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/connections/Connection.ts#L45)
