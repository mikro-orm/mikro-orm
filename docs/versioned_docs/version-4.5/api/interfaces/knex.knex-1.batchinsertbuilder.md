---
id: "knex.knex-1.batchinsertbuilder"
title: "Interface: BatchInsertBuilder<TRecord, TResult>"
sidebar_label: "BatchInsertBuilder"
custom_edit_url: null
hide_title: true
---

# Interface: BatchInsertBuilder<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).BatchInsertBuilder

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`TRecord` | *object* | *any* |
`TResult` | - | *number*[] |

## Hierarchy

* *Promise*<ResolveResult<TResult\>\>

  ↳ **BatchInsertBuilder**

## Properties

### [Symbol.toStringTag]

• `Readonly` **[Symbol.toStringTag]**: *string*

Inherited from: void

Defined in: docs/node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts:174

## Methods

### catch

▸ **catch**<TResult\>(`onrejected?`: *null* \| (`reason`: *any*) => TResult \| *PromiseLike*<TResult\>): *Promise*<Resolve<TResult\> \| TResult\>

Attaches a callback for only the rejection of the Promise.

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult` | *never* |

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`onrejected?` | *null* \| (`reason`: *any*) => TResult \| *PromiseLike*<TResult\> | The callback to execute when the Promise is rejected.   |

**Returns:** *Promise*<Resolve<TResult\> \| TResult\>

A Promise for the completion of the callback.

Inherited from: void

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:1460

___

### finally

▸ **finally**(`onfinally?`: *null* \| () => *void*): *Promise*<Resolve<TResult\>\>

Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
resolved value cannot be modified from the callback.

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`onfinally?` | *null* \| () => *void* | The callback to execute when the Promise is settled (fulfilled or rejected).   |

**Returns:** *Promise*<Resolve<TResult\>\>

A Promise for the completion of the callback.

Inherited from: void

Defined in: docs/node_modules/typescript/lib/lib.es2018.promise.d.ts:31

___

### returning

▸ **returning**(`column`: ***): [*BatchInsertBuilder*](knex.knex-1.batchinsertbuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

#### Parameters:

Name | Type |
:------ | :------ |
`column` | *** |

**Returns:** [*BatchInsertBuilder*](knex.knex-1.batchinsertbuilder.md)<TRecord, DeferredKeySelection<TRecord, never, *false*, {}, *false*, {}, never\>[]\>

Defined in: node_modules/knex/types/index.d.ts:1547

▸ **returning**<TKey, TResult2\>(`column`: TKey): [*BatchInsertBuilder*](knex.knex-1.batchinsertbuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<AddKey<SetBase<UnwrapArrayMember<TResult\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, TKey\>, *true*\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`column` | TKey |

**Returns:** [*BatchInsertBuilder*](knex.knex-1.batchinsertbuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1548

▸ **returning**<TKey, TResult2\>(`columns`: readonly TKey[]): [*BatchInsertBuilder*](knex.knex-1.batchinsertbuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TKey` | *string* | - |
`TResult2` | - | *SetSingle*<AddAliases<AddKey<SetBase<UnwrapArrayMember<TResult\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, TKey\>, {}\>, *false*\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`columns` | readonly TKey[] |

**Returns:** [*BatchInsertBuilder*](knex.knex-1.batchinsertbuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1558

▸ **returning**<TResult2\>(`column`: *unknown* *extends* TRecord ? *string* \| readonly *string*[] : *never*): [*BatchInsertBuilder*](knex.knex-1.batchinsertbuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *Partial*<AnyOrUnknownToOther<TRecord, {}\>\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`column` | *unknown* *extends* TRecord ? *string* \| readonly *string*[] : *never* |

**Returns:** [*BatchInsertBuilder*](knex.knex-1.batchinsertbuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1568

___

### then

▸ **then**<TResult1, TResult2\>(`onfulfilled?`: *null* \| (`value`: *Resolve*<TResult\>) => TResult1 \| *PromiseLike*<TResult1\>, `onrejected?`: *null* \| (`reason`: *any*) => TResult2 \| *PromiseLike*<TResult2\>): *Promise*<TResult1 \| TResult2\>

Attaches callbacks for the resolution and/or rejection of the Promise.

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult1` | *Resolve*<TResult\> |
`TResult2` | *never* |

#### Parameters:

Name | Type | Description |
:------ | :------ | :------ |
`onfulfilled?` | *null* \| (`value`: *Resolve*<TResult\>) => TResult1 \| *PromiseLike*<TResult1\> | The callback to execute when the Promise is resolved.   |
`onrejected?` | *null* \| (`reason`: *any*) => TResult2 \| *PromiseLike*<TResult2\> | The callback to execute when the Promise is rejected.   |

**Returns:** *Promise*<TResult1 \| TResult2\>

A Promise for the completion of which ever callback is executed.

Inherited from: void

Defined in: docs/node_modules/typescript/lib/lib.es5.d.ts:1453

___

### transacting

▸ **transacting**(`trx`: [*Transaction*](knex.knex-1.transaction.md)<any, any\>): [*BatchInsertBuilder*](knex.knex-1.batchinsertbuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`trx` | [*Transaction*](knex.knex-1.transaction.md)<any, any\> |

**Returns:** [*BatchInsertBuilder*](knex.knex-1.batchinsertbuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1545
