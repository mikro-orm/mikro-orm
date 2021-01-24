---
id: "core.metadataprovider"
title: "Class: MetadataProvider"
sidebar_label: "MetadataProvider"
hide_title: true
---

# Class: MetadataProvider

[core](../modules/core.md).MetadataProvider

## Hierarchy

* **MetadataProvider**

  ↳ [*JavaScriptMetadataProvider*](core.javascriptmetadataprovider.md)

  ↳ [*ReflectMetadataProvider*](core.reflectmetadataprovider.md)

  ↳ [*TsMorphMetadataProvider*](reflection.tsmorphmetadataprovider.md)

## Constructors

### constructor

\+ **new MetadataProvider**(`config`: [*IConfiguration*](../interfaces/core.iconfiguration.md)): [*MetadataProvider*](core.metadataprovider.md)

#### Parameters:

Name | Type |
------ | ------ |
`config` | [*IConfiguration*](../interfaces/core.iconfiguration.md) |

**Returns:** [*MetadataProvider*](core.metadataprovider.md)

Defined in: [packages/core/src/metadata/MetadataProvider.ts:9](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataProvider.ts#L9)

## Properties

### config

• `Protected` `Readonly` **config**: [*IConfiguration*](../interfaces/core.iconfiguration.md)

## Methods

### initProperties

▸ `Protected`**initProperties**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `fallback`: (`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>) => *void* \| *Promise*<*void*\>): *Promise*<*void*\>

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`fallback` | (`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>) => *void* \| *Promise*<*void*\> |

**Returns:** *Promise*<*void*\>

Defined in: [packages/core/src/metadata/MetadataProvider.ts:23](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataProvider.ts#L23)

___

### loadEntityMetadata

▸ `Abstract`**loadEntityMetadata**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `name`: *string*): *Promise*<*void*\>

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`name` | *string* |

**Returns:** *Promise*<*void*\>

Defined in: [packages/core/src/metadata/MetadataProvider.ts:13](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataProvider.ts#L13)

___

### loadFromCache

▸ **loadFromCache**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `cache`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>): *void*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`cache` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |

**Returns:** *void*

Defined in: [packages/core/src/metadata/MetadataProvider.ts:15](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataProvider.ts#L15)

___

### useCache

▸ **useCache**(): *boolean*

**Returns:** *boolean*

Defined in: [packages/core/src/metadata/MetadataProvider.ts:19](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataProvider.ts#L19)
