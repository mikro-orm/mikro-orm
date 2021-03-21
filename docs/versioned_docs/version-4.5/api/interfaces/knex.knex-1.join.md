---
id: "knex.knex-1.join"
title: "Interface: Join<TRecord, TResult>"
sidebar_label: "Join"
custom_edit_url: null
hide_title: true
---

# Interface: Join<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).Join

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`TRecord` | *object* | *any* |
`TResult` | - | *unknown*[] |

## Callable

▸ **Join**<TJoinTargetRecord, TRecord2, TResult2\>(`raw`: [*Raw*](knex.knex-1.raw.md)<any\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TJoinTargetRecord` | *object* | *any* |
`TRecord2` | *object* | TRecord & TJoinTargetRecord |
`TResult2` | - | *ReplaceBase*<TResult, TRecord2\> |

#### Parameters:

Name | Type |
:------ | :------ |
`raw` | [*Raw*](knex.knex-1.raw.md)<any\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1039

▸ **Join**<TTable, TRecord2, TResult2\>(`tableName`: TTable, `clause`: [*JoinCallback*](knex.knex-1.joincallback.md)): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TTable` | *never* | - |
`TRecord2` | - | [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\> & [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<[*TableType*](../modules/knex.knex-1.md#tabletype)<TTable\>, *base*\> |
`TResult2` | - | *ReplaceBase*<TResult, TRecord2\> |

#### Parameters:

Name | Type |
:------ | :------ |
`tableName` | TTable |
`clause` | [*JoinCallback*](knex.knex-1.joincallback.md) |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1046

▸ **Join**<TJoinTargetRecord, TRecord2, TResult2\>(`tableName`: [*TableDescriptor*](../modules/knex.knex-1.md#tabledescriptor) \| [*AliasDict*](knex.knex-1.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\>, `clause`: [*JoinCallback*](knex.knex-1.joincallback.md)): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TJoinTargetRecord` | *object* | *any* |
`TRecord2` | *object* | TRecord & TJoinTargetRecord |
`TResult2` | - | *ReplaceBase*<TResult, TRecord2\> |

#### Parameters:

Name | Type |
:------ | :------ |
`tableName` | [*TableDescriptor*](../modules/knex.knex-1.md#tabledescriptor) \| [*AliasDict*](knex.knex-1.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> |
`clause` | [*JoinCallback*](knex.knex-1.joincallback.md) |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1054

▸ **Join**<TJoinTargetRecord, TRecord2, TResult2\>(`tableName`: [*TableDescriptor*](../modules/knex.knex-1.md#tabledescriptor) \| [*AliasDict*](knex.knex-1.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\>, `columns`: { [key: string]: *string* \| *number* \| *boolean* \| [*Raw*](knex.knex-1.raw.md);  }): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TJoinTargetRecord` | *object* | *any* |
`TRecord2` | *object* | TRecord & TJoinTargetRecord |
`TResult2` | - | *ReplaceBase*<TResult, TRecord2\> |

#### Parameters:

Name | Type |
:------ | :------ |
`tableName` | [*TableDescriptor*](../modules/knex.knex-1.md#tabledescriptor) \| [*AliasDict*](knex.knex-1.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> |
`columns` | *object* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1062

▸ **Join**<TJoinTargetRecord, TRecord2, TResult2\>(`tableName`: [*TableDescriptor*](../modules/knex.knex-1.md#tabledescriptor) \| [*AliasDict*](knex.knex-1.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\>, `raw`: [*Raw*](knex.knex-1.raw.md)<any\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TJoinTargetRecord` | *object* | *any* |
`TRecord2` | *object* | TRecord & TJoinTargetRecord |
`TResult2` | - | *ReplaceBase*<TResult, TRecord2\> |

#### Parameters:

Name | Type |
:------ | :------ |
`tableName` | [*TableDescriptor*](../modules/knex.knex-1.md#tabledescriptor) \| [*AliasDict*](knex.knex-1.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> |
`raw` | [*Raw*](knex.knex-1.raw.md)<any\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1070

▸ **Join**<TTable, TRecord2, TResult2\>(`tableName`: TTable, `column1`: *string*, `column2`: *string*): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TTable` | *never* | - |
`TRecord2` | - | [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\> & [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<[*TableType*](../modules/knex.knex-1.md#tabletype)<TTable\>, *base*\> |
`TResult2` | - | *ReplaceBase*<TResult, TRecord2\> |

#### Parameters:

Name | Type |
:------ | :------ |
`tableName` | TTable |
`column1` | *string* |
`column2` | *string* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1078

▸ **Join**<TJoinTargetRecord, TRecord2, TResult2\>(`tableName`: [*TableDescriptor*](../modules/knex.knex-1.md#tabledescriptor) \| [*AliasDict*](knex.knex-1.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\>, `column1`: *string*, `column2`: *string*): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TJoinTargetRecord` | *object* | *any* |
`TRecord2` | *object* | TRecord & TJoinTargetRecord |
`TResult2` | - | *ReplaceBase*<TResult, TRecord2\> |

#### Parameters:

Name | Type |
:------ | :------ |
`tableName` | [*TableDescriptor*](../modules/knex.knex-1.md#tabledescriptor) \| [*AliasDict*](knex.knex-1.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> |
`column1` | *string* |
`column2` | *string* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1087

▸ **Join**<TJoinTargetRecord, TRecord2, TResult2\>(`tableName`: [*TableDescriptor*](../modules/knex.knex-1.md#tabledescriptor) \| [*AliasDict*](knex.knex-1.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\>, `column1`: *string*, `raw`: [*Raw*](knex.knex-1.raw.md)<any\>): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TJoinTargetRecord` | *object* | *any* |
`TRecord2` | *object* | TRecord & TJoinTargetRecord |
`TResult2` | - | *ReplaceBase*<TResult, TRecord2\> |

#### Parameters:

Name | Type |
:------ | :------ |
`tableName` | [*TableDescriptor*](../modules/knex.knex-1.md#tabledescriptor) \| [*AliasDict*](knex.knex-1.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> |
`column1` | *string* |
`raw` | [*Raw*](knex.knex-1.raw.md)<any\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1096

▸ **Join**<TTable, TRecord2, TResult2\>(`tableName`: TTable, `column1`: *string*, `operator`: *string*, `column2`: *string*): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TTable` | *never* | - |
`TRecord2` | - | [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\> & [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<[*TableType*](../modules/knex.knex-1.md#tabletype)<TTable\>, *base*\> |
`TResult2` | - | *ReplaceBase*<TResult, TRecord2\> |

#### Parameters:

Name | Type |
:------ | :------ |
`tableName` | TTable |
`column1` | *string* |
`operator` | *string* |
`column2` | *string* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1105

▸ **Join**<TJoinTargetRecord, TRecord2, TResult2\>(`tableName`: [*TableDescriptor*](../modules/knex.knex-1.md#tabledescriptor) \| [*AliasDict*](knex.knex-1.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\>, `column1`: *string*, `operator`: *string*, `column2`: *string*): [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`TJoinTargetRecord` | *object* | *any* |
`TRecord2` | *object* | TRecord & TJoinTargetRecord |
`TResult2` | - | *ReplaceBase*<TResult, TRecord2\> |

#### Parameters:

Name | Type |
:------ | :------ |
`tableName` | [*TableDescriptor*](../modules/knex.knex-1.md#tabledescriptor) \| [*AliasDict*](knex.knex-1.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<any, unknown[]\> |
`column1` | *string* |
`operator` | *string* |
`column2` | *string* |

**Returns:** [*QueryBuilder*](../classes/knex.knex-1.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1115
