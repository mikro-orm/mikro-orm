---
id: "knex.knex.as"
title: "Interface: As<TRecord, TResult>"
sidebar_label: "As"
hide_title: true
---

# Interface: As<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).As

## Type parameters

Name |
------ |
`TRecord` |
`TResult` |

## Hierarchy

* **As**

## Callable

▸ **As**(`columnName`: keyof TRecord): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | keyof TRecord |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:899

▸ **As**(`columnName`: *string*): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:900
