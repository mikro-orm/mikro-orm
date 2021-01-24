---
id: "knex.knex.rawquerybuilder"
title: "Interface: RawQueryBuilder<TRecord, TResult>"
sidebar_label: "RawQueryBuilder"
hide_title: true
---

# Interface: RawQueryBuilder<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).RawQueryBuilder

## Type parameters

Name | Default |
------ | ------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Hierarchy

* **RawQueryBuilder**

  ↳ [*WhereRaw*](knex.knex.whereraw.md)

  ↳ [*GroupBy*](knex.knex.groupby.md)

## Callable

▸ **RawQueryBuilder**<TResult2\>(`sql`: *string*, `bindings?`: *null* \| *string* \| *number* \| *boolean* \| Date \| *Buffer* \| *string*[] \| *number*[] \| Date[] \| *boolean*[] \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*ValueDict*](knex.knex.valuedict.md) \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| readonly [*RawBinding*](../modules/knex.knex-1.md#rawbinding)[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | TResult |

#### Parameters:

Name | Type |
------ | ------ |
`sql` | *string* |
`bindings?` | *null* \| *string* \| *number* \| *boolean* \| Date \| *Buffer* \| *string*[] \| *number*[] \| Date[] \| *boolean*[] \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*ValueDict*](knex.knex.valuedict.md) \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| readonly [*RawBinding*](../modules/knex.knex-1.md#rawbinding)[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1483

▸ **RawQueryBuilder**<TResult2\>(`raw`: [*Raw*](knex.knex.raw.md)<TResult2\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | TResult |

#### Parameters:

Name | Type |
------ | ------ |
`raw` | [*Raw*](knex.knex.raw.md)<TResult2\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1487
