---
id: "knex.knex-1.intersect"
title: "Interface: Intersect<TRecord, TResult>"
sidebar_label: "Intersect"
custom_edit_url: null
hide_title: true
---

# Interface: Intersect<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).Intersect

## Type parameters

Name | Default |
:------ | :------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Hierarchy

* **Intersect**

  ↳ [*Union*](knex.knex-1.union.md)

## Callable

▸ **Intersect**(`callback`: *MaybeArray*<[*Raw*](knex.knex-1.raw.md)<any\> \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, any\>\>, `wrap?`: *boolean*): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`callback` | *MaybeArray*<[*Raw*](knex.knex-1.raw.md)<any\> \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, any\>\> |
`wrap?` | *boolean* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1391

▸ **Intersect**(...`callbacks`: readonly ([*Raw*](knex.knex-1.raw.md)<any\> \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, any\>)[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`...callbacks` | readonly ([*Raw*](knex.knex-1.raw.md)<any\> \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, any\>)[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1395
