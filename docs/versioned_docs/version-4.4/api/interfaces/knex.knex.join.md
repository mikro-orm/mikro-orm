---
id: "knex.knex.join"
title: "Interface: Join<TRecord, TResult>"
sidebar_label: "Join"
hide_title: true
---

# Interface: Join<TRecord, TResult\>

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).Join

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`TRecord` | {} | *any* |
`TResult` | - | *unknown*[] |

## Hierarchy

* **Join**

## Callable

▸ **Join**<TJoinTargetRecord, TRecord2, TResult2\>(`raw`: [*Raw*](knex.knex.raw.md)<*any*\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TJoinTargetRecord` | {} | *any* |
`TRecord2` | {} | TRecord & TJoinTargetRecord |
`TResult2` | - | *ReplaceBase*<TResult, TRecord2\\> |

#### Parameters:

Name | Type |
------ | ------ |
`raw` | [*Raw*](knex.knex.raw.md)<*any*\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1033

▸ **Join**<TTable, TRecord2, TResult2\>(`tableName`: TTable, `clause`: [*JoinCallback*](knex.knex.joincallback.md)): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TTable` | *never* | - |
`TRecord2` | - | [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\\> & [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<[*TableType*](../modules/knex.knex-1.md#tabletype)<TTable\\>, *base*\\> |
`TResult2` | - | *ReplaceBase*<TResult, TRecord2\\> |

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | TTable |
`clause` | [*JoinCallback*](knex.knex.joincallback.md) |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1040

▸ **Join**<TJoinTargetRecord, TRecord2, TResult2\>(`tableName`: *string* \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| [*AliasDict*](knex.knex.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\>, `clause`: [*JoinCallback*](knex.knex.joincallback.md)): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TJoinTargetRecord` | {} | *any* |
`TRecord2` | {} | TRecord & TJoinTargetRecord |
`TResult2` | - | *ReplaceBase*<TResult, TRecord2\\> |

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | *string* \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| [*AliasDict*](knex.knex.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\> |
`clause` | [*JoinCallback*](knex.knex.joincallback.md) |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1048

▸ **Join**<TJoinTargetRecord, TRecord2, TResult2\>(`tableName`: *string* \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| [*AliasDict*](knex.knex.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\>, `columns`: { [key: string]: *string* \| *number* \| *boolean* \| [*Raw*](knex.knex.raw.md);  }): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TJoinTargetRecord` | {} | *any* |
`TRecord2` | {} | TRecord & TJoinTargetRecord |
`TResult2` | - | *ReplaceBase*<TResult, TRecord2\\> |

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | *string* \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| [*AliasDict*](knex.knex.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\> |
`columns` | { [key: string]: *string* \| *number* \| *boolean* \| [*Raw*](knex.knex.raw.md);  } |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1056

▸ **Join**<TJoinTargetRecord, TRecord2, TResult2\>(`tableName`: *string* \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| [*AliasDict*](knex.knex.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\>, `raw`: [*Raw*](knex.knex.raw.md)<*any*\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TJoinTargetRecord` | {} | *any* |
`TRecord2` | {} | TRecord & TJoinTargetRecord |
`TResult2` | - | *ReplaceBase*<TResult, TRecord2\\> |

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | *string* \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| [*AliasDict*](knex.knex.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\> |
`raw` | [*Raw*](knex.knex.raw.md)<*any*\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1064

▸ **Join**<TTable, TRecord2, TResult2\>(`tableName`: TTable, `column1`: *string*, `column2`: *string*): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TTable` | *never* | - |
`TRecord2` | - | [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\\> & [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<[*TableType*](../modules/knex.knex-1.md#tabletype)<TTable\\>, *base*\\> |
`TResult2` | - | *ReplaceBase*<TResult, TRecord2\\> |

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | TTable |
`column1` | *string* |
`column2` | *string* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1072

▸ **Join**<TJoinTargetRecord, TRecord2, TResult2\>(`tableName`: *string* \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| [*AliasDict*](knex.knex.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\>, `column1`: *string*, `column2`: *string*): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TJoinTargetRecord` | {} | *any* |
`TRecord2` | {} | TRecord & TJoinTargetRecord |
`TResult2` | - | *ReplaceBase*<TResult, TRecord2\\> |

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | *string* \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| [*AliasDict*](knex.knex.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\> |
`column1` | *string* |
`column2` | *string* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1081

▸ **Join**<TJoinTargetRecord, TRecord2, TResult2\>(`tableName`: *string* \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| [*AliasDict*](knex.knex.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\>, `column1`: *string*, `raw`: [*Raw*](knex.knex.raw.md)<*any*\>): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TJoinTargetRecord` | {} | *any* |
`TRecord2` | {} | TRecord & TJoinTargetRecord |
`TResult2` | - | *ReplaceBase*<TResult, TRecord2\\> |

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | *string* \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| [*AliasDict*](knex.knex.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\> |
`column1` | *string* |
`raw` | [*Raw*](knex.knex.raw.md)<*any*\> |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1090

▸ **Join**<TTable, TRecord2, TResult2\>(`tableName`: TTable, `column1`: *string*, `operator`: *string*, `column2`: *string*): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TTable` | *never* | - |
`TRecord2` | - | [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<TRecord, *base*\\> & [*ResolveTableType*](../modules/knex.knex-1.md#resolvetabletype)<[*TableType*](../modules/knex.knex-1.md#tabletype)<TTable\\>, *base*\\> |
`TResult2` | - | *ReplaceBase*<TResult, TRecord2\\> |

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | TTable |
`column1` | *string* |
`operator` | *string* |
`column2` | *string* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1099

▸ **Join**<TJoinTargetRecord, TRecord2, TResult2\>(`tableName`: *string* \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| [*AliasDict*](knex.knex.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\>, `column1`: *string*, `operator`: *string*, `column2`: *string*): [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`TJoinTargetRecord` | {} | *any* |
`TRecord2` | {} | TRecord & TJoinTargetRecord |
`TResult2` | - | *ReplaceBase*<TResult, TRecord2\\> |

#### Parameters:

Name | Type |
------ | ------ |
`tableName` | *string* \| [*Raw*](knex.knex.raw.md)<*any*\> \| [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<*any*, *any*\> \| [*AliasDict*](knex.knex.aliasdict.md) \| [*QueryCallback*](../modules/knex.knex-1.md#querycallback)<*any*, *unknown*[]\> |
`column1` | *string* |
`operator` | *string* |
`column2` | *string* |

**Returns:** [*QueryBuilder*](../classes/knex.knex.querybuilder.md)<TRecord2, TResult2\>

Defined in: node_modules/knex/types/index.d.ts:1109
