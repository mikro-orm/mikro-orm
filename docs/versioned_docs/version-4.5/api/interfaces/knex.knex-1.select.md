---
id: "knex.knex-1.select"
title: "Interface: Select<TRecord, TResult>"
sidebar_label: "Select"
custom_edit_url: null
hide_title: true
---

# Interface: Select<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).Select

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`TRecord` | *object* | *any* |
`TResult` | - | *unknown*[] |

## Hierarchy

* [*AliasQueryBuilder*](knex.knex-1.aliasquerybuilder.md)<TRecord, TResult\>

* [*ColumnNameQueryBuilder*](knex.knex-1.columnnamequerybuilder.md)<TRecord, TResult\>

  ↳ **Select**

## Callable

▸ **Select**(): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult\>

Defined in: node_modules/knex/types/index.d.ts:970

▸ **Select**<TResult2, TInnerRecord, TInnerResult\>(...`subQueryBuilders`: readonly [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TInnerRecord, TInnerResult\>[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *ArrayIfAlready*<TResult, any\> |
`TInnerRecord` | *any* |
`TInnerResult` | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`...subQueryBuilders` | readonly [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TInnerRecord, TInnerResult\>[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:971

▸ **Select**<TResult2, TInnerRecord, TInnerResult\>(`subQueryBuilders`: readonly [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TInnerRecord, TInnerResult\>[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *ArrayIfAlready*<TResult, any\> |
`TInnerRecord` | *any* |
`TInnerResult` | *any* |

#### Parameters:

Name | Type |
:------ | :------ |
`subQueryBuilders` | readonly [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TInnerRecord, TInnerResult\>[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:975

▸ **Select**<AliasUT, TResult2\>(...`aliases`: AliasUT): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

▸ **Select**<AliasUT, TResult2\>(`aliases`: AliasUT): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

▸ **Select**<AliasUT, TResult2\>(...`aliases`: AliasUT): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

▸ **Select**<AliasUT, TResult2\>(`aliases`: AliasUT): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

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

▸ **Select**(`columnName`: ***): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, ArrayIfAlready<TResult, DeferredKeySelection<TRecord, string, *false*, {}, *false*, {}, never\>\>\>

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *** |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, ArrayIfAlready<TResult, DeferredKeySelection<TRecord, string, *false*, {}, *false*, {}, never\>\>\>

Defined in: node_modules/knex/types/index.d.ts:1434

▸ **Select**<ColNameUT, TResult2\>(...`columnNames`: readonly ColNameUT[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`ColNameUT` | *string* \| *number* \| *symbol* | - |
`TResult2` | - | *AddAliases*<AddKey<SetBase<UnwrapArrayMember<TResult\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, ColNameUT & *string*\>, {}\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`...columnNames` | readonly ColNameUT[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1440

▸ **Select**<ColNameUT, TResult2\>(`columnNames`: readonly ColNameUT[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`ColNameUT` | *string* \| *number* \| *symbol* | - |
`TResult2` | - | *AddAliases*<AddKey<SetBase<UnwrapArrayMember<TResult\>, [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\>\>, ColNameUT & *string*\>, {}\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`columnNames` | readonly ColNameUT[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1451

▸ **Select**<TResult2\>(...`columnNames`: readonly [*ColumnDescriptor*](../modules/knex.knex-1.md#columndescriptor)<TRecord, TResult\>[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *AddAliases*<AddKey<SetBase<UnwrapArrayMember<TResult\>, Partial<AnyOrUnknownToOther<TRecord, {}\>\>\>, keyof TRecord & *string*\>, {}\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`...columnNames` | readonly [*ColumnDescriptor*](../modules/knex.knex-1.md#columndescriptor)<TRecord, TResult\>[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1462

▸ **Select**<TResult2\>(`columnNames`: readonly [*ColumnDescriptor*](../modules/knex.knex-1.md#columndescriptor)<TRecord, TResult\>[]): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

#### Type parameters:

Name | Default |
:------ | :------ |
`TResult2` | *AddAliases*<AddKey<SetBase<UnwrapArrayMember<TResult\>, Partial<AnyOrUnknownToOther<TRecord, {}\>\>\>, keyof TRecord & *string*\>, {}\>[] |

#### Parameters:

Name | Type |
:------ | :------ |
`columnNames` | readonly [*ColumnDescriptor*](../modules/knex.knex-1.md#columndescriptor)<TRecord, TResult\>[] |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1474
