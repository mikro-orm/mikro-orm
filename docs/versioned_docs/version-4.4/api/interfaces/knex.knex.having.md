---
id: "knex.knex.having"
title: "Interface: Having<TRecord, TResult>"
sidebar_label: "Having"
hide_title: true
---

# Interface: Having<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).Having

## Type parameters

Name | Default |
------ | ------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Hierarchy

* [*WhereWrapped*](knex.knex.wherewrapped.md)<TRecord, TResult\>

  ↳ **Having**

## Callable

▸ **Having**<K\>(`column`: K, `operator`: ComparisonOperator, `value`: *Readonly*<TRecord[K]\> \| *Readonly*<[*Raw*](knex.knex.raw.md)<TRecord[K]\>\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name | Type |
------ | ------ |
`K` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
------ | ------ |
`column` | K |
`operator` | ComparisonOperator |
`value` | *Readonly*<TRecord[K]\> \| *Readonly*<[*Raw*](knex.knex.raw.md)<TRecord[K]\>\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1399

▸ **Having**(`column`: *string* \| [*Raw*](knex.knex.raw.md)<*any*\>, `operator`: *string*, `value`: *null* \| *string* \| *number* \| *boolean* \| Date \| *Buffer* \| *string*[] \| *number*[] \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| Date[] \| *boolean*[] \| [*Raw*](knex.knex.raw.md)<*any*\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`column` | *string* \| [*Raw*](knex.knex.raw.md)<*any*\> |
`operator` | *string* |
`value` | *null* \| *string* \| *number* \| *boolean* \| Date \| *Buffer* \| *string*[] \| *number*[] \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| Date[] \| *boolean*[] \| [*Raw*](knex.knex.raw.md)<*any*\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1404

▸ **Having**(`raw`: [*Raw*](knex.knex.raw.md)<*any*\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`raw` | [*Raw*](knex.knex.raw.md)<*any*\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1410

▸ **Having**(`callback`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<TRecord, TResult\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`callback` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<TRecord, TResult\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1261
