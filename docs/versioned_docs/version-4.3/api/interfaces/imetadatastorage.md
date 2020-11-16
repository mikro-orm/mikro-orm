---
id: "imetadatastorage"
title: "Interface: IMetadataStorage"
sidebar_label: "IMetadataStorage"
---

## Hierarchy

* **IMetadataStorage**

## Methods

### find

▸ **find**&#60;T>(`entity`: string): [EntityMetadata](../classes/entitymetadata.md)&#60;T> \| undefined

*Defined in [packages/core/src/typings.ts:422](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L422)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | string |

**Returns:** [EntityMetadata](../classes/entitymetadata.md)&#60;T> \| undefined

___

### get

▸ **get**&#60;T>(`entity`: string, `init?`: boolean, `validate?`: boolean): [EntityMetadata](../classes/entitymetadata.md)&#60;T>

*Defined in [packages/core/src/typings.ts:421](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L421)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | string |
`init?` | boolean |
`validate?` | boolean |

**Returns:** [EntityMetadata](../classes/entitymetadata.md)&#60;T>

___

### getAll

▸ **getAll**(): [Dictionary](../index.md#dictionary)&#60;[EntityMetadata](../classes/entitymetadata.md)>

*Defined in [packages/core/src/typings.ts:420](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L420)*

**Returns:** [Dictionary](../index.md#dictionary)&#60;[EntityMetadata](../classes/entitymetadata.md)>

___

### has

▸ **has**(`entity`: string): boolean

*Defined in [packages/core/src/typings.ts:423](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L423)*

#### Parameters:

Name | Type |
------ | ------ |
`entity` | string |

**Returns:** boolean

___

### reset

▸ **reset**(`entity`: string): void

*Defined in [packages/core/src/typings.ts:425](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L425)*

#### Parameters:

Name | Type |
------ | ------ |
`entity` | string |

**Returns:** void

___

### set

▸ **set**(`entity`: string, `meta`: [EntityMetadata](../classes/entitymetadata.md)): [EntityMetadata](../classes/entitymetadata.md)

*Defined in [packages/core/src/typings.ts:424](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/typings.ts#L424)*

#### Parameters:

Name | Type |
------ | ------ |
`entity` | string |
`meta` | [EntityMetadata](../classes/entitymetadata.md) |

**Returns:** [EntityMetadata](../classes/entitymetadata.md)
