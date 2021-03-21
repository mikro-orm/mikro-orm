---
id: "core.type"
title: "Class: Type<JSType, DBType>"
sidebar_label: "Type"
custom_edit_url: null
hide_title: true
---

# Class: Type<JSType, DBType\>

[core](../modules/core.md).Type

## Type parameters

Name | Default |
:------ | :------ |
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
:------ | :------ |
`JSType` | *string* |
`DBType` | JSType |

**Returns:** [*Type*](core.type.md)<JSType, DBType\>

## Properties

### types

▪ `Private` `Readonly` `Static` **types**: *Map*<any, any\>

Defined in: [packages/core/src/types/Type.ts:6](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/Type.ts#L6)

## Methods

### compareAsType

▸ **compareAsType**(): *string*

How should the raw database values be compared? Used in `EntityComparator`.
Possible values: string | number | boolean | date | any | buffer | array

**Returns:** *string*

Defined in: [packages/core/src/types/Type.ts:36](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/Type.ts#L36)

___

### convertToDatabaseValue

▸ **convertToDatabaseValue**(`value`: JSType \| DBType, `platform`: [*Platform*](core.platform.md), `fromQuery?`: *boolean*): DBType

Converts a value from its JS representation to its database representation of this type.

#### Parameters:

Name | Type |
:------ | :------ |
`value` | JSType \| DBType |
`platform` | [*Platform*](core.platform.md) |
`fromQuery?` | *boolean* |

**Returns:** DBType

Defined in: [packages/core/src/types/Type.ts:11](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/Type.ts#L11)

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

Defined in: [packages/core/src/types/Type.ts:25](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/Type.ts#L25)

___

### convertToJSValue

▸ **convertToJSValue**(`value`: JSType \| DBType, `platform`: [*Platform*](core.platform.md)): JSType

Converts a value from its database representation to its JS representation of this type.

#### Parameters:

Name | Type |
:------ | :------ |
`value` | JSType \| DBType |
`platform` | [*Platform*](core.platform.md) |

**Returns:** JSType

Defined in: [packages/core/src/types/Type.ts:18](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/Type.ts#L18)

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

Defined in: [packages/core/src/types/Type.ts:30](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/Type.ts#L30)

___

### getColumnType

▸ **getColumnType**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `platform`: [*Platform*](core.platform.md)): *string*

Gets the SQL declaration snippet for a field of this type.

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *string*

Defined in: [packages/core/src/types/Type.ts:51](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/Type.ts#L51)

___

### toJSON

▸ **toJSON**(`value`: JSType, `platform`: [*Platform*](core.platform.md)): JSType \| DBType

Converts a value from its JS representation to its serialized JSON form of this type.
By default uses the runtime value.

#### Parameters:

Name | Type |
:------ | :------ |
`value` | JSType |
`platform` | [*Platform*](core.platform.md) |

**Returns:** JSType \| DBType

Defined in: [packages/core/src/types/Type.ts:44](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/Type.ts#L44)

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

Defined in: [packages/core/src/types/Type.ts:56](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/types/Type.ts#L56)
