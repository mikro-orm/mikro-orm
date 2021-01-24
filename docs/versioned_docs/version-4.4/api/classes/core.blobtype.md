---
id: "core.blobtype"
title: "Class: BlobType"
sidebar_label: "BlobType"
hide_title: true
---

# Class: BlobType

[core](../modules/core.md).BlobType

## Hierarchy

* [*Type*](core.type.md)<Buffer \| *null*\>

  ↳ **BlobType**

## Constructors

### constructor

\+ **new BlobType**(): [*BlobType*](core.blobtype.md)

**Returns:** [*BlobType*](core.blobtype.md)

Inherited from: [Type](core.type.md)

## Methods

### compareAsType

▸ **compareAsType**(): *string*

**Returns:** *string*

Overrides: [Type](core.type.md)

Defined in: [packages/core/src/types/BlobType.ts:25](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/BlobType.ts#L25)

___

### convertToDatabaseValue

▸ **convertToDatabaseValue**(`value`: *Buffer*, `platform`: [*Platform*](core.platform.md)): *Buffer*

#### Parameters:

Name | Type |
------ | ------ |
`value` | *Buffer* |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *Buffer*

Overrides: [Type](core.type.md)

Defined in: [packages/core/src/types/BlobType.ts:7](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/BlobType.ts#L7)

___

### convertToJSValue

▸ **convertToJSValue**(`value`: *Buffer*, `platform`: [*Platform*](core.platform.md)): *null* \| *Buffer*

#### Parameters:

Name | Type |
------ | ------ |
`value` | *Buffer* |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *null* \| *Buffer*

Overrides: [Type](core.type.md)

Defined in: [packages/core/src/types/BlobType.ts:11](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/BlobType.ts#L11)

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

Defined in: [packages/core/src/types/BlobType.ts:29](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/types/BlobType.ts#L29)

___

### toJSON

▸ **toJSON**(`value`: *null* \| *Buffer*, `platform`: [*Platform*](core.platform.md)): *null* \| *Buffer*

Converts a value from its JS representation to its serialized JSON form of this type.
By default uses the runtime value.

#### Parameters:

Name | Type |
------ | ------ |
`value` | *null* \| *Buffer* |
`platform` | [*Platform*](core.platform.md) |

**Returns:** *null* \| *Buffer*

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
