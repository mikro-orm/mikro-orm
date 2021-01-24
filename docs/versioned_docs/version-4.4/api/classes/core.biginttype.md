---
id: "core.biginttype"
title: "Class: BigIntType"
sidebar_label: "BigIntType"
hide_title: true
---

# Class: BigIntType

[core](../modules/core.md).BigIntType

This type will automatically convert string values returned from the database to native JS bigints.

## Hierarchy

* [*Type*](core.type.md)<*string* \| *bigint* \| *null* \| *undefined*, *string* \| *null* \| *undefined*\>

  ↳ **BigIntType**

## Constructors

### constructor

\+ **new BigIntType**(): [*BigIntType*](core.biginttype.md)

**Returns:** [*BigIntType*](core.biginttype.md)

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

▸ **convertToDatabaseValue**(`value`: *undefined* \| *null* \| *string* \| *bigint*): *undefined* \| *null* \| *string*

#### Parameters:

Name | Type |
------ | ------ |
`value` | *undefined* \| *null* \| *string* \| *bigint* |

**Returns:** *undefined* \| *null* \| *string*

Overrides: [Type](core.type.md)

Defined in: [packages/core/src/types/BigIntType.ts:10](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/BigIntType.ts#L10)

___

### convertToJSValue

▸ **convertToJSValue**(`value`: *undefined* \| *null* \| *string* \| *bigint*): *undefined* \| *null* \| *string*

#### Parameters:

Name | Type |
------ | ------ |
`value` | *undefined* \| *null* \| *string* \| *bigint* |

**Returns:** *undefined* \| *null* \| *string*

Overrides: [Type](core.type.md)

Defined in: [packages/core/src/types/BigIntType.ts:18](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/BigIntType.ts#L18)

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

Defined in: [packages/core/src/types/BigIntType.ts:26](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/BigIntType.ts#L26)

___

### toJSON

▸ **toJSON**(`value`: *undefined* \| *null* \| *string* \| *bigint*, `platform`: [*Platform*](core.platform.md)): *undefined* \| *null* \| *string* \| *bigint*

Converts a value from its JS representation to its serialized JSON form of this type.
By default uses the runtime value.

#### Parameters:

Name | Type |
------ | ------ |
`value` | *undefined* \| *null* \| *string* \| *bigint* |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *undefined* \| *null* \| *string* \| *bigint*

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
