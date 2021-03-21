---
id: "knex.knex-1.wherenull"
title: "Interface: WhereNull<TRecord, TResult>"
sidebar_label: "WhereNull"
custom_edit_url: null
hide_title: true
---

# Interface: WhereNull<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).WhereNull

## Type parameters

Name | Default |
:------ | :------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Hierarchy

* **WhereNull**

  ↳ [*Where*](knex.knex-1.where.md)

## Callable

▸ **WhereNull**(`columnName`: keyof TRecord): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | keyof TRecord |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1271

▸ **WhereNull**(`columnName`: *string*): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1272
