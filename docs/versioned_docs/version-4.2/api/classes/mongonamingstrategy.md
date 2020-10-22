---
id: "mongonamingstrategy"
title: "Class: MongoNamingStrategy"
sidebar_label: "MongoNamingStrategy"
---

## Hierarchy

* [AbstractNamingStrategy](abstractnamingstrategy.md)

  ↳ **MongoNamingStrategy**

## Implements

* [NamingStrategy](../interfaces/namingstrategy.md)

## Methods

### classToMigrationName

▸ **classToMigrationName**(`timestamp`: string): string

*Implementation of [NamingStrategy](../interfaces/namingstrategy.md)*

*Inherited from [AbstractNamingStrategy](abstractnamingstrategy.md).[classToMigrationName](abstractnamingstrategy.md#classtomigrationname)*

*Defined in [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:12](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L12)*

#### Parameters:

Name | Type |
------ | ------ |
`timestamp` | string |

**Returns:** string

___

### classToTableName

▸ **classToTableName**(`entityName`: string): string

*Implementation of [NamingStrategy](../interfaces/namingstrategy.md)*

*Overrides [AbstractNamingStrategy](abstractnamingstrategy.md).[classToTableName](abstractnamingstrategy.md#classtotablename)*

*Defined in [packages/core/src/naming-strategy/MongoNamingStrategy.ts:5](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/naming-strategy/MongoNamingStrategy.ts#L5)*

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |

**Returns:** string

___

### getClassName

▸ **getClassName**(`file`: string, `separator?`: string): string

*Implementation of [NamingStrategy](../interfaces/namingstrategy.md)*

*Inherited from [AbstractNamingStrategy](abstractnamingstrategy.md).[getClassName](abstractnamingstrategy.md#getclassname)*

*Defined in [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:5](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L5)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`file` | string | - |
`separator` | string | "-" |

**Returns:** string

___

### joinColumnName

▸ **joinColumnName**(`propertyName`: string): string

*Implementation of [NamingStrategy](../interfaces/namingstrategy.md)*

*Overrides [AbstractNamingStrategy](abstractnamingstrategy.md).[joinColumnName](abstractnamingstrategy.md#joincolumnname)*

*Defined in [packages/core/src/naming-strategy/MongoNamingStrategy.ts:9](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/naming-strategy/MongoNamingStrategy.ts#L9)*

#### Parameters:

Name | Type |
------ | ------ |
`propertyName` | string |

**Returns:** string

___

### joinKeyColumnName

▸ **joinKeyColumnName**(`entityName`: string, `referencedColumnName?`: string): string

*Overrides [AbstractNamingStrategy](abstractnamingstrategy.md).[joinKeyColumnName](abstractnamingstrategy.md#joinkeycolumnname)*

*Defined in [packages/core/src/naming-strategy/MongoNamingStrategy.ts:13](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/naming-strategy/MongoNamingStrategy.ts#L13)*

#### Parameters:

Name | Type |
------ | ------ |
`entityName` | string |
`referencedColumnName?` | string |

**Returns:** string

___

### joinTableName

▸ **joinTableName**(`sourceEntity`: string, `targetEntity`: string, `propertyName`: string): string

*Implementation of [NamingStrategy](../interfaces/namingstrategy.md)*

*Overrides [AbstractNamingStrategy](abstractnamingstrategy.md).[joinTableName](abstractnamingstrategy.md#jointablename)*

*Defined in [packages/core/src/naming-strategy/MongoNamingStrategy.ts:17](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/naming-strategy/MongoNamingStrategy.ts#L17)*

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

*Implementation of [NamingStrategy](../interfaces/namingstrategy.md)*

*Overrides [AbstractNamingStrategy](abstractnamingstrategy.md).[propertyToColumnName](abstractnamingstrategy.md#propertytocolumnname)*

*Defined in [packages/core/src/naming-strategy/MongoNamingStrategy.ts:21](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/naming-strategy/MongoNamingStrategy.ts#L21)*

#### Parameters:

Name | Type |
------ | ------ |
`propertyName` | string |

**Returns:** string

___

### referenceColumnName

▸ **referenceColumnName**(): string

*Implementation of [NamingStrategy](../interfaces/namingstrategy.md)*

*Overrides [AbstractNamingStrategy](abstractnamingstrategy.md).[referenceColumnName](abstractnamingstrategy.md#referencecolumnname)*

*Defined in [packages/core/src/naming-strategy/MongoNamingStrategy.ts:25](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/naming-strategy/MongoNamingStrategy.ts#L25)*

**Returns:** string
