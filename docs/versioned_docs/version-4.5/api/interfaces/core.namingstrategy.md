---
id: "core.namingstrategy"
title: "Interface: NamingStrategy"
sidebar_label: "NamingStrategy"
custom_edit_url: null
hide_title: true
---

# Interface: NamingStrategy

[core](../modules/core.md).NamingStrategy

## Implemented by

* [*AbstractNamingStrategy*](../classes/core.abstractnamingstrategy.md)

## Methods

### classToMigrationName

▸ **classToMigrationName**(`timestamp`: *string*): *string*

Return a migration name. This name should allow ordering.

#### Parameters:

Name | Type |
:------ | :------ |
`timestamp` | *string* |

**Returns:** *string*

Defined in: [packages/core/src/naming-strategy/NamingStrategy.ts:16](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/NamingStrategy.ts#L16)

___

### classToTableName

▸ **classToTableName**(`entityName`: *string*): *string*

Return a table name for an entity class

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |

**Returns:** *string*

Defined in: [packages/core/src/naming-strategy/NamingStrategy.ts:11](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/NamingStrategy.ts#L11)

___

### getClassName

▸ **getClassName**(`file`: *string*, `separator?`: *string*): *string*

Return a name of the class based on its file name

#### Parameters:

Name | Type |
:------ | :------ |
`file` | *string* |
`separator?` | *string* |

**Returns:** *string*

Defined in: [packages/core/src/naming-strategy/NamingStrategy.ts:6](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/NamingStrategy.ts#L6)

___

### joinColumnName

▸ **joinColumnName**(`propertyName`: *string*): *string*

Return a join column name for a property

#### Parameters:

Name | Type |
:------ | :------ |
`propertyName` | *string* |

**Returns:** *string*

Defined in: [packages/core/src/naming-strategy/NamingStrategy.ts:31](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/NamingStrategy.ts#L31)

___

### joinKeyColumnName

▸ **joinKeyColumnName**(`entityName`: *string*, `referencedColumnName?`: *string*, `composite?`: *boolean*): *string*

Return the foreign key column name for the given parameters

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`referencedColumnName?` | *string* |
`composite?` | *boolean* |

**Returns:** *string*

Defined in: [packages/core/src/naming-strategy/NamingStrategy.ts:41](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/NamingStrategy.ts#L41)

___

### joinTableName

▸ **joinTableName**(`sourceEntity`: *string*, `targetEntity`: *string*, `propertyName`: *string*): *string*

Return a join table name

#### Parameters:

Name | Type |
:------ | :------ |
`sourceEntity` | *string* |
`targetEntity` | *string* |
`propertyName` | *string* |

**Returns:** *string*

Defined in: [packages/core/src/naming-strategy/NamingStrategy.ts:36](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/NamingStrategy.ts#L36)

___

### propertyToColumnName

▸ **propertyToColumnName**(`propertyName`: *string*): *string*

Return a column name for a property

#### Parameters:

Name | Type |
:------ | :------ |
`propertyName` | *string* |

**Returns:** *string*

Defined in: [packages/core/src/naming-strategy/NamingStrategy.ts:21](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/NamingStrategy.ts#L21)

___

### referenceColumnName

▸ **referenceColumnName**(): *string*

Return the default reference column name

**Returns:** *string*

Defined in: [packages/core/src/naming-strategy/NamingStrategy.ts:26](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/NamingStrategy.ts#L26)
