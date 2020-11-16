---
id: "metadatastorage"
title: "Class: MetadataStorage"
sidebar_label: "MetadataStorage"
---

## Hierarchy

* **MetadataStorage**

## Constructors

### constructor

\+ **new MetadataStorage**(`metadata?`: [Dictionary](../index.md#dictionary)&#60;[EntityMetadata](entitymetadata.md)>): [MetadataStorage](metadatastorage.md)

*Defined in [packages/core/src/metadata/MetadataStorage.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataStorage.ts#L12)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`metadata` | [Dictionary](../index.md#dictionary)&#60;[EntityMetadata](entitymetadata.md)> | {} |

**Returns:** [MetadataStorage](metadatastorage.md)

## Properties

### metadata

• `Private` `Readonly` **metadata**: [Dictionary](../index.md#dictionary)&#60;[EntityMetadata](entitymetadata.md)>

*Defined in [packages/core/src/metadata/MetadataStorage.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataStorage.ts#L12)*

___

### metadata

▪ `Static` `Private` `Readonly` **metadata**: [Dictionary](../index.md#dictionary)&#60;[EntityMetadata](entitymetadata.md)> = Utils.getGlobalStorage('metadata')

*Defined in [packages/core/src/metadata/MetadataStorage.ts:10](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataStorage.ts#L10)*

___

### subscribers

▪ `Static` `Private` `Readonly` **subscribers**: [Dictionary](../index.md#dictionary)&#60;[EventSubscriber](../interfaces/eventsubscriber.md)> = Utils.getGlobalStorage('subscribers')

*Defined in [packages/core/src/metadata/MetadataStorage.ts:11](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataStorage.ts#L11)*

## Methods

### decorate

▸ **decorate**(`em`: [EntityManager](entitymanager.md)): void

*Defined in [packages/core/src/metadata/MetadataStorage.ts:103](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataStorage.ts#L103)*

#### Parameters:

Name | Type |
------ | ------ |
`em` | [EntityManager](entitymanager.md) |

**Returns:** void

___

### find

▸ **find**&#60;T>(`entity`: string): [EntityMetadata](entitymetadata.md)&#60;T> \| undefined

*Defined in [packages/core/src/metadata/MetadataStorage.ts:87](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataStorage.ts#L87)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | string |

**Returns:** [EntityMetadata](entitymetadata.md)&#60;T> \| undefined

___

### get

▸ **get**&#60;T>(`entity`: string, `init?`: boolean, `validate?`: boolean): [EntityMetadata](entitymetadata.md)&#60;T>

*Defined in [packages/core/src/metadata/MetadataStorage.ts:75](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataStorage.ts#L75)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | any |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entity` | string | - |
`init` | boolean | false |
`validate` | boolean | true |

**Returns:** [EntityMetadata](entitymetadata.md)&#60;T>

___

### getAll

▸ **getAll**(): [Dictionary](../index.md#dictionary)&#60;[EntityMetadata](entitymetadata.md)>

*Defined in [packages/core/src/metadata/MetadataStorage.ts:59](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataStorage.ts#L59)*

**Returns:** [Dictionary](../index.md#dictionary)&#60;[EntityMetadata](entitymetadata.md)>

___

### getByDiscriminatorColumn

▸ **getByDiscriminatorColumn**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)&#60;T>, `data`: [EntityData](../index.md#entitydata)&#60;T>): [EntityMetadata](entitymetadata.md)&#60;T> \| undefined

*Defined in [packages/core/src/metadata/MetadataStorage.ts:63](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataStorage.ts#L63)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md)&#60;T> |
`data` | [EntityData](../index.md#entitydata)&#60;T> |

**Returns:** [EntityMetadata](entitymetadata.md)&#60;T> \| undefined

___

### has

▸ **has**(`entity`: string): boolean

*Defined in [packages/core/src/metadata/MetadataStorage.ts:91](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataStorage.ts#L91)*

#### Parameters:

Name | Type |
------ | ------ |
`entity` | string |

**Returns:** boolean

___

### reset

▸ **reset**(`entity`: string): void

*Defined in [packages/core/src/metadata/MetadataStorage.ts:99](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataStorage.ts#L99)*

#### Parameters:

Name | Type |
------ | ------ |
`entity` | string |

**Returns:** void

___

### set

▸ **set**(`entity`: string, `meta`: [EntityMetadata](entitymetadata.md)): [EntityMetadata](entitymetadata.md)

*Defined in [packages/core/src/metadata/MetadataStorage.ts:95](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataStorage.ts#L95)*

#### Parameters:

Name | Type |
------ | ------ |
`entity` | string |
`meta` | [EntityMetadata](entitymetadata.md) |

**Returns:** [EntityMetadata](entitymetadata.md)

___

### clear

▸ `Static`**clear**(): void

*Defined in [packages/core/src/metadata/MetadataStorage.ts:54](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataStorage.ts#L54)*

**Returns:** void

___

### getMetadata

▸ `Static`**getMetadata**(): [Dictionary](../index.md#dictionary)&#60;[EntityMetadata](entitymetadata.md)>

*Defined in [packages/core/src/metadata/MetadataStorage.ts:18](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataStorage.ts#L18)*

**Returns:** [Dictionary](../index.md#dictionary)&#60;[EntityMetadata](entitymetadata.md)>

▸ `Static`**getMetadata**&#60;T>(`entity`: string, `path`: string): [EntityMetadata](entitymetadata.md)&#60;T>

*Defined in [packages/core/src/metadata/MetadataStorage.ts:19](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataStorage.ts#L19)*

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> | any |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | string |
`path` | string |

**Returns:** [EntityMetadata](entitymetadata.md)&#60;T>

___

### getMetadataFromDecorator

▸ `Static`**getMetadataFromDecorator**&#60;T>(`target`: T & [Dictionary](../index.md#dictionary)): [EntityMetadata](entitymetadata.md)&#60;T>

*Defined in [packages/core/src/metadata/MetadataStorage.ts:38](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataStorage.ts#L38)*

#### Type parameters:

Name | Default |
------ | ------ |
`T` | any |

#### Parameters:

Name | Type |
------ | ------ |
`target` | T & [Dictionary](../index.md#dictionary) |

**Returns:** [EntityMetadata](entitymetadata.md)&#60;T>

___

### getSubscriberMetadata

▸ `Static`**getSubscriberMetadata**(): [Dictionary](../index.md#dictionary)&#60;[EventSubscriber](../interfaces/eventsubscriber.md)>

*Defined in [packages/core/src/metadata/MetadataStorage.ts:46](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataStorage.ts#L46)*

**Returns:** [Dictionary](../index.md#dictionary)&#60;[EventSubscriber](../interfaces/eventsubscriber.md)>

___

### init

▸ `Static`**init**(): [MetadataStorage](metadatastorage.md)

*Defined in [packages/core/src/metadata/MetadataStorage.ts:50](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataStorage.ts#L50)*

**Returns:** [MetadataStorage](metadatastorage.md)

___

### isKnownEntity

▸ `Static`**isKnownEntity**(`name`: string): boolean

*Defined in [packages/core/src/metadata/MetadataStorage.ts:34](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataStorage.ts#L34)*

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |

**Returns:** boolean
