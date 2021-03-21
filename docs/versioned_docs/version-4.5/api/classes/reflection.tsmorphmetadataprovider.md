---
id: "reflection.tsmorphmetadataprovider"
title: "Class: TsMorphMetadataProvider"
sidebar_label: "TsMorphMetadataProvider"
custom_edit_url: null
hide_title: true
---

# Class: TsMorphMetadataProvider

[reflection](../modules/reflection.md).TsMorphMetadataProvider

## Hierarchy

* [*MetadataProvider*](core.metadataprovider.md)

  ↳ **TsMorphMetadataProvider**

## Constructors

### constructor

\+ **new TsMorphMetadataProvider**(`config`: [*IConfiguration*](../interfaces/core.iconfiguration.md)): [*TsMorphMetadataProvider*](reflection.tsmorphmetadataprovider.md)

#### Parameters:

Name | Type |
:------ | :------ |
`config` | [*IConfiguration*](../interfaces/core.iconfiguration.md) |

**Returns:** [*TsMorphMetadataProvider*](reflection.tsmorphmetadataprovider.md)

Inherited from: [MetadataProvider](core.metadataprovider.md)

Defined in: [packages/core/src/metadata/MetadataProvider.ts:9](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/core/src/metadata/MetadataProvider.ts#L9)

## Properties

### config

• `Protected` `Readonly` **config**: [*IConfiguration*](../interfaces/core.iconfiguration.md)

Inherited from: [MetadataProvider](core.metadataprovider.md).[config](core.metadataprovider.md#config)

___

### project

• `Private` `Readonly` **project**: *Project*

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:6](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/reflection/src/TsMorphMetadataProvider.ts#L6)

___

### sources

• `Private` **sources**: *SourceFile*[]

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:12](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/reflection/src/TsMorphMetadataProvider.ts#L12)

## Methods

### extractType

▸ `Private`**extractType**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>): *string*

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |

**Returns:** *string*

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:62](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/reflection/src/TsMorphMetadataProvider.ts#L62)

___

### getExistingSourceFile

▸ **getExistingSourceFile**(`path`: *string*, `ext?`: *string*, `validate?`: *boolean*): *Promise*<SourceFile\>

#### Parameters:

Name | Type | Default value |
:------ | :------ | :------ |
`path` | *string* | - |
`ext?` | *string* | - |
`validate` | *boolean* | true |

**Returns:** *Promise*<SourceFile\>

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:26](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/reflection/src/TsMorphMetadataProvider.ts#L26)

___

### getSourceFile

▸ `Private`**getSourceFile**(`tsPath`: *string*, `validate`: *boolean*): *Promise*<undefined \| SourceFile\>

#### Parameters:

Name | Type |
:------ | :------ |
`tsPath` | *string* |
`validate` | *boolean* |

**Returns:** *Promise*<undefined \| SourceFile\>

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:137](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/reflection/src/TsMorphMetadataProvider.ts#L137)

___

### initProperties

▸ `Protected`**initProperties**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |

**Returns:** *Promise*<void\>

Overrides: [MetadataProvider](core.metadataprovider.md)

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:49](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/reflection/src/TsMorphMetadataProvider.ts#L49)

___

### initPropertyType

▸ `Private`**initPropertyType**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>): *Promise*<void\>

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |

**Returns:** *Promise*<void\>

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:74](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/reflection/src/TsMorphMetadataProvider.ts#L74)

___

### initSourceFiles

▸ `Private`**initSourceFiles**(): *Promise*<void\>

**Returns:** *Promise*<void\>

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:171](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/reflection/src/TsMorphMetadataProvider.ts#L171)

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

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:18](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/reflection/src/TsMorphMetadataProvider.ts#L18)

___

### loadFromCache

▸ **loadFromCache**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>, `cache`: [*EntityMetadata*](core.entitymetadata.md)<any\>): *void*

Re-hydrates missing attributes like `customType` (functions/instances are lost when caching to JSON)

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |
`cache` | [*EntityMetadata*](core.entitymetadata.md)<any\> |

**Returns:** *void*

Overrides: [MetadataProvider](core.metadataprovider.md)

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:39](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/reflection/src/TsMorphMetadataProvider.ts#L39)

___

### processWrapper

▸ `Private`**processWrapper**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>, `wrapper`: *string*): *void*

#### Parameters:

Name | Type |
:------ | :------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |
`wrapper` | *string* |

**Returns:** *void*

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:151](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/reflection/src/TsMorphMetadataProvider.ts#L151)

___

### readTypeFromSource

▸ `Private`**readTypeFromSource**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<any\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<any\>): *Promise*<{ `optional?`: *boolean* ; `type`: *string*  }\>

#### Parameters:

Name | Type |
:------ | :------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<any\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<any\> |

**Returns:** *Promise*<{ `optional?`: *boolean* ; `type`: *string*  }\>

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:87](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/reflection/src/TsMorphMetadataProvider.ts#L87)

___

### useCache

▸ **useCache**(): *boolean*

**Returns:** *boolean*

Overrides: [MetadataProvider](core.metadataprovider.md)

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:14](https://github.com/mikro-orm/mikro-orm/blob/bcf1a0899b/packages/reflection/src/TsMorphMetadataProvider.ts#L14)
