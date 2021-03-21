---
id: "knex.knex-1.orderby"
title: "Interface: OrderBy<TRecord, TResult>"
sidebar_label: "OrderBy"
custom_edit_url: null
hide_title: true
---

# Interface: OrderBy<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).OrderBy

## Type parameters

Name | Default |
:------ | :------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Callable

▸ **OrderBy**(`columnName`: [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\> \| keyof TRecord, `order?`: *asc* \| *desc*): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\> \| keyof TRecord |
`order?` | *asc* \| *desc* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1369

▸ **OrderBy**(`columnName`: *string* \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\>, `order?`: *string*): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\> |
`order?` | *string* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1373

▸ **OrderBy**(`columnDefs`: (keyof TRecord \| *Readonly*<{ `column`: [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\> \| keyof TRecord ; `order?`: *asc* \| *desc*  }\>)[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnDefs` | (keyof TRecord \| *Readonly*<{ `column`: [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\> \| keyof TRecord ; `order?`: *asc* \| *desc*  }\>)[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1374

▸ **OrderBy**(`columnDefs`: (*string* \| *Readonly*<{ `column`: *string* \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\> ; `order?`: *string*  }\>)[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnDefs` | (*string* \| *Readonly*<{ `column`: *string* \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\> ; `order?`: *string*  }\>)[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1382
