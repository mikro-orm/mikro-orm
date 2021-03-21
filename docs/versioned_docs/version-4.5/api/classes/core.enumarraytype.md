---
id: "core.enumarraytype"
title: "Class: EnumArrayType<T>"
sidebar_label: "EnumArrayType"
custom_edit_url: null
hide_title: true
---

# Class: EnumArrayType<T\>

[core](../modules/core.md).EnumArrayType

## Type parameters

Name | Type | Default |
:------ | :------ | :------ |
`T` | *string* \| *number* | *string* |

## Hierarchy

* [*ArrayType*](core.arraytype.md)<T\>

  ↳ **EnumArrayType**

## Constructors

### constructor

\+ **new EnumArrayType**<T\>(`owner`: *string*, `items?`: T[], `hydrate?`: (`i`: *string*) => T): [*EnumArrayType*](core.enumarraytype.md)<T\>

#### Type parameters:

Name | Type | Default |
:------ | :------ | :------ |
`T` | *string* \| *number* | *string* |

#### Parameters:

Name | Type |
:------ | :------ |
`owner` | *string* |
`items?` | T[] |
`hydrate` | (`i`: *string*) => T |

**Returns:** [*EnumArrayType*](core.enumarraytype.md)<T\>

Overrides: [ArrayType](core.arraytype.md)

Defined in: [packages/core/src/types/EnumArrayType.ts:14](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/EnumArrayType.ts#L14)

## Methods

### compareAsType

▸ **compareAsType**(): *string*

**Returns:** *string*

Inherited from: [ArrayType](core.arraytype.md)

Defined in: [packages/core/src/types/ArrayType.ts:41](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/ArrayType.ts#L41)

___

### convertToDatabaseValue

▸ **convertToDatabaseValue**(`value`: *null* \| T[], `platform`: [*Platform*](core.platform.md), `fromQuery?`: *boolean*): *null* \| *string*

#### Parameters:

Name | Type |
:------ | :------ |
`value` | *null* \| T[] |
`platform` | [*Platform*](core.platform.md) |
`fromQuery?` | *boolean* |

**Returns:** *null* \| *string*

Overrides: [ArrayType](core.arraytype.md)

Defined in: [packages/core/src/types/EnumArrayType.ts:22](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/EnumArrayType.ts#L22)

___

### convertToDatabaseValueSQL

▸ `Optional`**convertToDatabaseValueSQL**(`key`: *string*, `platform`: [*Platform*](core.platform.md)): *string*

Converts a value from its JS representation to its database representation of this type.

#### Parameters:

Name | Type |
:------ | :------ |
`key` | *string* |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *string*

Inherited from: [ArrayType](core.arraytype.md)

Defined in: [packages/core/src/types/Type.ts:25](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/Type.ts#L25)

___

### convertToJSValue

▸ **convertToJSValue**(`value`: *null* \| *string* \| T[], `platform`: [*Platform*](core.platform.md)): *null* \| T[]

#### Parameters:

Name | Type |
:------ | :------ |
`value` | *null* \| *string* \| T[] |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *null* \| T[]

Inherited from: [ArrayType](core.arraytype.md)

Defined in: [packages/core/src/types/ArrayType.ts:29](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/ArrayType.ts#L29)

___

### convertToJSValueSQL

▸ `Optional`**convertToJSValueSQL**(`key`: *string*, `platform`: [*Platform*](core.platform.md)): *string*

Modifies the SQL expression (identifier, parameter) to convert to a JS value.

#### Parameters:

Name | Type |
:------ | :------ |
`key` | *string* |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *string*

Inherited from: [ArrayType](core.arraytype.md)

Defined in: [packages/core/src/types/Type.ts:30](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/Type.ts#L30)

___

### getColumnType

▸ **getColumnType**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `platform`: [*Platform*](core.platform.md)): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *string*

Inherited from: [ArrayType](core.arraytype.md)

Defined in: [packages/core/src/types/ArrayType.ts:49](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/ArrayType.ts#L49)

___

### toJSON

▸ **toJSON**(`value`: T[]): T[]

#### Parameters:

Name | Type |
:------ | :------ |
`value` | T[] |

**Returns:** T[]

Inherited from: [ArrayType](core.arraytype.md)

Defined in: [packages/core/src/types/ArrayType.ts:45](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/ArrayType.ts#L45)

___

### getType

▸ `Static`**getType**<JSType, DBType\>(`cls`: [*Constructor*](../modules/core.md#constructor)<[*Type*](core.type.md)<JSType, DBType\>\>): [*Type*](core.type.md)<JSType, DBType\>

#### Type parameters:

Name |
:------ |
`JSType` |
`DBType` |

#### Parameters:

Name | Type |
:------ | :------ |
`cls` | [*Constructor*](../modules/core.md#constructor)<[*Type*](core.type.md)<JSType, DBType\>\> |

**Returns:** [*Type*](core.type.md)<JSType, DBType\>

Inherited from: [ArrayType](core.arraytype.md)

Defined in: [packages/core/src/types/Type.ts:56](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/Type.ts#L56)
