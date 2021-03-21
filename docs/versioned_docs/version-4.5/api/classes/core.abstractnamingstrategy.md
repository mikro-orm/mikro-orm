---
id: "core.abstractnamingstrategy"
title: "Class: AbstractNamingStrategy"
sidebar_label: "AbstractNamingStrategy"
custom_edit_url: null
hide_title: true
---

# Class: AbstractNamingStrategy

[core](../modules/core.md).AbstractNamingStrategy

## Hierarchy

* **AbstractNamingStrategy**

  ↳ [*MongoNamingStrategy*](core.mongonamingstrategy.md)

  ↳ [*UnderscoreNamingStrategy*](core.underscorenamingstrategy.md)

  ↳ [*EntityCaseNamingStrategy*](core.entitycasenamingstrategy.md)

## Implements

* [*NamingStrategy*](../interfaces/core.namingstrategy.md)

## Constructors

### constructor

\+ **new AbstractNamingStrategy**(): [*AbstractNamingStrategy*](core.abstractnamingstrategy.md)

**Returns:** [*AbstractNamingStrategy*](core.abstractnamingstrategy.md)

## Methods

### classToMigrationName

▸ **classToMigrationName**(`timestamp`: *string*): *string*

Return a migration name. This name should allow ordering.

#### Parameters:

Name | Type |
:------ | :------ |
`timestamp` | *string* |

**Returns:** *string*

Implementation of: [NamingStrategy](../interfaces/core.namingstrategy.md)

Defined in: [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:12](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L12)

___

### classToTableName

▸ `Abstract`**classToTableName**(`entityName`: *string*): *string*

Return a table name for an entity class

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |

**Returns:** *string*

Implementation of: [NamingStrategy](../interfaces/core.namingstrategy.md)

Defined in: [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:16](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L16)

___

### getClassName

▸ **getClassName**(`file`: *string*, `separator?`: *string*): *string*

Return a name of the class based on its file name

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`file` | *string* | - |
`separator` | *string* | '-' |

**Returns:** *string*

Implementation of: [NamingStrategy](../interfaces/core.namingstrategy.md)

Defined in: [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:5](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L5)

___

### joinColumnName

▸ `Abstract`**joinColumnName**(`propertyName`: *string*): *string*

Return a join column name for a property

#### Parameters:

Name | Type |
:------ | :------ |
`propertyName` | *string* |

**Returns:** *string*

Implementation of: [NamingStrategy](../interfaces/core.namingstrategy.md)

Defined in: [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:18](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L18)

___

### joinKeyColumnName

▸ `Abstract`**joinKeyColumnName**(`entityName`: *string*, `referencedColumnName?`: *string*): *string*

Return the foreign key column name for the given parameters

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`referencedColumnName?` | *string* |

**Returns:** *string*

Implementation of: [NamingStrategy](../interfaces/core.namingstrategy.md)

Defined in: [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:20](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L20)

___

### joinTableName

▸ `Abstract`**joinTableName**(`sourceEntity`: *string*, `targetEntity`: *string*, `propertyName?`: *string*): *string*

Return a join table name

#### Parameters:

Name | Type |
:------ | :------ |
`sourceEntity` | *string* |
`targetEntity` | *string* |
`propertyName?` | *string* |

**Returns:** *string*

Implementation of: [NamingStrategy](../interfaces/core.namingstrategy.md)

Defined in: [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:22](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L22)

___

### propertyToColumnName

▸ `Abstract`**propertyToColumnName**(`propertyName`: *string*): *string*

Return a column name for a property

#### Parameters:

Name | Type |
:------ | :------ |
`propertyName` | *string* |

**Returns:** *string*

Implementation of: [NamingStrategy](../interfaces/core.namingstrategy.md)

Defined in: [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:24](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L24)

___

### referenceColumnName

▸ `Abstract`**referenceColumnName**(): *string*

Return the default reference column name

**Returns:** *string*

Implementation of: [NamingStrategy](../interfaces/core.namingstrategy.md)

Defined in: [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:26](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L26)
