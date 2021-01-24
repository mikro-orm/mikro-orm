---
id: "knex.knex.havingrange"
title: "Interface: HavingRange<TRecord, TResult>"
sidebar_label: "HavingRange"
hide_title: true
---

# Interface: HavingRange<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).HavingRange

## Type parameters

Name | Default |
------ | ------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Hierarchy

* **HavingRange**

## Callable

▸ **HavingRange**<K\>(`columnName`: K, `values`: readonly (*Readonly*<TRecord[K]\> \| *Readonly*<[*Raw*](knex.knex.raw.md)<TRecord[K]\>\>)[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name | Type |
------ | ------ |
`K` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | K |
`values` | readonly (*Readonly*<TRecord[K]\> \| *Readonly*<[*Raw*](knex.knex.raw.md)<TRecord[K]\>\>)[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1418

▸ **HavingRange**(`columnName`: *string*, `values`: readonly [*Value*](../modules/knex.knex-1.md#value)[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`values` | readonly [*Value*](../modules/knex.knex-1.md#value)[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1422
