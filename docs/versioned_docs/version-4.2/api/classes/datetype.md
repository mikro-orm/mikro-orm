---
id: "datetype"
title: "Class: DateType"
sidebar_label: "DateType"
---

## Hierarchy

* [Type](type.md)&#60;Date, string>

  ↳ **DateType**

## Methods

### compareAsType

▸ **compareAsType**(): string

*Overrides [Type](type.md).[compareAsType](type.md#compareastype)*

*Defined in [packages/core/src/types/DateType.ts:34](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/DateType.ts#L34)*

**Returns:** string

___

### convertToDatabaseValue

▸ **convertToDatabaseValue**(`value`: Date \| string \| undefined \| null, `platform`: [Platform](platform.md)): string

*Overrides [Type](type.md).[convertToDatabaseValue](type.md#converttodatabasevalue)*

*Defined in [packages/core/src/types/DateType.ts:8](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/DateType.ts#L8)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | Date \| string \| undefined \| null |
`platform` | [Platform](platform.md) |

**Returns:** string

___

### convertToJSValue

▸ **convertToJSValue**(`value`: Date \| string \| null \| undefined, `platform`: [Platform](platform.md)): Date

*Overrides [Type](type.md).[convertToJSValue](type.md#converttojsvalue)*

*Defined in [packages/core/src/types/DateType.ts:20](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/DateType.ts#L20)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | Date \| string \| null \| undefined |
`platform` | [Platform](platform.md) |

**Returns:** Date

___

### getColumnType

▸ **getColumnType**(`prop`: [EntityProperty](../interfaces/entityproperty.md), `platform`: [Platform](platform.md)): string

*Overrides [Type](type.md).[getColumnType](type.md#getcolumntype)*

*Defined in [packages/core/src/types/DateType.ts:38](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/DateType.ts#L38)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`platform` | [Platform](platform.md) |

**Returns:** string

___

### toJSON

▸ **toJSON**(`value`: Date, `platform`: [Platform](platform.md)): Date \| string

*Overrides [Type](type.md).[toJSON](type.md#tojson)*

*Defined in [packages/core/src/types/DateType.ts:42](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/DateType.ts#L42)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | Date |
`platform` | [Platform](platform.md) |

**Returns:** Date \| string

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
