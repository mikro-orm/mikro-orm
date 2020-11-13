---
id: "tsmorphmetadataprovider"
title: "Class: TsMorphMetadataProvider"
sidebar_label: "TsMorphMetadataProvider"
---

## Hierarchy

* MetadataProvider

  ↳ **TsMorphMetadataProvider**

## Constructors

### constructor

\+ **new TsMorphMetadataProvider**(`config`: IConfiguration): [TsMorphMetadataProvider](tsmorphmetadataprovider.md)

*Inherited from [TsMorphMetadataProvider](tsmorphmetadataprovider.md).[constructor](tsmorphmetadataprovider.md#constructor)*

*Defined in packages/core/dist/metadata/MetadataProvider.d.ts:6*

#### Parameters:

Name | Type |
------ | ------ |
`config` | IConfiguration |

**Returns:** [TsMorphMetadataProvider](tsmorphmetadataprovider.md)

## Properties

### config

• `Protected` `Readonly` **config**: IConfiguration

*Inherited from [TsMorphMetadataProvider](tsmorphmetadataprovider.md).[config](tsmorphmetadataprovider.md#config)*

*Defined in packages/core/dist/metadata/MetadataProvider.d.ts:6*

___

### project

• `Private` `Readonly` **project**: Project = new Project({ compilerOptions: { strictNullChecks: true, }, })

*Defined in [packages/reflection/src/TsMorphMetadataProvider.ts:6](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/reflection/src/TsMorphMetadataProvider.ts#L6)*

___

### sources

• `Private` **sources**: SourceFile[]

*Defined in [packages/reflection/src/TsMorphMetadataProvider.ts:12](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/reflection/src/TsMorphMetadataProvider.ts#L12)*

## Methods

### extractType

▸ `Private`**extractType**(`prop`: EntityProperty): string

*Defined in [packages/reflection/src/TsMorphMetadataProvider.ts:49](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/reflection/src/TsMorphMetadataProvider.ts#L49)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty |

**Returns:** string

___

### getExistingSourceFile

▸ **getExistingSourceFile**(`path`: string, `ext?`: string, `validate?`: boolean): Promise&#60;SourceFile>

*Defined in [packages/reflection/src/TsMorphMetadataProvider.ts:26](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/reflection/src/TsMorphMetadataProvider.ts#L26)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`path` | string | - |
`ext?` | string | - |
`validate` | boolean | true |

**Returns:** Promise&#60;SourceFile>

___

### getSourceFile

▸ `Private`**getSourceFile**(`tsPath`: string, `validate`: boolean): Promise&#60;SourceFile \| undefined>

*Defined in [packages/reflection/src/TsMorphMetadataProvider.ts:99](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/reflection/src/TsMorphMetadataProvider.ts#L99)*

#### Parameters:

Name | Type |
------ | ------ |
`tsPath` | string |
`validate` | boolean |

**Returns:** Promise&#60;SourceFile \| undefined>

___

### initProperties

▸ `Protected`**initProperties**(`meta`: EntityMetadata): Promise&#60;void>

*Overrides void*

*Defined in [packages/reflection/src/TsMorphMetadataProvider.ts:36](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/reflection/src/TsMorphMetadataProvider.ts#L36)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |

**Returns:** Promise&#60;void>

___

### initPropertyType

▸ `Private`**initPropertyType**(`meta`: EntityMetadata, `prop`: EntityProperty): Promise&#60;void>

*Defined in [packages/reflection/src/TsMorphMetadataProvider.ts:61](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/reflection/src/TsMorphMetadataProvider.ts#L61)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |
`prop` | EntityProperty |

**Returns:** Promise&#60;void>

___

### initSourceFiles

▸ `Private`**initSourceFiles**(): Promise&#60;void>

*Defined in [packages/reflection/src/TsMorphMetadataProvider.ts:127](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/reflection/src/TsMorphMetadataProvider.ts#L127)*

**Returns:** Promise&#60;void>

___

### loadEntityMetadata

▸ **loadEntityMetadata**(`meta`: EntityMetadata, `name`: string): Promise&#60;void>

*Overrides void*

*Defined in [packages/reflection/src/TsMorphMetadataProvider.ts:18](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/reflection/src/TsMorphMetadataProvider.ts#L18)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |
`name` | string |

**Returns:** Promise&#60;void>

___

### loadFromCache

▸ **loadFromCache**(`meta`: EntityMetadata, `cache`: EntityMetadata): void

*Inherited from [TsMorphMetadataProvider](tsmorphmetadataprovider.md).[loadFromCache](tsmorphmetadataprovider.md#loadfromcache)*

*Defined in packages/core/dist/metadata/MetadataProvider.d.ts:9*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |
`cache` | EntityMetadata |

**Returns:** void

___

### processWrapper

▸ `Private`**processWrapper**(`prop`: EntityProperty, `wrapper`: string): void

*Defined in [packages/reflection/src/TsMorphMetadataProvider.ts:113](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/reflection/src/TsMorphMetadataProvider.ts#L113)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | EntityProperty |
`wrapper` | string |

**Returns:** void

___

### readTypeFromSource

▸ `Private`**readTypeFromSource**(`meta`: EntityMetadata, `prop`: EntityProperty): Promise&#60;{ optional?: boolean ; type: string  }>

*Defined in [packages/reflection/src/TsMorphMetadataProvider.ts:73](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/reflection/src/TsMorphMetadataProvider.ts#L73)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | EntityMetadata |
`prop` | EntityProperty |

**Returns:** Promise&#60;{ optional?: boolean ; type: string  }>

___

### useCache

▸ **useCache**(): boolean

*Overrides void*

*Defined in [packages/reflection/src/TsMorphMetadataProvider.ts:14](https://github.com/mikro-orm/mikro-orm/blob/18b580bb42/packages/reflection/src/TsMorphMetadataProvider.ts#L14)*

**Returns:** boolean
