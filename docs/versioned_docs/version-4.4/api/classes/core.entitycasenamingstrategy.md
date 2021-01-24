---
id: "core.entitycasenamingstrategy"
title: "Class: EntityCaseNamingStrategy"
sidebar_label: "EntityCaseNamingStrategy"
hide_title: true
---

# Class: EntityCaseNamingStrategy

[core](../modules/core.md).EntityCaseNamingStrategy

This strategy keeps original entity/property names for table/column.

## Hierarchy

* [*AbstractNamingStrategy*](core.abstractnamingstrategy.md)

  ↳ **EntityCaseNamingStrategy**

## Constructors

### constructor

\+ **new EntityCaseNamingStrategy**(): [*EntityCaseNamingStrategy*](core.entitycasenamingstrategy.md)

**Returns:** [*EntityCaseNamingStrategy*](core.entitycasenamingstrategy.md)

Inherited from: [AbstractNamingStrategy](core.abstractnamingstrategy.md)

## Methods

### classToMigrationName

▸ **classToMigrationName**(`timestamp`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`timestamp` | *string* |

**Returns:** *string*

Inherited from: [AbstractNamingStrategy](core.abstractnamingstrategy.md)

Defined in: [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L12)

___

### classToTableName

▸ **classToTableName**(`entityName`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |

**Returns:** *string*

Overrides: [AbstractNamingStrategy](core.abstractnamingstrategy.md)

Defined in: [packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts:8](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts#L8)

___

### getClassName

▸ **getClassName**(`file`: *string*, `separator?`: *string*): *string*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`file` | *string* | - |
`separator` | *string* | '-' |

**Returns:** *string*

Inherited from: [AbstractNamingStrategy](core.abstractnamingstrategy.md)

Defined in: [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:5](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L5)

___

### joinColumnName

▸ **joinColumnName**(`propertyName`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`propertyName` | *string* |

**Returns:** *string*

Overrides: [AbstractNamingStrategy](core.abstractnamingstrategy.md)

Defined in: [packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts#L12)

___

### joinKeyColumnName

▸ **joinKeyColumnName**(`entityName`: *string*, `referencedColumnName?`: *string*, `composite?`: *boolean*): *string*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | *string* | - |
`referencedColumnName?` | *string* | - |
`composite` | *boolean* | false |

**Returns:** *string*

Overrides: [AbstractNamingStrategy](core.abstractnamingstrategy.md)

Defined in: [packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts:16](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts#L16)

___

### joinTableName

▸ **joinTableName**(`sourceEntity`: *string*, `targetEntity`: *string*, `propertyName`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`sourceEntity` | *string* |
`targetEntity` | *string* |
`propertyName` | *string* |

**Returns:** *string*

Overrides: [AbstractNamingStrategy](core.abstractnamingstrategy.md)

Defined in: [packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts:26](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts#L26)

___

### propertyToColumnName

▸ **propertyToColumnName**(`propertyName`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`propertyName` | *string* |

**Returns:** *string*

Overrides: [AbstractNamingStrategy](core.abstractnamingstrategy.md)

Defined in: [packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts:30](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts#L30)

___

### referenceColumnName

▸ **referenceColumnName**(): *string*

**Returns:** *string*

Overrides: [AbstractNamingStrategy](core.abstractnamingstrategy.md)

Defined in: [packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts:34](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts#L34)
