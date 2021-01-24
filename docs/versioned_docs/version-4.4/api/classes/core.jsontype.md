---
id: "core.jsontype"
title: "Class: JsonType"
sidebar_label: "JsonType"
hide_title: true
---

# Class: JsonType

[core](../modules/core.md).JsonType

## Hierarchy

* [*Type*](core.type.md)<*unknown*, *string* \| *null*\>

  ↳ **JsonType**

## Constructors

### constructor

\+ **new JsonType**(): [*JsonType*](core.jsontype.md)

**Returns:** [*JsonType*](core.jsontype.md)

Inherited from: [Type](core.type.md)

## Methods

### compareAsType

▸ **compareAsType**(): *string*

How should the raw database values be compared? Used in `EntityComparator`.
Possible values: string | number | boolean | date | any | buffer | array

**Returns:** *string*

Inherited from: [Type](core.type.md)

Defined in: [packages/core/src/types/Type.ts:26](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/Type.ts#L26)

___

### convertToDatabaseValue

▸ **convertToDatabaseValue**(`value`: *unknown*, `platform`: [*Platform*](core.platform.md)): *null* \| *string*

#### Parameters:

Name | Type |
------ | ------ |
`value` | *unknown* |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *null* \| *string*

Overrides: [Type](core.type.md)

Defined in: [packages/core/src/types/JsonType.ts:8](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/JsonType.ts#L8)

___

### convertToJSValue

▸ **convertToJSValue**(`value`: *unknown*, `platform`: [*Platform*](core.platform.md)): *unknown*

#### Parameters:

Name | Type |
------ | ------ |
`value` | *unknown* |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *unknown*

Overrides: [Type](core.type.md)

Defined in: [packages/core/src/types/JsonType.ts:16](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/JsonType.ts#L16)

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

Defined in: [packages/core/src/types/JsonType.ts:24](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/JsonType.ts#L24)

___

### toJSON

▸ **toJSON**(`value`: *unknown*, `platform`: [*Platform*](core.platform.md)): *unknown*

Converts a value from its JS representation to its serialized JSON form of this type.
By default uses the runtime value.

#### Parameters:

Name | Type |
------ | ------ |
`value` | *unknown* |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *unknown*

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
