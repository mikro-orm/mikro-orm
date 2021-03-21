---
id: "knex.knex-1.ref"
title: "Interface: Ref<TSrc, TMapping>"
sidebar_label: "Ref"
custom_edit_url: null
hide_title: true
---

# Interface: Ref<TSrc, TMapping\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).Ref

## Type parameters

Name | Type |
:------ | :------ |
`TSrc` | *string* |
`TMapping` | *object* |

## Hierarchy

* [*Raw*](knex.knex-1.raw.md)<string\>

  ↳ **Ref**

## Properties

### [RefMemberTag]

• **[RefMemberTag]**: *object*

#### Type declaration:

Name | Type |
:------ | :------ |
`mapping` | TMapping |
`src` | TSrc |

Defined in: node_modules/knex/types/index.d.ts:1532

___

### [Symbol.toStringTag]

• `Readonly` **[Symbol.toStringTag]**: *string*

Inherited from: [Raw](knex.knex-1.raw.md).[[Symbol.toStringTag]](knex.knex-1.raw.md#[symbol.tostringtag])

Defined in: node_modules/knex/types/index.d.ts:1645

## Methods

### addListener

▸ **addListener**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/@types/node/events.d.ts:62

___

### as

▸ **as**<TAlias\>(`alias`: TAlias): [*Ref*](knex.knex-1.ref.md)<TSrc, { [K in string]: TSrc}\>

#### Type parameters:

Name | Type |
:------ | :------ |
`TAlias` | *string* |

#### Parameters:

Name | Type |
:------ | :------ |
`alias` | TAlias |

**Returns:** [*Ref*](knex.knex-1.ref.md)<TSrc, { [K in string]: TSrc}\>

Defined in: node_modules/knex/types/index.d.ts:1537

___

### asCallback

▸ **asCallback**(`callback`: Function): *Promise*<string\>

#### Parameters:

Name | Type |
:------ | :------ |
`callback` | Function |

**Returns:** *Promise*<string\>

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/knex/types/index.d.ts:1663

___

### catch

▸ **catch**<TResult\>(`onrejected?`: *null* \| (`reason`: *any*) => TResult \| *PromiseLike*<TResult\>): *Promise*<string \| TResult\>

Attaches a callback for only the rejection of the Promise.

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult` | *never* |

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`onrejected?` | *null* \| (`reason`: *any*) => TResult \| *PromiseLike*<TResult\> | The callback to execute when the Promise is rejected.   |

**Returns:** *Promise*<string \| TResult\>

A Promise for the completion of the callback.

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:1460

___

### connection

▸ **connection**(`connection`: *any*): [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

#### Parameters:

Name | Type |
:------ | :------ |
`connection` | *any* |

**Returns:** [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/knex/types/index.d.ts:1650

___

### debug

▸ **debug**(`enabled`: *boolean*): [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

#### Parameters:

Name | Type |
:------ | :------ |
`enabled` | *boolean* |

**Returns:** [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/knex/types/index.d.ts:1651

___

### emit

▸ **emit**(`event`: *string* \| *symbol*, ...`args`: *any*[]): *boolean*

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |
`...args` | *any*[] |

**Returns:** *boolean*

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/@types/node/events.d.ts:72

___

### eventNames

▸ **eventNames**(): (*string* \| *symbol*)[]

**Returns:** (*string* \| *symbol*)[]

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/@types/node/events.d.ts:77

___

### finally

▸ **finally**(`onfinally?`: *null* \| () => *void*): *Promise*<string\>

Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
resolved value cannot be modified from the callback.

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`onfinally?` | *null* \| () => *void* | The callback to execute when the Promise is settled (fulfilled or rejected).   |

**Returns:** *Promise*<string\>

A Promise for the completion of the callback.

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: docs/node_modules/typescript/lib/lib.es2018.promise.d.ts:31

___

### getMaxListeners

▸ **getMaxListeners**(): *number*

**Returns:** *number*

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/@types/node/events.d.ts:69

___

### listenerCount

▸ **listenerCount**(`event`: *string* \| *symbol*): *number*

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |

**Returns:** *number*

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/@types/node/events.d.ts:73

___

### listeners

▸ **listeners**(`event`: *string* \| *symbol*): Function[]

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |

**Returns:** Function[]

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/@types/node/events.d.ts:70

___

### off

▸ **off**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/@types/node/events.d.ts:66

___

### on

▸ **on**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/@types/node/events.d.ts:63

___

### once

▸ **once**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/@types/node/events.d.ts:64

___

### options

▸ **options**(`options`: *Readonly*<{ [key: string]: *any*;  }\>): [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

#### Parameters:

Name | Type |
:------ | :------ |
`options` | *Readonly*<{ [key: string]: *any*;  }\> |

**Returns:** [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/knex/types/index.d.ts:1649

___

### pipe

▸ **pipe**<T\>(`writable`: T, `options?`: *Readonly*<{ [key: string]: *any*;  }\>): *PassThrough*

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | *WritableStream*<T\> |

#### Parameters:

Name | Type |
:------ | :------ |
`writable` | T |
`options?` | *Readonly*<{ [key: string]: *any*;  }\> |

**Returns:** *PassThrough*

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/knex/types/index.d.ts:1659

___

### prependListener

▸ **prependListener**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/@types/node/events.d.ts:75

___

### prependOnceListener

▸ **prependOnceListener**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/@types/node/events.d.ts:76

___

### queryContext

▸ **queryContext**(`context`: *any*): [*Raw*](knex.knex-1.raw.md)<string\>

#### Parameters:

Name | Type |
:------ | :------ |
`context` | *any* |

**Returns:** [*Raw*](knex.knex-1.raw.md)<string\>

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/knex/types/index.d.ts:1508

▸ **queryContext**(): *any*

**Returns:** *any*

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/knex/types/index.d.ts:1509

___

### rawListeners

▸ **rawListeners**(`event`: *string* \| *symbol*): Function[]

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |

**Returns:** Function[]

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/@types/node/events.d.ts:71

___

### removeAllListeners

▸ **removeAllListeners**(`event?`: *string* \| *symbol*): [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

#### Parameters:

Name | Type |
:------ | :------ |
`event?` | *string* \| *symbol* |

**Returns:** [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/@types/node/events.d.ts:67

___

### removeListener

▸ **removeListener**(`event`: *string* \| *symbol*, `listener`: (...`args`: *any*[]) => *void*): [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

#### Parameters:

Name | Type |
:------ | :------ |
`event` | *string* \| *symbol* |
`listener` | (...`args`: *any*[]) => *void* |

**Returns:** [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/@types/node/events.d.ts:65

___

### setMaxListeners

▸ **setMaxListeners**(`n`: *number*): [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

#### Parameters:

Name | Type |
:------ | :------ |
`n` | *number* |

**Returns:** [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/@types/node/events.d.ts:68

___

### stream

▸ **stream**(`handler`: (`readable`: *PassThrough*) => *any*): *Promise*<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`handler` | (`readable`: *PassThrough*) => *any* |

**Returns:** *Promise*<any\>

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/knex/types/index.d.ts:1653

▸ **stream**(`options`: *Readonly*<{ [key: string]: *any*;  }\>, `handler`: (`readable`: *PassThrough*) => *any*): *Promise*<any\>

#### Parameters:

Name | Type |
:------ | :------ |
`options` | *Readonly*<{ [key: string]: *any*;  }\> |
`handler` | (`readable`: *PassThrough*) => *any* |

**Returns:** *Promise*<any\>

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/knex/types/index.d.ts:1654

▸ **stream**(`options?`: *Readonly*<{ [key: string]: *any*;  }\>): *PassThrough*

#### Parameters:

Name | Type |
:------ | :------ |
`options?` | *Readonly*<{ [key: string]: *any*;  }\> |

**Returns:** *PassThrough*

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/knex/types/index.d.ts:1658

___

### then

▸ **then**<TResult1, TResult2\>(`onfulfilled?`: *null* \| (`value`: *string*) => TResult1 \| *PromiseLike*<TResult1\>, `onrejected?`: *null* \| (`reason`: *any*) => TResult2 \| *PromiseLike*<TResult2\>): *Promise*<TResult1 \| TResult2\>

Attaches callbacks for the resolution and/or rejection of the Promise.

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult1` | *string* |
`TResult2` | *never* |

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`onfulfilled?` | *null* \| (`value`: *string*) => TResult1 \| *PromiseLike*<TResult1\> | The callback to execute when the Promise is resolved.   |
`onrejected?` | *null* \| (`reason`: *any*) => TResult2 \| *PromiseLike*<TResult2\> | The callback to execute when the Promise is rejected.   |

**Returns:** *Promise*<TResult1 \| TResult2\>

A Promise for the completion of which ever callback is executed.

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:1453

___

### timeout

▸ **timeout**(`ms`: *number*, `options?`: { `cancel?`: *boolean*  }): [*Raw*](knex.knex-1.raw.md)<string\>

#### Parameters:

Name | Type |
:------ | :------ |
`ms` | *number* |
`options?` | *object* |
`options.cancel?` | *boolean* |

**Returns:** [*Raw*](knex.knex-1.raw.md)<string\>

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/knex/types/index.d.ts:1505

___

### toQuery

▸ **toQuery**(): *string*

**Returns:** *string*

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/knex/types/index.d.ts:1648

___

### toSQL

▸ **toSQL**(): [*Sql*](knex.knex-1.sql.md)

**Returns:** [*Sql*](knex.knex-1.sql.md)

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/knex/types/index.d.ts:1507

___

### transacting

▸ **transacting**(`trx`: [*Transaction*](knex.knex-1.transaction.md)<any, any\>): [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

#### Parameters:

Name | Type |
:------ | :------ |
`trx` | [*Transaction*](knex.knex-1.transaction.md)<any, any\> |

**Returns:** [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/knex/types/index.d.ts:1652

___

### withSchema

▸ **withSchema**(`schema`: *string*): [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

#### Parameters:

Name | Type |
:------ | :------ |
`schema` | *string* |

**Returns:** [*Ref*](knex.knex-1.ref.md)<TSrc, TMapping\>

Defined in: node_modules/knex/types/index.d.ts:1536

___

### wrap

▸ **wrap**<TResult2\>(`before`: *string*, `after`: *string*): [*Raw*](knex.knex-1.raw.md)<string\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *string* |

#### Parameters:

Name | Type |
:------ | :------ |
`before` | *string* |
`after` | *string* |

**Returns:** [*Raw*](knex.knex-1.raw.md)<string\>

Inherited from: [Raw](knex.knex-1.raw.md)

Defined in: node_modules/knex/types/index.d.ts:1506
