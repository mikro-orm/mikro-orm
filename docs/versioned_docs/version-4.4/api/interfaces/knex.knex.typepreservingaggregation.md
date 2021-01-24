---
id: "knex.knex.typepreservingaggregation"
title: "Interface: TypePreservingAggregation<TRecord, TResult, TValue>"
sidebar_label: "TypePreservingAggregation"
hide_title: true
---

# Interface: TypePreservingAggregation<TRecord, TResult, TValue\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).TypePreservingAggregation

## Type parameters

Name | Default |
------ | ------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |
`TValue` | *any* |

## Hierarchy

* **TypePreservingAggregation**

## Callable

▸ **TypePreservingAggregation**<TKey, TResult2\>(...`columnNames`: readonly TKey[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TKey` | *string* \| *number* \| *symbol* | - |
`TResult2` | - | *ArrayIfAlready*<TResult, *UnwrapArrayMember*<TResult\\> *extends* *DeferredKeySelection*<TBase, TKeys, THasSelect, TAliasMapping, TSingle, TIntersectProps, TUnionProps\\> ? *true* *extends* THasSelect ? *DeferredKeySelection*<TBase, TKeys, THasSelect, TAliasMapping, TSingle, TIntersectProps & *Dict*<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\\>[TKey]\\>, TUnionProps\\> : *DeferredKeySelection*<{}, *never*, *true*, {}, *false*, *Dict*<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\\>[TKey]\\>, *never*\\> : *Dict*<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\\>[TKey]\\>\\> |

#### Parameters:

Name | Type |
------ | ------ |
`...columnNames` | readonly TKey[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1337

▸ **TypePreservingAggregation**<TAliases, TResult2\>(`aliases`: TAliases): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TAliases` | {} | *Readonly*<*Record*<*string*, *string* \\| *string*[] \\| [*Raw*](knex.knex.raw.md)<*any*\\>\\>\\> |
`TResult2` | - | *ArrayIfAlready*<TResult, *UnwrapArrayMember*<TResult\\> *extends* *DeferredKeySelection*<TBase, TKeys, THasSelect, TAliasMapping, TSingle, TIntersectProps, TUnionProps\\> ? *true* *extends* THasSelect ? *DeferredKeySelection*<TBase, TKeys, THasSelect, TAliasMapping, TSingle, TIntersectProps & { [K in string \\| number \\| symbol]?: K extends keyof TRecord ? TRecord[K] : TValue}, TUnionProps\\> : *DeferredKeySelection*<{}, *never*, *true*, {}, *false*, { [K in string \\| number \\| symbol]?: K extends keyof TRecord ? TRecord[K] : TValue}, *never*\\> : { [K in string \\| number \\| symbol]?: K extends keyof TRecord ? TRecord[K] : TValue}\\> |

#### Parameters:

Name | Type |
------ | ------ |
`aliases` | TAliases |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1343

▸ **TypePreservingAggregation**<TResult2\>(...`columnNames`: readonly (*string* \| [*Raw*](knex.knex.raw.md)<*any*\> \| *Readonly*<*Record*<*string*, *string* \| readonly string[] \| [*Raw*](knex.knex.raw.md)<*any*\>\>\>)[]): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
------ | ------ |
`TResult2` | *ArrayIfAlready*<TResult, *UnwrapArrayMember*<TResult\\> *extends* *DeferredKeySelection*<TBase, TKeys, THasSelect, TAliasMapping, TSingle, TIntersectProps, TUnionProps\\> ? *true* *extends* THasSelect ? *DeferredKeySelection*<TBase, TKeys, THasSelect, TAliasMapping, TSingle, TIntersectProps & *Dict*<TValue\\>, TUnionProps\\> : *DeferredKeySelection*<{}, *never*, *true*, {}, *false*, *Dict*<TValue\\>, *never*\\> : *Dict*<TValue\\>\\> |

#### Parameters:

Name | Type |
------ | ------ |
`...columnNames` | readonly (*string* \| [*Raw*](knex.knex.raw.md)<*any*\> \| *Readonly*<*Record*<*string*, *string* \| readonly string[] \| [*Raw*](knex.knex.raw.md)<*any*\>\>\>)[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1353
