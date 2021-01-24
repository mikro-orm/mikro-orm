---
id: "knex.knex.orderby"
title: "Interface: OrderBy<TRecord, TResult>"
sidebar_label: "OrderBy"
hide_title: true
---

# Interface: OrderBy<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).OrderBy

## Type parameters

Name | Default |
------ | ------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Hierarchy

* **OrderBy**

## Callable

▸ **OrderBy**(`columnName`: [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| keyof TRecord, `order?`: *asc* \| *desc*): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| keyof TRecord |
`order?` | *asc* \| *desc* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1363

▸ **OrderBy**(`columnName`: *string* \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\>, `order?`: *string*): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> |
`order?` | *string* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1367

▸ **OrderBy**(`columnDefs`: (keyof TRecord \| *Readonly*<{ `column`: [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| keyof TRecord ; `order?`: *undefined* \| *asc* \| *desc*  }\>)[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`columnDefs` | (keyof TRecord \| *Readonly*<{ `column`: [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| keyof TRecord ; `order?`: *undefined* \| *asc* \| *desc*  }\>)[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1368

▸ **OrderBy**(`columnDefs`: (*string* \| *Readonly*<{ `column`: *string* \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> ; `order?`: *undefined* \| *string*  }\>)[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`columnDefs` | (*string* \| *Readonly*<{ `column`: *string* \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> ; `order?`: *undefined* \| *string*  }\>)[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1376
