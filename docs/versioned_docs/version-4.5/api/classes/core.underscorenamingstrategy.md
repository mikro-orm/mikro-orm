---
id: "core.underscorenamingstrategy"
title: "Class: UnderscoreNamingStrategy"
sidebar_label: "UnderscoreNamingStrategy"
custom_edit_url: null
hide_title: true
---

# Class: UnderscoreNamingStrategy

[core](../modules/core.md).UnderscoreNamingStrategy

## Hierarchy

* [*AbstractNamingStrategy*](core.abstractnamingstrategy.md)

  ↳ **UnderscoreNamingStrategy**

## Constructors

### constructor

\+ **new UnderscoreNamingStrategy**(): [*UnderscoreNamingStrategy*](core.underscorenamingstrategy.md)

**Returns:** [*UnderscoreNamingStrategy*](core.underscorenamingstrategy.md)

Inherited from: [AbstractNamingStrategy](core.abstractnamingstrategy.md)

## Methods

### classToMigrationName

▸ **classToMigrationName**(`timestamp`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`timestamp` | *string* |

**Returns:** *string*

Inherited from: [AbstractNamingStrategy](core.abstractnamingstrategy.md)

Defined in: [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:12](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L12)

___

### classToTableName

▸ **classToTableName**(`entityName`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |

**Returns:** *string*

Overrides: [AbstractNamingStrategy](core.abstractnamingstrategy.md)

Defined in: [packages/core/src/naming-strategy/UnderscoreNamingStrategy.ts:5](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/UnderscoreNamingStrategy.ts#L5)

___

### getClassName

▸ **getClassName**(`file`: *string*, `separator?`: *string*): *string*

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`file` | *string* | - |
`separator` | *string* | '-' |

**Returns:** *string*

Inherited from: [AbstractNamingStrategy](core.abstractnamingstrategy.md)

Defined in: [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:5](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L5)

___

### joinColumnName

▸ **joinColumnName**(`propertyName`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`propertyName` | *string* |

**Returns:** *string*

Overrides: [AbstractNamingStrategy](core.abstractnamingstrategy.md)

Defined in: [packages/core/src/naming-strategy/UnderscoreNamingStrategy.ts:9](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/UnderscoreNamingStrategy.ts#L9)

___

### joinKeyColumnName

▸ **joinKeyColumnName**(`entityName`: *string*, `referencedColumnName?`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`entityName` | *string* |
`referencedColumnName?` | *string* |

**Returns:** *string*

Overrides: [AbstractNamingStrategy](core.abstractnamingstrategy.md)

Defined in: [packages/core/src/naming-strategy/UnderscoreNamingStrategy.ts:13](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/UnderscoreNamingStrategy.ts#L13)

___

### joinTableName

▸ **joinTableName**(`sourceEntity`: *string*, `targetEntity`: *string*, `propertyName`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`sourceEntity` | *string* |
`targetEntity` | *string* |
`propertyName` | *string* |

**Returns:** *string*

Overrides: [AbstractNamingStrategy](core.abstractnamingstrategy.md)

Defined in: [packages/core/src/naming-strategy/UnderscoreNamingStrategy.ts:17](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/UnderscoreNamingStrategy.ts#L17)

___

### propertyToColumnName

▸ **propertyToColumnName**(`propertyName`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`propertyName` | *string* |

**Returns:** *string*

Overrides: [AbstractNamingStrategy](core.abstractnamingstrategy.md)

Defined in: [packages/core/src/naming-strategy/UnderscoreNamingStrategy.ts:21](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/UnderscoreNamingStrategy.ts#L21)

___

### referenceColumnName

▸ **referenceColumnName**(): *string*

**Returns:** *string*

Overrides: [AbstractNamingStrategy](core.abstractnamingstrategy.md)

Defined in: [packages/core/src/naming-strategy/UnderscoreNamingStrategy.ts:25](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/UnderscoreNamingStrategy.ts#L25)

___

### underscore

▸ `Private`**underscore**(`name`: *string*): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`name` | *string* |

**Returns:** *string*

Defined in: [packages/core/src/naming-strategy/UnderscoreNamingStrategy.ts:29](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/naming-strategy/UnderscoreNamingStrategy.ts#L29)
