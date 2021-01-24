---
id: "reflection.tsmorphmetadataprovider"
title: "Class: TsMorphMetadataProvider"
sidebar_label: "TsMorphMetadataProvider"
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
------ | ------ |
`config` | [*IConfiguration*](../interfaces/core.iconfiguration.md) |

**Returns:** [*TsMorphMetadataProvider*](reflection.tsmorphmetadataprovider.md)

Inherited from: [MetadataProvider](core.metadataprovider.md)

Defined in: [packages/core/src/metadata/MetadataProvider.ts:9](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/core/src/metadata/MetadataProvider.ts#L9)

## Properties

### config

• `Protected` `Readonly` **config**: [*IConfiguration*](../interfaces/core.iconfiguration.md)

Inherited from: [MetadataProvider](core.metadataprovider.md).[config](core.metadataprovider.md#config)

___

### project

• `Private` `Readonly` **project**: *Project*

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:6](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/reflection/src/TsMorphMetadataProvider.ts#L6)

___

### sources

• `Private` **sources**: *SourceFile*[]

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:12](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/reflection/src/TsMorphMetadataProvider.ts#L12)

## Methods

### extractType

▸ `Private`**extractType**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): *string*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** *string*

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:49](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/reflection/src/TsMorphMetadataProvider.ts#L49)

___

### getExistingSourceFile

▸ **getExistingSourceFile**(`path`: *string*, `ext?`: *string*, `validate?`: *boolean*): *Promise*<*SourceFile*\>

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`path` | *string* | - |
`ext?` | *string* | - |
`validate` | *boolean* | true |

**Returns:** *Promise*<*SourceFile*\>

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:26](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/reflection/src/TsMorphMetadataProvider.ts#L26)

___

### getSourceFile

▸ `Private`**getSourceFile**(`tsPath`: *string*, `validate`: *boolean*): *Promise*<*undefined* \| *SourceFile*\>

#### Parameters:

Name | Type |
------ | ------ |
`tsPath` | *string* |
`validate` | *boolean* |

**Returns:** *Promise*<*undefined* \| *SourceFile*\>

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:100](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/reflection/src/TsMorphMetadataProvider.ts#L100)

___

### initProperties

▸ `Protected`**initProperties**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>): *Promise*<*void*\>

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |

**Returns:** *Promise*<*void*\>

Overrides: [MetadataProvider](core.metadataprovider.md)

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:36](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/reflection/src/TsMorphMetadataProvider.ts#L36)

___

### initPropertyType

▸ `Private`**initPropertyType**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): *Promise*<*void*\>

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** *Promise*<*void*\>

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:61](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/reflection/src/TsMorphMetadataProvider.ts#L61)

___

### initSourceFiles

▸ `Private`**initSourceFiles**(): *Promise*<*void*\>

**Returns:** *Promise*<*void*\>

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:134](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/reflection/src/TsMorphMetadataProvider.ts#L134)

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

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:18](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/reflection/src/TsMorphMetadataProvider.ts#L18)

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

### processWrapper

▸ `Private`**processWrapper**(`prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>, `wrapper`: *string*): *void*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |
`wrapper` | *string* |

**Returns:** *void*

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:114](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/reflection/src/TsMorphMetadataProvider.ts#L114)

___

### readTypeFromSource

▸ `Private`**readTypeFromSource**(`meta`: [*EntityMetadata*](core.entitymetadata.md)<*any*\>, `prop`: [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\>): *Promise*<{ `optional?`: *undefined* \| *boolean* ; `type`: *string*  }\>

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [*EntityMetadata*](core.entitymetadata.md)<*any*\> |
`prop` | [*EntityProperty*](../interfaces/core.entityproperty.md)<*any*\> |

**Returns:** *Promise*<{ `optional?`: *undefined* \| *boolean* ; `type`: *string*  }\>

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:74](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/reflection/src/TsMorphMetadataProvider.ts#L74)

___

### useCache

▸ **useCache**(): *boolean*

**Returns:** *boolean*

Overrides: [MetadataProvider](core.metadataprovider.md)

Defined in: [packages/reflection/src/TsMorphMetadataProvider.ts:14](https://github.com/mikro-orm/mikro-orm/blob/969d4229bd/packages/reflection/src/TsMorphMetadataProvider.ts#L14)
