---
id: "knex.knex.distincton"
title: "Interface: DistinctOn<TRecord, TResult>"
sidebar_label: "DistinctOn"
hide_title: true
---

# Interface: DistinctOn<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).DistinctOn

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`TRecord` | {} | - |
`TResult` | - | {}[] |

## Hierarchy

* **DistinctOn**

## Callable

▸ **DistinctOn**<ColNameUT\>(...`columnNames`: readonly ColNameUT[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name | Type |
------ | ------ |
`ColNameUT` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
------ | ------ |
`...columnNames` | readonly ColNameUT[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1016

▸ **DistinctOn**<ColNameUT\>(`columnNames`: readonly ColNameUT[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name | Type |
------ | ------ |
`ColNameUT` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
------ | ------ |
`columnNames` | readonly ColNameUT[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1019

▸ **DistinctOn**(...`columnNames`: readonly *string*[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`...columnNames` | readonly *string*[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1023

▸ **DistinctOn**(`columnNames`: readonly *string*[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`columnNames` | readonly *string*[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1025
