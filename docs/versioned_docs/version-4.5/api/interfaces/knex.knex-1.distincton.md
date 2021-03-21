---
id: "knex.knex-1.distincton"
title: "Interface: DistinctOn<TRecord, TResult>"
sidebar_label: "DistinctOn"
custom_edit_url: null
hide_title: true
---

# Interface: DistinctOn<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).DistinctOn

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`TRecord` | *object* | - |
`TResult` | - | {}[] |

## Callable

▸ **DistinctOn**<ColNameUT\>(...`columnNames`: readonly ColNameUT[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name | Type |
:------ | :------ |
`ColNameUT` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
:------ | :------ |
`...columnNames` | readonly ColNameUT[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1022

▸ **DistinctOn**<ColNameUT\>(`columnNames`: readonly ColNameUT[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Type parameters:

Name | Type |
:------ | :------ |
`ColNameUT` | *string* \| *number* \| *symbol* |

#### Parameters:

Name | Type |
:------ | :------ |
`columnNames` | readonly ColNameUT[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1025

▸ **DistinctOn**(...`columnNames`: readonly *string*[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`...columnNames` | readonly *string*[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1029

▸ **DistinctOn**(`columnNames`: readonly *string*[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnNames` | readonly *string*[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1031
