---
id: "knex.knex.union"
title: "Interface: Union<TRecord, TResult>"
sidebar_label: "Union"
hide_title: true
---

# Interface: Union<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).Union

## Type parameters

Name | Default |
------ | ------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Hierarchy

* [*Intersect*](knex.knex.intersect.md)<TRecord, TResult\>

  ↳ **Union**

## Callable

▸ **Union**(`callback`: *MaybeArray*<[*Raw*](knex.knex.raw.md)<*any*\> \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\> \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *any*\>\>, `wrap?`: *boolean*): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`callback` | *MaybeArray*<[*Raw*](knex.knex.raw.md)<*any*\> \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\> \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *any*\>\> |
`wrap?` | *boolean* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1385

▸ **Union**(...`callbacks`: readonly ([*Raw*](knex.knex.raw.md)<*any*\> \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\> \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *any*\>)[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`...callbacks` | readonly ([*Raw*](knex.knex.raw.md)<*any*\> \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\> \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, *any*\>)[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1389
