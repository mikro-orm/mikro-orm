---
id: "core.javascriptmetadataprovider"
title: "Class: JavaScriptMetadataProvider"
sidebar_label: "JavaScriptMetadataProvider"
custom_edit_url: null
hide_title: true
---

# Class: JavaScriptMetadataProvider

[core](../modules/core.md).JavaScriptMetadataProvider

**`deprecated`** use EntitySchema instead

## Hierarchy

* [*MetadataProvider*](core.metadataprovider.md)

  ↳ **JavaScriptMetadataProvider**

## Constructors

### constructor

\+ **new JavaScriptMetadataProvider**(`config`: [*IConfiguration*](../interfaces/core.iconfiguration.md)): [*JavaScriptMetadataProvider*](core.javascriptmetadataprovider.md)

#### Parameters:

Name | Type |
:------ | :------ |
`config` | [*IConfiguration*](../interfaces/core.iconfiguration.md) |

**Returns:** [*JavaScriptMetadataProvider*](core.javascriptmetadataprovider.md)

Inherited from: [MetadataProvider](core.metadataprovider.md)

Defined in: [packages/core/src/metadata/MetadataProvider.ts:9](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/MetadataProvider.ts#L9)

## Properties

### config

• `Protected` `Readonly` **config**: [*IConfiguration*](../interfaces/core.iconfiguration.md)

Inherited from: [MetadataProvider](core.metadataprovider.md).[config](core.metadataprovider.md#config)

## Methods

### getSchema

▸ `Private`**getSchema**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>): *any*

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |

**Returns:** *any*

Defined in: [packages/core/src/metadata/JavaScriptMetadataProvider.ts:55](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/JavaScriptMetadataProvider.ts#L55)

___

### initProperties

▸ `Protected`**initProperties**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>, `fallback`: (`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>) => *void* \| *Promise*<void\>): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |
`fallback` | (`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>) => *void* \| *Promise*<void\> |

**Returns:** *Promise*<void\>

Inherited from: [MetadataProvider](core.metadataprovider.md)

Defined in: [packages/core/src/metadata/MetadataProvider.ts:23](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/MetadataProvider.ts#L23)

___

### initProperty

▸ `Private`**initProperty**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `propName`: *string*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`propName` | *string* |

**Returns:** *void*

Defined in: [packages/core/src/metadata/JavaScriptMetadataProvider.ts:43](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/JavaScriptMetadataProvider.ts#L43)

___

### loadEntityMetadata

▸ **loadEntityMetadata**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>, `name`: *string*): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |
`name` | *string* |

**Returns:** *Promise*<void\>

Overrides: [MetadataProvider](core.metadataprovider.md)

Defined in: [packages/core/src/metadata/JavaScriptMetadataProvider.ts:11](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/JavaScriptMetadataProvider.ts#L11)

___

### loadFromCache

▸ **loadFromCache**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>, `cache`: [*EntityMetadata*](core.entitymetadata.md)<any\>): *void*

Re-hydrates missing attributes like `onUpdate` (functions are lost when caching to JSON)

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |
`cache` | [*EntityMetadata*](core.entitymetadata.md)<any\> |

**Returns:** *void*

Overrides: [MetadataProvider](core.metadataprovider.md)

Defined in: [packages/core/src/metadata/JavaScriptMetadataProvider.ts:28](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/JavaScriptMetadataProvider.ts#L28)

___

### useCache

▸ **useCache**(): *boolean*

**Returns:** *boolean*

Inherited from: [MetadataProvider](core.metadataprovider.md)

Defined in: [packages/core/src/metadata/MetadataProvider.ts:19](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/MetadataProvider.ts#L19)
