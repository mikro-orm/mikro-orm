---
id: "knex.knex-1.altertablebuilder"
title: "Interface: AlterTableBuilder"
sidebar_label: "AlterTableBuilder"
custom_edit_url: null
hide_title: true
---

# Interface: AlterTableBuilder

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).AlterTableBuilder

## Hierarchy

* [*TableBuilder*](knex.knex-1.tablebuilder.md)

  ↳ **AlterTableBuilder**

## Methods

### bigIncrements

▸ **bigIncrements**(`columnName?`: *string*): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName?` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1723

___

### bigInteger

▸ **bigInteger**(`columnName`: *string*): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1728

___

### binary

▸ **binary**(`columnName`: *string*, `length?`: *number*): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`length?` | *number* |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1757

___

### boolean

▸ **boolean**(`columnName`: *string*): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1746

___

### comment

▸ **comment**(`val`: *string*): [*TableBuilder*](knex.knex-1.tablebuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`val` | *string* |

**Returns:** [*TableBuilder*](knex.knex-1.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1771

___

### date

▸ **date**(`columnName`: *string*): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1747

___

### dateTime

▸ **dateTime**(`columnName`: *string*, `options?`: *Readonly*<{ `precision?`: *number* ; `useTz?`: *boolean*  }\>): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`options?` | *Readonly*<{ `precision?`: *number* ; `useTz?`: *boolean*  }\> |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1748

___

### decimal

▸ **decimal**(`columnName`: *string*, `precision?`: *null* \| *number*, `scale?`: *number*): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`precision?` | *null* \| *number* |
`scale?` | *number* |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1741

___

### double

▸ **double**(`columnName`: *string*, `precision?`: *number*, `scale?`: *number*): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`precision?` | *number* |
`scale?` | *number* |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1736

___

### dropColumn

▸ **dropColumn**(`columnName`: *string*): [*TableBuilder*](knex.knex-1.tablebuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |

**Returns:** [*TableBuilder*](knex.knex-1.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1724

___

### dropColumns

▸ **dropColumns**(...`columnNames`: *string*[]): [*TableBuilder*](knex.knex-1.tablebuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`...columnNames` | *string*[] |

**Returns:** [*TableBuilder*](knex.knex-1.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1725

___

### dropForeign

▸ **dropForeign**(`columnNames`: readonly *string*[], `foreignKeyName?`: *string*): [*TableBuilder*](knex.knex-1.tablebuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnNames` | readonly *string*[] |
`foreignKeyName?` | *string* |

**Returns:** [*TableBuilder*](knex.knex-1.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1785

___

### dropIndex

▸ **dropIndex**(`columnNames`: *string* \| readonly (*string* \| [*Raw*](knex.knex-1.raw.md)<any\>)[], `indexName?`: *string*): [*TableBuilder*](knex.knex-1.tablebuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnNames` | *string* \| readonly (*string* \| [*Raw*](knex.knex-1.raw.md)<any\>)[] |
`indexName?` | *string* |

**Returns:** [*TableBuilder*](knex.knex-1.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1788

___

### dropPrimary

▸ **dropPrimary**(`constraintName?`: *string*): [*TableBuilder*](knex.knex-1.tablebuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`constraintName?` | *string* |

**Returns:** [*TableBuilder*](knex.knex-1.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1787

___

### dropTimestamps

▸ **dropTimestamps**(): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1789

___

### dropUnique

▸ **dropUnique**(`columnNames`: readonly (*string* \| [*Raw*](knex.knex-1.raw.md)<any\>)[], `indexName?`: *string*): [*TableBuilder*](knex.knex-1.tablebuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnNames` | readonly (*string* \| [*Raw*](knex.knex-1.raw.md)<any\>)[] |
`indexName?` | *string* |

**Returns:** [*TableBuilder*](knex.knex-1.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1786

___

### enu

▸ **enu**(`columnName`: *string*, `values`: readonly [*Value*](../modules/knex.knex-1.md#value)[], `options?`: [*EnumOptions*](knex.knex-1.enumoptions.md)): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`values` | readonly [*Value*](../modules/knex.knex-1.md#value)[] |
`options?` | [*EnumOptions*](knex.knex-1.enumoptions.md) |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1763

___

### enum

▸ **enum**(`columnName`: *string*, `values`: readonly [*Value*](../modules/knex.knex-1.md#value)[], `options?`: [*EnumOptions*](knex.knex-1.enumoptions.md)): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`values` | readonly [*Value*](../modules/knex.knex-1.md#value)[] |
`options?` | [*EnumOptions*](knex.knex-1.enumoptions.md) |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1758

___

### float

▸ **float**(`columnName`: *string*, `precision?`: *number*, `scale?`: *number*): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`precision?` | *number* |
`scale?` | *number* |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1731

___

### foreign

▸ **foreign**(`column`: *string*, `foreignKeyName?`: *string*): [*ForeignConstraintBuilder*](knex.knex-1.foreignconstraintbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`column` | *string* |
`foreignKeyName?` | *string* |

**Returns:** [*ForeignConstraintBuilder*](knex.knex-1.foreignconstraintbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1780

▸ **foreign**(`columns`: readonly *string*[], `foreignKeyName?`: *string*): [*MultikeyForeignConstraintBuilder*](knex.knex-1.multikeyforeignconstraintbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columns` | readonly *string*[] |
`foreignKeyName?` | *string* |

**Returns:** [*MultikeyForeignConstraintBuilder*](knex.knex-1.multikeyforeignconstraintbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1781

___

### increments

▸ **increments**(`columnName?`: *string*): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName?` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1722

___

### index

▸ **index**(`columnNames`: *string* \| readonly (*string* \| [*Raw*](knex.knex-1.raw.md)<any\>)[], `indexName?`: *string*, `indexType?`: *string*): [*TableBuilder*](knex.knex-1.tablebuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnNames` | *string* \| readonly (*string* \| [*Raw*](knex.knex-1.raw.md)<any\>)[] |
`indexName?` | *string* |
`indexType?` | *string* |

**Returns:** [*TableBuilder*](knex.knex-1.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1774

___

### integer

▸ **integer**(`columnName`: *string*, `length?`: *number*): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`length?` | *number* |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1727

___

### json

▸ **json**(`columnName`: *string*): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1768

___

### jsonb

▸ **jsonb**(`columnName`: *string*): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1769

___

### primary

▸ **primary**(`columnNames`: readonly *string*[], `constraintName?`: *string*): [*TableBuilder*](knex.knex-1.tablebuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnNames` | readonly *string*[] |
`constraintName?` | *string* |

**Returns:** [*TableBuilder*](knex.knex-1.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1773

___

### queryContext

▸ **queryContext**(`context`: *any*): [*TableBuilder*](knex.knex-1.tablebuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`context` | *any* |

**Returns:** [*TableBuilder*](knex.knex-1.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1790

___

### renameColumn

▸ **renameColumn**(`from`: *string*, `to`: *string*): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`from` | *string* |
`to` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1726

___

### specificType

▸ **specificType**(`columnName`: *string*, `type`: *string*): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`type` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1772

___

### string

▸ **string**(`columnName`: *string*, `length?`: *number*): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`length?` | *number* |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1730

___

### text

▸ **text**(`columnName`: *string*, `textType?`: *string*): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`textType?` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1729

___

### time

▸ **time**(`columnName`: *string*): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1749

___

### timestamp

▸ **timestamp**(`columnName`: *string*, `options?`: *Readonly*<{ `precision?`: *number* ; `useTz?`: *boolean*  }\>): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`options?` | *Readonly*<{ `precision?`: *number* ; `useTz?`: *boolean*  }\> |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1750

▸ **timestamp**(`columnName`: *string*, `withoutTz?`: *boolean*, `precision?`: *number*): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

**`deprecated`** 

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |
`withoutTz?` | *boolean* |
`precision?` | *number* |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1752

___

### timestamps

▸ **timestamps**(`useTimestampType?`: *boolean*, `makeDefaultNow?`: *boolean*): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`useTimestampType?` | *boolean* |
`makeDefaultNow?` | *boolean* |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1753

___

### unique

▸ **unique**(`columnNames`: readonly (*string* \| [*Raw*](knex.knex-1.raw.md)<any\>)[], `indexName?`: *string*): [*TableBuilder*](knex.knex-1.tablebuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnNames` | readonly (*string* \| [*Raw*](knex.knex-1.raw.md)<any\>)[] |
`indexName?` | *string* |

**Returns:** [*TableBuilder*](knex.knex-1.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1779

___

### uuid

▸ **uuid**(`columnName`: *string*): [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

#### Parameters:

Name | Type |
:------ | :------ |
`columnName` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex-1.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex-1.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1770
