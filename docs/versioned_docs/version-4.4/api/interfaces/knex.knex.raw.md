---
id: "knex.knex.raw"
title: "Interface: Raw<TResult>"
sidebar_label: "Raw"
hide_title: true
---

# Interface: Raw<TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).Raw

## Type parameters

Name | Default |
------ | ------ |
`TResult` | *any* |

## Hierarchy

* *EventEmitter*

* [*ChainableInterface*](knex.knex.chainableinterface.md)<*ResolveResult*<TResult\>\>

  ↳ **Raw**

  ↳↳ [*Ref*](knex.knex.ref.md)

## Properties

### [Symbol.toStringTag]

• `Readonly` **[Symbol.toStringTag]**: *string*

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md).[[Symbol.toStringTag]](knex.knex.chainableinterface.md#[symbol.tostringtag])

Defined in: node_modules/knex/types/index.d.ts:1639

## Methods

### addListener

▸ **addListener**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Raw*](knex.knex.raw.md)<TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Raw*](knex.knex.raw.md)<TResult\>

Defined in: node_modules/@types/node/events.d.ts:57

___

### asCallback

▸ **asCallback**(`callback`: Function): *Promise*<*Resolve*<TResult\>\>

#### Parameters:

Name | Type |
------ | ------ |
`callback` | Function |

**Returns:** *Promise*<*Resolve*<TResult\>\>

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1657

___

### catch

▸ **catch**<TResult\>(`onrejected?`: *null* \| (`reason`: *any*) => TResult \| *PromiseLike*<TResult\>): *Promise*<*Resolve*<TResult\> \| TResult\>

Attaches a callback for only the rejection of the Promise.

#### Type parameters:

Name | Default |
------ | ------ |
`TResult` | *never* |

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`onrejected?` | *null* \| (`reason`: *any*) => TResult \| *PromiseLike*<TResult\> | The callback to execute when the Promise is rejected.   |

**Returns:** *Promise*<*Resolve*<TResult\> \| TResult\>

A Promise for the completion of the callback.

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:1448

___

### connection

▸ **connection**(`connection`: *any*): [*Raw*](knex.knex.raw.md)<TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`connection` | *any* |

**Returns:** [*Raw*](knex.knex.raw.md)<TResult\>

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1644

___

### debug

▸ **debug**(`enabled`: *boolean*): [*Raw*](knex.knex.raw.md)<TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`enabled` | *boolean* |

**Returns:** [*Raw*](knex.knex.raw.md)<TResult\>

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1645

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

### finally

▸ **finally**(`onfinally?`: *null* \| () => *void*): *Promise*<*Resolve*<TResult\>\>

Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
resolved value cannot be modified from the callback.

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`onfinally?` | *null* \| () => *void* | The callback to execute when the Promise is settled (fulfilled or rejected).   |

**Returns:** *Promise*<*Resolve*<TResult\>\>

A Promise for the completion of the callback.

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: docs/node_modules/typescript/lib/lib.es2018.promise.d.ts:31

___

### getMaxListeners

▸ **getMaxListeners**(): *number*

**Returns:** *number*

Defined in: node_modules/@types/node/events.d.ts:64

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

▸ **off**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Raw*](knex.knex.raw.md)<TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Raw*](knex.knex.raw.md)<TResult\>

Defined in: node_modules/@types/node/events.d.ts:61

___

### on

▸ **on**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Raw*](knex.knex.raw.md)<TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Raw*](knex.knex.raw.md)<TResult\>

Defined in: node_modules/@types/node/events.d.ts:58

___

### once

▸ **once**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Raw*](knex.knex.raw.md)<TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Raw*](knex.knex.raw.md)<TResult\>

Defined in: node_modules/@types/node/events.d.ts:59

___

### options

▸ **options**(`options`: *Readonly*<{ [key: string]: *any*;  }\>): [*Raw*](knex.knex.raw.md)<TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`options` | *Readonly*<{ [key: string]: *any*;  }\> |

**Returns:** [*Raw*](knex.knex.raw.md)<TResult\>

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1643

___

### pipe

▸ **pipe**<T\>(`writable`: T, `options?`: *Readonly*<{ [key: string]: *any*;  }\>): *PassThrough*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | *WritableStream*<T\> |

#### Parameters:

Name | Type |
------ | ------ |
`writable` | T |
`options?` | *Readonly*<{ [key: string]: *any*;  }\> |

**Returns:** *PassThrough*

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1653

___

### prependListener

▸ **prependListener**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Raw*](knex.knex.raw.md)<TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Raw*](knex.knex.raw.md)<TResult\>

Defined in: node_modules/@types/node/events.d.ts:70

___

### prependOnceListener

▸ **prependOnceListener**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Raw*](knex.knex.raw.md)<TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Raw*](knex.knex.raw.md)<TResult\>

Defined in: node_modules/@types/node/events.d.ts:71

___

### queryContext

▸ **queryContext**(`context`: *any*): [*Raw*](knex.knex.raw.md)<TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`context` | *any* |

**Returns:** [*Raw*](knex.knex.raw.md)<TResult\>

Defined in: node_modules/knex/types/index.d.ts:1502

▸ **queryContext**(): *any*

**Returns:** *any*

Defined in: node_modules/knex/types/index.d.ts:1503

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

### removeAllListeners

▸ **removeAllListeners**(`event?`: *string* \| *symbol*): [*Raw*](knex.knex.raw.md)<TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`event?` | *string* \| *symbol* |

**Returns:** [*Raw*](knex.knex.raw.md)<TResult\>

Defined in: node_modules/@types/node/events.d.ts:62

___

### removeListener

▸ **removeListener**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Raw*](knex.knex.raw.md)<TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Raw*](knex.knex.raw.md)<TResult\>

Defined in: node_modules/@types/node/events.d.ts:60

___

### setMaxListeners

▸ **setMaxListeners**(`n`: *number*): [*Raw*](knex.knex.raw.md)<TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`n` | *number* |

**Returns:** [*Raw*](knex.knex.raw.md)<TResult\>

Defined in: node_modules/@types/node/events.d.ts:63

___

### stream

▸ **stream**(`handler`: (`readable`: *PassThrough*) => *any*): *Promise*<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`handler` | (`readable`: *PassThrough*) => *any* |

**Returns:** *Promise*<*any*\>

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1647

▸ **stream**(`options`: *Readonly*<{ [key: string]: *any*;  }\>, `handler`: (`readable`: *PassThrough*) => *any*): *Promise*<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`options` | *Readonly*<{ [key: string]: *any*;  }\> |
`handler` | (`readable`: *PassThrough*) => *any* |

**Returns:** *Promise*<*any*\>

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1648

▸ **stream**(`options?`: *Readonly*<{ [key: string]: *any*;  }\>): *PassThrough*

#### Parameters:

Name | Type |
------ | ------ |
`options?` | *Readonly*<{ [key: string]: *any*;  }\> |

**Returns:** *PassThrough*

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1652

___

### then

▸ **then**<TResult1, TResult2\>(`onfulfilled?`: *null* \| (`value`: *Resolve*<TResult\>) => TResult1 \| *PromiseLike*<TResult1\>, `onrejected?`: *null* \| (`reason`: *any*) => TResult2 \| *PromiseLike*<TResult2\>): *Promise*<TResult1 \| TResult2\>

Attaches callbacks for the resolution and/or rejection of the Promise.

#### Type parameters:

Name | Default |
------ | ------ |
`TResult1` | *Resolve*<TResult\\> |
`TResult2` | *never* |

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`onfulfilled?` | *null* \| (`value`: *Resolve*<TResult\>) => TResult1 \| *PromiseLike*<TResult1\> | The callback to execute when the Promise is resolved.   |
`onrejected?` | *null* \| (`reason`: *any*) => TResult2 \| *PromiseLike*<TResult2\> | The callback to execute when the Promise is rejected.   |

**Returns:** *Promise*<TResult1 \| TResult2\>

A Promise for the completion of which ever callback is executed.

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:1441

___

### timeout

▸ **timeout**(`ms`: *number*, `options?`: { `cancel?`: *undefined* \| *boolean*  }): [*Raw*](knex.knex.raw.md)<TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`ms` | *number* |
`options?` | { `cancel?`: *undefined* \| *boolean*  } |

**Returns:** [*Raw*](knex.knex.raw.md)<TResult\>

Defined in: node_modules/knex/types/index.d.ts:1499

___

### toQuery

▸ **toQuery**(): *string*

**Returns:** *string*

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1642

___

### toSQL

▸ **toSQL**(): [*Sql*](knex.knex.sql.md)

**Returns:** [*Sql*](knex.knex.sql.md)

Defined in: node_modules/knex/types/index.d.ts:1501

___

### transacting

▸ **transacting**(`trx`: [*Transaction*](knex.knex.transaction.md)<*any*, *any*\>): [*Raw*](knex.knex.raw.md)<TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`trx` | [*Transaction*](knex.knex.transaction.md)<*any*, *any*\> |

**Returns:** [*Raw*](knex.knex.raw.md)<TResult\>

Inherited from: [ChainableInterface](knex.knex.chainableinterface.md)

Defined in: node_modules/knex/types/index.d.ts:1646

___

### wrap

▸ **wrap**<TResult2\>(`before`: *string*, `after`: *string*): [*Raw*](knex.knex.raw.md)<TResult\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | TResult |

#### Parameters:

Name | Type |
------ | ------ |
`before` | *string* |
`after` | *string* |

**Returns:** [*Raw*](knex.knex.raw.md)<TResult\>

Defined in: node_modules/knex/types/index.d.ts:1500
