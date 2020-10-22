---
id: "jsontype"
title: "Class: JsonType"
sidebar_label: "JsonType"
---

## Hierarchy

* [Type](type.md)&#60;unknown, string \| null>

  ↳ **JsonType**

## Methods

### compareAsType

▸ **compareAsType**(): string

*Inherited from [Type](type.md).[compareAsType](type.md#compareastype)*

*Defined in [packages/core/src/types/Type.ts:26](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/types/Type.ts#L26)*

How should the raw database values be compared? Used in `EntityComparator`.
Possible values: string | number | boolean | date | any | buffer | array

**Returns:** string

___

### convertToDatabaseValue

▸ **convertToDatabaseValue**(`value`: unknown, `platform`: [Platform](platform.md)): string \| null

*Overrides [Type](type.md).[convertToDatabaseValue](type.md#converttodatabasevalue)*

*Defined in [packages/core/src/types/JsonType.ts:8](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/types/JsonType.ts#L8)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | unknown |
`platform` | [Platform](platform.md) |

**Returns:** string \| null

___

### convertToJSValue

▸ **convertToJSValue**(`value`: string \| unknown, `platform`: [Platform](platform.md)): unknown

*Overrides [Type](type.md).[convertToJSValue](type.md#converttojsvalue)*

*Defined in [packages/core/src/types/JsonType.ts:16](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/types/JsonType.ts#L16)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | string \| unknown |
`platform` | [Platform](platform.md) |

**Returns:** unknown

___

### getColumnType

▸ **getColumnType**(`prop`: [EntityProperty](../interfaces/entityproperty.md), `platform`: [Platform](platform.md)): string

*Overrides [Type](type.md).[getColumnType](type.md#getcolumntype)*

*Defined in [packages/core/src/types/JsonType.ts:24](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/types/JsonType.ts#L24)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`platform` | [Platform](platform.md) |

**Returns:** string

___

### toJSON

▸ **toJSON**(`value`: unknown, `platform`: [Platform](platform.md)): unknown \| string \| null

*Inherited from [Type](type.md).[toJSON](type.md#tojson)*

*Defined in [packages/core/src/types/Type.ts:34](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/types/Type.ts#L34)*

Converts a value from its JS representation to its serialized JSON form of this type.
By default uses the runtime value.

#### Parameters:

Name | Type |
------ | ------ |
`value` | unknown |
`platform` | [Platform](platform.md) |

**Returns:** unknown \| string \| null

___

### getType

▸ `Static`**getType**&#60;JSType, DBType>(`cls`: [Constructor](../index.md#constructor)&#60;[Type](type.md)&#60;JSType, DBType>>): [Type](type.md)&#60;JSType, DBType>

*Inherited from [Type](type.md).[getType](type.md#gettype)*

*Defined in [packages/core/src/types/Type.ts:46](https://github.com/mikro-orm/mikro-orm/blob/c7aaca40d/packages/core/src/types/Type.ts#L46)*

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
