---
id: "knex.knex.aliasquerybuilder"
title: "Interface: AliasQueryBuilder<TRecord, TResult>"
sidebar_label: "AliasQueryBuilder"
hide_title: true
---

# Interface: AliasQueryBuilder<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).AliasQueryBuilder

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`TRecord` | {} | *any* |
`TResult` | - | *unknown*[] |

## Hierarchy

* **AliasQueryBuilder**

  ↳ [*Select*](knex.knex.select.md)

## Callable

▸ **AliasQueryBuilder**<AliasUT, TResult2\>(...`aliases`: AliasUT): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`AliasUT` | [*InferrableColumnDescriptor*](../modules/knex.knex-1.md#inferrablecolumndescriptor)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>[] | - |
`TResult2` | - | *ArrayIfAlready*<TResult, *AddAliases*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\\>\\>, *IncompatibleToAlt*<*ArrayMember*<AliasUT\\>, *string*, *never*\\>\\>, *UnionToIntersection*<*IncompatibleToAlt*<AliasUT *extends* I[] ? I *extends* [*Ref*](knex.knex.ref.md)<*any*, TMapping\\> ? TMapping : I : *never*, *Dict*<*any*\\>, {}\\>\\>\\>\\> |

#### Parameters:

Name | Type |
------ | ------ |
`...aliases` | AliasUT |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:917

▸ **AliasQueryBuilder**<AliasUT, TResult2\>(`aliases`: AliasUT): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`AliasUT` | [*InferrableColumnDescriptor*](../modules/knex.knex-1.md#inferrablecolumndescriptor)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>[] | - |
`TResult2` | - | *ArrayIfAlready*<TResult, *AddAliases*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\\>\\>, *IncompatibleToAlt*<*ArrayMember*<AliasUT\\>, *string*, *never*\\>\\>, *UnionToIntersection*<*IncompatibleToAlt*<AliasUT *extends* I[] ? I *extends* [*Ref*](knex.knex.ref.md)<*any*, TMapping\\> ? TMapping : I : *never*, *Dict*<*any*\\>, {}\\>\\>\\>\\> |

#### Parameters:

Name | Type |
------ | ------ |
`aliases` | AliasUT |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:928

▸ **AliasQueryBuilder**<AliasUT, TResult2\>(...`aliases`: AliasUT): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`AliasUT` | (*string* \| *Dict*<*any*\>)[] | - |
`TResult2` | - | *ArrayIfAlready*<TResult, *AddAliases*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\\>\\>, *IncompatibleToAlt*<*ArrayMember*<AliasUT\\>, *string*, *never*\\>\\>, *UnionToIntersection*<*IncompatibleToAlt*<AliasUT *extends* I[] ? I *extends* [*Ref*](knex.knex.ref.md)<*any*, TMapping\\> ? TMapping : I : *never*, *Dict*<*any*\\>, {}\\>\\>\\>\\> |

#### Parameters:

Name | Type |
------ | ------ |
`...aliases` | AliasUT |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:940

▸ **AliasQueryBuilder**<AliasUT, TResult2\>(`aliases`: AliasUT): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`AliasUT` | (*string* \| *Dict*<*any*\>)[] | - |
`TResult2` | - | *ArrayIfAlready*<TResult, *AddAliases*<*AddKey*<*SetBase*<*UnwrapArrayMember*<TResult\\>, TRecord\\>, *IncompatibleToAlt*<*ArrayMember*<AliasUT\\>, *string*, *never*\\>\\>, *UnionToIntersection*<*IncompatibleToAlt*<AliasUT *extends* I[] ? I *extends* [*Ref*](knex.knex.ref.md)<*any*, TMapping\\> ? TMapping : I : *never*, *Dict*<*any*\\>, {}\\>\\>\\>\\> |

#### Parameters:

Name | Type |
------ | ------ |
`aliases` | AliasUT |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:952
