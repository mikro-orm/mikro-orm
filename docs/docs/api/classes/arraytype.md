---
id: "arraytype"
title: "Class: ArrayType<T>"
sidebar_label: "ArrayType"
---

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`T` | string \| number | string |

## Hierarchy

* [Type](type.md)&#60;T[] \| null, string \| null>

  ↳ **ArrayType**

  ↳↳ [EnumArrayType](enumarraytype.md)

## Constructors

### constructor

\+ **new ArrayType**(`hydrate?`: (i: string) => T): [ArrayType](arraytype.md)

*Defined in [packages/core/src/types/ArrayType.ts:7](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/types/ArrayType.ts#L7)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`hydrate` | (i: string) => T | i => i as T |

**Returns:** [ArrayType](arraytype.md)

## Properties

### hydrate

• `Private` `Readonly` **hydrate**: (i: string) => T

*Defined in [packages/core/src/types/ArrayType.ts:9](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/types/ArrayType.ts#L9)*

## Methods

### compareAsType

▸ **compareAsType**(): string

*Overrides [Type](type.md).[compareAsType](type.md#compareastype)*

*Defined in [packages/core/src/types/ArrayType.ts:37](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/types/ArrayType.ts#L37)*

**Returns:** string

___

### convertToDatabaseValue

▸ **convertToDatabaseValue**(`value`: T[] \| null, `platform`: [Platform](platform.md), `fromQuery?`: boolean): string \| null

*Overrides [Type](type.md).[convertToDatabaseValue](type.md#converttodatabasevalue)*

*Defined in [packages/core/src/types/ArrayType.ts:13](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/types/ArrayType.ts#L13)*

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

*Overrides [Type](type.md).[convertToJSValue](type.md#converttojsvalue)*

*Defined in [packages/core/src/types/ArrayType.ts:25](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/types/ArrayType.ts#L25)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | T[] \| string \| null |
`platform` | [Platform](platform.md) |

**Returns:** T[] \| null

___

### getColumnType

▸ **getColumnType**(`prop`: [EntityProperty](../interfaces/entityproperty.md), `platform`: [Platform](platform.md)): string

*Overrides [Type](type.md).[getColumnType](type.md#getcolumntype)*

*Defined in [packages/core/src/types/ArrayType.ts:45](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/types/ArrayType.ts#L45)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`platform` | [Platform](platform.md) |

**Returns:** string

___

### toJSON

▸ **toJSON**(`value`: T[]): T[]

*Overrides [Type](type.md).[toJSON](type.md#tojson)*

*Defined in [packages/core/src/types/ArrayType.ts:41](https://github.com/mikro-orm/mikro-orm/blob/4249b052e/packages/core/src/types/ArrayType.ts#L41)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | T[] |

**Returns:** T[]

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
