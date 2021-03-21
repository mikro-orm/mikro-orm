---
id: "knex.knex-1.whereexists"
title: "Interface: WhereExists<TRecord, TResult>"
sidebar_label: "WhereExists"
custom_edit_url: null
hide_title: true
---

# Interface: WhereExists<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).WhereExists

## Type parameters

Name | Default |
:------ | :------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Callable

▸ **WhereExists**(`callback`: [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<TRecord, TResult\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`callback` | [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<TRecord, TResult\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1284

▸ **WhereExists**<TRecordInner, TResultInner\>(`query`: [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecordInner, TResultInner\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name |
:------ |
`TRecordInner` |
`TResultInner` |

#### Parameters:

Name | Type |
:------ | :------ |
`query` | [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecordInner, TResultInner\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1285
