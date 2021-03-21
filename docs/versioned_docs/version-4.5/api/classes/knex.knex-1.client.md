---
id: "knex.knex-1.client"
title: "Class: Client"
sidebar_label: "Client"
custom_edit_url: null
hide_title: true
---

# Class: Client

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).Client

## Hierarchy

* *EventEmitter*

  ↳ **Client**

## Constructors

### constructor

\+ **new Client**(`config`: [*Config*](../interfaces/knex.knex-1.config.md)<any\>): [*Client*](knex.knex-1.client.md)

#### Parameters:

Name | Type |
:------ | :------ |
`config` | [*Config*](../interfaces/knex.knex-1.config.md)<any\> |

**Returns:** [*Client*](knex.knex-1.client.md)

Overrides: void

Defined in: node_modules/knex/types/index.d.ts:2180

## Properties

### canCancelQuery

• **canCancelQuery**: *boolean*

Defined in: node_modules/knex/types/index.d.ts:2230

___

### config

• **config**: [*Config*](../interfaces/knex.knex-1.config.md)<any\>

Defined in: node_modules/knex/types/index.d.ts:2182

___

### connectionConfigExpirationChecker

• **connectionConfigExpirationChecker**: *null* \| () => *boolean*

Defined in: node_modules/knex/types/index.d.ts:2193

___

### connectionConfigProvider

• **connectionConfigProvider**: *any*

Defined in: node_modules/knex/types/index.d.ts:2192

___

### connectionSettings

• **connectionSettings**: *object*

Defined in: node_modules/knex/types/index.d.ts:2185

___

### dialect

• **dialect**: *string*

Defined in: node_modules/knex/types/index.d.ts:2183

___

### driver

• **driver**: *any*

Defined in: node_modules/knex/types/index.d.ts:2217

___

### driverName

• **driverName**: *string*

Defined in: node_modules/knex/types/index.d.ts:2184

___

### logger

• **logger**: [*Logger*](../interfaces/knex.knex-1.logger.md)

Defined in: node_modules/knex/types/index.d.ts:2190

___

### pool

• **pool**: *undefined* \| *Pool*<any\>

Defined in: node_modules/knex/types/index.d.ts:2225

___

### valueForUndefined

• **valueForUndefined**: *any*

Defined in: node_modules/knex/types/index.d.ts:2194

___

### version

• `Optional` **version**: *string*

Defined in: node_modules/knex/types/index.d.ts:2191

___

### captureRejectionSymbol

▪ `Readonly` `Static` **captureRejectionSymbol**: *typeof* [*captureRejectionSymbol*](knex.knex-1.client.md#capturerejectionsymbol)

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:43

___

### captureRejections

▪ `Static` **captureRejections**: *boolean*

Sets or gets the default captureRejection value for all emitters.

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:49

___

### defaultMaxListeners

▪ `Static` **defaultMaxListeners**: *number*

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:50

___

### errorMonitor

▪ `Readonly` `Static` **errorMonitor**: *typeof* [*errorMonitor*](knex.knex-1.client.md#errormonitor)

This symbol shall be used to install a listener for only monitoring `'error'`
events. Listeners installed using this symbol are called before the regular
`'error'` listeners are called.

Installing a listener using this symbol does not change the behavior once an
`'error'` event is emitted, therefore the process will still crash if no
regular `'error'` listener is installed.

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:42

## Methods

### acquireConnection

▸ **acquireConnection**(): *any*

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2226

___

### acquireRawConnection

▸ **acquireRawConnection**(): *Promise*<any\>

**Returns:** *Promise*<any\>

Defined in: node_modules/knex/types/index.d.ts:2187

___

### addListener

▸ **addListener**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Client*](knex.knex-1.client.md)

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Client*](knex.knex-1.client.md)

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:62

___

### assertCanCancelQuery

▸ **assertCanCancelQuery**(): *void*

**Returns:** *void*

Defined in: node_modules/knex/types/index.d.ts:2231

___

### cancelQuery

▸ **cancelQuery**(): *void*

**Returns:** *void*

Defined in: node_modules/knex/types/index.d.ts:2232

___

### columnBuilder

▸ **columnBuilder**(`tableBuilder`: *any*, `type`: *any*, `args`: *any*): [*ColumnBuilder*](../interfaces/knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`tableBuilder` | *any* |
`type` | *any* |
`args` | *any* |

**Returns:** [*ColumnBuilder*](../interfaces/knex.knex-1.columnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:2202

___

### columnCompiler

▸ **columnCompiler**(`tableBuilder`: *any*, `columnBuilder`: *any*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`tableBuilder` | *any* |
`columnBuilder` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2203

___

### customWrapIdentifier

▸ **customWrapIdentifier**(`value`: *any*, `origImpl`: *any*, `queryContext`: *any*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`value` | *any* |
`origImpl` | *any* |
`queryContext` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2214

___

### database

▸ **database**(): *any*

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2229

___

### destroy

▸ **destroy**(`callback`: *any*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`callback` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2228

___

### destroyRawConnection

▸ **destroyRawConnection**(`connection`: *any*): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`connection` | *any* |

**Returns:** *Promise*<void\>

Defined in: node_modules/knex/types/index.d.ts:2188

___

### emit

▸ **emit**(`event`: *string* \| *symbol*, ...`args`: *any*[]): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |
`...args` | *any*[] |

**Returns:** *boolean*

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:72

___

### eventNames

▸ **eventNames**(): (*string* \| *symbol*)[]

**Returns:** (*string* \| *symbol*)[]

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:77

___

### formatter

▸ **formatter**(`builder`: *any*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`builder` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2195

___

### getMaxListeners

▸ **getMaxListeners**(): *number*

**Returns:** *number*

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:69

___

### getPoolSettings

▸ **getPoolSettings**(`poolConfig`: *any*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`poolConfig` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2223

___

### initializeDriver

▸ **initializeDriver**(): *void*

**Returns:** *void*

Defined in: node_modules/knex/types/index.d.ts:2216

___

### initializePool

▸ **initializePool**(`config?`: {}): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`config?` | *object* |

**Returns:** *void*

Defined in: node_modules/knex/types/index.d.ts:2224

___

### listenerCount

▸ **listenerCount**(`event`: *string* \| *symbol*): *number*

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |

**Returns:** *number*

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:73

___

### listeners

▸ **listeners**(`event`: *string* \| *symbol*): Function[]

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |

**Returns:** Function[]

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:70

___

### off

▸ **off**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Client*](knex.knex-1.client.md)

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Client*](knex.knex-1.client.md)

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:66

___

### on

▸ **on**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Client*](knex.knex-1.client.md)

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Client*](knex.knex-1.client.md)

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:63

___

### once

▸ **once**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Client*](knex.knex-1.client.md)

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Client*](knex.knex-1.client.md)

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:64

___

### poolDefaults

▸ **poolDefaults**(): *object*

**Returns:** *object*

Name | Type |
:------ | :------ |
`max` | *number* |
`min` | *number* |
`propagateCreateError` | *boolean* |

Defined in: node_modules/knex/types/index.d.ts:2218

___

### positionBindings

▸ **positionBindings**(`sql`: *any*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`sql` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2211

___

### postProcessResponse

▸ **postProcessResponse**(`resp`: *any*, `queryContext`: *any*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`resp` | *any* |
`queryContext` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2212

___

### prepBindings

▸ **prepBindings**(`bindings`: *any*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`bindings` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2210

___

### prependListener

▸ **prependListener**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Client*](knex.knex-1.client.md)

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Client*](knex.knex-1.client.md)

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:75

___

### prependOnceListener

▸ **prependOnceListener**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Client*](knex.knex-1.client.md)

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Client*](knex.knex-1.client.md)

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:76

___

### query

▸ **query**(`connection`: *any*, `obj`: *any*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`connection` | *any* |
`obj` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2208

___

### queryBuilder

▸ **queryBuilder**(): [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\>

**Returns:** [*QueryBuilder*](knex.knex-1.querybuilder.md)<any, any\>

Defined in: node_modules/knex/types/index.d.ts:2196

___

### queryCompiler

▸ **queryCompiler**(`builder`: *any*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`builder` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2197

___

### raw

▸ **raw**(...`args`: *any*[]): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`...args` | *any*[] |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2206

___

### rawListeners

▸ **rawListeners**(`event`: *string* \| *symbol*): Function[]

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |

**Returns:** Function[]

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:71

___

### ref

▸ **ref**(...`args`: *any*[]): [*Ref*](../interfaces/knex.knex-1.ref.md)<any, any\>

#### Parameters:

Name | Type |
:------ | :------ |
`...args` | *any*[] |

**Returns:** [*Ref*](../interfaces/knex.knex-1.ref.md)<any, any\>

Defined in: node_modules/knex/types/index.d.ts:2207

___

### releaseConnection

▸ **releaseConnection**(`connection`: *any*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`connection` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2227

___

### removeAllListeners

▸ **removeAllListeners**(`event?`: *string* \| *symbol*): [*Client*](knex.knex-1.client.md)

#### Parameters:

Name | Type |
:------ | :------ |
`event?` | *string* \| *symbol* |

**Returns:** [*Client*](knex.knex-1.client.md)

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:67

___

### removeListener

▸ **removeListener**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Client*](knex.knex-1.client.md)

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Client*](knex.knex-1.client.md)

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:65

___

### runner

▸ **runner**(`builder`: *any*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`builder` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2204

___

### schemaBuilder

▸ **schemaBuilder**(): [*SchemaBuilder*](../interfaces/knex.knex-1.schemabuilder.md)

**Returns:** [*SchemaBuilder*](../interfaces/knex.knex-1.schemabuilder.md)

Defined in: node_modules/knex/types/index.d.ts:2198

___

### schemaCompiler

▸ **schemaCompiler**(`builder`: [*SchemaBuilder*](../interfaces/knex.knex-1.schemabuilder.md)): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`builder` | [*SchemaBuilder*](../interfaces/knex.knex-1.schemabuilder.md) |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2199

___

### setMaxListeners

▸ **setMaxListeners**(`n`: *number*): [*Client*](knex.knex-1.client.md)

#### Parameters:

Name | Type |
:------ | :------ |
`n` | *number* |

**Returns:** [*Client*](knex.knex-1.client.md)

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:68

___

### stream

▸ **stream**(`connection`: *any*, `obj`: *any*, `stream`: *any*, `options`: *any*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`connection` | *any* |
`obj` | *any* |
`stream` | *any* |
`options` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2209

___

### tableBuilder

▸ **tableBuilder**(`type`: *any*, `tableName`: *any*, `fn`: *any*): [*TableBuilder*](../interfaces/knex.knex-1.tablebuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`type` | *any* |
`tableName` | *any* |
`fn` | *any* |

**Returns:** [*TableBuilder*](../interfaces/knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:2200

___

### tableCompiler

▸ **tableCompiler**(`tableBuilder`: *any*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`tableBuilder` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2201

___

### transaction

▸ **transaction**(`container`: *any*, `config`: *any*, `outerTx`: *any*): [*Transaction*](../interfaces/knex.knex-1.transaction.md)<any, any\>

#### Parameters:

Name | Type |
:------ | :------ |
`container` | *any* |
`config` | *any* |
`outerTx` | *any* |

**Returns:** [*Transaction*](../interfaces/knex.knex-1.transaction.md)<any, any\>

Defined in: node_modules/knex/types/index.d.ts:2205

___

### validateConnection

▸ **validateConnection**(`connection`: *any*): *Promise*<boolean\>

#### Parameters:

Name | Type |
:------ | :------ |
`connection` | *any* |

**Returns:** *Promise*<boolean\>

Defined in: node_modules/knex/types/index.d.ts:2189

___

### wrapIdentifier

▸ **wrapIdentifier**(`value`: *any*, `queryContext`: *any*): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`value` | *any* |
`queryContext` | *any* |

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:2213

___

### wrapIdentifierImpl

▸ **wrapIdentifierImpl**(`value`: *any*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`value` | *any* |

**Returns:** *string*

Defined in: node_modules/knex/types/index.d.ts:2215

___

### listenerCount

▸ `Static`**listenerCount**(`emitter`: *EventEmitter*, `event`: *string* \| *symbol*): *number*

**`deprecated`** since v4.0.0

#### Parameters:

Name | Type |
:------ | :------ |
`emitter` | *EventEmitter* |
`event` | *string* \| *symbol* |

**Returns:** *number*

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:31

___

### on

▸ `Static`**on**(`emitter`: *EventEmitter*, `event`: *string*): *AsyncIterableIterator*<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`emitter` | *EventEmitter* |
`event` | *string* |

**Returns:** *AsyncIterableIterator*<any\>

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:28

___

### once

▸ `Static`**once**(`emitter`: *NodeEventTarget*, `event`: *string* \| *symbol*): *Promise*<any[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`emitter` | *NodeEventTarget* |
`event` | *string* \| *symbol* |

**Returns:** *Promise*<any[]\>

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:26

▸ `Static`**once**(`emitter`: DOMEventTarget, `event`: *string*): *Promise*<any[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`emitter` | DOMEventTarget |
`event` | *string* |

**Returns:** *Promise*<any[]\>

Inherited from: void

Defined in: node_modules/@types/node/events.d.ts:27
