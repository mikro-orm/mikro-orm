---
id: "knex.knex.groupby"
title: "Interface: GroupBy<TRecord, TResult>"
sidebar_label: "GroupBy"
hide_title: true
---

# Interface: GroupBy<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).GroupBy

## Type parameters

Name | Default |
------ | ------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Hierarchy

* [*RawQueryBuilder*](knex.knex.rawquerybuilder.md)<TRecord, TResult\>

* [*ColumnNameQueryBuilder*](knex.knex.columnnamequerybuilder.md)<TRecord, TResult\>

  ↳ **GroupBy**

## Callable

▸ **GroupBy**<TResult2\>(`sql`: *string*, `bindings?`: *null* \| *string* \| *number* \| *boolean* \| Date \| *Buffer* \| *string*[] \| *number*[] \| Date[] \| *boolean*[] \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*ValueDict*](knex.knex.valuedict.md) \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| readonly [*RawBinding*](../modules/knex.knex-1.md#rawbinding)[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | TResult |

#### Parameters:

Name | Type |
------ | ------ |
`sql` | *string* |
`bindings?` | *null* \| *string* \| *number* \| *boolean* \| Date \| *Buffer* \| *string*[] \| *number*[] \| Date[] \| *boolean*[] \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*ValueDict*](knex.knex.valuedict.md) \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| readonly [*RawBinding*](../modules/knex.knex-1.md#rawbinding)[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1483

▸ **GroupBy**<TResult2\>(`raw`: [*Raw*](knex.knex.raw.md)<TResult2\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | TResult |

#### Parameters:

Name | Type |
------ | ------ |
`raw` | [*Raw*](knex.knex.raw.md)<TResult2\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1487

▸ **GroupBy**(`columnName`: ***): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *ArrayIfAlready*<TResult, *DeferredKeySelection*<TRecord, *string*, *false*, {}, *false*, {}, *never*\>\>\>

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *** |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *ArrayIfAlready*<TResult, *DeferredKeySelection*<TRecord, *string*, *false*, {}, *false*, {}, *never*\>\>\>

Defined in: node_modules/knex/types/index.d.ts:1428

▸ **GroupBy**<ColNameUT, TResult2\>(...`columnNames`: readonly ColNameUT[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`ColNameUT` | *string* \| *number* \| *symbol* | - |
`TResult2` | - | *AddAliases*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\\>\\>, ColNameUT & *string*\\>, {}\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`...columnNames` | readonly ColNameUT[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1434

▸ **GroupBy**<ColNameUT, TResult2\>(`columnNames`: readonly ColNameUT[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`ColNameUT` | *string* \| *number* \| *symbol* | - |
`TResult2` | - | *AddAliases*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\\>\\>, ColNameUT & *string*\\>, {}\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`columnNames` | readonly ColNameUT[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1445

▸ **GroupBy**<TResult2\>(...`columnNames`: readonly [*ColumnDescriptor*](../modules/knex.knex-1.md#columndescriptor)<TRecord, TResult\>[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | *AddAliases*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, *Partial*<*AnyOrUnknownToOther*<TRecord, {}\\>\\>\\>, keyof TRecord & *string*\\>, {}\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`...columnNames` | readonly [*ColumnDescriptor*](../modules/knex.knex-1.md#columndescriptor)<TRecord, TResult\>[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1456

▸ **GroupBy**<TResult2\>(`columnNames`: readonly [*ColumnDescriptor*](../modules/knex.knex-1.md#columndescriptor)<TRecord, TResult\>[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | *AddAliases*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, *Partial*<*AnyOrUnknownToOther*<TRecord, {}\\>\\>\\>, keyof TRecord & *string*\\>, {}\\>[] |

#### Parameters:

Name | Type |
------ | ------ |
`columnNames` | readonly [*ColumnDescriptor*](../modules/knex.knex-1.md#columndescriptor)<TRecord, TResult\>[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1468
