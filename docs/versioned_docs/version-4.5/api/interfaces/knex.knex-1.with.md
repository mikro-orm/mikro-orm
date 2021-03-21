---
id: "knex.knex-1.with"
title: "Interface: With<TRecord, TResult>"
sidebar_label: "With"
custom_edit_url: null
hide_title: true
---

# Interface: With<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).With

## Type parameters

Name | Default |
:------ | :------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Hierarchy

* [*WithRaw*](knex.knex-1.withraw.md)<TRecord, TResult\>

* [*WithWrapped*](knex.knex-1.withwrapped.md)<TRecord, TResult\>

  ↳ **With**

## Callable

▸ **With**(`alias`: *string*, `raw`: [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\> \| [*Raw*](knex.knex-1.raw.md)<any\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`alias` | *string* |
`raw` | [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\> \| [*Raw*](knex.knex-1.raw.md)<any\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1188

▸ **With**(`alias`: *string*, `sql`: *string*, `bindings?`: Object \| readonly [*Value*](../modules/knex.knex-1.md#value)[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`alias` | *string* |
`sql` | *string* |
`bindings?` | Object \| readonly [*Value*](../modules/knex.knex-1.md#value)[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1189

▸ **With**(`alias`: *string*, `queryBuilder`: [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`alias` | *string* |
`queryBuilder` | [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1200

▸ **With**(`alias`: *string*, `callback`: (`queryBuilder`: [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\>) => *any*): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
:------ | :------ |
`alias` | *string* |
`callback` | (`queryBuilder`: [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<any, any\>) => *any* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1201
