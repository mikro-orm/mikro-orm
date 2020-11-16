---
id: "abstractnamingstrategy"
title: "Class: AbstractNamingStrategy"
sidebar_label: "AbstractNamingStrategy"
---

## Hierarchy

* **AbstractNamingStrategy**

  ↳ [MongoNamingStrategy](mongonamingstrategy.md)

  ↳ [UnderscoreNamingStrategy](underscorenamingstrategy.md)

  ↳ [EntityCaseNamingStrategy](entitycasenamingstrategy.md)

## Implements

* [NamingStrategy](../interfaces/namingstrategy.md)

## Methods

### classToMigrationName

▸ **classToMigrationName**(`timestamp`: string): string

*Implementation of [NamingStrategy](../interfaces/namingstrategy.md)*

*Defined in [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L12)*

#### Parameters:

Name | Type |
------ | ------ |
`timestamp` | string |

**Returns:** string

___

### classToTableName

▸ `Abstract`**classToTableName**(`entityName`: string): string

*Implementation of [NamingStrategy](../interfaces/namingstrategy.md)*

*Defined in [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:16](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L16)*

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |

**Returns:** string

___

### getClassName

▸ **getClassName**(`file`: string, `separator?`: string): string

*Implementation of [NamingStrategy](../interfaces/namingstrategy.md)*

*Defined in [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:5](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L5)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`file` | string | - |
`separator` | string | "-" |

**Returns:** string

___

### joinColumnName

▸ `Abstract`**joinColumnName**(`propertyName`: string): string

*Implementation of [NamingStrategy](../interfaces/namingstrategy.md)*

*Defined in [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:18](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L18)*

#### Parameters:

Name | Type |
------ | ------ |
`propertyName` | string |

**Returns:** string

___

### joinKeyColumnName

▸ `Abstract`**joinKeyColumnName**(`entityName`: string, `referencedColumnName?`: string): string

*Defined in [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:20](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L20)*

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`referencedColumnName?` | string |

**Returns:** string

___

### joinTableName

▸ `Abstract`**joinTableName**(`sourceEntity`: string, `targetEntity`: string, `propertyName?`: string): string

*Implementation of [NamingStrategy](../interfaces/namingstrategy.md)*

*Defined in [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:22](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L22)*

#### Parameters:

Name | Type |
------ | ------ |
`sourceEntity` | string |
`targetEntity` | string |
`propertyName?` | string |

**Returns:** string

___

### propertyToColumnName

▸ `Abstract`**propertyToColumnName**(`propertyName`: string): string

*Implementation of [NamingStrategy](../interfaces/namingstrategy.md)*

*Defined in [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:24](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L24)*

#### Parameters:

Name | Type |
------ | ------ |
`propertyName` | string |

**Returns:** string

___

### referenceColumnName

▸ `Abstract`**referenceColumnName**(): string

*Implementation of [NamingStrategy](../interfaces/namingstrategy.md)*

*Defined in [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:26](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L26)*

**Returns:** string
