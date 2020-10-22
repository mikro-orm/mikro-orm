---
id: "enumarraytype"
title: "Class: EnumArrayType<T>"
sidebar_label: "EnumArrayType"
---

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`T` | string \| number | string |

## Hierarchy

* [ArrayType](arraytype.md)&#60;T>

  ↳ **EnumArrayType**

## Constructors

### constructor

\+ **new EnumArrayType**(`owner`: string, `items?`: T[], `hydrate?`: (i: string) => T): [EnumArrayType](enumarraytype.md)

*Overrides [ArrayType](arraytype.md).[constructor](arraytype.md#constructor)*

*Defined in [packages/core/src/types/EnumArrayType.ts:14](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/EnumArrayType.ts#L14)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`owner` | string | - |
`items?` | T[] | - |
`hydrate` | (i: string) => T | i => i as T |

**Returns:** [EnumArrayType](enumarraytype.md)

## Properties

### items

• `Private` `Optional` `Readonly` **items**: T[]

*Defined in [packages/core/src/types/EnumArrayType.ts:17](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/EnumArrayType.ts#L17)*

___

### owner

• `Private` `Readonly` **owner**: string

*Defined in [packages/core/src/types/EnumArrayType.ts:16](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/EnumArrayType.ts#L16)*

## Methods

### compareAsType

▸ **compareAsType**(): string

*Inherited from [ArrayType](arraytype.md).[compareAsType](arraytype.md#compareastype)*

*Overrides [Type](type.md).[compareAsType](type.md#compareastype)*

*Defined in [packages/core/src/types/ArrayType.ts:37](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/ArrayType.ts#L37)*

**Returns:** string

___

### convertToDatabaseValue

▸ **convertToDatabaseValue**(`value`: T[] \| null, `platform`: [Platform](platform.md), `fromQuery?`: boolean): string \| null

*Overrides [ArrayType](arraytype.md).[convertToDatabaseValue](arraytype.md#converttodatabasevalue)*

*Defined in [packages/core/src/types/EnumArrayType.ts:22](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/EnumArrayType.ts#L22)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | T[] \| null |
`platform` | [Platform](platform.md) |
`fromQuery?` | boolean |

**Returns:** string \| null

___

### convertToJSValue

▸ **convertToJSValue**(`value`: T[] \| string \| null, `platform`: [Platform](platform.md)): T[] \| null

*Inherited from [ArrayType](arraytype.md).[convertToJSValue](arraytype.md#converttojsvalue)*

*Overrides [Type](type.md).[convertToJSValue](type.md#converttojsvalue)*

*Defined in [packages/core/src/types/ArrayType.ts:25](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/ArrayType.ts#L25)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | T[] \| string \| null |
`platform` | [Platform](platform.md) |

**Returns:** T[] \| null

___

### getColumnType

▸ **getColumnType**(`prop`: [EntityProperty](../interfaces/entityproperty.md), `platform`: [Platform](platform.md)): string

*Inherited from [ArrayType](arraytype.md).[getColumnType](arraytype.md#getcolumntype)*

*Overrides [Type](type.md).[getColumnType](type.md#getcolumntype)*

*Defined in [packages/core/src/types/ArrayType.ts:45](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/ArrayType.ts#L45)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`platform` | [Platform](platform.md) |

**Returns:** string

___

### toJSON

▸ **toJSON**(`value`: T[]): T[]

*Inherited from [ArrayType](arraytype.md).[toJSON](arraytype.md#tojson)*

*Overrides [Type](type.md).[toJSON](type.md#tojson)*

*Defined in [packages/core/src/types/ArrayType.ts:41](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/ArrayType.ts#L41)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | T[] |

**Returns:** T[]

___

### getType

▸ `Static`**getType**&#60;JSType, DBType>(`cls`: [Constructor](../index.md#constructor)&#60;[Type](type.md)&#60;JSType, DBType>>): [Type](type.md)&#60;JSType, DBType>

*Inherited from [Type](type.md).[getType](type.md#gettype)*

*Defined in [packages/core/src/types/Type.ts:46](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/Type.ts#L46)*

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
