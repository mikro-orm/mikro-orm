---
id: "entitycasenamingstrategy"
title: "Class: EntityCaseNamingStrategy"
sidebar_label: "EntityCaseNamingStrategy"
---

This strategy keeps original entity/property names for table/column.

## Hierarchy

* [AbstractNamingStrategy](abstractnamingstrategy.md)

  ↳ **EntityCaseNamingStrategy**

## Implements

* [NamingStrategy](../interfaces/namingstrategy.md)

## Methods

### classToMigrationName

▸ **classToMigrationName**(`timestamp`: string): string

*Implementation of [NamingStrategy](../interfaces/namingstrategy.md)*

*Inherited from [AbstractNamingStrategy](abstractnamingstrategy.md).[classToMigrationName](abstractnamingstrategy.md#classtomigrationname)*

*Defined in [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:12](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L12)*

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

*Defined in [packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts:8](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts#L8)*

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

*Defined in [packages/core/src/naming-strategy/AbstractNamingStrategy.ts:5](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/naming-strategy/AbstractNamingStrategy.ts#L5)*

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

*Defined in [packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts:12](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts#L12)*

#### Parameters:

Name | Type |
------ | ------ |
`propertyName` | string |

**Returns:** string

___

### joinKeyColumnName

▸ **joinKeyColumnName**(`entityName`: string, `referencedColumnName?`: string, `composite?`: boolean): string

*Implementation of [NamingStrategy](../interfaces/namingstrategy.md)*

*Overrides [AbstractNamingStrategy](abstractnamingstrategy.md).[joinKeyColumnName](abstractnamingstrategy.md#joinkeycolumnname)*

*Defined in [packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts:16](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts#L16)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entityName` | string | - |
`referencedColumnName?` | string | - |
`composite` | boolean | false |

**Returns:** string

___

### joinTableName

▸ **joinTableName**(`sourceEntity`: string, `targetEntity`: string, `propertyName`: string): string

*Implementation of [NamingStrategy](../interfaces/namingstrategy.md)*

*Overrides [AbstractNamingStrategy](abstractnamingstrategy.md).[joinTableName](abstractnamingstrategy.md#jointablename)*

*Defined in [packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts:26](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts#L26)*

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

*Defined in [packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts:30](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts#L30)*

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

*Defined in [packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts:34](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/naming-strategy/EntityCaseNamingStrategy.ts#L34)*

**Returns:** string
