---
id: "knex.knex-1.withraw"
title: "Interface: WithRaw<TRecord, TResult>"
sidebar_label: "WithRaw"
custom_edit_url: null
hide_title: true
---

# Interface: WithRaw<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).WithRaw

## Type parameters

Name | Default |
:------ | :------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Hierarchy

* **WithRaw**

  ↳ [*With*](knex.knex-1.with.md)

## Callable

▸ **WithRaw**(`alias`: *string*, `raw`: [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\> \| [*Raw*](knex.knex-1.raw.md)<any\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`alias` | *string* |
`raw` | [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\> \| [*Raw*](knex.knex-1.raw.md)<any\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1188

▸ **WithRaw**(`alias`: *string*, `sql`: *string*, `bindings?`: Object \| readonly [*Value*](../modules/knex.knex-1.md#value)[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`alias` | *string* |
`sql` | *string* |
`bindings?` | Object \| readonly [*Value*](../modules/knex.knex-1.md#value)[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1189
