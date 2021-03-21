---
id: "knex.knex-1.rawbuilder"
title: "Interface: RawBuilder<TRecord, TResult>"
sidebar_label: "RawBuilder"
custom_edit_url: null
hide_title: true
---

# Interface: RawBuilder<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).RawBuilder

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`TRecord` | *object* | *any* |
`TResult` | - | *any* |

## Callable

▸ **RawBuilder**<TResult2\>(`value`: [*Value*](../modules/knex.knex-1.md#value)): [*Raw*](knex.knex-1.raw.md)<TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | TResult |

#### Parameters:

Name | Type |
:------ | :------ |
`value` | [*Value*](../modules/knex.knex-1.md#value) |

**Returns:** [*Raw*](knex.knex-1.raw.md)<TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1512

▸ **RawBuilder**<TResult2\>(`sql`: *string*, ...`bindings`: readonly ([*Value*](../modules/knex.knex-1.md#value) \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\>)[]): [*Raw*](knex.knex-1.raw.md)<TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | TResult |

#### Parameters:

Name | Type |
:------ | :------ |
`sql` | *string* |
`...bindings` | readonly ([*Value*](../modules/knex.knex-1.md#value) \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\>)[] |

**Returns:** [*Raw*](knex.knex-1.raw.md)<TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1513

▸ **RawBuilder**<TResult2\>(`sql`: *string*, `bindings`: [*ValueDict*](knex.knex-1.valuedict.md) \| readonly ([*Value*](../modules/knex.knex-1.md#value) \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\>)[]): [*Raw*](knex.knex-1.raw.md)<TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | TResult |

#### Parameters:

Name | Type |
:------ | :------ |
`sql` | *string* |
`bindings` | [*ValueDict*](knex.knex-1.valuedict.md) \| readonly ([*Value*](../modules/knex.knex-1.md#value) \| [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\>)[] |

**Returns:** [*Raw*](knex.knex-1.raw.md)<TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1514
