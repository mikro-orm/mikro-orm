---
id: "knex.knex-1.aliasquerybuilder"
title: "Interface: AliasQueryBuilder<TRecord, TResult>"
sidebar_label: "AliasQueryBuilder"
custom_edit_url: null
hide_title: true
---

# Interface: AliasQueryBuilder<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).AliasQueryBuilder

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`TRecord` | *object* | *any* |
`TResult` | - | *unknown*[] |

## Hierarchy

* **AliasQueryBuilder**

  ↳ [*Select*](knex.knex-1.select.md)

## Callable

▸ **AliasQueryBuilder**<AliasUT, TResult2\>(...`aliases`: AliasUT): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`AliasUT` | [*InferrableColumnDescriptor*](../modules/knex.knex-1.md#inferrablecolumndescriptor)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>[] | - |
`TResult2` | - | *ArrayIfAlready*<TResult, AddAliases<AddKey<SetBase<UnwrapArrayMember<TResult\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, IncompatibleToAlt<ArrayMember<AliasUT\>, string, never\>\>, UnionToIntersection<IncompatibleToAlt<AliasUT *extends* I[] ? I *extends* [*Ref*](knex.knex-1.ref.md)<any, TMapping\> ? TMapping : I : *never*, Dict<any\>, {}\>\>\>\> |

#### Parameters:

Name | Type |
:------ | :------ |
`...aliases` | AliasUT |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:918

▸ **AliasQueryBuilder**<AliasUT, TResult2\>(`aliases`: AliasUT): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`AliasUT` | [*InferrableColumnDescriptor*](../modules/knex.knex-1.md#inferrablecolumndescriptor)<[*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>[] | - |
`TResult2` | - | *ArrayIfAlready*<TResult, AddAliases<AddKey<SetBase<UnwrapArrayMember<TResult\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, IncompatibleToAlt<ArrayMember<AliasUT\>, string, never\>\>, UnionToIntersection<IncompatibleToAlt<AliasUT *extends* I[] ? I *extends* [*Ref*](knex.knex-1.ref.md)<any, TMapping\> ? TMapping : I : *never*, Dict<any\>, {}\>\>\>\> |

#### Parameters:

Name | Type |
:------ | :------ |
`aliases` | AliasUT |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:929

▸ **AliasQueryBuilder**<AliasUT, TResult2\>(...`aliases`: AliasUT): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`AliasUT` | (*string* \| *Dict*<any\>)[] | - |
`TResult2` | - | *ArrayIfAlready*<TResult, AddAliases<AddKey<SetBase<UnwrapArrayMember<TResult\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, IncompatibleToAlt<ArrayMember<AliasUT\>, string, never\>\>, UnionToIntersection<IncompatibleToAlt<AliasUT *extends* I[] ? I *extends* [*Ref*](knex.knex-1.ref.md)<any, TMapping\> ? TMapping : I : *never*, Dict<any\>, {}\>\>\>\> |

#### Parameters:

Name | Type |
:------ | :------ |
`...aliases` | AliasUT |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:941

▸ **AliasQueryBuilder**<AliasUT, TResult2\>(`aliases`: AliasUT): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`AliasUT` | (*string* \| *Dict*<any\>)[] | - |
`TResult2` | - | *ArrayIfAlready*<TResult, AddAliases<AddKey<SetBase<UnwrapArrayMember<TResult\>, TRecord\>, IncompatibleToAlt<ArrayMember<AliasUT\>, string, never\>\>, UnionToIntersection<IncompatibleToAlt<AliasUT *extends* I[] ? I *extends* [*Ref*](knex.knex-1.ref.md)<any, TMapping\> ? TMapping : I : *never*, Dict<any\>, {}\>\>\>\> |

#### Parameters:

Name | Type |
:------ | :------ |
`aliases` | AliasUT |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:953
