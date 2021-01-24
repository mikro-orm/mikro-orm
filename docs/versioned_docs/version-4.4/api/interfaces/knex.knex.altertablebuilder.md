---
id: "knex.knex.altertablebuilder"
title: "Interface: AlterTableBuilder"
sidebar_label: "AlterTableBuilder"
hide_title: true
---

# Interface: AlterTableBuilder

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).AlterTableBuilder

## Hierarchy

* [*TableBuilder*](knex.knex.tablebuilder.md)

  ↳ **AlterTableBuilder**

## Methods

### bigIncrements

▸ **bigIncrements**(`columnName?`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName?` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1717

___

### bigInteger

▸ **bigInteger**(`columnName`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1722

___

### binary

▸ **binary**(`columnName`: *string*, `length?`: *number*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`length?` | *number* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1751

___

### boolean

▸ **boolean**(`columnName`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1740

___

### comment

▸ **comment**(`val`: *string*): [*TableBuilder*](knex.knex.tablebuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`val` | *string* |

**Returns:** [*TableBuilder*](knex.knex.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1765

___

### date

▸ **date**(`columnName`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1741

___

### dateTime

▸ **dateTime**(`columnName`: *string*, `options?`: *Readonly*<{ `precision?`: *undefined* \| *number* ; `useTz?`: *undefined* \| *boolean*  }\>): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`options?` | *Readonly*<{ `precision?`: *undefined* \| *number* ; `useTz?`: *undefined* \| *boolean*  }\> |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1742

___

### decimal

▸ **decimal**(`columnName`: *string*, `precision?`: *null* \| *number*, `scale?`: *number*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`precision?` | *null* \| *number* |
`scale?` | *number* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1735

___

### double

▸ **double**(`columnName`: *string*, `precision?`: *number*, `scale?`: *number*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`precision?` | *number* |
`scale?` | *number* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1730

___

### dropColumn

▸ **dropColumn**(`columnName`: *string*): [*TableBuilder*](knex.knex.tablebuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |

**Returns:** [*TableBuilder*](knex.knex.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1718

___

### dropColumns

▸ **dropColumns**(...`columnNames`: *string*[]): [*TableBuilder*](knex.knex.tablebuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`...columnNames` | *string*[] |

**Returns:** [*TableBuilder*](knex.knex.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1719

___

### dropForeign

▸ **dropForeign**(`columnNames`: readonly *string*[], `foreignKeyName?`: *string*): [*TableBuilder*](knex.knex.tablebuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnNames` | readonly *string*[] |
`foreignKeyName?` | *string* |

**Returns:** [*TableBuilder*](knex.knex.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1779

___

### dropIndex

▸ **dropIndex**(`columnNames`: *string* \| readonly (*string* \| [*Raw*](knex.knex.raw.md)<*any*\>)[], `indexName?`: *string*): [*TableBuilder*](knex.knex.tablebuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnNames` | *string* \| readonly (*string* \| [*Raw*](knex.knex.raw.md)<*any*\>)[] |
`indexName?` | *string* |

**Returns:** [*TableBuilder*](knex.knex.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1782

___

### dropPrimary

▸ **dropPrimary**(`constraintName?`: *string*): [*TableBuilder*](knex.knex.tablebuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`constraintName?` | *string* |

**Returns:** [*TableBuilder*](knex.knex.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1781

___

### dropTimestamps

▸ **dropTimestamps**(): [*ColumnBuilder*](knex.knex.columnbuilder.md)

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1783

___

### dropUnique

▸ **dropUnique**(`columnNames`: readonly (*string* \| [*Raw*](knex.knex.raw.md)<*any*\>)[], `indexName?`: *string*): [*TableBuilder*](knex.knex.tablebuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnNames` | readonly (*string* \| [*Raw*](knex.knex.raw.md)<*any*\>)[] |
`indexName?` | *string* |

**Returns:** [*TableBuilder*](knex.knex.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1780

___

### enu

▸ **enu**(`columnName`: *string*, `values`: readonly [*Value*](../modules/knex.knex-1.md#value)[], `options?`: [*EnumOptions*](knex.knex.enumoptions.md)): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`values` | readonly [*Value*](../modules/knex.knex-1.md#value)[] |
`options?` | [*EnumOptions*](knex.knex.enumoptions.md) |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1757

___

### enum

▸ **enum**(`columnName`: *string*, `values`: readonly [*Value*](../modules/knex.knex-1.md#value)[], `options?`: [*EnumOptions*](knex.knex.enumoptions.md)): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`values` | readonly [*Value*](../modules/knex.knex-1.md#value)[] |
`options?` | [*EnumOptions*](knex.knex.enumoptions.md) |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1752

___

### float

▸ **float**(`columnName`: *string*, `precision?`: *number*, `scale?`: *number*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`precision?` | *number* |
`scale?` | *number* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1725

___

### foreign

▸ **foreign**(`column`: *string*, `foreignKeyName?`: *string*): [*ForeignConstraintBuilder*](knex.knex.foreignconstraintbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`column` | *string* |
`foreignKeyName?` | *string* |

**Returns:** [*ForeignConstraintBuilder*](knex.knex.foreignconstraintbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1774

▸ **foreign**(`columns`: readonly *string*[], `foreignKeyName?`: *string*): [*MultikeyForeignConstraintBuilder*](knex.knex.multikeyforeignconstraintbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columns` | readonly *string*[] |
`foreignKeyName?` | *string* |

**Returns:** [*MultikeyForeignConstraintBuilder*](knex.knex.multikeyforeignconstraintbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1775

___

### increments

▸ **increments**(`columnName?`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName?` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1716

___

### index

▸ **index**(`columnNames`: *string* \| readonly (*string* \| [*Raw*](knex.knex.raw.md)<*any*\>)[], `indexName?`: *string*, `indexType?`: *string*): [*TableBuilder*](knex.knex.tablebuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnNames` | *string* \| readonly (*string* \| [*Raw*](knex.knex.raw.md)<*any*\>)[] |
`indexName?` | *string* |
`indexType?` | *string* |

**Returns:** [*TableBuilder*](knex.knex.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1768

___

### integer

▸ **integer**(`columnName`: *string*, `length?`: *number*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`length?` | *number* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1721

___

### json

▸ **json**(`columnName`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1762

___

### jsonb

▸ **jsonb**(`columnName`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1763

___

### primary

▸ **primary**(`columnNames`: readonly *string*[], `constraintName?`: *string*): [*TableBuilder*](knex.knex.tablebuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnNames` | readonly *string*[] |
`constraintName?` | *string* |

**Returns:** [*TableBuilder*](knex.knex.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1767

___

### queryContext

▸ **queryContext**(`context`: *any*): [*TableBuilder*](knex.knex.tablebuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`context` | *any* |

**Returns:** [*TableBuilder*](knex.knex.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1784

___

### renameColumn

▸ **renameColumn**(`from`: *string*, `to`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`from` | *string* |
`to` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1720

___

### specificType

▸ **specificType**(`columnName`: *string*, `type`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`type` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1766

___

### string

▸ **string**(`columnName`: *string*, `length?`: *number*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`length?` | *number* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1724

___

### text

▸ **text**(`columnName`: *string*, `textType?`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`textType?` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1723

___

### time

▸ **time**(`columnName`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1743

___

### timestamp

▸ **timestamp**(`columnName`: *string*, `options?`: *Readonly*<{ `precision?`: *undefined* \| *number* ; `useTz?`: *undefined* \| *boolean*  }\>): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`options?` | *Readonly*<{ `precision?`: *undefined* \| *number* ; `useTz?`: *undefined* \| *boolean*  }\> |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1744

▸ **timestamp**(`columnName`: *string*, `withoutTz?`: *boolean*, `precision?`: *number*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

**`deprecated`** 

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |
`withoutTz?` | *boolean* |
`precision?` | *number* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1746

___

### timestamps

▸ **timestamps**(`useTimestampType?`: *boolean*, `makeDefaultNow?`: *boolean*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`useTimestampType?` | *boolean* |
`makeDefaultNow?` | *boolean* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1747

___

### unique

▸ **unique**(`columnNames`: readonly (*string* \| [*Raw*](knex.knex.raw.md)<*any*\>)[], `indexName?`: *string*): [*TableBuilder*](knex.knex.tablebuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnNames` | readonly (*string* \| [*Raw*](knex.knex.raw.md)<*any*\>)[] |
`indexName?` | *string* |

**Returns:** [*TableBuilder*](knex.knex.tablebuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1773

___

### uuid

▸ **uuid**(`columnName`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [TableBuilder](knex.knex.tablebuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1764
