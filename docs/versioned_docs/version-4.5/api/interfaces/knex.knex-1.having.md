---
id: "knex.knex-1.having"
title: "Interface: Having<TRecord, TResult>"
sidebar_label: "Having"
custom_edit_url: null
hide_title: true
---

# Interface: Having<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).Having

## Type parameters

Name | Default |
:------ | :------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Hierarchy

* [*WhereWrapped*](knex.knex-1.wherewrapped.md)<TRecord, TResult\>

  ↳ **Having**

## Callable

▸ **Having**<K\>(`column`: K, `operator`: ComparisonOperator, `value`: [*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<TRecord[K]\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name | Type |
:------ | :------ |
`K` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
:------ | :------ |
`column` | K |
`operator` | ComparisonOperator |
`value` | [*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<TRecord[K]\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1405

▸ **Having**(`column`: *string* \| [*Raw*](knex.knex-1.raw.md)<any\>, `operator`: *string*, `value`: [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\> \| [*Value*](../modules/knex.knex-1.md#value)): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`column` | *string* \| [*Raw*](knex.knex-1.raw.md)<any\> |
`operator` | *string* |
`value` | [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\> \| [*Value*](../modules/knex.knex-1.md#value) |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1410

▸ **Having**(`raw`: [*Raw*](knex.knex-1.raw.md)<any\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`raw` | [*Raw*](knex.knex-1.raw.md)<any\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1416

▸ **Having**(`callback`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<TRecord, TResult\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`callback` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<TRecord, TResult\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1267
