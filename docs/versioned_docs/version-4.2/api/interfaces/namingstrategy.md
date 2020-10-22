---
id: "namingstrategy"
title: "Interface: NamingStrategy"
sidebar_label: "NamingStrategy"
---

## Hierarchy

* **NamingStrategy**

## Implemented by

* [AbstractNamingStrategy](../classes/abstractnamingstrategy.md)
* [EntityCaseNamingStrategy](../classes/entitycasenamingstrategy.md)
* [MongoNamingStrategy](../classes/mongonamingstrategy.md)
* [UnderscoreNamingStrategy](../classes/underscorenamingstrategy.md)

## Methods

### classToMigrationName

▸ **classToMigrationName**(`timestamp`: string): string

*Defined in [packages/core/src/naming-strategy/NamingStrategy.ts:16](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/naming-strategy/NamingStrategy.ts#L16)*

Return a migration name. This name should allow ordering.

#### Parameters:

Name | Type |
------ | ------ |
`timestamp` | string |

**Returns:** string

___

### classToTableName

▸ **classToTableName**(`entityName`: string): string

*Defined in [packages/core/src/naming-strategy/NamingStrategy.ts:11](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/naming-strategy/NamingStrategy.ts#L11)*

Return a table name for an entity class

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |

**Returns:** string

___

### getClassName

▸ **getClassName**(`file`: string, `separator?`: string): string

*Defined in [packages/core/src/naming-strategy/NamingStrategy.ts:6](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/naming-strategy/NamingStrategy.ts#L6)*

Return a name of the class based on its file name

#### Parameters:

Name | Type |
------ | ------ |
`file` | string |
`separator?` | string |

**Returns:** string

___

### joinColumnName

▸ **joinColumnName**(`propertyName`: string): string

*Defined in [packages/core/src/naming-strategy/NamingStrategy.ts:31](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/naming-strategy/NamingStrategy.ts#L31)*

Return a join column name for a property

#### Parameters:

Name | Type |
------ | ------ |
`propertyName` | string |

**Returns:** string

___

### joinKeyColumnName

▸ **joinKeyColumnName**(`entityName`: string, `referencedColumnName?`: string, `composite?`: boolean): string

*Defined in [packages/core/src/naming-strategy/NamingStrategy.ts:41](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/naming-strategy/NamingStrategy.ts#L41)*

Return the foreign key column name for the given parameters

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`referencedColumnName?` | string |
`composite?` | boolean |

**Returns:** string

___

### joinTableName

▸ **joinTableName**(`sourceEntity`: string, `targetEntity`: string, `propertyName`: string): string

*Defined in [packages/core/src/naming-strategy/NamingStrategy.ts:36](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/naming-strategy/NamingStrategy.ts#L36)*

Return a join table name

#### Parameters:

Name | Type |
------ | ------ |
`sourceEntity` | string |
`targetEntity` | string |
`propertyName` | string |

**Returns:** string

___

### propertyToColumnName

▸ **propertyToColumnName**(`propertyName`: string): string

*Defined in [packages/core/src/naming-strategy/NamingStrategy.ts:21](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/naming-strategy/NamingStrategy.ts#L21)*

Return a column name for a property

#### Parameters:

Name | Type |
------ | ------ |
`propertyName` | string |

**Returns:** string

___

### referenceColumnName

▸ **referenceColumnName**(): string

*Defined in [packages/core/src/naming-strategy/NamingStrategy.ts:26](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/naming-strategy/NamingStrategy.ts#L26)*

Return the default reference column name

**Returns:** string
