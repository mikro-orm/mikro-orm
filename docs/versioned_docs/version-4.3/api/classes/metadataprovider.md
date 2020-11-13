---
id: "metadataprovider"
title: "Class: MetadataProvider"
sidebar_label: "MetadataProvider"
---

## Hierarchy

* **MetadataProvider**

  ↳ [JavaScriptMetadataProvider](javascriptmetadataprovider.md)

  ↳ [ReflectMetadataProvider](reflectmetadataprovider.md)

## Constructors

### constructor

\+ **new MetadataProvider**(`config`: [IConfiguration](../interfaces/iconfiguration.md)): [MetadataProvider](metadataprovider.md)

*Defined in [packages/core/src/metadata/MetadataProvider.ts:9](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataProvider.ts#L9)*

#### Parameters:

Name | Type |
------ | ------ |
`config` | [IConfiguration](../interfaces/iconfiguration.md) |

**Returns:** [MetadataProvider](metadataprovider.md)

## Properties

### config

• `Protected` `Readonly` **config**: [IConfiguration](../interfaces/iconfiguration.md)

*Defined in [packages/core/src/metadata/MetadataProvider.ts:11](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataProvider.ts#L11)*

## Methods

### initProperties

▸ `Protected`**initProperties**(`meta`: [EntityMetadata](entitymetadata.md), `fallback`: (prop: [EntityProperty](../interfaces/entityproperty.md)) => void \| Promise&#60;void>): Promise&#60;void>

*Defined in [packages/core/src/metadata/MetadataProvider.ts:23](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataProvider.ts#L23)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`fallback` | (prop: [EntityProperty](../interfaces/entityproperty.md)) => void \| Promise&#60;void> |

**Returns:** Promise&#60;void>

___

### loadEntityMetadata

▸ `Abstract`**loadEntityMetadata**(`meta`: [EntityMetadata](entitymetadata.md), `name`: string): Promise&#60;void>

*Defined in [packages/core/src/metadata/MetadataProvider.ts:13](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataProvider.ts#L13)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`name` | string |

**Returns:** Promise&#60;void>

___

### loadFromCache

▸ **loadFromCache**(`meta`: [EntityMetadata](entitymetadata.md), `cache`: [EntityMetadata](entitymetadata.md)): void

*Defined in [packages/core/src/metadata/MetadataProvider.ts:15](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataProvider.ts#L15)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`cache` | [EntityMetadata](entitymetadata.md) |

**Returns:** void

___

### useCache

▸ **useCache**(): boolean

*Defined in [packages/core/src/metadata/MetadataProvider.ts:19](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataProvider.ts#L19)*

**Returns:** boolean
