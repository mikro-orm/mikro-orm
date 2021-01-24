---
id: "knex.knex.chainableinterface"
title: "Interface: ChainableInterface<T>"
sidebar_label: "ChainableInterface"
hide_title: true
---

# Interface: ChainableInterface<T\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).ChainableInterface

## Type parameters

Name | Default |
------ | ------ |
`T` | *any* |

## Hierarchy

* *Pick*<*Promise*<T\>, keyof *Promise*<T\> & [*ExposedPromiseKeys*](../modules/knex.knex-1.md#exposedpromisekeys)\>

* [*StringTagSupport*](knex.knex.stringtagsupport.md)

  ↳ **ChainableInterface**

  ↳↳ [*Raw*](knex.knex.raw.md)

  ↳↳ [*QueryBuilder*](../classes/knex.knex.querybuilder.md)

  ↳↳ [*SchemaBuilder*](knex.knex.schemabuilder.md)

## Properties

### [Symbol.toStringTag]

• `Readonly` **[Symbol.toStringTag]**: *string*

Inherited from: [StringTagSupport](knex.knex.stringtagsupport.md).[[Symbol.toStringTag]](knex.knex.stringtagsupport.md#[symbol.tostringtag])

Defined in: node_modules/knex/types/index.d.ts:1639

## Methods

### asCallback

▸ **asCallback**(`callback`: Function): *Promise*<T\>

#### Parameters:

Name | Type |
------ | ------ |
`callback` | Function |

**Returns:** *Promise*<T\>

Defined in: node_modules/knex/types/index.d.ts:1657

___

### catch

▸ **catch**<TResult\>(`onrejected?`: *null* \| (`reason`: *any*) => TResult \| *PromiseLike*<TResult\>): *Promise*<T \| TResult\>

Attaches a callback for only the rejection of the Promise.

#### Type parameters:

Name | Default |
------ | ------ |
`TResult` | *never* |

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`onrejected?` | *null* \| (`reason`: *any*) => TResult \| *PromiseLike*<TResult\> | The callback to execute when the Promise is rejected.   |

**Returns:** *Promise*<T \| TResult\>

A Promise for the completion of the callback.

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:1448

___

### connection

▸ **connection**(`connection`: *any*): [*ChainableInterface*](knex.knex.chainableinterface.md)<T\>

#### Parameters:

Name | Type |
------ | ------ |
`connection` | *any* |

**Returns:** [*ChainableInterface*](knex.knex.chainableinterface.md)<T\>

Defined in: node_modules/knex/types/index.d.ts:1644

___

### debug

▸ **debug**(`enabled`: *boolean*): [*ChainableInterface*](knex.knex.chainableinterface.md)<T\>

#### Parameters:

Name | Type |
------ | ------ |
`enabled` | *boolean* |

**Returns:** [*ChainableInterface*](knex.knex.chainableinterface.md)<T\>

Defined in: node_modules/knex/types/index.d.ts:1645

___

### finally

▸ **finally**(`onfinally?`: *null* \| () => *void*): *Promise*<T\>

Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
resolved value cannot be modified from the callback.

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`onfinally?` | *null* \| () => *void* | The callback to execute when the Promise is settled (fulfilled or rejected).   |

**Returns:** *Promise*<T\>

A Promise for the completion of the callback.

Defined in: docs/node_modules/typescript/lib/lib.es2018.promise.d.ts:31

___

### options

▸ **options**(`options`: *Readonly*<{ [key: string]: *any*;  }\>): [*ChainableInterface*](knex.knex.chainableinterface.md)<T\>

#### Parameters:

Name | Type |
------ | ------ |
`options` | *Readonly*<{ [key: string]: *any*;  }\> |

**Returns:** [*ChainableInterface*](knex.knex.chainableinterface.md)<T\>

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

Defined in: node_modules/knex/types/index.d.ts:1653

___

### stream

▸ **stream**(`handler`: (`readable`: *PassThrough*) => *any*): *Promise*<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`handler` | (`readable`: *PassThrough*) => *any* |

**Returns:** *Promise*<*any*\>

Defined in: node_modules/knex/types/index.d.ts:1647

▸ **stream**(`options`: *Readonly*<{ [key: string]: *any*;  }\>, `handler`: (`readable`: *PassThrough*) => *any*): *Promise*<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`options` | *Readonly*<{ [key: string]: *any*;  }\> |
`handler` | (`readable`: *PassThrough*) => *any* |

**Returns:** *Promise*<*any*\>

Defined in: node_modules/knex/types/index.d.ts:1648

▸ **stream**(`options?`: *Readonly*<{ [key: string]: *any*;  }\>): *PassThrough*

#### Parameters:

Name | Type |
------ | ------ |
`options?` | *Readonly*<{ [key: string]: *any*;  }\> |

**Returns:** *PassThrough*

Defined in: node_modules/knex/types/index.d.ts:1652

___

### then

▸ **then**<TResult1, TResult2\>(`onfulfilled?`: *null* \| (`value`: T) => TResult1 \| *PromiseLike*<TResult1\>, `onrejected?`: *null* \| (`reason`: *any*) => TResult2 \| *PromiseLike*<TResult2\>): *Promise*<TResult1 \| TResult2\>

Attaches callbacks for the resolution and/or rejection of the Promise.

#### Type parameters:

Name | Default |
------ | ------ |
`TResult1` | T |
`TResult2` | *never* |

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`onfulfilled?` | *null* \| (`value`: T) => TResult1 \| *PromiseLike*<TResult1\> | The callback to execute when the Promise is resolved.   |
`onrejected?` | *null* \| (`reason`: *any*) => TResult2 \| *PromiseLike*<TResult2\> | The callback to execute when the Promise is rejected.   |

**Returns:** *Promise*<TResult1 \| TResult2\>

A Promise for the completion of which ever callback is executed.

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:1441

___

### toQuery

▸ **toQuery**(): *string*

**Returns:** *string*

Defined in: node_modules/knex/types/index.d.ts:1642

___

### transacting

▸ **transacting**(`trx`: [*Transaction*](knex.knex.transaction.md)<*any*, *any*\>): [*ChainableInterface*](knex.knex.chainableinterface.md)<T\>

#### Parameters:

Name | Type |
------ | ------ |
`trx` | [*Transaction*](knex.knex.transaction.md)<*any*, *any*\> |

**Returns:** [*ChainableInterface*](knex.knex.chainableinterface.md)<T\>

Defined in: node_modules/knex/types/index.d.ts:1646
