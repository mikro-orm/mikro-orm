---
id: "core.timetype"
title: "Class: TimeType"
sidebar_label: "TimeType"
hide_title: true
---

# Class: TimeType

[core](../modules/core.md).TimeType

## Hierarchy

* [*Type*](core.type.md)

  ↳ **TimeType**

## Constructors

### constructor

\+ **new TimeType**(): [*TimeType*](core.timetype.md)

**Returns:** [*TimeType*](core.timetype.md)

Inherited from: [Type](core.type.md)

## Methods

### compareAsType

▸ **compareAsType**(): *string*

**Returns:** *string*

Overrides: [Type](core.type.md)

Defined in: [packages/core/src/types/TimeType.ts:16](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/TimeType.ts#L16)

___

### convertToDatabaseValue

▸ **convertToDatabaseValue**(`value`: *any*, `platform`: [*Platform*](core.platform.md)): *string*

#### Parameters:

Name | Type |
------ | ------ |
`value` | *any* |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *string*

Overrides: [Type](core.type.md)

Defined in: [packages/core/src/types/TimeType.ts:8](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/TimeType.ts#L8)

___

### convertToJSValue

▸ **convertToJSValue**(`value`: *string*, `platform`: [*Platform*](core.platform.md)): *string*

Converts a value from its database representation to its JS representation of this type.

#### Parameters:

Name | Type |
------ | ------ |
`value` | *string* |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *string*

Inherited from: [Type](core.type.md)

Defined in: [packages/core/src/types/Type.ts:18](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/Type.ts#L18)

___

### getColumnType

▸ **getColumnType**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `platform`: [*Platform*](core.platform.md)): *string*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *string*

Overrides: [Type](core.type.md)

Defined in: [packages/core/src/types/TimeType.ts:20](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/TimeType.ts#L20)

___

### toJSON

▸ **toJSON**(`value`: *string*, `platform`: [*Platform*](core.platform.md)): *string*

Converts a value from its JS representation to its serialized JSON form of this type.
By default uses the runtime value.

#### Parameters:

Name | Type |
------ | ------ |
`value` | *string* |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *string*

Inherited from: [Type](core.type.md)

Defined in: [packages/core/src/types/Type.ts:34](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/Type.ts#L34)

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

Inherited from: [Type](core.type.md)

Defined in: [packages/core/src/types/Type.ts:46](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/Type.ts#L46)
