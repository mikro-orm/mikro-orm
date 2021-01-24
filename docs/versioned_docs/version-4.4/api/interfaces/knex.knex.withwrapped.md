---
id: "knex.knex.withwrapped"
title: "Interface: WithWrapped<TRecord, TResult>"
sidebar_label: "WithWrapped"
hide_title: true
---

# Interface: WithWrapped<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).WithWrapped

## Type parameters

Name | Default |
------ | ------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Hierarchy

* **WithWrapped**

  ↳ [*With*](knex.knex.with.md)

## Callable

▸ **WithWrapped**(`alias`: *string*, `queryBuilder`: [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`alias` | *string* |
`queryBuilder` | [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1194

▸ **WithWrapped**(`alias`: *string*, `callback`: (`queryBuilder`: [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\>) => *any*): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`alias` | *string* |
`callback` | (`queryBuilder`: [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\>) => *any* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1195
