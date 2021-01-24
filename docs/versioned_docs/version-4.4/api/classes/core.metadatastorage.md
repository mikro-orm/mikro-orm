---
id: "core.metadatastorage"
title: "Class: MetadataStorage"
sidebar_label: "MetadataStorage"
hide_title: true
---

# Class: MetadataStorage

[core](../modules/core.md).MetadataStorage

## Hierarchy

* **MetadataStorage**

## Constructors

### constructor

\+ **new MetadataStorage**(`metadata?`: [*Dictionary*](../modules/core.md#dictionary)<[*EntityMetadata*](core.entitymetadata.md)<*any*\>\>): [*MetadataStorage*](core.metadatastorage.md)

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`metadata` | [*Dictionary*](../modules/core.md#dictionary)<[*EntityMetadata*](core.entitymetadata.md)<*any*\>\> | ... |

**Returns:** [*MetadataStorage*](core.metadatastorage.md)

Defined in: [packages/core/src/metadata/MetadataStorage.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataStorage.ts#L12)

## Properties

### metadata

• `Private` `Readonly` **metadata**: [*Dictionary*](../modules/core.md#dictionary)<[*EntityMetadata*](core.entitymetadata.md)<*any*\>\>

Defined in: [packages/core/src/metadata/MetadataStorage.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataStorage.ts#L12)

___

### metadata

▪ `Private` `Readonly` `Static` **metadata**: [*Dictionary*](../modules/core.md#dictionary)<[*EntityMetadata*](core.entitymetadata.md)<*any*\>\>

Defined in: [packages/core/src/metadata/MetadataStorage.ts:10](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataStorage.ts#L10)

___

### subscribers

▪ `Private` `Readonly` `Static` **subscribers**: [*Dictionary*](../modules/core.md#dictionary)<[*EventSubscriber*](../interfaces/core.eventsubscriber.md)<*any*\>\>

Defined in: [packages/core/src/metadata/MetadataStorage.ts:11](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataStorage.ts#L11)

## Methods

### decorate

▸ **decorate**(`em`: [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`em` | [*EntityManager*](core.entitymanager.md)<[*IDatabaseDriver*](../interfaces/core.idatabasedriver.md)<[*Connection*](core.connection.md)\>\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataStorage.ts:103](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataStorage.ts#L103)

___

### find

▸ **find**<T\>(`entity`: *string*): *undefined* \| [*EntityMetadata*](core.entitymetadata.md)<T\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | *any* |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | *string* |

**Returns:** *undefined* \| [*EntityMetadata*](core.entitymetadata.md)<T\>

Defined in: [packages/core/src/metadata/MetadataStorage.ts:87](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataStorage.ts#L87)

___

### get

▸ **get**<T\>(`entity`: *string*, `init?`: *boolean*, `validate?`: *boolean*): [*EntityMetadata*](core.entitymetadata.md)<T\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | *any* |

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`entity` | *string* | - |
`init` | *boolean* | false |
`validate` | *boolean* | true |

**Returns:** [*EntityMetadata*](core.entitymetadata.md)<T\>

Defined in: [packages/core/src/metadata/MetadataStorage.ts:75](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataStorage.ts#L75)

___

### getAll

▸ **getAll**(): [*Dictionary*](../modules/core.md#dictionary)<[*EntityMetadata*](core.entitymetadata.md)<*any*\>\>

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<[*EntityMetadata*](core.entitymetadata.md)<*any*\>\>

Defined in: [packages/core/src/metadata/MetadataStorage.ts:59](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataStorage.ts#L59)

___

### getByDiscriminatorColumn

▸ **getByDiscriminatorColumn**<T\>(`meta`: [*EntityMetadata*](core.entitymetadata.md)<T\>, `data`: [*EntityData*](../modules/core.md#entitydata)<T\>): *undefined* \| [*EntityMetadata*](core.entitymetadata.md)<T\>

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<T\> |
`data` | [*EntityData*](../modules/core.md#entitydata)<T\> |

**Returns:** *undefined* \| [*EntityMetadata*](core.entitymetadata.md)<T\>

Defined in: [packages/core/src/metadata/MetadataStorage.ts:63](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataStorage.ts#L63)

___

### has

▸ **has**(`entity`: *string*): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`entity` | *string* |

**Returns:** *boolean*

Defined in: [packages/core/src/metadata/MetadataStorage.ts:91](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataStorage.ts#L91)

___

### reset

▸ **reset**(`entity`: *string*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`entity` | *string* |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataStorage.ts:99](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataStorage.ts#L99)

___

### set

▸ **set**(`entity`: *string*, `meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>): [*EntityMetadata*](core.entitymetadata.md)<*any*\>

#### Parameters:

Name | Type |
------ | ------ |
`entity` | *string* |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |

**Returns:** [*EntityMetadata*](core.entitymetadata.md)<*any*\>

Defined in: [packages/core/src/metadata/MetadataStorage.ts:95](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataStorage.ts#L95)

___

### clear

▸ `Static`**clear**(): *void*

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataStorage.ts:54](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataStorage.ts#L54)

___

### getMetadata

▸ `Static`**getMetadata**(): [*Dictionary*](../modules/core.md#dictionary)<[*EntityMetadata*](core.entitymetadata.md)<*any*\>\>

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<[*EntityMetadata*](core.entitymetadata.md)<*any*\>\>

Defined in: [packages/core/src/metadata/MetadataStorage.ts:18](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataStorage.ts#L18)

▸ `Static`**getMetadata**<T\>(`entity`: *string*, `path`: *string*): [*EntityMetadata*](core.entitymetadata.md)<T\>

#### Type parameters:

Name | Type | Default |
------ | ------ | ------ |
`T` | [*AnyEntity*](../modules/core.md#anyentity)<T\> | *any* |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | *string* |
`path` | *string* |

**Returns:** [*EntityMetadata*](core.entitymetadata.md)<T\>

Defined in: [packages/core/src/metadata/MetadataStorage.ts:19](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataStorage.ts#L19)

___

### getMetadataFromDecorator

▸ `Static`**getMetadataFromDecorator**<T\>(`target`: T & [*Dictionary*](../modules/core.md#dictionary)<*any*\>): [*EntityMetadata*](core.entitymetadata.md)<T\>

#### Type parameters:

Name | Default |
------ | ------ |
`T` | *any* |

#### Parameters:

Name | Type |
------ | ------ |
`target` | T & [*Dictionary*](../modules/core.md#dictionary)<*any*\> |

**Returns:** [*EntityMetadata*](core.entitymetadata.md)<T\>

Defined in: [packages/core/src/metadata/MetadataStorage.ts:38](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataStorage.ts#L38)

___

### getSubscriberMetadata

▸ `Static`**getSubscriberMetadata**(): [*Dictionary*](../modules/core.md#dictionary)<[*EventSubscriber*](../interfaces/core.eventsubscriber.md)<*any*\>\>

**Returns:** [*Dictionary*](../modules/core.md#dictionary)<[*EventSubscriber*](../interfaces/core.eventsubscriber.md)<*any*\>\>

Defined in: [packages/core/src/metadata/MetadataStorage.ts:46](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataStorage.ts#L46)

___

### init

▸ `Static`**init**(): [*MetadataStorage*](core.metadatastorage.md)

**Returns:** [*MetadataStorage*](core.metadatastorage.md)

Defined in: [packages/core/src/metadata/MetadataStorage.ts:50](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataStorage.ts#L50)

___

### isKnownEntity

▸ `Static`**isKnownEntity**(`name`: *string*): *boolean*

#### Parameters:

Name | Type |
------ | ------ |
`name` | *string* |

**Returns:** *boolean*

Defined in: [packages/core/src/metadata/MetadataStorage.ts:34](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataStorage.ts#L34)
