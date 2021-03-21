---
id: "knex.knex-1.where"
title: "Interface: Where<TRecord, TResult>"
sidebar_label: "Where"
custom_edit_url: null
hide_title: true
---

# Interface: Where<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).Where

## Type parameters

Name | Default |
:------ | :------ |
`TRecord` | *any* |
`TResult` | *unknown* |

## Hierarchy

* [*WhereRaw*](knex.knex-1.whereraw.md)<TRecord, TResult\>

* [*WhereWrapped*](knex.knex-1.wherewrapped.md)<TRecord, TResult\>

* [*WhereNull*](knex.knex-1.wherenull.md)<TRecord, TResult\>

  ↳ **Where**

## Callable

▸ **Where**(`raw`: [*Raw*](knex.knex-1.raw.md)<any\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`raw` | [*Raw*](knex.knex-1.raw.md)<any\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1211

▸ **Where**(`callback`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<TRecord, TResult\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`callback` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<TRecord, TResult\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1212

▸ **Where**(`object`: *Readonly*<Partial<AnyOrUnknownToOther<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, {}\>\>\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`object` | *Readonly*<Partial<AnyOrUnknownToOther<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, {}\>\>\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1214

▸ **Where**(`object`: *Readonly*<Object\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`object` | *Readonly*<Object\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1216

▸ **Where**<T\>(`columnName`: T, `value`: *null* \| [*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>[T]\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | T |
`value` | *null* \| [*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>[T]\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1218

▸ **Where**(`columnName`: *string*, `value`: [*Value*](../modules/knex.knex-1.md#value)): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`value` | [*Value*](../modules/knex.knex-1.md#value) |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1223

▸ **Where**<T\>(`columnName`: T, `operator`: ComparisonOperator, `value`: *null* \| [*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>[T]\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | T |
`operator` | ComparisonOperator |
`value` | *null* \| [*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>[T]\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1225

▸ **Where**(`columnName`: *string*, `operator`: *string*, `value`: [*Value*](../modules/knex.knex-1.md#value)): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`operator` | *string* |
`value` | [*Value*](../modules/knex.knex-1.md#value) |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1231

▸ **Where**<T, TRecordInner, TResultInner\>(`columnName`: T, `operator`: ComparisonOperator, `value`: [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecordInner, TResultInner\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name | Type |
:------ | :------ |
`T` | *string* \| *number* \| *symbol* |
`TRecordInner` | - |
`TResultInner` | - |

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | T |
`operator` | ComparisonOperator |
`value` | [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecordInner, TResultInner\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1236

▸ **Where**<TRecordInner, TResultInner\>(`columnName`: *string*, `operator`: *string*, `value`: [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecordInner, TResultInner\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name |
:------ |
`TRecordInner` |
`TResultInner` |

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`operator` | *string* |
`value` | [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecordInner, TResultInner\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1242

▸ **Where**(`left`: [*Raw*](knex.knex-1.raw.md)<any\>, `operator`: *string*, `right`: [*Value*](../modules/knex.knex-1.md#value)): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`left` | [*Raw*](knex.knex-1.raw.md)<any\> |
`operator` | *string* |
`right` | [*Value*](../modules/knex.knex-1.md#value) |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1248

▸ **Where**<TRecordInner, TResultInner\>(`left`: [*Raw*](knex.knex-1.raw.md)<any\>, `operator`: *string*, `right`: [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecordInner, TResultInner\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name |
:------ |
`TRecordInner` |
`TResultInner` |

#### Parameters:

Name | Type |
:------ | :------ |
`left` | [*Raw*](knex.knex-1.raw.md)<any\> |
`operator` | *string* |
`right` | [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecordInner, TResultInner\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1253

▸ **Where**(`condition`: *boolean*): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`condition` | *boolean* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1263

▸ **Where**<TResult2\>(`sql`: *string*, `bindings?`: [*ValueDict*](knex.knex-1.valuedict.md) \| [*Value*](../modules/knex.knex-1.md#value) \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\> \| readonly ([*Value*](../modules/knex.knex-1.md#value) \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\>)[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

▸ **Where**<TResult2\>(`raw`: [*Raw*](knex.knex-1.raw.md)<TResult2\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

▸ **Where**(`callback`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<TRecord, TResult\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`callback` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<TRecord, TResult\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1267

▸ **Where**(`columnName`: keyof TRecord): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | keyof TRecord |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1271

▸ **Where**(`columnName`: *string*): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1272
