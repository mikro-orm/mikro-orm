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

*Defined in [packages/core/src/typings.ts:407](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/typings.ts#L407)*

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

*Defined in [packages/core/src/typings.ts:406](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/typings.ts#L406)*

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

*Defined in [packages/core/src/typings.ts:405](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/typings.ts#L405)*

**Returns:** [Dictionary](../index.md#dictionary)&#60;[EntityMetadata](../classes/entitymetadata.md)>

___

### has

▸ **has**(`entity`: string): boolean

*Defined in [packages/core/src/typings.ts:408](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/typings.ts#L408)*

#### Parameters:

Name | Type |
------ | ------ |
`entity` | string |

**Returns:** boolean

___

### reset

▸ **reset**(`entity`: string): void

*Defined in [packages/core/src/typings.ts:410](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/typings.ts#L410)*

#### Parameters:

Name | Type |
------ | ------ |
`entity` | string |

**Returns:** void

___

### set

▸ **set**(`entity`: string, `meta`: [EntityMetadata](../classes/entitymetadata.md)): [EntityMetadata](../classes/entitymetadata.md)

*Defined in [packages/core/src/typings.ts:409](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/typings.ts#L409)*

#### Parameters:

Name | Type |
------ | ------ |
`entity` | string |
`meta` | [EntityMetadata](../classes/entitymetadata.md) |

**Returns:** [EntityMetadata](../classes/entitymetadata.md)
