---
id: "knex.knex.rawbuilder"
title: "Interface: RawBuilder<TRecord, TResult>"
sidebar_label: "RawBuilder"
hide_title: true
---

# Interface: RawBuilder<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).RawBuilder

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`TRecord` | {} | *any* |
`TResult` | - | *any* |

## Hierarchy

* **RawBuilder**

## Callable

▸ **RawBuilder**<TResult2\>(`value`: [*Value*](../modules/knex.knex-1.md#value)): [*Raw*](knex.knex.raw.md)<TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | TResult |

#### Parameters:

Name | Type |
------ | ------ |
`value` | [*Value*](../modules/knex.knex-1.md#value) |

**Returns:** [*Raw*](knex.knex.raw.md)<TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1506

▸ **RawBuilder**<TResult2\>(`sql`: *string*, ...`bindings`: readonly [*RawBinding*](../modules/knex.knex-1.md#rawbinding)[]): [*Raw*](knex.knex.raw.md)<TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | TResult |

#### Parameters:

Name | Type |
------ | ------ |
`sql` | *string* |
`...bindings` | readonly [*RawBinding*](../modules/knex.knex-1.md#rawbinding)[] |

**Returns:** [*Raw*](knex.knex.raw.md)<TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1507

▸ **RawBuilder**<TResult2\>(`sql`: *string*, `bindings`: [*ValueDict*](knex.knex.valuedict.md) \| readonly [*RawBinding*](../modules/knex.knex-1.md#rawbinding)[]): [*Raw*](knex.knex.raw.md)<TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | TResult |

#### Parameters:

Name | Type |
------ | ------ |
`sql` | *string* |
`bindings` | [*ValueDict*](knex.knex.valuedict.md) \| readonly [*RawBinding*](../modules/knex.knex-1.md#rawbinding)[] |

**Returns:** [*Raw*](knex.knex.raw.md)<TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1508
