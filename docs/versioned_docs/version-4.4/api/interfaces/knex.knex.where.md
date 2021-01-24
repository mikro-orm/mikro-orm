---
id: "knex.knex.where"
title: "Interface: Where<TRecord, TResult>"
sidebar_label: "Where"
hide_title: true
---

# Interface: Where<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).Where

## Type parameters

Name | Default |
------ | ------ |
`TRecord` | *any* |
`TResult` | *unknown* |

## Hierarchy

* [*WhereRaw*](knex.knex.whereraw.md)<TRecord, TResult\>

* [*WhereWrapped*](knex.knex.wherewrapped.md)<TRecord, TResult\>

* [*WhereNull*](knex.knex.wherenull.md)<TRecord, TResult\>

  ↳ **Where**

## Callable

▸ **Where**(`raw`: [*Raw*](knex.knex.raw.md)<*any*\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`raw` | [*Raw*](knex.knex.raw.md)<*any*\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1205

▸ **Where**(`callback`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<TRecord, TResult\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`callback` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<TRecord, TResult\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1206

▸ **Where**(`object`: *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, {}\>\>\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`object` | *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, {}\>\>\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1208

▸ **Where**(`object`: *Readonly*<Object\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`object` | *Readonly*<Object\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1210

▸ **Where**<T\>(`columnName`: T, `value`: *null* \| *Readonly*<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>[T]\> \| *Readonly*<[*Raw*](knex.knex.raw.md)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>[T]\>\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | T |
`value` | *null* \| *Readonly*<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>[T]\> \| *Readonly*<[*Raw*](knex.knex.raw.md)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>[T]\>\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1212

▸ **Where**(`columnName`: *string*, `value`: [*Value*](../modules/knex.knex-1.md#value)): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`value` | [*Value*](../modules/knex.knex-1.md#value) |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1217

▸ **Where**<T\>(`columnName`: T, `operator`: ComparisonOperator, `value`: *null* \| *Readonly*<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>[T]\> \| *Readonly*<[*Raw*](knex.knex.raw.md)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>[T]\>\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | T |
`operator` | ComparisonOperator |
`value` | *null* \| *Readonly*<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>[T]\> \| *Readonly*<[*Raw*](knex.knex.raw.md)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>[T]\>\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1219

▸ **Where**(`columnName`: *string*, `operator`: *string*, `value`: [*Value*](../modules/knex.knex-1.md#value)): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`operator` | *string* |
`value` | [*Value*](../modules/knex.knex-1.md#value) |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1225

▸ **Where**<T, TRecordInner, TResultInner\>(`columnName`: T, `operator`: ComparisonOperator, `value`: [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecordInner, TResultInner\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name | Type |
------ | ------ |
`T` | *string* \| *number* \| *symbol* |
`TRecordInner` | - |
`TResultInner` | - |

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | T |
`operator` | ComparisonOperator |
`value` | [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecordInner, TResultInner\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1230

▸ **Where**<TRecordInner, TResultInner\>(`columnName`: *string*, `operator`: *string*, `value`: [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecordInner, TResultInner\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name |
------ |
`TRecordInner` |
`TResultInner` |

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`operator` | *string* |
`value` | [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecordInner, TResultInner\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1236

▸ **Where**(`left`: [*Raw*](knex.knex.raw.md)<*any*\>, `operator`: *string*, `right`: [*Value*](../modules/knex.knex-1.md#value)): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`left` | [*Raw*](knex.knex.raw.md)<*any*\> |
`operator` | *string* |
`right` | [*Value*](../modules/knex.knex-1.md#value) |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1242

▸ **Where**<TRecordInner, TResultInner\>(`left`: [*Raw*](knex.knex.raw.md)<*any*\>, `operator`: *string*, `right`: [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecordInner, TResultInner\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name |
------ |
`TRecordInner` |
`TResultInner` |

#### Parameters:

Name | Type |
------ | ------ |
`left` | [*Raw*](knex.knex.raw.md)<*any*\> |
`operator` | *string* |
`right` | [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecordInner, TResultInner\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1247

▸ **Where**(`condition`: *boolean*): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`condition` | *boolean* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1257

▸ **Where**<TResult2\>(`sql`: *string*, `bindings?`: *null* \| *string* \| *number* \| *boolean* \| Date \| *Buffer* \| *string*[] \| *number*[] \| Date[] \| *boolean*[] \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*ValueDict*](knex.knex.valuedict.md) \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| readonly [*RawBinding*](../modules/knex.knex-1.md#rawbinding)[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

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

▸ **Where**<TResult2\>(`raw`: [*Raw*](knex.knex.raw.md)<TResult2\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

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

▸ **Where**(`callback`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<TRecord, TResult\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`callback` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<TRecord, TResult\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1261

▸ **Where**(`columnName`: keyof TRecord): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | keyof TRecord |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1265

▸ **Where**(`columnName`: *string*): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1266
