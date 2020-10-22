---
id: "type"
title: "Class: Type<JSType, DBType>"
sidebar_label: "Type"
---

## Type parameters

Name | Default |
------ | ------ |
`JSType` | string |
`DBType` | JSType |

## Hierarchy

* **Type**

  ↳ [DateType](datetype.md)

  ↳ [TimeType](timetype.md)

  ↳ [BigIntType](biginttype.md)

  ↳ [BlobType](blobtype.md)

  ↳ [ArrayType](arraytype.md)

  ↳ [JsonType](jsontype.md)

## Properties

### types

▪ `Static` `Private` `Readonly` **types**: Map&#60;any, any> = new Map()

*Defined in [packages/core/src/types/Type.ts:6](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/Type.ts#L6)*

## Methods

### compareAsType

▸ **compareAsType**(): string

*Defined in [packages/core/src/types/Type.ts:26](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/Type.ts#L26)*

How should the raw database values be compared? Used in `EntityComparator`.
Possible values: string | number | boolean | date | any | buffer | array

**Returns:** string

___

### convertToDatabaseValue

▸ **convertToDatabaseValue**(`value`: JSType \| DBType, `platform`: [Platform](platform.md), `fromQuery?`: boolean): DBType

*Defined in [packages/core/src/types/Type.ts:11](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/Type.ts#L11)*

Converts a value from its JS representation to its database representation of this type.

#### Parameters:

Name | Type |
------ | ------ |
`value` | JSType \| DBType |
`platform` | [Platform](platform.md) |
`fromQuery?` | boolean |

**Returns:** DBType

___

### convertToJSValue

▸ **convertToJSValue**(`value`: JSType \| DBType, `platform`: [Platform](platform.md)): JSType

*Defined in [packages/core/src/types/Type.ts:18](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/Type.ts#L18)*

Converts a value from its database representation to its JS representation of this type.

#### Parameters:

Name | Type |
------ | ------ |
`value` | JSType \| DBType |
`platform` | [Platform](platform.md) |

**Returns:** JSType

___

### getColumnType

▸ **getColumnType**(`prop`: [EntityProperty](../interfaces/entityproperty.md), `platform`: [Platform](platform.md)): string

*Defined in [packages/core/src/types/Type.ts:41](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/Type.ts#L41)*

Gets the SQL declaration snippet for a field of this type.

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`platform` | [Platform](platform.md) |

**Returns:** string

___

### toJSON

▸ **toJSON**(`value`: JSType, `platform`: [Platform](platform.md)): JSType \| DBType

*Defined in [packages/core/src/types/Type.ts:34](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/types/Type.ts#L34)*

Converts a value from its JS representation to its serialized JSON form of this type.
By default uses the runtime value.

#### Parameters:

Name | Type |
------ | ------ |
`value` | JSType |
`platform` | [Platform](platform.md) |

**Returns:** JSType \| DBType

___

### getType

▸ `Static`**getType**&#60;JSType, DBType>(`cls`: [Constructor](../index.md#constructor)&#60;[Type](type.md)&#60;JSType, DBType>>): [Type](type.md)&#60;JSType, DBType>

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
