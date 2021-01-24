---
id: "knex.knex.mysqlaltercolumnbuilder"
title: "Interface: MySqlAlterColumnBuilder"
sidebar_label: "MySqlAlterColumnBuilder"
hide_title: true
---

# Interface: MySqlAlterColumnBuilder

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).MySqlAlterColumnBuilder

## Hierarchy

* [*AlterColumnBuilder*](knex.knex.altercolumnbuilder.md)

  ↳ **MySqlAlterColumnBuilder**

## Methods

### after

▸ **after**(`columnName`: *string*): [*AlterColumnBuilder*](knex.knex.altercolumnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |

**Returns:** [*AlterColumnBuilder*](knex.knex.altercolumnbuilder.md)

Overrides: [AlterColumnBuilder](knex.knex.altercolumnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1835

___

### alter

▸ **alter**(): [*ColumnBuilder*](knex.knex.columnbuilder.md)

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [AlterColumnBuilder](knex.knex.altercolumnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1808

___

### comment

▸ **comment**(`value`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`value` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [AlterColumnBuilder](knex.knex.altercolumnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1807

___

### defaultTo

▸ **defaultTo**(`value`: [*Value*](../modules/knex.knex-1.md#value)): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`value` | [*Value*](../modules/knex.knex-1.md#value) |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [AlterColumnBuilder](knex.knex.altercolumnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1803

___

### first

▸ **first**(): [*AlterColumnBuilder*](knex.knex.altercolumnbuilder.md)

**Returns:** [*AlterColumnBuilder*](knex.knex.altercolumnbuilder.md)

Overrides: [AlterColumnBuilder](knex.knex.altercolumnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1834

___

### index

▸ **index**(`indexName?`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`indexName?` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [AlterColumnBuilder](knex.knex.altercolumnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1797

___

### notNullable

▸ **notNullable**(): [*ColumnBuilder*](knex.knex.columnbuilder.md)

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [AlterColumnBuilder](knex.knex.altercolumnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1805

___

### nullable

▸ **nullable**(): [*ColumnBuilder*](knex.knex.columnbuilder.md)

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [AlterColumnBuilder](knex.knex.altercolumnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1806

___

### onDelete

▸ **onDelete**(`command`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`command` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [AlterColumnBuilder](knex.knex.altercolumnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1801

___

### onUpdate

▸ **onUpdate**(`command`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`command` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [AlterColumnBuilder](knex.knex.altercolumnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1802

___

### primary

▸ **primary**(`constraintName?`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`constraintName?` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [AlterColumnBuilder](knex.knex.altercolumnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1798

___

### queryContext

▸ **queryContext**(`context`: *any*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`context` | *any* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [AlterColumnBuilder](knex.knex.altercolumnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1809

___

### references

▸ **references**(`columnName`: *string*): [*ReferencingColumnBuilder*](knex.knex.referencingcolumnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |

**Returns:** [*ReferencingColumnBuilder*](knex.knex.referencingcolumnbuilder.md)

Inherited from: [AlterColumnBuilder](knex.knex.altercolumnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1800

___

### unique

▸ **unique**(`indexName?`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`indexName?` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [AlterColumnBuilder](knex.knex.altercolumnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1799

___

### unsigned

▸ **unsigned**(): [*ColumnBuilder*](knex.knex.columnbuilder.md)

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [AlterColumnBuilder](knex.knex.altercolumnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1804

___

### withKeyName

▸ **withKeyName**(`keyName`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`keyName` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [AlterColumnBuilder](knex.knex.altercolumnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1810
