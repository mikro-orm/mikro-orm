---
id: "knex.knex.wherenull"
title: "Interface: WhereNull<TRecord, TResult>"
sidebar_label: "WhereNull"
hide_title: true
---

# Interface: WhereNull<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).WhereNull

## Type parameters

Name | Default |
------ | ------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Hierarchy

* **WhereNull**

  ↳ [*Where*](knex.knex.where.md)

## Callable

▸ **WhereNull**(`columnName`: keyof TRecord): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | keyof TRecord |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1265

▸ **WhereNull**(`columnName`: *string*): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1266
