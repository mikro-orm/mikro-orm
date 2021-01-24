---
id: "core.enumarraytype"
title: "Class: EnumArrayType<T>"
sidebar_label: "EnumArrayType"
hide_title: true
---

# Class: EnumArrayType<T\>

[core](../modules/core.md).EnumArrayType

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`T` | *string* \| *number* | *string* |

## Hierarchy

* [*ArrayType*](core.arraytype.md)<T\>

  ↳ **EnumArrayType**

## Constructors

### constructor

\+ **new EnumArrayType**<T\>(`owner`: *string*, `items?`: T[], `hydrate?`: (`i`: *string*) => T): [*EnumArrayType*](core.enumarraytype.md)<T\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | *string* \| *number* | *string* |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`owner` | *string* | - |
`items?` | T[] | - |
`hydrate` | (`i`: *string*) => T | ... |

**Returns:** [*EnumArrayType*](core.enumarraytype.md)<T\>

Inherited from: [ArrayType](core.arraytype.md)

Defined in: [packages/core/src/types/EnumArrayType.ts:14](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/EnumArrayType.ts#L14)

## Methods

### compareAsType

▸ **compareAsType**(): *string*

**Returns:** *string*

Inherited from: [ArrayType](core.arraytype.md)

Defined in: [packages/core/src/types/ArrayType.ts:41](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/ArrayType.ts#L41)

___

### convertToDatabaseValue

▸ **convertToDatabaseValue**(`value`: *null* \| T[], `platform`: [*Platform*](core.platform.md), `fromQuery?`: *boolean*): *null* \| *string*

#### Parameters:

Name | Type |
------ | ------ |
`value` | *null* \| T[] |
`platform` | [*Platform*](core.platform.md) |
`fromQuery?` | *boolean* |

**Returns:** *null* \| *string*

Overrides: [ArrayType](core.arraytype.md)

Defined in: [packages/core/src/types/EnumArrayType.ts:22](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/EnumArrayType.ts#L22)

___

### convertToJSValue

▸ **convertToJSValue**(`value`: *null* \| *string* \| T[], `platform`: [*Platform*](core.platform.md)): *null* \| T[]

#### Parameters:

Name | Type |
------ | ------ |
`value` | *null* \| *string* \| T[] |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *null* \| T[]

Inherited from: [ArrayType](core.arraytype.md)

Defined in: [packages/core/src/types/ArrayType.ts:29](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/ArrayType.ts#L29)

___

### getColumnType

▸ **getColumnType**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `platform`: [*Platform*](core.platform.md)): *string*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *string*

Inherited from: [ArrayType](core.arraytype.md)

Defined in: [packages/core/src/types/ArrayType.ts:49](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/ArrayType.ts#L49)

___

### toJSON

▸ **toJSON**(`value`: T[]): T[]

#### Parameters:

Name | Type |
------ | ------ |
`value` | T[] |

**Returns:** T[]

Inherited from: [ArrayType](core.arraytype.md)

Defined in: [packages/core/src/types/ArrayType.ts:45](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/ArrayType.ts#L45)

___

### getType

▸ `Static`**getType**<JSType, DBType\>(`cls`: [*Constructor*](../modules/core.md#constructor)<[*Type*](core.type.md)<JSType, DBType\>\>): [*Type*](core.type.md)<JSType, DBType\>

#### Type parameters:

Name |
------ |
`JSType` |
`DBType` |

#### Parameters:

Name | Type |
------ | ------ |
`cls` | [*Constructor*](../modules/core.md#constructor)<[*Type*](core.type.md)<JSType, DBType\>\> |

**Returns:** [*Type*](core.type.md)<JSType, DBType\>

Inherited from: [ArrayType](core.arraytype.md)

Defined in: [packages/core/src/types/Type.ts:46](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/Type.ts#L46)
