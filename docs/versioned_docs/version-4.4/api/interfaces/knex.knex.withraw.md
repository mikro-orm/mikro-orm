---
id: "knex.knex.withraw"
title: "Interface: WithRaw<TRecord, TResult>"
sidebar_label: "WithRaw"
hide_title: true
---

# Interface: WithRaw<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).WithRaw

## Type parameters

Name | Default |
------ | ------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Hierarchy

* **WithRaw**

  ↳ [*With*](knex.knex.with.md)

## Callable

▸ **WithRaw**(`alias`: *string*, `raw`: [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| [*Raw*](knex.knex.raw.md)<*any*\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`alias` | *string* |
`raw` | [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| [*Raw*](knex.knex.raw.md)<*any*\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1182

▸ **WithRaw**(`alias`: *string*, `sql`: *string*, `bindings?`: Object \| readonly [*Value*](../modules/knex.knex-1.md#value)[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`alias` | *string* |
`sql` | *string* |
`bindings?` | Object \| readonly [*Value*](../modules/knex.knex-1.md#value)[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1183
