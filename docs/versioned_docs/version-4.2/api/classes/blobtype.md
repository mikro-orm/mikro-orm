---
id: "blobtype"
title: "Class: BlobType"
sidebar_label: "BlobType"
---

## Hierarchy

* [Type](type.md)&#60;Buffer \| null>

  ↳ **BlobType**

## Methods

### compareAsType

▸ **compareAsType**(): string

*Overrides [Type](type.md).[compareAsType](type.md#compareastype)*

*Defined in [packages/core/src/types/BlobType.ts:25](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/BlobType.ts#L25)*

**Returns:** string

___

### convertToDatabaseValue

▸ **convertToDatabaseValue**(`value`: Buffer, `platform`: [Platform](platform.md)): Buffer

*Overrides [Type](type.md).[convertToDatabaseValue](type.md#converttodatabasevalue)*

*Defined in [packages/core/src/types/BlobType.ts:7](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/BlobType.ts#L7)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | Buffer |
`platform` | [Platform](platform.md) |

**Returns:** Buffer

___

### convertToJSValue

▸ **convertToJSValue**(`value`: Buffer, `platform`: [Platform](platform.md)): Buffer \| null

*Overrides [Type](type.md).[convertToJSValue](type.md#converttojsvalue)*

*Defined in [packages/core/src/types/BlobType.ts:11](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/BlobType.ts#L11)*

#### Parameters:

Name | Type |
------ | ------ |
`value` | Buffer |
`platform` | [Platform](platform.md) |

**Returns:** Buffer \| null

___

### getColumnType

▸ **getColumnType**(`prop`: [EntityProperty](../interfaces/entityproperty.md), `platform`: [Platform](platform.md)): string

*Overrides [Type](type.md).[getColumnType](type.md#getcolumntype)*

*Defined in [packages/core/src/types/BlobType.ts:29](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/BlobType.ts#L29)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`platform` | [Platform](platform.md) |

**Returns:** string

___

### toJSON

▸ **toJSON**(`value`: Buffer \| null, `platform`: [Platform](platform.md)): Buffer \| null \| JSType

*Inherited from [Type](type.md).[toJSON](type.md#tojson)*

*Defined in [packages/core/src/types/Type.ts:34](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/Type.ts#L34)*

Converts a value from its JS representation to its serialized JSON form of this type.
By default uses the runtime value.

#### Parameters:

Name | Type |
------ | ------ |
`value` | Buffer \| null |
`platform` | [Platform](platform.md) |

**Returns:** Buffer \| null \| JSType

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
