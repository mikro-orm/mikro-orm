---
id: "core.mongonamingstrategy"
title: "Class: MongoNamingStrategy"
sidebar_label: "MongoNamingStrategy"
hide_title: true
---

# Class: MongoNamingStrategy

[core](../modules/core.md).MongoNamingStrategy

## Hierarchy

* [*AbstractNamingStrategy*](core.abstractnamingstrategy.md)

  ↳ **MongoNamingStrategy**

## Constructors

### constructor

\+ **new MongoNamingStrategy**(): [*MongoNamingStrategy*](core.mongonamingstrategy.md)

**Returns:** [*MongoNamingStrategy*](core.mongonamingstrategy.md)

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

Defined in: [packages/core/src/naming-strategy/MongoNamingStrategy.ts:5](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/naming-strategy/MongoNamingStrategy.ts#L5)

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

Defined in: [packages/core/src/naming-strategy/MongoNamingStrategy.ts:9](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/naming-strategy/MongoNamingStrategy.ts#L9)

___

### joinKeyColumnName

▸ **joinKeyColumnName**(`entityName`: *string*, `referencedColumnName?`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | *string* |
`referencedColumnName?` | *string* |

**Returns:** *string*

Overrides: [AbstractNamingStrategy](core.abstractnamingstrategy.md)

Defined in: [packages/core/src/naming-strategy/MongoNamingStrategy.ts:13](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/naming-strategy/MongoNamingStrategy.ts#L13)

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

Defined in: [packages/core/src/naming-strategy/MongoNamingStrategy.ts:17](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/naming-strategy/MongoNamingStrategy.ts#L17)

___

### propertyToColumnName

▸ **propertyToColumnName**(`propertyName`: *string*): *string*

#### Parameters:

Name | Type |
------ | ------ |
`propertyName` | *string* |

**Returns:** *string*

Overrides: [AbstractNamingStrategy](core.abstractnamingstrategy.md)

Defined in: [packages/core/src/naming-strategy/MongoNamingStrategy.ts:21](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/naming-strategy/MongoNamingStrategy.ts#L21)

___

### referenceColumnName

▸ **referenceColumnName**(): *string*

**Returns:** *string*

Overrides: [AbstractNamingStrategy](core.abstractnamingstrategy.md)

Defined in: [packages/core/src/naming-strategy/MongoNamingStrategy.ts:25](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/naming-strategy/MongoNamingStrategy.ts#L25)
