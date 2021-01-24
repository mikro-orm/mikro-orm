---
id: "knex.knex.postgresqlcolumnbuilder"
title: "Interface: PostgreSqlColumnBuilder"
sidebar_label: "PostgreSqlColumnBuilder"
hide_title: true
---

# Interface: PostgreSqlColumnBuilder

[knex](../modules/knex.md).[Knex](../modules/knex.knex-1.md).PostgreSqlColumnBuilder

## Hierarchy

* [*ColumnBuilder*](knex.knex.columnbuilder.md)

  ↳ **PostgreSqlColumnBuilder**

## Methods

### after

▸ **after**(`columnName`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [ColumnBuilder](knex.knex.columnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1811

___

### alter

▸ **alter**(): [*ColumnBuilder*](knex.knex.columnbuilder.md)

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [ColumnBuilder](knex.knex.columnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1808

___

### comment

▸ **comment**(`value`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`value` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [ColumnBuilder](knex.knex.columnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1807

___

### defaultTo

▸ **defaultTo**(`value`: [*Value*](../modules/knex.knex-1.md#value)): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`value` | [*Value*](../modules/knex.knex-1.md#value) |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [ColumnBuilder](knex.knex.columnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1803

___

### first

▸ **first**(): [*ColumnBuilder*](knex.knex.columnbuilder.md)

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [ColumnBuilder](knex.knex.columnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1812

___

### index

▸ **index**(`indexName?`: *string*, `indexType?`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`indexName?` | *string* |
`indexType?` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Overrides: [ColumnBuilder](knex.knex.columnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1824

___

### notNullable

▸ **notNullable**(): [*ColumnBuilder*](knex.knex.columnbuilder.md)

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [ColumnBuilder](knex.knex.columnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1805

___

### nullable

▸ **nullable**(): [*ColumnBuilder*](knex.knex.columnbuilder.md)

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [ColumnBuilder](knex.knex.columnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1806

___

### onDelete

▸ **onDelete**(`command`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`command` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [ColumnBuilder](knex.knex.columnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1801

___

### onUpdate

▸ **onUpdate**(`command`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`command` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [ColumnBuilder](knex.knex.columnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1802

___

### primary

▸ **primary**(`constraintName?`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`constraintName?` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [ColumnBuilder](knex.knex.columnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1798

___

### queryContext

▸ **queryContext**(`context`: *any*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`context` | *any* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [ColumnBuilder](knex.knex.columnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1809

___

### references

▸ **references**(`columnName`: *string*): [*ReferencingColumnBuilder*](knex.knex.referencingcolumnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`columnName` | *string* |

**Returns:** [*ReferencingColumnBuilder*](knex.knex.referencingcolumnbuilder.md)

Inherited from: [ColumnBuilder](knex.knex.columnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1800

___

### unique

▸ **unique**(`indexName?`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`indexName?` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [ColumnBuilder](knex.knex.columnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1799

___

### unsigned

▸ **unsigned**(): [*ColumnBuilder*](knex.knex.columnbuilder.md)

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [ColumnBuilder](knex.knex.columnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1804

___

### withKeyName

▸ **withKeyName**(`keyName`: *string*): [*ColumnBuilder*](knex.knex.columnbuilder.md)

#### Parameters:

Name | Type |
------ | ------ |
`keyName` | *string* |

**Returns:** [*ColumnBuilder*](knex.knex.columnbuilder.md)

Inherited from: [ColumnBuilder](knex.knex.columnbuilder.md)

Defined in: node_modules/knex/types/index.d.ts:1810
