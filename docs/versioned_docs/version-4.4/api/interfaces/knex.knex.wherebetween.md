---
id: "knex.knex.wherebetween"
title: "Interface: WhereBetween<TRecord, TResult>"
sidebar_label: "WhereBetween"
hide_title: true
---

# Interface: WhereBetween<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).WhereBetween

## Type parameters

Name | Default |
------ | ------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Hierarchy

* **WhereBetween**

## Callable

▸ **WhereBetween**<K\>(`columnName`: K, `range`: readonly (*Readonly*<TRecord[K]\> \| *Readonly*<[*Raw*](knex.knex.raw.md)<TRecord[K]\>\>)[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name | Type |
------ | ------ |
`K` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | K |
`range` | readonly (*Readonly*<TRecord[K]\> \| *Readonly*<[*Raw*](knex.knex.raw.md)<TRecord[K]\>\>)[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1270

▸ **WhereBetween**(`columnName`: *string*, `range`: readonly [*Value*](../modules/knex.knex-1.md#value)[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`range` | readonly [*Value*](../modules/knex.knex-1.md#value)[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1274
