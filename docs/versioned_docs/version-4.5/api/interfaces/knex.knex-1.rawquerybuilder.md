---
id: "knex.knex-1.rawquerybuilder"
title: "Interface: RawQueryBuilder<TRecord, TResult>"
sidebar_label: "RawQueryBuilder"
custom_edit_url: null
hide_title: true
---

# Interface: RawQueryBuilder<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).RawQueryBuilder

## Type parameters

Name | Default |
:------ | :------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Hierarchy

* **RawQueryBuilder**

  ↳ [*WhereRaw*](knex.knex-1.whereraw.md)

  ↳ [*GroupBy*](knex.knex-1.groupby.md)

## Callable

▸ **RawQueryBuilder**<TResult2\>(`sql`: *string*, `bindings?`: [*ValueDict*](knex.knex-1.valuedict.md) \| [*Value*](../modules/knex.knex-1.md#value) \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\> \| readonly ([*Value*](../modules/knex.knex-1.md#value) \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\>)[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | TResult |

#### Parameters:

Name | Type |
:------ | :------ |
`sql` | *string* |
`bindings?` | [*ValueDict*](knex.knex-1.valuedict.md) \| [*Value*](../modules/knex.knex-1.md#value) \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\> \| readonly ([*Value*](../modules/knex.knex-1.md#value) \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\>)[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1489

▸ **RawQueryBuilder**<TResult2\>(`raw`: [*Raw*](knex.knex-1.raw.md)<TResult2\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | TResult |

#### Parameters:

Name | Type |
:------ | :------ |
`raw` | [*Raw*](knex.knex-1.raw.md)<TResult2\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1493
