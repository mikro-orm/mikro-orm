---
id: "knex.knex-1.whereraw"
title: "Interface: WhereRaw<TRecord, TResult>"
sidebar_label: "WhereRaw"
custom_edit_url: null
hide_title: true
---

# Interface: WhereRaw<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).WhereRaw

## Type parameters

Name | Default |
:------ | :------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Hierarchy

* [*RawQueryBuilder*](knex.knex-1.rawquerybuilder.md)<TRecord, TResult\>

  ↳ **WhereRaw**

  ↳↳ [*Where*](knex.knex-1.where.md)

## Callable

▸ **WhereRaw**(`condition`: *boolean*): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`condition` | *boolean* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1263

▸ **WhereRaw**<TResult2\>(`sql`: *string*, `bindings?`: [*ValueDict*](knex.knex-1.valuedict.md) \| [*Value*](../modules/knex.knex-1.md#value) \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\> \| readonly ([*Value*](../modules/knex.knex-1.md#value) \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\>)[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

▸ **WhereRaw**<TResult2\>(`raw`: [*Raw*](knex.knex-1.raw.md)<TResult2\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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
