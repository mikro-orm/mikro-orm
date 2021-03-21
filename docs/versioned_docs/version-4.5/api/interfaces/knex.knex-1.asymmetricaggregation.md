---
id: "knex.knex-1.asymmetricaggregation"
title: "Interface: AsymmetricAggregation<TRecord, TResult, TValue>"
sidebar_label: "AsymmetricAggregation"
custom_edit_url: null
hide_title: true
---

# Interface: AsymmetricAggregation<TRecord, TResult, TValue\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).AsymmetricAggregation

## Type parameters

Name | Default |
:------ | :------ |
`TRecord` | *any* |
`TResult` | *unknown*[] |
`TValue` | *any* |

## Callable

▸ **AsymmetricAggregation**<TResult2\>(...`columnNames`: readonly keyof [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *ArrayIfAlready*<TResult, *UnwrapArrayMember*<TResult\> *extends* *DeferredKeySelection*<TBase, TKeys, THasSelect, TAliasMapping, TSingle, TIntersectProps, TUnionProps\> ? *true* *extends* THasSelect ? *DeferredKeySelection*<TBase, TKeys, THasSelect, TAliasMapping, TSingle, TIntersectProps & *Dict*<TValue\>, TUnionProps\> : *DeferredKeySelection*<{}, never, *true*, {}, *false*, Dict<TValue\>, never\> : *Dict*<TValue\>\> |

#### Parameters:

Name | Type |
:------ | :------ |
`...columnNames` | readonly keyof [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1330

▸ **AsymmetricAggregation**<TAliases, TResult2\>(`aliases`: TAliases): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TAliases` | *object* | *Record*<string, string \| string[] \| [*Raw*](knex.knex-1.raw.md)<any\>\> |
`TResult2` | - | *ArrayIfAlready*<TResult, *UnwrapArrayMember*<TResult\> *extends* *DeferredKeySelection*<TBase, TKeys, THasSelect, TAliasMapping, TSingle, TIntersectProps, TUnionProps\> ? *true* *extends* THasSelect ? *DeferredKeySelection*<TBase, TKeys, THasSelect, TAliasMapping, TSingle, TIntersectProps & { [k in string \| number \| symbol]?: TValue}, TUnionProps\> : *DeferredKeySelection*<{}, never, *true*, {}, *false*, { [k in string \| number \| symbol]?: TValue}, never\> : { [k in string \| number \| symbol]?: TValue}\> |

#### Parameters:

Name | Type |
:------ | :------ |
`aliases` | TAliases |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1333

▸ **AsymmetricAggregation**<TResult2\>(...`columnNames`: readonly (*string* \| [*Raw*](knex.knex-1.raw.md)<any\> \| *Readonly*<Record<string, string \| string[] \| [*Raw*](knex.knex-1.raw.md)<any\>\>\>)[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *ArrayIfAlready*<TResult, *UnwrapArrayMember*<TResult\> *extends* *DeferredKeySelection*<TBase, TKeys, THasSelect, TAliasMapping, TSingle, TIntersectProps, TUnionProps\> ? *true* *extends* THasSelect ? *DeferredKeySelection*<TBase, TKeys, THasSelect, TAliasMapping, TSingle, TIntersectProps & *Dict*<TValue\>, TUnionProps\> : *DeferredKeySelection*<{}, never, *true*, {}, *false*, Dict<TValue\>, never\> : *Dict*<TValue\>\> |

#### Parameters:

Name | Type |
:------ | :------ |
`...columnNames` | readonly (*string* \| [*Raw*](knex.knex-1.raw.md)<any\> \| *Readonly*<Record<string, string \| string[] \| [*Raw*](knex.knex-1.raw.md)<any\>\>\>)[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1337
