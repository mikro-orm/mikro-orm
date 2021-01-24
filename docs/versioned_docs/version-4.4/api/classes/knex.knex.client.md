---
id: "knex.knex.client"
title: "Class: Client"
sidebar_label: "Client"
hide_title: true
---

# Class: Client

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).Client

## Hierarchy

* *EventEmitter*

  ↳ **Client**

## Constructors

### constructor

\+ **new Client**(`config`: [*Config*](../interfaces/knex.knex.config.md)<*any*\>): [*Client*](knex.knex.client.md)

#### Parameters:

Name | Type |
------ | ------ |
`config` | [*Config*](../interfaces/knex.knex.config.md)<*any*\> |

**Returns:** [*Client*](knex.knex.client.md)

Defined in: node_modules/knex/types/index.d.ts:2174

## Properties

### canCancelQuery

• **canCancelQuery**: *boolean*

Defined in: node_modules/knex/types/index.d.ts:2224

___

### config

• **config**: [*Config*](../interfaces/knex.knex.config.md)<*any*\>

Defined in: node_modules/knex/types/index.d.ts:2176

___

### connectionConfigExpirationChecker

• **connectionConfigExpirationChecker**: *null* \| () => *boolean*

Defined in: node_modules/knex/types/index.d.ts:2187

___

### connectionConfigProvider

• **connectionConfigProvider**: *any*

Defined in: node_modules/knex/types/index.d.ts:2186

___

### connectionSettings

• **connectionSettings**: *object*

Defined in: node_modules/knex/types/index.d.ts:2179

___

### dialect

• **dialect**: *string*

Defined in: node_modules/knex/types/index.d.ts:2177

___

### driver

• **driver**: *any*

Defined in: node_modules/knex/types/index.d.ts:2211

___

### driverName

• **driverName**: *string*

Defined in: node_modules/knex/types/index.d.ts:2178

___

### logger

• **logger**: [*Logger*](../interfaces/knex.knex.logger.md)

Defined in: node_modules/knex/types/index.d.ts:2184

___

### pool

• **pool**: *undefined* \| *Pool*<*any*\>

Defined in: node_modules/knex/types/index.d.ts:2219

___

### valueForUndefined

• **valueForUndefined**: *any*

Defined in: node_modules/knex/types/index.d.ts:2188

___

### version

• `Optional` **version**: *undefined* \| *string*

Defined in: node_modules/knex/types/index.d.ts:2185

___

### captureRejectionSymbol

▪ `Readonly` `Static` **captureRejectionSymbol**: *typeof* [*captureRejectionSymbol*](knex.knex.client.md#capturerejectionsymbol)

Defined in: node_modules/@types/node/events.d.ts:38

___

### captureRejections

▪ `Static` **captureRejections**: *boolean*

Sets or gets the default captureRejection value for all emitters.

Defined in: node_modules/@types/node/events.d.ts:44

___

### defaultMaxListeners

▪ `Static` **defaultMaxListeners**: *number*

Defined in: node_modules/@types/node/events.d.ts:45

___

### errorMonitor

▪ `Readonly` `Static` **errorMonitor**: *typeof* [*errorMonitor*](knex.knex.client.md#errormonitor)

This symbol shall be used to install a listener for only monitoring `'error'`
events. Listeners installed using this symbol are called before the regular
`'error'` listeners are called.

Installing a listener using this symbol does not change the behavior once an
`'error'` event is emitted, therefore the process will still crash if no
regular `'error'` listener is installed.

Defined in: node_modules/@types/node/events.d.ts:37

## Methods

### acquireConnection

▸ **acquireConnection**(): *any*

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2220

___

### acquireRawConnection

▸ **acquireRawConnection**(): *Promise*<*any*\>

**Returns:** *Promise*<*any*\>

Defined in: node_modules/knex/types/index.d.ts:2181

___

### addListener

▸ **addListener**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Client*](knex.knex.client.md)

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Client*](knex.knex.client.md)

Defined in: node_modules/@types/node/events.d.ts:57

___

### assertCanCancelQuery

▸ **assertCanCancelQuery**(): *void*

**Returns:** *void*

Defined in: node_modules/knex/types/index.d.ts:2225

___

### cancelQuery

▸ **cancelQuery**(): *void*

**Returns:** *void*

Defined in: node_modules/knex/types/index.d.ts:2226

___

### columnBuilder

▸ **columnBuilder**(`tableBuilder`: *any*, `type`: *any*, `args`: *any*): [*ColumnBuilder*](../interfaces/knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`tableBuilder` | *any* |
`type` | *any* |
`args` | *any* |

**Returns:** [*ColumnBuilder*](../interfaces/knex.knex.columnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:2196

___

### columnCompiler

▸ **columnCompiler**(`tableBuilder`: *any*, `columnBuilder`: *any*): *any*

#### Parameters:

Name | Type |
------ | ------ |
`tableBuilder` | *any* |
`columnBuilder` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2197

___

### customWrapIdentifier

▸ **customWrapIdentifier**(`value`: *any*, `origImpl`: *any*, `queryContext`: *any*): *any*

#### Parameters:

Name | Type |
------ | ------ |
`value` | *any* |
`origImpl` | *any* |
`queryContext` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2208

___

### database

▸ **database**(): *any*

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2223

___

### destroy

▸ **destroy**(`callback`: *any*): *any*

#### Parameters:

Name | Type |
------ | ------ |
`callback` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2222

___

### destroyRawConnection

▸ **destroyRawConnection**(`connection`: *any*): *Promise*<*void*\>

#### Parameters:

Name | Type |
------ | ------ |
`connection` | *any* |

**Returns:** *Promise*<*void*\>

Defined in: node_modules/knex/types/index.d.ts:2182

___

### emit

▸ **emit**(`event`: *string* \| *symbol*, ...`args`: *any*[]): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`...args` | *any*[] |

**Returns:** *boolean*

Defined in: node_modules/@types/node/events.d.ts:67

___

### eventNames

▸ **eventNames**(): (*string* \| *symbol*)[]

**Returns:** (*string* \| *symbol*)[]

Defined in: node_modules/@types/node/events.d.ts:72

___

### formatter

▸ **formatter**(`builder`: *any*): *any*

#### Parameters:

Name | Type |
------ | ------ |
`builder` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2189

___

### getMaxListeners

▸ **getMaxListeners**(): *number*

**Returns:** *number*

Defined in: node_modules/@types/node/events.d.ts:64

___

### getPoolSettings

▸ **getPoolSettings**(`poolConfig`: *any*): *any*

#### Parameters:

Name | Type |
------ | ------ |
`poolConfig` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2217

___

### initializeDriver

▸ **initializeDriver**(): *void*

**Returns:** *void*

Defined in: node_modules/knex/types/index.d.ts:2210

___

### initializePool

▸ **initializePool**(`config?`: {}): *void*

#### Parameters:

Name | Type |
------ | ------ |
`config?` | {} |

**Returns:** *void*

Defined in: node_modules/knex/types/index.d.ts:2218

___

### listenerCount

▸ **listenerCount**(`event`: *string* \| *symbol*): *number*

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |

**Returns:** *number*

Defined in: node_modules/@types/node/events.d.ts:68

___

### listeners

▸ **listeners**(`event`: *string* \| *symbol*): Function[]

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |

**Returns:** Function[]

Defined in: node_modules/@types/node/events.d.ts:65

___

### off

▸ **off**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Client*](knex.knex.client.md)

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Client*](knex.knex.client.md)

Defined in: node_modules/@types/node/events.d.ts:61

___

### on

▸ **on**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Client*](knex.knex.client.md)

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Client*](knex.knex.client.md)

Defined in: node_modules/@types/node/events.d.ts:58

___

### once

▸ **once**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Client*](knex.knex.client.md)

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Client*](knex.knex.client.md)

Defined in: node_modules/@types/node/events.d.ts:59

___

### poolDefaults

▸ **poolDefaults**(): *object*

**Returns:** *object*

Name | Type |
------ | ------ |
`max` | *number* |
`min` | *number* |
`propagateCreateError` | *boolean* |

Defined in: node_modules/knex/types/index.d.ts:2212

___

### positionBindings

▸ **positionBindings**(`sql`: *any*): *any*

#### Parameters:

Name | Type |
------ | ------ |
`sql` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2205

___

### postProcessResponse

▸ **postProcessResponse**(`resp`: *any*, `queryContext`: *any*): *any*

#### Parameters:

Name | Type |
------ | ------ |
`resp` | *any* |
`queryContext` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2206

___

### prepBindings

▸ **prepBindings**(`bindings`: *any*): *any*

#### Parameters:

Name | Type |
------ | ------ |
`bindings` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2204

___

### prependListener

▸ **prependListener**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Client*](knex.knex.client.md)

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Client*](knex.knex.client.md)

Defined in: node_modules/@types/node/events.d.ts:70

___

### prependOnceListener

▸ **prependOnceListener**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Client*](knex.knex.client.md)

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Client*](knex.knex.client.md)

Defined in: node_modules/@types/node/events.d.ts:71

___

### query

▸ **query**(`connection`: *any*, `obj`: *any*): *any*

#### Parameters:

Name | Type |
------ | ------ |
`connection` | *any* |
`obj` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2202

___

### queryBuilder

▸ **queryBuilder**(): [*QueryBuilder*](knex.knex.querybuilder.md)<*any*, *any*\>

**Returns:** [*QueryBuilder*](knex.knex.querybuilder.md)<*any*, *any*\>

Defined in: node_modules/knex/types/index.d.ts:2190

___

### queryCompiler

▸ **queryCompiler**(`builder`: *any*): *any*

#### Parameters:

Name | Type |
------ | ------ |
`builder` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2191

___

### raw

▸ **raw**(...`args`: *any*[]): *any*

#### Parameters:

Name | Type |
------ | ------ |
`...args` | *any*[] |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2200

___

### rawListeners

▸ **rawListeners**(`event`: *string* \| *symbol*): Function[]

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |

**Returns:** Function[]

Defined in: node_modules/@types/node/events.d.ts:66

___

### ref

▸ **ref**(...`args`: *any*[]): [*Ref*](../interfaces/knex.knex.ref.md)<*any*, *any*\>

#### Parameters:

Name | Type |
------ | ------ |
`...args` | *any*[] |

**Returns:** [*Ref*](../interfaces/knex.knex.ref.md)<*any*, *any*\>

Defined in: node_modules/knex/types/index.d.ts:2201

___

### releaseConnection

▸ **releaseConnection**(`connection`: *any*): *any*

#### Parameters:

Name | Type |
------ | ------ |
`connection` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2221

___

### removeAllListeners

▸ **removeAllListeners**(`event?`: *string* \| *symbol*): [*Client*](knex.knex.client.md)

#### Parameters:

Name | Type |
------ | ------ |
`event?` | *string* \| *symbol* |

**Returns:** [*Client*](knex.knex.client.md)

Defined in: node_modules/@types/node/events.d.ts:62

___

### removeListener

▸ **removeListener**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Client*](knex.knex.client.md)

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Client*](knex.knex.client.md)

Defined in: node_modules/@types/node/events.d.ts:60

___

### runner

▸ **runner**(`builder`: *any*): *any*

#### Parameters:

Name | Type |
------ | ------ |
`builder` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2198

___

### schemaBuilder

▸ **schemaBuilder**(): [*SchemaBuilder*](../interfaces/knex.knex.schemabuilder.md)

**Returns:** [*SchemaBuilder*](../interfaces/knex.knex.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:2192

___

### schemaCompiler

▸ **schemaCompiler**(`builder`: [*SchemaBuilder*](../interfaces/knex.knex.schemabuilder.md)): *any*

#### Parameters:

Name | Type |
------ | ------ |
`builder` | [*SchemaBuilder*](../interfaces/knex.knex.schemabuilder.md) |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2193

___

### setMaxListeners

▸ **setMaxListeners**(`n`: *number*): [*Client*](knex.knex.client.md)

#### Parameters:

Name | Type |
------ | ------ |
`n` | *number* |

**Returns:** [*Client*](knex.knex.client.md)

Defined in: node_modules/@types/node/events.d.ts:63

___

### stream

▸ **stream**(`connection`: *any*, `obj`: *any*, `stream`: *any*, `options`: *any*): *any*

#### Parameters:

Name | Type |
------ | ------ |
`connection` | *any* |
`obj` | *any* |
`stream` | *any* |
`options` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2203

___

### tableBuilder

▸ **tableBuilder**(`type`: *any*, `tableName`: *any*, `fn`: *any*): [*TableBuilder*](../interfaces/knex.knex.tablebuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`type` | *any* |
`tableName` | *any* |
`fn` | *any* |

**Returns:** [*TableBuilder*](../interfaces/knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:2194

___

### tableCompiler

▸ **tableCompiler**(`tableBuilder`: *any*): *any*

#### Parameters:

Name | Type |
------ | ------ |
`tableBuilder` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2195

___

### transaction

▸ **transaction**(`container`: *any*, `config`: *any*, `outerTx`: *any*): [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\>

#### Parameters:

Name | Type |
------ | ------ |
`container` | *any* |
`config` | *any* |
`outerTx` | *any* |

**Returns:** [*Transaction*](../interfaces/knex.knex.transaction.md)<*any*, *any*\>

Defined in: node_modules/knex/types/index.d.ts:2199

___

### validateConnection

▸ **validateConnection**(`connection`: *any*): *Promise*<*boolean*\>

#### Parameters:

Name | Type |
------ | ------ |
`connection` | *any* |

**Returns:** *Promise*<*boolean*\>

Defined in: node_modules/knex/types/index.d.ts:2183

___

### wrapIdentifier

▸ **wrapIdentifier**(`value`: *any*, `queryContext`: *any*): *any*

#### Parameters:

Name | Type |
------ | ------ |
`value` | *any* |
`queryContext` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2207

___

### wrapIdentifierImpl

▸ **wrapIdentifierImpl**(`value`: *any*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`value` | *any* |

**Returns:** *string*

Defined in: node_modules/knex/types/index.d.ts:2209

___

### listenerCount

▸ `Static`**listenerCount**(`emitter`: *EventEmitter*, `event`: *string* \| *symbol*): *number*

**`deprecated`** since v4.0.0

#### Parameters:

Name | Type |
------ | ------ |
`emitter` | *EventEmitter* |
`event` | *string* \| *symbol* |

**Returns:** *number*

Defined in: node_modules/@types/node/events.d.ts:26

___

### on

▸ `Static`**on**(`emitter`: *EventEmitter*, `event`: *string*): *AsyncIterableIterator*<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`emitter` | *EventEmitter* |
`event` | *string* |

**Returns:** *AsyncIterableIterator*<*any*\>

Defined in: node_modules/@types/node/events.d.ts:23

___

### once

▸ `Static`**once**(`emitter`: *NodeEventTarget*, `event`: *string* \| *symbol*): *Promise*<*any*[]\>

#### Parameters:

Name | Type |
------ | ------ |
`emitter` | *NodeEventTarget* |
`event` | *string* \| *symbol* |

**Returns:** *Promise*<*any*[]\>

Defined in: node_modules/@types/node/events.d.ts:21

▸ `Static`**once**(`emitter`: DOMEventTarget, `event`: *string*): *Promise*<*any*[]\>

#### Parameters:

Name | Type |
------ | ------ |
`emitter` | DOMEventTarget |
`event` | *string* |

**Returns:** *Promise*<*any*[]\>

Defined in: node_modules/@types/node/events.d.ts:22
