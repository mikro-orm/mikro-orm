---
id: "reflectmetadataprovider"
title: "Class: ReflectMetadataProvider"
sidebar_label: "ReflectMetadataProvider"
---

## Hierarchy

* [MetadataProvider](metadataprovider.md)

  ↳ **ReflectMetadataProvider**

## Constructors

### constructor

\+ **new ReflectMetadataProvider**(`config`: [IConfiguration](../interfaces/iconfiguration.md)): [ReflectMetadataProvider](reflectmetadataprovider.md)

*Inherited from [MetadataProvider](metadataprovider.md).[constructor](metadataprovider.md#constructor)*

*Defined in [packages/core/src/metadata/MetadataProvider.ts:9](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataProvider.ts#L9)*

#### Parameters:

Name | Type |
------ | ------ |
`config` | [IConfiguration](../interfaces/iconfiguration.md) |

**Returns:** [ReflectMetadataProvider](reflectmetadataprovider.md)

## Properties

### config

• `Protected` `Readonly` **config**: [IConfiguration](../interfaces/iconfiguration.md)

*Inherited from [MetadataProvider](metadataprovider.md).[config](metadataprovider.md#config)*

*Defined in [packages/core/src/metadata/MetadataProvider.ts:11](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataProvider.ts#L11)*

## Methods

### initProperties

▸ `Protected`**initProperties**(`meta`: [EntityMetadata](entitymetadata.md), `fallback`: (prop: [EntityProperty](../interfaces/entityproperty.md)) => void \| Promise&#60;void>): Promise&#60;void>

*Inherited from [MetadataProvider](metadataprovider.md).[initProperties](metadataprovider.md#initproperties)*

*Defined in [packages/core/src/metadata/MetadataProvider.ts:23](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataProvider.ts#L23)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`fallback` | (prop: [EntityProperty](../interfaces/entityproperty.md)) => void \| Promise&#60;void> |

**Returns:** Promise&#60;void>

___

### initPropertyType

▸ `Protected`**initPropertyType**(`meta`: [EntityMetadata](entitymetadata.md), `prop`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/ReflectMetadataProvider.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/ReflectMetadataProvider.ts#L12)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### loadEntityMetadata

▸ **loadEntityMetadata**(`meta`: [EntityMetadata](entitymetadata.md), `name`: string): Promise&#60;void>

*Overrides [MetadataProvider](metadataprovider.md).[loadEntityMetadata](metadataprovider.md#loadentitymetadata)*

*Defined in [packages/core/src/metadata/ReflectMetadataProvider.ts:8](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/ReflectMetadataProvider.ts#L8)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`name` | string |

**Returns:** Promise&#60;void>

___

### loadFromCache

▸ **loadFromCache**(`meta`: [EntityMetadata](entitymetadata.md), `cache`: [EntityMetadata](entitymetadata.md)): void

*Inherited from [MetadataProvider](metadataprovider.md).[loadFromCache](metadataprovider.md#loadfromcache)*

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

*Inherited from [MetadataProvider](metadataprovider.md).[useCache](metadataprovider.md#usecache)*

*Defined in [packages/core/src/metadata/MetadataProvider.ts:19](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/core/src/metadata/MetadataProvider.ts#L19)*

**Returns:** boolean
