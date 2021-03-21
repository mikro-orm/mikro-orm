---
id: "core.datetype"
title: "Class: DateType"
sidebar_label: "DateType"
custom_edit_url: null
hide_title: true
---

# Class: DateType

[core](../modules/core.md).DateType

## Hierarchy

* [*Type*](core.type.md)<Date, string\>

  ↳ **DateType**

## Constructors

### constructor

\+ **new DateType**(): [*DateType*](core.datetype.md)

**Returns:** [*DateType*](core.datetype.md)

Inherited from: [Type](core.type.md)

## Methods

### compareAsType

▸ **compareAsType**(): *string*

**Returns:** *string*

Overrides: [Type](core.type.md)

Defined in: [packages/core/src/types/DateType.ts:34](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/DateType.ts#L34)

___

### convertToDatabaseValue

▸ **convertToDatabaseValue**(`value`: *undefined* \| *null* \| *string* \| Date, `platform`: [*Platform*](core.platform.md)): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`value` | *undefined* \| *null* \| *string* \| Date |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *string*

Overrides: [Type](core.type.md)

Defined in: [packages/core/src/types/DateType.ts:8](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/DateType.ts#L8)

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

Inherited from: [Type](core.type.md)

Defined in: [packages/core/src/types/Type.ts:25](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/Type.ts#L25)

___

### convertToJSValue

▸ **convertToJSValue**(`value`: *undefined* \| *null* \| *string* \| Date, `platform`: [*Platform*](core.platform.md)): Date

#### Parameters:

Name | Type |
:------ | :------ |
`value` | *undefined* \| *null* \| *string* \| Date |
`platform` | [*Platform*](core.platform.md) |

**Returns:** Date

Overrides: [Type](core.type.md)

Defined in: [packages/core/src/types/DateType.ts:20](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/DateType.ts#L20)

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

Inherited from: [Type](core.type.md)

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

Overrides: [Type](core.type.md)

Defined in: [packages/core/src/types/DateType.ts:38](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/DateType.ts#L38)

___

### toJSON

▸ **toJSON**(`value`: Date, `platform`: [*Platform*](core.platform.md)): *string* \| Date

#### Parameters:

Name | Type |
:------ | :------ |
`value` | Date |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *string* \| Date

Overrides: [Type](core.type.md)

Defined in: [packages/core/src/types/DateType.ts:42](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/DateType.ts#L42)

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

Inherited from: [Type](core.type.md)

Defined in: [packages/core/src/types/Type.ts:56](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/Type.ts#L56)
