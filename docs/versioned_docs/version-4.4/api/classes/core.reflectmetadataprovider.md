---
id: "core.reflectmetadataprovider"
title: "Class: ReflectMetadataProvider"
sidebar_label: "ReflectMetadataProvider"
hide_title: true
---

# Class: ReflectMetadataProvider

[core](../modules/core.md).ReflectMetadataProvider

## Hierarchy

* [*MetadataProvider*](core.metadataprovider.md)

  ↳ **ReflectMetadataProvider**

## Constructors

### constructor

\+ **new ReflectMetadataProvider**(`config`: [*IConfiguration*](../interfaces/core.iconfiguration.md)): [*ReflectMetadataProvider*](core.reflectmetadataprovider.md)

#### Parameters:

Name | Type |
------ | ------ |
`config` | [*IConfiguration*](../interfaces/core.iconfiguration.md) |

**Returns:** [*ReflectMetadataProvider*](core.reflectmetadataprovider.md)

Inherited from: [MetadataProvider](core.metadataprovider.md)

Defined in: [packages/core/src/metadata/MetadataProvider.ts:9](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataProvider.ts#L9)

## Properties

### config

• `Protected` `Readonly` **config**: [*IConfiguration*](../interfaces/core.iconfiguration.md)

Inherited from: [MetadataProvider](core.metadataprovider.md).[config](core.metadataprovider.md#config)

## Methods

### initProperties

▸ `Protected`**initProperties**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `fallback`: (`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>) => *void* \| *Promise*<*void*\>): *Promise*<*void*\>

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`fallback` | (`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>) => *void* \| *Promise*<*void*\> |

**Returns:** *Promise*<*void*\>

Inherited from: [MetadataProvider](core.metadataprovider.md)

Defined in: [packages/core/src/metadata/MetadataProvider.ts:23](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataProvider.ts#L23)

___

### initPropertyType

▸ `Protected`**initPropertyType**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/ReflectMetadataProvider.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/ReflectMetadataProvider.ts#L12)

___

### loadEntityMetadata

▸ **loadEntityMetadata**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `name`: *string*): *Promise*<*void*\>

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`name` | *string* |

**Returns:** *Promise*<*void*\>

Overrides: [MetadataProvider](core.metadataprovider.md)

Defined in: [packages/core/src/metadata/ReflectMetadataProvider.ts:8](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/ReflectMetadataProvider.ts#L8)

___

### loadFromCache

▸ **loadFromCache**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `cache`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`cache` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |

**Returns:** *void*

Inherited from: [MetadataProvider](core.metadataprovider.md)

Defined in: [packages/core/src/metadata/MetadataProvider.ts:15](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataProvider.ts#L15)

___

### useCache

▸ **useCache**(): *boolean*

**Returns:** *boolean*

Inherited from: [MetadataProvider](core.metadataprovider.md)

Defined in: [packages/core/src/metadata/MetadataProvider.ts:19](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataProvider.ts#L19)
