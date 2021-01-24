---
id: "core.arraytype"
title: "Class: ArrayType<T>"
sidebar_label: "ArrayType"
hide_title: true
---

# Class: ArrayType<T\>

[core](../modules/core.md).ArrayType

## Type parameters

Name | Type | Default |
------ | ------ | ------ |
`T` | *string* \| *number* | *string* |

## Hierarchy

* [*Type*](core.type.md)<T[] \| *null*, *string* \| *null*\>

  ↳ **ArrayType**

  ↳↳ [*EnumArrayType*](core.enumarraytype.md)

## Constructors

### constructor

\+ **new ArrayType**<T\>(`hydrate?`: (`i`: *string*) => T): [*ArrayType*](core.arraytype.md)<T\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | *string* \| *number* | *string* |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`hydrate` | (`i`: *string*) => T | ... |

**Returns:** [*ArrayType*](core.arraytype.md)<T\>

Inherited from: [Type](core.type.md)

Defined in: [packages/core/src/types/ArrayType.ts:7](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/ArrayType.ts#L7)

## Methods

### compareAsType

▸ **compareAsType**(): *string*

**Returns:** *string*

Overrides: [Type](core.type.md)

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

Overrides: [Type](core.type.md)

Defined in: [packages/core/src/types/ArrayType.ts:13](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/ArrayType.ts#L13)

___

### convertToJSValue

▸ **convertToJSValue**(`value`: *null* \| *string* \| T[], `platform`: [*Platform*](core.platform.md)): *null* \| T[]

#### Parameters:

Name | Type |
------ | ------ |
`value` | *null* \| *string* \| T[] |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *null* \| T[]

Overrides: [Type](core.type.md)

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

Overrides: [Type](core.type.md)

Defined in: [packages/core/src/types/ArrayType.ts:49](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/ArrayType.ts#L49)

___

### toJSON

▸ **toJSON**(`value`: T[]): T[]

#### Parameters:

Name | Type |
------ | ------ |
`value` | T[] |

**Returns:** T[]

Overrides: [Type](core.type.md)

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

Inherited from: [Type](core.type.md)

Defined in: [packages/core/src/types/Type.ts:46](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/Type.ts#L46)
