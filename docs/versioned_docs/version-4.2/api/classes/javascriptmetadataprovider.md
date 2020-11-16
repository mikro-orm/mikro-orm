---
id: "javascriptmetadataprovider"
title: "Class: JavaScriptMetadataProvider"
sidebar_label: "JavaScriptMetadataProvider"
---

**`deprecated`** use EntitySchema instead

## Hierarchy

* [MetadataProvider](metadataprovider.md)

  ↳ **JavaScriptMetadataProvider**

## Constructors

### constructor

\+ **new JavaScriptMetadataProvider**(`config`: [IConfiguration](../interfaces/iconfiguration.md)): [JavaScriptMetadataProvider](javascriptmetadataprovider.md)

*Inherited from [MetadataProvider](metadataprovider.md).[constructor](metadataprovider.md#constructor)*

*Defined in [packages/core/src/metadata/MetadataProvider.ts:9](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataProvider.ts#L9)*

#### Parameters:

Name | Type |
------ | ------ |
`config` | [IConfiguration](../interfaces/iconfiguration.md) |

**Returns:** [JavaScriptMetadataProvider](javascriptmetadataprovider.md)

## Properties

### config

• `Protected` `Readonly` **config**: [IConfiguration](../interfaces/iconfiguration.md)

*Inherited from [MetadataProvider](metadataprovider.md).[config](metadataprovider.md#config)*

*Defined in [packages/core/src/metadata/MetadataProvider.ts:11](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataProvider.ts#L11)*

## Methods

### getSchema

▸ `Private`**getSchema**(`meta`: [EntityMetadata](entitymetadata.md)): any

*Defined in [packages/core/src/metadata/JavaScriptMetadataProvider.ts:55](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/JavaScriptMetadataProvider.ts#L55)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |

**Returns:** any

___

### initProperties

▸ `Protected`**initProperties**(`meta`: [EntityMetadata](entitymetadata.md), `fallback`: (prop: [EntityProperty](../interfaces/entityproperty.md)) => void \| Promise&#60;void>): Promise&#60;void>

*Inherited from [MetadataProvider](metadataprovider.md).[initProperties](metadataprovider.md#initproperties)*

*Defined in [packages/core/src/metadata/MetadataProvider.ts:23](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataProvider.ts#L23)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`fallback` | (prop: [EntityProperty](../interfaces/entityproperty.md)) => void \| Promise&#60;void> |

**Returns:** Promise&#60;void>

___

### initProperty

▸ `Private`**initProperty**(`prop`: [EntityProperty](../interfaces/entityproperty.md), `propName`: string): void

*Defined in [packages/core/src/metadata/JavaScriptMetadataProvider.ts:43](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/JavaScriptMetadataProvider.ts#L43)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`propName` | string |

**Returns:** void

___

### loadEntityMetadata

▸ **loadEntityMetadata**(`meta`: [EntityMetadata](entitymetadata.md), `name`: string): Promise&#60;void>

*Overrides [MetadataProvider](metadataprovider.md).[loadEntityMetadata](metadataprovider.md#loadentitymetadata)*

*Defined in [packages/core/src/metadata/JavaScriptMetadataProvider.ts:11](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/JavaScriptMetadataProvider.ts#L11)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`name` | string |

**Returns:** Promise&#60;void>

___

### loadFromCache

▸ **loadFromCache**(`meta`: [EntityMetadata](entitymetadata.md), `cache`: [EntityMetadata](entitymetadata.md)): void

*Overrides [MetadataProvider](metadataprovider.md).[loadFromCache](metadataprovider.md#loadfromcache)*

*Defined in [packages/core/src/metadata/JavaScriptMetadataProvider.ts:28](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/JavaScriptMetadataProvider.ts#L28)*

Re-hydrates missing attributes like `onUpdate` (functions are lost when caching to JSON)

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`cache` | [EntityMetadata](entitymetadata.md) |

**Returns:** void

___

### useCache

▸ **useCache**(): boolean

*Inherited from [MetadataProvider](metadataprovider.md).[useCache](metadataprovider.md#usecache)*

*Defined in [packages/core/src/metadata/MetadataProvider.ts:19](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataProvider.ts#L19)*

**Returns:** boolean
