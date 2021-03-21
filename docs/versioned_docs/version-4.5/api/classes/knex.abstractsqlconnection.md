---
id: "knex.abstractsqlconnection"
title: "Class: AbstractSqlConnection"
sidebar_label: "AbstractSqlConnection"
custom_edit_url: null
hide_title: true
---

# Class: AbstractSqlConnection

[knex](../modules/knex.md).AbstractSqlConnection

## Hierarchy

* [*Connection*](core.connection.md)

  ↳ **AbstractSqlConnection**

## Constructors

### constructor

\+ **new AbstractSqlConnection**(`config`: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>, `options?`: [*ConnectionOptions*](../interfaces/core.connectionoptions.md), `type?`: *read* \| *write*): [*AbstractSqlConnection*](knex.abstractsqlconnection.md)

#### Parameters:

Name | Type |
:------ | :------ |
`config` | [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |
`options?` | [*ConnectionOptions*](../interfaces/core.connectionoptions.md) |
`type?` | *read* \| *write* |

**Returns:** [*AbstractSqlConnection*](knex.abstractsqlconnection.md)

Overrides: [Connection](core.connection.md)

Defined in: [packages/knex/src/AbstractSqlConnection.ts:18](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/AbstractSqlConnection.ts#L18)

## Properties

### client

• `Protected` **client**: *Knex*<any, unknown[]\>

Overrides: [Connection](core.connection.md).[client](core.connection.md#client)

Defined in: [packages/knex/src/AbstractSqlConnection.ts:18](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/AbstractSqlConnection.ts#L18)

___

### config

• `Protected` `Readonly` **config**: [*Configuration*](core.configuration.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>

Inherited from: [Connection](core.connection.md).[config](core.connection.md#config)

___

### metadata

• `Protected` **metadata**: [*MetadataStorage*](core.metadatastorage.md)

Inherited from: [Connection](core.connection.md).[metadata](core.connection.md#metadata)

Defined in: [packages/core/src/connections/Connection.ts:12](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/connections/Connection.ts#L12)

___

### options

• `Protected` `Optional` `Readonly` **options**: [*ConnectionOptions*](../interfaces/core.connectionoptions.md)

Inherited from: [Connection](core.connection.md).[options](core.connection.md#options)

___

### platform

• `Protected` **platform**: [*AbstractSqlPlatform*](knex.abstractsqlplatform.md)

Overrides: [Connection](core.connection.md).[platform](core.connection.md#platform)

Defined in: [packages/knex/src/AbstractSqlConnection.ts:17](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/AbstractSqlConnection.ts#L17)

___

### type

• `Protected` `Readonly` **type**: *read* \| *write*= 'write'

Inherited from: [Connection](core.connection.md).[type](core.connection.md#type)

## Methods

### begin

▸ **begin**(`ctx?`: [*Transaction*](../interfaces/knex.knex-1.transaction.md)<any, any\>, `eventBroadcaster?`: [*TransactionEventBroadcaster*](core.transactioneventbroadcaster.md)): *Promise*<[*Transaction*](../interfaces/knex.knex-1.transaction.md)<any, any\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`ctx?` | [*Transaction*](../interfaces/knex.knex-1.transaction.md)<any, any\> |
`eventBroadcaster?` | [*TransactionEventBroadcaster*](core.transactioneventbroadcaster.md) |

**Returns:** *Promise*<[*Transaction*](../interfaces/knex.knex-1.transaction.md)<any, any\>\>

Overrides: [Connection](core.connection.md)

Defined in: [packages/knex/src/AbstractSqlConnection.ts:56](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/AbstractSqlConnection.ts#L56)

___

### close

▸ **close**(`force?`: *boolean*): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`force?` | *boolean* |

**Returns:** *Promise*<void\>

Overrides: [Connection](core.connection.md)

Defined in: [packages/knex/src/AbstractSqlConnection.ts:29](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/AbstractSqlConnection.ts#L29)

___

### commit

▸ **commit**(`ctx`: [*Transaction*](../interfaces/knex.knex-1.transaction.md)<any, any\>, `eventBroadcaster?`: [*TransactionEventBroadcaster*](core.transactioneventbroadcaster.md)): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`ctx` | [*Transaction*](../interfaces/knex.knex-1.transaction.md)<any, any\> |
`eventBroadcaster?` | [*TransactionEventBroadcaster*](core.transactioneventbroadcaster.md) |

**Returns:** *Promise*<void\>

Overrides: [Connection](core.connection.md)

Defined in: [packages/knex/src/AbstractSqlConnection.ts:72](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/AbstractSqlConnection.ts#L72)

___

### connect

▸ `Abstract`**connect**(): *Promise*<void\>

Establishes connection to database

**Returns:** *Promise*<void\>

Inherited from: [Connection](core.connection.md)

Defined in: [packages/core/src/connections/Connection.ts:28](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/connections/Connection.ts#L28)

___

### createKnexClient

▸ `Protected`**createKnexClient**(`type`: *string*): *Knex*<any, unknown[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`type` | *string* |

**Returns:** *Knex*<any, unknown[]\>

Defined in: [packages/knex/src/AbstractSqlConnection.ts:136](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/AbstractSqlConnection.ts#L136)

___

### execute

▸ **execute**<T\>(`queryOrKnex`: *string* \| [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\> \| [*Raw*](../interfaces/knex.knex-1.raw.md)<any\>, `params?`: *any*[], `method?`: *all* \| *get* \| *run*, `ctx?`: *any*): *Promise*<T\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | [*QueryResult*](../interfaces/core.queryresult.md) \| [*EntityData*](../modules/core.md#entitydata)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\> \| [*EntityData*](../modules/core.md#entitydata)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>[] | [*EntityData*](../modules/core.md#entitydata)<[*AnyEntity*](../modules/core.md#anyentity)<any\>\>[] |

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`queryOrKnex` | *string* \| [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\> \| [*Raw*](../interfaces/knex.knex-1.raw.md)<any\> | - |
`params` | *any*[] | - |
`method` | *all* \| *get* \| *run* | 'all' |
`ctx?` | *any* | - |

**Returns:** *Promise*<T\>

Overrides: [Connection](core.connection.md)

Defined in: [packages/knex/src/AbstractSqlConnection.ts:101](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/AbstractSqlConnection.ts#L101)

___

### executeQuery

▸ `Protected`**executeQuery**<T\>(`query`: *string*, `cb`: () => *Promise*<T\>): *Promise*<T\>

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`query` | *string* |
`cb` | () => *Promise*<T\> |

**Returns:** *Promise*<T\>

Inherited from: [Connection](core.connection.md)

Defined in: [packages/core/src/connections/Connection.ts:90](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/connections/Connection.ts#L90)

___

### getClientUrl

▸ **getClientUrl**(): *string*

**Returns:** *string*

Inherited from: [Connection](core.connection.md)

Defined in: [packages/core/src/connections/Connection.ts:75](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/connections/Connection.ts#L75)

___

### getConnectionOptions

▸ **getConnectionOptions**(): [*ConnectionConfig*](../interfaces/core.connectionconfig.md)

**Returns:** [*ConnectionConfig*](../interfaces/core.connectionconfig.md)

Inherited from: [Connection](core.connection.md)

Defined in: [packages/core/src/connections/Connection.ts:63](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/connections/Connection.ts#L63)

___

### getDefaultClientUrl

▸ `Abstract`**getDefaultClientUrl**(): *string*

Returns default client url for given driver (e.g. mongodb://127.0.0.1:27017 for mongodb)

**Returns:** *string*

Inherited from: [Connection](core.connection.md)

Defined in: [packages/core/src/connections/Connection.ts:43](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/connections/Connection.ts#L43)

___

### getKnex

▸ **getKnex**(): *Knex*<any, unknown[]\>

**Returns:** *Knex*<any, unknown[]\>

Defined in: [packages/knex/src/AbstractSqlConnection.ts:25](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/AbstractSqlConnection.ts#L25)

___

### getKnexOptions

▸ `Protected`**getKnexOptions**(`type`: *string*): [*Config*](../interfaces/knex.knex-1.config.md)<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`type` | *string* |

**Returns:** [*Config*](../interfaces/knex.knex-1.config.md)<any\>

Defined in: [packages/knex/src/AbstractSqlConnection.ts:145](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/AbstractSqlConnection.ts#L145)

___

### getSql

▸ `Private`**getSql**(`query`: *string*, `formatted`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`query` | *string* |
`formatted` | *string* |

**Returns:** *string*

Defined in: [packages/knex/src/AbstractSqlConnection.ts:153](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/AbstractSqlConnection.ts#L153)

___

### isConnected

▸ **isConnected**(): *Promise*<boolean\>

**Returns:** *Promise*<boolean\>

Overrides: [Connection](core.connection.md)

Defined in: [packages/knex/src/AbstractSqlConnection.ts:33](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/AbstractSqlConnection.ts#L33)

___

### loadFile

▸ **loadFile**(`path`: *string*): *Promise*<void\>

Execute raw SQL queries from file

#### Parameters:

Name | Type |
:------ | :------ |
`path` | *string* |

**Returns:** *Promise*<void\>

Defined in: [packages/knex/src/AbstractSqlConnection.ts:127](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/AbstractSqlConnection.ts#L127)

___

### logQuery

▸ `Protected`**logQuery**(`query`: *string*, `took?`: *number*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`query` | *string* |
`took?` | *number* |

**Returns:** *void*

Overrides: [Connection](core.connection.md)

Defined in: [packages/knex/src/AbstractSqlConnection.ts:132](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/AbstractSqlConnection.ts#L132)

___

### patchKnexClient

▸ `Private`**patchKnexClient**(): *void*

do not call `positionBindings` when there are no bindings - it was messing up with
already interpolated strings containing `?`, and escaping that was not enough to
support edge cases like `\\?` strings (as `positionBindings` was removing the `\\`)

**Returns:** *void*

Defined in: [packages/knex/src/AbstractSqlConnection.ts:172](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/AbstractSqlConnection.ts#L172)

___

### rollback

▸ **rollback**(`ctx`: [*Transaction*](../interfaces/knex.knex-1.transaction.md)<any, any\>, `eventBroadcaster?`: [*TransactionEventBroadcaster*](core.transactioneventbroadcaster.md)): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`ctx` | [*Transaction*](../interfaces/knex.knex-1.transaction.md)<any, any\> |
`eventBroadcaster?` | [*TransactionEventBroadcaster*](core.transactioneventbroadcaster.md) |

**Returns:** *Promise*<void\>

Overrides: [Connection](core.connection.md)

Defined in: [packages/knex/src/AbstractSqlConnection.ts:87](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/AbstractSqlConnection.ts#L87)

___

### setMetadata

▸ **setMetadata**(`metadata`: [*MetadataStorage*](core.metadatastorage.md)): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`metadata` | [*MetadataStorage*](core.metadatastorage.md) |

**Returns:** *void*

Inherited from: [Connection](core.connection.md)

Defined in: [packages/core/src/connections/Connection.ts:82](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/connections/Connection.ts#L82)

___

### setPlatform

▸ **setPlatform**(`platform`: [*Platform*](core.platform.md)): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *void*

Inherited from: [Connection](core.connection.md)

Defined in: [packages/core/src/connections/Connection.ts:86](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/connections/Connection.ts#L86)

___

### transactional

▸ **transactional**<T\>(`cb`: (`trx`: [*Transaction*](../interfaces/knex.knex-1.transaction.md)<any, any\>) => *Promise*<T\>, `ctx?`: [*Transaction*](../interfaces/knex.knex-1.transaction.md)<any, any\>, `eventBroadcaster?`: [*TransactionEventBroadcaster*](core.transactioneventbroadcaster.md)): *Promise*<T\>

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`cb` | (`trx`: [*Transaction*](../interfaces/knex.knex-1.transaction.md)<any, any\>) => *Promise*<T\> |
`ctx?` | [*Transaction*](../interfaces/knex.knex-1.transaction.md)<any, any\> |
`eventBroadcaster?` | [*TransactionEventBroadcaster*](core.transactioneventbroadcaster.md) |

**Returns:** *Promise*<T\>

Overrides: [Connection](core.connection.md)

Defined in: [packages/knex/src/AbstractSqlConnection.ts:42](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/AbstractSqlConnection.ts#L42)

___

### transformRawResult

▸ `Protected` `Abstract`**transformRawResult**<T\>(`res`: *any*, `method`: *all* \| *get* \| *run*): T

#### Type parameters:

Name |
:------ |
`T` |

#### Parameters:

Name | Type |
:------ | :------ |
`res` | *any* |
`method` | *all* \| *get* \| *run* |

**Returns:** T

Defined in: [packages/knex/src/AbstractSqlConnection.ts:197](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/knex/src/AbstractSqlConnection.ts#L197)
