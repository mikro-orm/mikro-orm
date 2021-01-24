---
id: "knex.knex.table"
title: "Interface: Table<TRecord, TResult>"
sidebar_label: "Table"
hide_title: true
---

# Interface: Table<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).Table

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`TRecord` | {} | *any* |
`TResult` | {} | *any* |

## Hierarchy

* **Table**

## Callable

▸ **Table**<TTable, TRecord2, TResult2\>(`tableName`: TTable, `options?`: PgTableOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TTable` | *never* | - |
`TRecord2` | - | [*TableType*](../modules/knex.knex-1.md#tabletype)<TTable\\> |
`TResult2` | - | *ReplaceBase*<TResult, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord2, *base*\\>\\> |

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | TTable |
`options?` | PgTableOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:981

▸ **Table**<TRecord2, TResult2\>(`tableName`: *string* \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| [*AliasDict*](knex.knex.aliasdict.md), `options?`: PgTableOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TRecord2` | *unknown* |
`TResult2` | *ReplaceBase*<TResult, TRecord2\\> |

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | *string* \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| [*AliasDict*](knex.knex.aliasdict.md) |
`options?` | PgTableOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:989

▸ **Table**<TRecord2, TResult2\>(`callback`: Function, `options?`: PgTableOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TRecord2` | *unknown* |
`TResult2` | *ReplaceBase*<TResult, TRecord2\\> |

#### Parameters:

Name | Type |
------ | ------ |
`callback` | Function |
`options?` | PgTableOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:996

▸ **Table**<TRecord2, TResult2\>(`raw`: [*Raw*](knex.knex.raw.md)<*any*\>, `options?`: PgTableOptions): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TRecord2` | *unknown* |
`TResult2` | *ReplaceBase*<TResult, TRecord2\\> |

#### Parameters:

Name | Type |
------ | ------ |
`raw` | [*Raw*](knex.knex.raw.md)<*any*\> |
`options?` | PgTableOptions |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1003
