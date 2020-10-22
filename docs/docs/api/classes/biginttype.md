---
id: "biginttype"
title: "Class: BigIntType"
sidebar_label: "BigIntType"
---

This type will automatically convert string values returned from the database to native JS bigints.

## Hierarchy

* [Type](type.md)&#60;string \| bigint \| null \| undefined, string \| null \| undefined>

  ↳ **BigIntType**

## Methods

### compareAsType

▸ **compareAsType**(): string

*Inherited from [Type](type.md).[compareAsType](type.md#compareastype)*

*Defined in [packages/core/src/types/Type.ts:26](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/types/Type.ts#L26)*

How should the raw database values be compared? Used in `EntityComparator`.
Possible values: string | number | boolean | date | any | buffer | array

**Returns:** string

___

### convertToDatabaseValue

▸ **convertToDatabaseValue**(`value`: string \| bigint \| null \| undefined): string \| null \| undefined

*Overrides [Type](type.md).[convertToDatabaseValue](type.md#converttodatabasevalue)*

*Defined in [packages/core/src/types/BigIntType.ts:10](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/types/BigIntType.ts#L10)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | string \| bigint \| null \| undefined |

**Returns:** string \| null \| undefined

___

### convertToJSValue

▸ **convertToJSValue**(`value`: string \| bigint \| null \| undefined): string \| null \| undefined

*Overrides [Type](type.md).[convertToJSValue](type.md#converttojsvalue)*

*Defined in [packages/core/src/types/BigIntType.ts:18](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/types/BigIntType.ts#L18)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | string \| bigint \| null \| undefined |

**Returns:** string \| null \| undefined

___

### getColumnType

▸ **getColumnType**(`prop`: [EntityProperty](../interfaces/entityproperty.md), `platform`: [Platform](platform.md)): string

*Overrides [Type](type.md).[getColumnType](type.md#getcolumntype)*

*Defined in [packages/core/src/types/BigIntType.ts:26](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/types/BigIntType.ts#L26)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`platform` | [Platform](platform.md) |

**Returns:** string

___

### toJSON

▸ **toJSON**(`value`: string \| bigint \| null \| undefined, `platform`: [Platform](platform.md)): string \| bigint \| null \| undefined \| string \| null \| undefined

*Inherited from [Type](type.md).[toJSON](type.md#tojson)*

*Defined in [packages/core/src/types/Type.ts:34](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/types/Type.ts#L34)*

Converts a value from its JS representation to its serialized JSON form of this type.
By default uses the runtime value.

#### Parameters:

Name | Type |
------ | ------ |
`value` | string \| bigint \| null \| undefined |
`platform` | [Platform](platform.md) |

**Returns:** string \| bigint \| null \| undefined \| string \| null \| undefined

___

### getType

▸ `Static`**getType**&#60;JSType, DBType>(`cls`: [Constructor](../index.md#constructor)&#60;[Type](type.md)&#60;JSType, DBType>>): [Type](type.md)&#60;JSType, DBType>

*Inherited from [Type](type.md).[getType](type.md#gettype)*

*Defined in [packages/core/src/types/Type.ts:46](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/types/Type.ts#L46)*

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
