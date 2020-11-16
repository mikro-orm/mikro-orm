---
id: "metadatadiscovery"
title: "Class: MetadataDiscovery"
sidebar_label: "MetadataDiscovery"
---

## Hierarchy

* **MetadataDiscovery**

## Constructors

### constructor

\+ **new MetadataDiscovery**(`metadata`: [MetadataStorage](metadatastorage.md), `platform`: [Platform](platform.md), `config`: [Configuration](configuration.md)): [MetadataDiscovery](metadatadiscovery.md)

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:24](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L24)*

#### Parameters:

Name | Type |
------ | ------ |
`metadata` | [MetadataStorage](metadatastorage.md) |
`platform` | [Platform](platform.md) |
`config` | [Configuration](configuration.md) |

**Returns:** [MetadataDiscovery](metadatadiscovery.md)

## Properties

### cache

• `Private` `Readonly` **cache**: [CacheAdapter](../interfaces/cacheadapter.md) = this.config.getCacheAdapter()

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:20](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L20)*

___

### config

• `Private` `Readonly` **config**: [Configuration](configuration.md)

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:28](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L28)*

___

### discovered

• `Private` `Readonly` **discovered**: [EntityMetadata](entitymetadata.md)[] = []

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:24](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L24)*

___

### logger

• `Private` `Readonly` **logger**: [Logger](logger.md) = this.config.getLogger()

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:21](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L21)*

___

### metadata

• `Private` `Readonly` **metadata**: [MetadataStorage](metadatastorage.md)

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:26](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L26)*

___

### metadataProvider

• `Private` `Readonly` **metadataProvider**: [MetadataProvider](metadataprovider.md) = this.config.getMetadataProvider()

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:19](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L19)*

___

### namingStrategy

• `Private` `Readonly` **namingStrategy**: [NamingStrategy](../interfaces/namingstrategy.md) = this.config.getNamingStrategy()

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:18](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L18)*

___

### platform

• `Private` `Readonly` **platform**: [Platform](platform.md)

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:27](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L27)*

___

### schemaHelper

• `Private` `Readonly` **schemaHelper**: { getTypeDefinition: (prop: [EntityProperty](../interfaces/entityproperty.md), types?: [Dictionary](../index.md#dictionary)&#60;string[]>, lengths?: [Dictionary](../index.md#dictionary)&#60;number>, allowZero?: boolean) => string  } = this.platform.getSchemaHelper()

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:22](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L22)*

#### Type declaration:

Name | Type |
------ | ------ |
`getTypeDefinition` | (prop: [EntityProperty](../interfaces/entityproperty.md), types?: [Dictionary](../index.md#dictionary)&#60;string[]>, lengths?: [Dictionary](../index.md#dictionary)&#60;number>, allowZero?: boolean) => string |

___

### validator

• `Private` `Readonly` **validator**: [MetadataValidator](metadatavalidator.md) = new MetadataValidator()

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:23](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L23)*

## Methods

### applyNamingStrategy

▸ `Private`**applyNamingStrategy**(`meta`: [EntityMetadata](entitymetadata.md), `prop`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:238](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L238)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### autoWireBidirectionalProperties

▸ `Private`**autoWireBidirectionalProperties**(`meta`: [EntityMetadata](entitymetadata.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:491](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L491)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |

**Returns:** void

___

### createDiscriminatorProperty

▸ `Private`**createDiscriminatorProperty**(`meta`: [EntityMetadata](entitymetadata.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:625](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L625)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |

**Returns:** void

___

### defineBaseEntityProperties

▸ `Private`**defineBaseEntityProperties**(`meta`: [EntityMetadata](entitymetadata.md)): number

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:504](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L504)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |

**Returns:** number

___

### defineFixedOrderProperty

▸ `Private`**defineFixedOrderProperty**(`prop`: [EntityProperty](../interfaces/entityproperty.md)): [EntityProperty](../interfaces/entityproperty.md)

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:427](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L427)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** [EntityProperty](../interfaces/entityproperty.md)

___

### definePivotProperty

▸ `Private`**definePivotProperty**(`prop`: [EntityProperty](../interfaces/entityproperty.md), `name`: string, `type`: string, `inverse`: string, `owner`: boolean): [EntityProperty](../interfaces/entityproperty.md)

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:450](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L450)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`name` | string |
`type` | string |
`inverse` | string |
`owner` | boolean |

**Returns:** [EntityProperty](../interfaces/entityproperty.md)

___

### definePivotTableEntity

▸ `Private`**definePivotTableEntity**(`meta`: [EntityMetadata](entitymetadata.md), `prop`: [EntityProperty](../interfaces/entityproperty.md)): [EntityMetadata](entitymetadata.md)

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:393](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L393)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** [EntityMetadata](entitymetadata.md)

___

### discover

▸ **discover**(`preferTsNode?`: boolean): Promise&#60;[MetadataStorage](metadatastorage.md)>

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:30](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L30)*

#### Parameters:

Name | Type | Default value |
------ | ------ | ------ |
`preferTsNode` | boolean | true |

**Returns:** Promise&#60;[MetadataStorage](metadatastorage.md)>

___

### discoverDirectories

▸ `Private`**discoverDirectories**(`paths`: string[]): Promise&#60;void>

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:87](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L87)*

#### Parameters:

Name | Type |
------ | ------ |
`paths` | string[] |

**Returns:** Promise&#60;void>

___

### discoverEntity

▸ `Private`**discoverEntity**&#60;T>(`entity`: [EntityClass](../index.md#entityclass)&#60;T> \| [EntityClassGroup](../index.md#entityclassgroup)&#60;T> \| [EntitySchema](entityschema.md)&#60;T>, `path?`: string): Promise&#60;void>

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:190](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L190)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [EntityClass](../index.md#entityclass)&#60;T> \| [EntityClassGroup](../index.md#entityclassgroup)&#60;T> \| [EntitySchema](entityschema.md)&#60;T> |
`path?` | string |

**Returns:** Promise&#60;void>

___

### discoverReferences

▸ `Private`**discoverReferences**(`refs`: [Constructor](../index.md#constructor)&#60;[AnyEntity](../index.md#anyentity)>[]): Promise&#60;void>

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:136](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L136)*

#### Parameters:

Name | Type |
------ | ------ |
`refs` | [Constructor](../index.md#constructor)&#60;[AnyEntity](../index.md#anyentity)>[] |

**Returns:** Promise&#60;void>

___

### findEntities

▸ `Private`**findEntities**(`preferTsNode`: boolean): Promise&#60;[EntityMetadata](entitymetadata.md)[]>

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:69](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L69)*

#### Parameters:

Name | Type |
------ | ------ |
`preferTsNode` | boolean |

**Returns:** Promise&#60;[EntityMetadata](entitymetadata.md)[]>

___

### getDefaultVersionValue

▸ `Private`**getDefaultVersionValue**(`prop`: [EntityProperty](../interfaces/entityproperty.md)): string

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:635](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L635)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** string

___

### getEntityClassOrSchema

▸ `Private`**getEntityClassOrSchema**(`path`: string, `name`: string): any[]

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:772](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L772)*

#### Parameters:

Name | Type |
------ | ------ |
`path` | string |
`name` | string |

**Returns:** any[]

___

### getSchema

▸ `Private`**getSchema**&#60;T>(`entity`: [Constructor](../index.md#constructor)&#60;T> \| [EntitySchema](entityschema.md)&#60;T>): [EntitySchema](entityschema.md)&#60;T>

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:167](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L167)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [Constructor](../index.md#constructor)&#60;T> \| [EntitySchema](entityschema.md)&#60;T> |

**Returns:** [EntitySchema](entityschema.md)&#60;T>

___

### initColumnType

▸ `Private`**initColumnType**(`prop`: [EntityProperty](../interfaces/entityproperty.md), `path?`: string): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:707](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L707)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`path?` | string |

**Returns:** void

___

### initCustomType

▸ `Private`**initCustomType**(`prop`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:671](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L671)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### initDefaultValue

▸ `Private`**initDefaultValue**(`prop`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:648](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L648)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### initEmbeddables

▸ `Private`**initEmbeddables**(`meta`: [EntityMetadata](entitymetadata.md), `embeddedProp`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:544](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L544)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`embeddedProp` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### initEnumValues

▸ `Private`**initEnumValues**(`prop`: [EntityProperty](../interfaces/entityproperty.md), `path`: string): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:743](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L743)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`path` | string |

**Returns:** void

___

### initFactoryField

▸ `Private`**initFactoryField**&#60;T>(`prop`: [EntityProperty](../interfaces/entityproperty.md)&#60;T>): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:382](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L382)*

#### Type parameters:

Name |
------ |
`T` |

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md)&#60;T> |

**Returns:** void

___

### initFieldName

▸ `Private`**initFieldName**(`prop`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:256](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L256)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### initManyToManyFieldName

▸ `Private`**initManyToManyFieldName**(`prop`: [EntityProperty](../interfaces/entityproperty.md), `name`: string): string[]

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:285](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L285)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`name` | string |

**Returns:** string[]

___

### initManyToManyFields

▸ `Private`**initManyToManyFields**(`meta`: [EntityMetadata](entitymetadata.md), `prop`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:290](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L290)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### initManyToOneFieldName

▸ `Private`**initManyToOneFieldName**(`prop`: [EntityProperty](../interfaces/entityproperty.md), `name`: string): string[]

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:270](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L270)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |
`name` | string |

**Returns:** string[]

___

### initManyToOneFields

▸ `Private`**initManyToOneFields**(`prop`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:322](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L322)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### initOneToManyFields

▸ `Private`**initOneToManyFields**(`prop`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:336](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L336)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### initSingleTableInheritance

▸ `Private`**initSingleTableInheritance**(`meta`: [EntityMetadata](entitymetadata.md), `metadata`: [EntityMetadata](entitymetadata.md)[]): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:575](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L575)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`metadata` | [EntityMetadata](entitymetadata.md)[] |

**Returns:** void

___

### initUnsigned

▸ `Private`**initUnsigned**(`prop`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:757](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L757)*

#### Parameters:

Name | Type |
------ | ------ |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### initVersionProperty

▸ `Private`**initVersionProperty**(`meta`: [EntityMetadata](entitymetadata.md), `prop`: [EntityProperty](../interfaces/entityproperty.md)): void

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:662](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L662)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |
`prop` | [EntityProperty](../interfaces/entityproperty.md) |

**Returns:** void

___

### prepare

▸ `Private`**prepare**&#60;T>(`entity`: [EntityClass](../index.md#entityclass)&#60;T> \| [EntityClassGroup](../index.md#entityclassgroup)&#60;T> \| [EntitySchema](entityschema.md)&#60;T>): [EntityClass](../index.md#entityclass)&#60;T> \| [EntitySchema](entityschema.md)&#60;T>

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:151](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L151)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`entity` | [EntityClass](../index.md#entityclass)&#60;T> \| [EntityClassGroup](../index.md#entityclassgroup)&#60;T> \| [EntitySchema](entityschema.md)&#60;T> |

**Returns:** [EntityClass](../index.md#entityclass)&#60;T> \| [EntitySchema](entityschema.md)&#60;T>

___

### processEntity

▸ `Private`**processEntity**(`meta`: [EntityMetadata](entitymetadata.md)): [EntityMetadata](entitymetadata.md)[]

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:348](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L348)*

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |

**Returns:** [EntityMetadata](entitymetadata.md)[]

___

### saveToCache

▸ `Private`**saveToCache**&#60;T>(`meta`: [EntityMetadata](entitymetadata.md)): Promise&#60;void>

*Defined in [packages/core/src/metadata/MetadataDiscovery.ts:224](https://github.com/mikro-orm/mikro-orm/blob/8766baa31/packages/core/src/metadata/MetadataDiscovery.ts#L224)*

#### Type parameters:

Name | Type |
------ | ------ |
`T` | [AnyEntity](../index.md#anyentity)&#60;T> |

#### Parameters:

Name | Type |
------ | ------ |
`meta` | [EntityMetadata](entitymetadata.md) |

**Returns:** Promise&#60;void>
