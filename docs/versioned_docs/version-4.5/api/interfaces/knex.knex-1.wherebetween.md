---
id: "knex.knex-1.wherebetween"
title: "Interface: WhereBetween<TRecord, TResult>"
sidebar_label: "WhereBetween"
custom_edit_url: null
hide_title: true
---

# Interface: WhereBetween<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).WhereBetween

## Type parameters

Name | Default |
:------ | :------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Callable

▸ **WhereBetween**<K\>(`columnName`: K, `range`: readonly [[*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<TRecord[K]\>, [*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<TRecord[K]\>]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name | Type |
:------ | :------ |
`K` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | K |
`range` | readonly [[*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<TRecord[K]\>, [*DbColumn*](../modules/knex.knex-1.md#dbcolumn)<TRecord[K]\>] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1276

▸ **WhereBetween**(`columnName`: *string*, `range`: readonly [[*Value*](../modules/knex.knex-1.md#value), [*Value*](../modules/knex.knex-1.md#value)]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`range` | readonly [[*Value*](../modules/knex.knex-1.md#value), [*Value*](../modules/knex.knex-1.md#value)] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1280
