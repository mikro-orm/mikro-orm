---
id: "knex.knex-1.wherein"
title: "Interface: WhereIn<TRecord, TResult>"
sidebar_label: "WhereIn"
custom_edit_url: null
hide_title: true
---

# Interface: WhereIn<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).WhereIn

## Type parameters

Name | Default |
:------ | :------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Callable

▸ **WhereIn**<K\>(`columnName`: K, `values`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> \| readonly [*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>[K]\>[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name | Type |
:------ | :------ |
`K` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | K |
`values` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> \| readonly [*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>[K]\>[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1291

▸ **WhereIn**(`columnName`: *string*, `values`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> \| readonly [*Value*](../modules/knex.knex-1.md#value)[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`values` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> \| readonly [*Value*](../modules/knex.knex-1.md#value)[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1295

▸ **WhereIn**<K\>(`columnNames`: readonly K[], `values`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> \| readonly readonly DbColumn<ResolveTableType<TRecord, "base"\>[K]\>[][]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name | Type |
:------ | :------ |
`K` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
:------ | :------ |
`columnNames` | readonly K[] |
`values` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> \| readonly readonly DbColumn<ResolveTableType<TRecord, "base"\>[K]\>[][] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1299

▸ **WhereIn**(`columnNames`: readonly *string*[], `values`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> \| readonly [*Value*](../modules/knex.knex-1.md#value)[][]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnNames` | readonly *string*[] |
`values` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> \| readonly [*Value*](../modules/knex.knex-1.md#value)[][] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1303

▸ **WhereIn**<K, TRecordInner, TResultInner\>(`columnName`: K, `values`: [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecordInner, TRecord[K]\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name | Type |
:------ | :------ |
`K` | *string* \| *number* \| *symbol* |
`TRecordInner` | - |
`TResultInner` | - |

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | K |
`values` | [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecordInner, TRecord[K]\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1307

▸ **WhereIn**<TRecordInner, TResultInner\>(`columnName`: *string*, `values`: [*Value*](../modules/knex.knex-1.md#value)[] \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecordInner, TResultInner\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name |
:------ |
`TRecordInner` |
`TResultInner` |

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`values` | [*Value*](../modules/knex.knex-1.md#value)[] \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecordInner, TResultInner\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1311

▸ **WhereIn**<K, TRecordInner, TResultInner\>(`columnNames`: readonly K[], `values`: [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecordInner, TRecord[K]\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name | Type |
:------ | :------ |
`K` | *string* \| *number* \| *symbol* |
`TRecordInner` | - |
`TResultInner` | - |

#### Parameters:

Name | Type |
:------ | :------ |
`columnNames` | readonly K[] |
`values` | [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecordInner, TRecord[K]\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1315

▸ **WhereIn**<TRecordInner, TResultInner\>(`columnNames`: readonly *string*[], `values`: [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecordInner, TResultInner\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name |
:------ |
`TRecordInner` |
`TResultInner` |

#### Parameters:

Name | Type |
:------ | :------ |
`columnNames` | readonly *string*[] |
`values` | [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecordInner, TResultInner\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1319
