---
id: "core.type"
title: "Class: Type<JSType, DBType>"
sidebar_label: "Type"
hide_title: true
---

# Class: Type<JSType, DBType\>

[core](../modules/core.md).Type

## Type parameters

Name | Default |
------ | ------ |
`JSType` | *string* |
`DBType` | JSType |

## Hierarchy

* **Type**

  ↳ [*DateType*](core.datetype.md)

  ↳ [*TimeType*](core.timetype.md)

  ↳ [*BigIntType*](core.biginttype.md)

  ↳ [*BlobType*](core.blobtype.md)

  ↳ [*ArrayType*](core.arraytype.md)

  ↳ [*JsonType*](core.jsontype.md)

## Constructors

### constructor

\+ **new Type**<JSType, DBType\>(): [*Type*](core.type.md)<JSType, DBType\>

#### Type parameters:

Name | Default |
------ | ------ |
`JSType` | *string* |
`DBType` | JSType |

**Returns:** [*Type*](core.type.md)<JSType, DBType\>

## Properties

### types

▪ `Private` `Readonly` `Static` **types**: *Map*<*any*, *any*\>

Defined in: [packages/core/src/types/Type.ts:6](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/Type.ts#L6)

## Methods

### compareAsType

▸ **compareAsType**(): *string*

How should the raw database values be compared? Used in `EntityComparator`.
Possible values: string | number | boolean | date | any | buffer | array

**Returns:** *string*

Defined in: [packages/core/src/types/Type.ts:26](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/Type.ts#L26)

___

### convertToDatabaseValue

▸ **convertToDatabaseValue**(`value`: JSType \| DBType, `platform`: [*Platform*](core.platform.md), `fromQuery?`: *boolean*): DBType

Converts a value from its JS representation to its database representation of this type.

#### Parameters:

Name | Type |
------ | ------ |
`value` | JSType \| DBType |
`platform` | [*Platform*](core.platform.md) |
`fromQuery?` | *boolean* |

**Returns:** DBType

Defined in: [packages/core/src/types/Type.ts:11](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/Type.ts#L11)

___

### convertToJSValue

▸ **convertToJSValue**(`value`: JSType \| DBType, `platform`: [*Platform*](core.platform.md)): JSType

Converts a value from its database representation to its JS representation of this type.

#### Parameters:

Name | Type |
------ | ------ |
`value` | JSType \| DBType |
`platform` | [*Platform*](core.platform.md) |

**Returns:** JSType

Defined in: [packages/core/src/types/Type.ts:18](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/Type.ts#L18)

___

### getColumnType

▸ **getColumnType**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `platform`: [*Platform*](core.platform.md)): *string*

Gets the SQL declaration snippet for a field of this type.

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *string*

Defined in: [packages/core/src/types/Type.ts:41](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/Type.ts#L41)

___

### toJSON

▸ **toJSON**(`value`: JSType, `platform`: [*Platform*](core.platform.md)): JSType \| DBType

Converts a value from its JS representation to its serialized JSON form of this type.
By default uses the runtime value.

#### Parameters:

Name | Type |
------ | ------ |
`value` | JSType |
`platform` | [*Platform*](core.platform.md) |

**Returns:** JSType \| DBType

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

Defined in: [packages/core/src/types/Type.ts:46](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/Type.ts#L46)
