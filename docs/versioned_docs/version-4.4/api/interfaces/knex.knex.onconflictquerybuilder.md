---
id: "knex.knex.onconflictquerybuilder"
title: "Interface: OnConflictQueryBuilder<TRecord, TResult>"
sidebar_label: "OnConflictQueryBuilder"
hide_title: true
---

# Interface: OnConflictQueryBuilder<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).OnConflictQueryBuilder

## Type parameters

Name |
------ |
`TRecord` |
`TResult` |

## Hierarchy

* **OnConflictQueryBuilder**

## Methods

### ignore

▸ **ignore**(): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:456

___

### merge

▸ **merge**(`data?`: *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`data?` | *Readonly*<*Partial*<*AnyOrUnknownToOther*<[*MaybeRawRecord*](../modules/knex.knex-1.md#mayberawrecord)<TRecord\>, {}\>\>\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:457
