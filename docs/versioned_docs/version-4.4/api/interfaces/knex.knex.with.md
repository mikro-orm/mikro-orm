---
id: "knex.knex.with"
title: "Interface: With<TRecord, TResult>"
sidebar_label: "With"
hide_title: true
---

# Interface: With<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).With

## Type parameters

Name | Default |
------ | ------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |

## Hierarchy

* [*WithRaw*](knex.knex.withraw.md)<TRecord, TResult\>

* [*WithWrapped*](knex.knex.withwrapped.md)<TRecord, TResult\>

  ↳ **With**

## Callable

▸ **With**(`alias`: *string*, `raw`: [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| [*Raw*](knex.knex.raw.md)<*any*\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`alias` | *string* |
`raw` | [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| [*Raw*](knex.knex.raw.md)<*any*\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1182

▸ **With**(`alias`: *string*, `sql`: *string*, `bindings?`: Object \| readonly [*Value*](../modules/knex.knex-1.md#value)[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`alias` | *string* |
`sql` | *string* |
`bindings?` | Object \| readonly [*Value*](../modules/knex.knex-1.md#value)[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1183

▸ **With**(`alias`: *string*, `queryBuilder`: [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`alias` | *string* |
`queryBuilder` | [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1194

▸ **With**(`alias`: *string*, `callback`: (`queryBuilder`: [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\>) => *any*): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

#### Parameters:

Name | Type |
------ | ------ |
`alias` | *string* |
`callback` | (`queryBuilder`: [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\>) => *any* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:1195
