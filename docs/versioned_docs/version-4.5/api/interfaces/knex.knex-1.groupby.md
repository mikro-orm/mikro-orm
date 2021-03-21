---
id: "knex.knex-1.groupby"
title: "Interface: GroupBy<TRecord, TResult>"
sidebar_label: "GroupBy"
custom_edit_url: null
hide_title: true
---

# Interface: GroupBy<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).GroupBy

## Type parameters

Name | Default |
:------ | :------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Hierarchy

* [*RawQueryBuilder*](knex.knex-1.rawquerybuilder.md)<TRecord, TResult\>

* [*ColumnNameQueryBuilder*](knex.knex-1.columnnamequerybuilder.md)<TRecord, TResult\>

  ↳ **GroupBy**

## Callable

▸ **GroupBy**<TResult2\>(`sql`: *string*, `bindings?`: [*ValueDict*](knex.knex-1.valuedict.md) \| [*Value*](../modules/knex.knex-1.md#value) \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\> \| readonly ([*Value*](../modules/knex.knex-1.md#value) \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\>)[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | TResult |

#### Parameters:

Name | Type |
:------ | :------ |
`sql` | *string* |
`bindings?` | [*ValueDict*](knex.knex-1.valuedict.md) \| [*Value*](../modules/knex.knex-1.md#value) \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\> \| readonly ([*Value*](../modules/knex.knex-1.md#value) \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\>)[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1489

▸ **GroupBy**<TResult2\>(`raw`: [*Raw*](knex.knex-1.raw.md)<TResult2\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | TResult |

#### Parameters:

Name | Type |
:------ | :------ |
`raw` | [*Raw*](knex.knex-1.raw.md)<TResult2\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1493

▸ **GroupBy**(`columnName`: ***): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, ArrayIfAlready<TResult, DeferredKeySelection<TRecord, string, *false*, {}, *false*, {}, never\>\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *** |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, ArrayIfAlready<TResult, DeferredKeySelection<TRecord, string, *false*, {}, *false*, {}, never\>\>\>

Defined in: node_modules/knex/types/index.d.ts:1434

▸ **GroupBy**<ColNameUT, TResult2\>(...`columnNames`: readonly ColNameUT[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`ColNameUT` | *string* \| *number* \| *symbol* | - |
`TResult2` | - | *AddAliases*<AddKey<SetBase<UnwrapArrayMember<TResult\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, ColNameUT & *string*\>, {}\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`...columnNames` | readonly ColNameUT[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1440

▸ **GroupBy**<ColNameUT, TResult2\>(`columnNames`: readonly ColNameUT[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`ColNameUT` | *string* \| *number* \| *symbol* | - |
`TResult2` | - | *AddAliases*<AddKey<SetBase<UnwrapArrayMember<TResult\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, ColNameUT & *string*\>, {}\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`columnNames` | readonly ColNameUT[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1451

▸ **GroupBy**<TResult2\>(...`columnNames`: readonly [*ColumnDescriptor*](../modules/knex.knex-1.md#columndescriptor)<TRecord, TResult\>[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *AddAliases*<AddKey<SetBase<UnwrapArrayMember<TResult\>, Partial<AnyOrUnknownToOther<TRecord, {}\>\>\>, keyof TRecord & *string*\>, {}\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`...columnNames` | readonly [*ColumnDescriptor*](../modules/knex.knex-1.md#columndescriptor)<TRecord, TResult\>[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1462

▸ **GroupBy**<TResult2\>(`columnNames`: readonly [*ColumnDescriptor*](../modules/knex.knex-1.md#columndescriptor)<TRecord, TResult\>[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *AddAliases*<AddKey<SetBase<UnwrapArrayMember<TResult\>, Partial<AnyOrUnknownToOther<TRecord, {}\>\>\>, keyof TRecord & *string*\>, {}\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`columnNames` | readonly [*ColumnDescriptor*](../modules/knex.knex-1.md#columndescriptor)<TRecord, TResult\>[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1474
