---
id: "knex.knex.whereraw"
title: "Interface: WhereRaw<TRecord, TResult>"
sidebar_label: "WhereRaw"
hide_title: true
---

# Interface: WhereRaw<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).WhereRaw

## Type parameters

Name | Default |
------ | ------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Hierarchy

* [*RawQueryBuilder*](knex.knex.rawquerybuilder.md)<TRecord, TResult\>

  ↳ **WhereRaw**

  ↳↳ [*Where*](knex.knex.where.md)

## Callable

▸ **WhereRaw**(`condition`: *boolean*): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`condition` | *boolean* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1257

▸ **WhereRaw**<TResult2\>(`sql`: *string*, `bindings?`: *null* \| *string* \| *number* \| *boolean* \| Date \| *Buffer* \| *string*[] \| *number*[] \| Date[] \| *boolean*[] \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*ValueDict*](knex.knex.valuedict.md) \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| readonly [*RawBinding*](../modules/knex.knex-1.md#rawbinding)[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

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

▸ **WhereRaw**<TResult2\>(`raw`: [*Raw*](knex.knex.raw.md)<TResult2\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

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
