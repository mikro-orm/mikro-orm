---
id: "timetype"
title: "Class: TimeType"
sidebar_label: "TimeType"
---

## Hierarchy

* [Type](type.md)

  ↳ **TimeType**

## Methods

### compareAsType

▸ **compareAsType**(): string

*Overrides [Type](type.md).[compareAsType](type.md#compareastype)*

*Defined in [packages/core/src/types/TimeType.ts:16](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/types/TimeType.ts#L16)*

**Returns:** string

___

### convertToDatabaseValue

▸ **convertToDatabaseValue**(`value`: any, `platform`: [Platform](platform.md)): string

*Overrides [Type](type.md).[convertToDatabaseValue](type.md#converttodatabasevalue)*

*Defined in [packages/core/src/types/TimeType.ts:8](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/types/TimeType.ts#L8)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | any |
`platform` | [Platform](platform.md) |

**Returns:** string

___

### convertToJSValue

▸ **convertToJSValue**(`value`: string \| JSType, `platform`: [Platform](platform.md)): string

*Inherited from [Type](type.md).[convertToJSValue](type.md#converttojsvalue)*

*Defined in [packages/core/src/types/Type.ts:18](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/types/Type.ts#L18)*

Converts a value from its database representation to its JS representation of this type.

#### Parameters:

Name | Type |
------ | ------ |
`value` | string \| JSType |
`platform` | [Platform](platform.md) |

**Returns:** string

___

### getColumnType

▸ **getColumnType**(`prop`: [EntityProperty](../interfaces/entityproperty.md), `platform`: [Platform](platform.md)): string

*Overrides [Type](type.md).[getColumnType](type.md#getcolumntype)*

*Defined in [packages/core/src/types/TimeType.ts:20](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/types/TimeType.ts#L20)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`platform` | [Platform](platform.md) |

**Returns:** string

___

### toJSON

▸ **toJSON**(`value`: string, `platform`: [Platform](platform.md)): string \| JSType

*Inherited from [Type](type.md).[toJSON](type.md#tojson)*

*Defined in [packages/core/src/types/Type.ts:34](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/types/Type.ts#L34)*

Converts a value from its JS representation to its serialized JSON form of this type.
By default uses the runtime value.

#### Parameters:

Name | Type |
------ | ------ |
`value` | string |
`platform` | [Platform](platform.md) |

**Returns:** string \| JSType

___

### getType

▸ `Static`**getType**&#60;JSType, DBType>(`cls`: [Constructor](../index.md#constructor)&#60;[Type](type.md)&#60;JSType, DBType>>): [Type](type.md)&#60;JSType, DBType>

*Inherited from [Type](type.md).[getType](type.md#gettype)*

*Defined in [packages/core/src/types/Type.ts:46](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/types/Type.ts#L46)*

#### Type parameters:

Name |
------ |
`JSType` |
`DBType` |

#### Parameters:

Name | Type |
------ | ------ |
`cls` | [Constructor](../index.md#constructor)&#60;[Type](type.md)&#60;JSType, DBType>> |

**Returns:** [Type](type.md)&#60;JSType, DBType>
